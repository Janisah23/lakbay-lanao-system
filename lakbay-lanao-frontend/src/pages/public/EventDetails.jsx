import React, { useState, useEffect } from 'react';
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import TourismChatbot from "../../components/chatbot/TourismChatbot";
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiClock, FiMapPin, FiCalendar, FiUser, FiInfo, FiHeart } from "react-icons/fi";
import { MdOutlineBookmarkAdd, MdBookmarkAdded } from "react-icons/md"; 
import { FaHeart } from "react-icons/fa";

import { db, auth } from "../../firebase/config";
import { doc, getDoc, setDoc, deleteDoc, getDocs, collection, updateDoc, serverTimestamp } from "firebase/firestore";
import { useFavorites } from "../../components/context/FavoritesContext";

const EventDetails = () => {
  const [morePlaces, setMorePlaces] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();
  const [eventDetail, setEventDetail] = useState(null);
  
  // Rating States
  const [userRating, setUserRating] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const { favorites } = useFavorites();
  const isFav = favorites.some(fav => String(fav.id) === String(id));

  // 1. Fetch Event Detail
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        let docRef = doc(db, "tourismData", id);
        let snap = await getDoc(docRef);

        if (snap.exists()) {
          setEventDetail({ id: snap.id, ...snap.data() });
          return;
        }

        // Fallback to tourismContent if not in tourismData
        docRef = doc(db, "tourismContent", id);
        snap = await getDoc(docRef);

        if (snap.exists()) {
          setEventDetail({ id: snap.id, ...snap.data() });
        } else {
          console.log("No such document in both collections!");
        }
      } catch (error) {
        console.error("Error fetching:", error);
      }
    };

    if (id) fetchEvent();
  }, [id]);

  // 2. Fetch More Places
  useEffect(() => {
    if (!eventDetail) return;

    const fetchMorePlaces = async () => {
      try {
        const snap = await getDocs(collection(db, "tourismContent"));
        const items = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const filtered = items.filter(
          item =>
            item.id !== id &&
            item.contentType === eventDetail.contentType
        );

        setMorePlaces(filtered);
      } catch (error) {
        console.error("Error fetching places:", error);
      }
    };

    fetchMorePlaces();
  }, [eventDetail, id]); 

  const toggleFavorite = async (item) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in to add to your list.");
      return;
    }

    const favRef = doc(db, "users", user.uid, "favorites", item.id);
    if (isFav) {
      await deleteDoc(favRef);
    } else {
      await setDoc(favRef, item);
    }
  };

  const handleRating = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Please login first to submit a rating.");

    try {
      const reviewRef = doc(db, "tourismContent", eventDetail.id, "reviews", user.uid);

      await setDoc(reviewRef, {
        userId: user.uid,
        rating: userRating,
        createdAt: serverTimestamp()
      });

      const currentRating = eventDetail.rating || 0;
      const currentCount = eventDetail.reviewsCount || 0;

      const newCount = currentCount + 1;
      const newAverage = ((currentRating * currentCount) + userRating) / newCount;

      const placeRef = doc(db, "tourismContent", eventDetail.id);

      await updateDoc(placeRef, {
        rating: newAverage,
        reviewsCount: newCount,
        isTopDestination: newAverage >= 4.5 && newCount >= 5
      });

      // Trigger success UI
      setIsSubmitted(true);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000); // Hide popup after 3 seconds
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  if (!eventDetail) {
    return (
      <div className="font-sans text-gray-900 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading details...</p>
        </div>
      </div>
    );
  }

  const formattedDate = eventDetail.eventDate 
    ? new Date(eventDetail.eventDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : "TBA";

  const locationStr = eventDetail.location
    ? `${eventDetail.location.municipality}, ${eventDetail.location.province}`
    : "Lanao del Sur";

  return (
    <div className="font-sans text-gray-900 bg-white min-h-screen">
      <Navbar />

      {/* 1. HEADER SECTION */}
      <section className="pt-32 pb-8 px-8 md:px-16 lg:px-24 max-w-[1400px] mx-auto">
        <p className="text-sm text-gray-500 font-semibold mb-1 uppercase tracking-wide">
          {eventDetail.location?.province || "Lanao del Sur"}
        </p>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-900 mb-4 tracking-tight leading-tight">
          {eventDetail.title}
        </h1>
        
        <p className="text-xl text-gray-500 mb-6 font-light max-w-4xl">
          {eventDetail.summary || "Discover the cultural heritage and beauty of Lanao."}
        </p>

        {/* Rating and Ranking Row */}
        <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-gray-700">
          <div className="flex items-center gap-1.5 font-bold text-red-600">
            <div className="flex gap-0.5">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
            </div>
            Top Destination
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-yellow-500 text-lg tracking-widest">
              ★★★★<span className="text-yellow-200">★</span>
            </span>
            <span className="font-bold text-gray-900 ml-1">{eventDetail.rating ? eventDetail.rating.toFixed(1) : "4.8"}</span>
            <span className="text-gray-500">({eventDetail.reviewsCount || "1,250"})</span>
          </div>
          
          <div className="text-gray-600">
            <span className="font-bold text-gray-900">#1</span> of 50 most visited in Lanao
          </div>
        </div>
      </section>

      {/* 2. HERO IMAGE WITH FLOATING BUTTON */}
      <section className="w-full relative">
        <div className="max-w-[1400px] mx-auto w-full relative">
          <button
            onClick={() => toggleFavorite(eventDetail)}
            className="absolute -top-6 right-6 md:right-12 z-20 bg-white px-5 py-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center gap-2 font-semibold text-sm text-gray-800 hover:bg-gray-50 transition-colors border border-gray-100"
          >
            {isFav ? (
              <>
                <MdBookmarkAdded className="text-[22px] text-blue-600" /> 
                Added to list
              </>
            ) : (
              <>
                <MdOutlineBookmarkAdd className="text-[22px] text-gray-700" /> 
                Add to list
              </>
            )}
          </button>
        </div>

        <div className="w-full h-[200px] md:h-[300px] lg:h-[400px]">
          <img
            src={eventDetail.imageURL || "/default.jpg"}
            alt={eventDetail.title}
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* 3. CONTENT & DESCRIPTION SECTION */}
      <section className="py-20 px-8 md:px-16 lg:px-24 bg-white">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">

          {/* LEFT: Description */}
          <div className="lg:col-span-2 space-y-10">
            <h2 className="text-3xl font-bold text-gray-900 border-b border-gray-200 pb-4">
                About this Experience
            </h2>

            <div className="text-lg text-gray-700 leading-loose space-y-6">
                {eventDetail.description ? eventDetail.description.split('\n').map((str, idx) => (
                    <p key={idx}>{str}</p>
                )) : <p>Detailed description is being finalized. Prepare for an unforgettable adventure celebrating Meranao culture and hospitality.</p>}
            </div>

            {/* Admission Info */}
            <div className="mt-8 flex items-start gap-4 bg-gray-50 border border-gray-200 p-6 rounded-lg text-gray-800">
                <FiInfo className="text-2xl text-blue-700 flex-shrink-0 mt-0.5"/>
                <div>
                  <p className="font-bold mb-1">Admission Details</p>
                  <p className="text-sm">{eventDetail.price || "This experience is open to the public free of charge."}</p>
                </div>
            </div>
          </div>

          {/* RIGHT: Sidebar Info */}
          <div className="space-y-10 lg:sticky lg:top-24">
            
            {/* RATING CARD (New professional layout with popup) */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm relative">
                
                {/* Success Popup Notification */}
                {showPopup && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-sm font-semibold py-2.5 px-5 rounded-full shadow-xl flex items-center gap-2 z-50 whitespace-nowrap transition-all duration-300">
                        <span className="text-green-400 text-lg leading-none">✔</span> Rating submitted!
                    </div>
                )}

                <h3 className="font-bold text-gray-900 mb-2">Rate your experience</h3>
                <p className="text-sm text-gray-500 mb-5">Share your thoughts with other travelers.</p>
                
                {/* Interactive Stars Container */}
                <div className="flex flex-col items-center bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <div className="flex gap-2 text-3xl mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <span
                                key={star}
                                onClick={() => {
                                    if (!isSubmitted) setUserRating(star); // Only allow clicking if not submitted
                                }}
                                className={`transition-colors duration-200 ${
                                    star <= userRating 
                                        ? "text-yellow-400 drop-shadow-sm" 
                                        : "text-gray-300 hover:text-yellow-200"
                                } ${isSubmitted ? "cursor-default" : "cursor-pointer"}`}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                    {/* Dynamic Label */}
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {userRating > 0 ? `${userRating} out of 5 Stars` : "Select a rating"}
                    </p>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleRating}
                    disabled={userRating === 0 || isSubmitted}
                    className={`w-full mt-5 font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                        isSubmitted
                        ? "bg-green-50 text-green-700 border border-green-200 cursor-default" 
                        : userRating > 0 
                            ? "bg-blue-900 hover:bg-blue-800 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5" 
                            : "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    }`}
                >
                    {isSubmitted ? (
                        <>
                            <span className="text-green-600 text-lg leading-none">✔</span> Submitted
                        </>
                    ) : (
                        "Submit Rating"
                    )}
                </button>
            </div>

            {/* Key Details Box */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-6">Key Details</h3>
                
                <div className="space-y-5">
                    {/* Date */}
                    <div className="flex gap-4">
                        <FiCalendar className="text-xl text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Date</p>
                            <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
                        </div>
                    </div>
                    {/* Location */}
                    <div className="flex gap-4">
                        <FiMapPin className="text-xl text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Location</p>
                            <p className="text-sm text-gray-500 mt-1">{locationStr}</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. MORE TO EXPLORE */}
      <section className="py-24 px-8 md:px-16 lg:px-24 bg-white border-t border-gray-100">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-10">
          <h3 className="text-3xl font-bold text-blue-900 mb-2">
            More {eventDetail?.type || "Places"} to Explore
          </h3>            
          <p className="text-gray-600">Discover other stunning destinations nearby.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {morePlaces.slice(0, 4).map((place) => (
              <div
                key={place.id}
                onClick={() => navigate(`/event/${place.id}`)}
                className="group cursor-pointer flex flex-col relative bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <div className="relative h-[200px] w-full bg-gray-100">
                  <img
                    src={place.imageURL || "/default.jpg"}
                    alt={place.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(place);
                    }}
                    className="absolute top-3 right-3 bg-white/95 p-2 rounded-full shadow-md z-10 hover:bg-gray-50 transition-colors"
                  >
                    {favorites.some(fav => String(fav.id) === String(place.id)) ? (
                      <FaHeart className="text-blue-800 text-[15px]" />
                    ) : (
                      <FiHeart className="text-blue-800 text-[15px] hover:text-blue-600 transition" />
                    )}
                  </button>

                <div className="p-5 flex-1 flex flex-col bg-white">
                  <h3 className="font-medium text-[15px] text-gray-900 line-clamp-2">
                    {place.name || place.title}
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2 font-normal">
                      {place.description || "Discover this amazing place in Lanao."}
                    </p>
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* See More Places Button */}
          {morePlaces.length > 4 && (
            <div className="mt-12 text-center md:text-left">
              <button 
                onClick={() => navigate('/destinations')}
                className="border border-blue-900 text-blue-900 font-semibold px-8 py-3 text-sm hover:bg-blue-50 transition-colors rounded-sm"
              >
                See more places
              </button>
            </div>
          )}
        </div>
      </section>
      <TourismChatbot />
      <Footer />
    </div>
  );
};

export default EventDetails;