import React, { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import TourismChatbot from "../../components/chatbot/TourismChatbot";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiMapPin, FiCalendar, FiInfo, FiHeart, FiShare2,
  FiBookmark, FiChevronLeft, FiChevronRight,
} from "react-icons/fi";
import { MdOutlineBookmarkAdd, MdBookmarkAdded } from "react-icons/md";
import { FaHeart, FaTwitter, FaFacebookF, FaLink } from "react-icons/fa";

import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebase/config";
import {
  doc, getDoc, setDoc, deleteDoc, getDocs,
  collection, updateDoc, serverTimestamp, increment,
} from "firebase/firestore";
import { useFavorites } from "../../components/context/FavoritesContext";

const EventDetails = () => {
  const [morePlaces, setMorePlaces] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();
  const [eventDetail, setEventDetail] = useState(null);

  const [userRating, setUserRating] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  // CLEANED: Removed lightboxOpen and setLightboxOpen state

  const [showSharePanel, setShowSharePanel] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const { favorites } = useFavorites();
  const isFav = favorites.some((fav) => String(fav.id) === String(id));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && id) {
        try {
          const reviewRef = doc(db, "tourismContent", id, "reviews", user.uid);
          const reviewSnap = await getDoc(reviewRef);
          
          if (reviewSnap.exists()) {
            setUserRating(reviewSnap.data().rating);
            setIsSubmitted(true);
          }
        } catch (error) {
          console.error("Error checking user review:", error);
        }
      } else {
        setUserRating(0);
        setIsSubmitted(false);
      }
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, "tourismContent", id);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          setEventDetail({ id: snap.id, ...snap.data() });
          await updateDoc(docRef, { viewCount: increment(1) });
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      }
    };
    if (id) fetchEvent();
  }, [id]);

  useEffect(() => {
    if (!eventDetail) return;
    const fetchMorePlaces = async () => {
      try {
        const snap = await getDocs(collection(db, "tourismContent"));
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMorePlaces(
          items.filter((item) => item.id !== id && item.contentType === eventDetail.contentType)
        );
      } catch (error) {
        console.error("Error fetching places:", error);
      }
    };
    fetchMorePlaces();
  }, [eventDetail, id]);

  const toggleFavorite = async (item) => {
    const user = auth.currentUser;
    if (!user) { alert("Please log in to add to your list."); return; }
    const favRef = doc(db, "users", user.uid, "favorites", item.id);
    if (isFav) {
      await deleteDoc(favRef);
      await updateDoc(doc(db, "tourismContent", item.id), { saveCount: increment(-1) }).catch(() => {});
    } else {
      await setDoc(favRef, item);
      await updateDoc(doc(db, "tourismContent", item.id), { saveCount: increment(1) }).catch(() => {});
    }
  };

  const handleRating = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Please login first to submit a rating.");
    if (isSubmitted) return;

    try {
      const reviewRef = doc(db, "tourismContent", eventDetail.id, "reviews", user.uid);
      await setDoc(reviewRef, {
        userId: user.uid,
        rating: userRating,
        createdAt: serverTimestamp(),
      });

      const currentRating = eventDetail.rating || 0;
      const currentCount = eventDetail.reviewsCount || 0;
      const newCount = currentCount + 1;
      const newAverage = ((currentRating * currentCount) + userRating) / newCount;

      const placeRef = doc(db, "tourismContent", eventDetail.id);
      await updateDoc(placeRef, {
        rating: newAverage,
        reviewsCount: newCount,
        isTopDestination: newAverage >= 4.5 && newCount >= 5,
      });

      setEventDetail((prev) => ({ ...prev, rating: newAverage, reviewsCount: newCount }));
      setIsSubmitted(true);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (!eventDetail) {
    return (
      <div className="font-sans min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb] mx-auto" />
          <p className="mt-4 text-gray-500 font-medium">Loading details...</p>
        </div>
      </div>
    );
  }

  const galleryImages = [eventDetail.imageURL, ...(eventDetail.galleryImages || [])].filter(Boolean);
  
  // CLEANED: Removed mapQuery, mapEmbedUrl, and mapDirectionsUrl as they were unused

  const formattedDate = eventDetail.eventDate
    ? new Date(eventDetail.eventDate).toLocaleDateString(undefined, {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : "TBA";

  const locationStr = eventDetail.location
    ? `${eventDetail.location.municipality}, ${eventDetail.location.province}`
    : "Lanao del Sur";

  const saveCount = eventDetail.saveCount || 0;

  return (
    <div className="font-sans text-gray-900 min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff]">
      <Navbar />

      {/* ── HEADER ── */}
      <section className="pt-32 pb-10 px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5 font-medium uppercase tracking-wider">
          <span className="cursor-pointer hover:text-[#2563eb] transition" onClick={() => navigate("/destinations")}>
            Destinations
          </span>
          <span>/</span>
          <span className="text-gray-500">{eventDetail.location?.province || "Lanao del Sur"}</span>
        </div>

        <div className="flex items-start justify-between gap-8 flex-wrap">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-100 px-3 py-1 text-xs font-semibold text-red-600 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              Event Experience
            </span>

            <h1 className="text-4xl md:text-5xl font-bold text-[#2563eb] mb-6 tracking-tight leading-tight">
              {eventDetail.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-400 tracking-widest text-base">
                  {"★".repeat(Math.floor(eventDetail.rating || 4))}
                  <span className="text-yellow-200">{"★".repeat(5 - Math.floor(eventDetail.rating || 4))}</span>
                </span>
                <span className="font-bold text-gray-900">{eventDetail.rating ? eventDetail.rating.toFixed(1) : "—"}</span>
                <span className="text-gray-400">({eventDetail.reviewsCount || 0})</span>
              </div>
              <div className="w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-1.5 text-gray-500">
                <FiBookmark className="text-sm" />
                <span>{saveCount.toLocaleString()} saves</span>
              </div>
              <div className="w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-1.5 text-gray-500">
                <FiMapPin className="text-sm" />
                <span>{locationStr}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 mt-2">
            <div className="relative">
              <button onClick={() => setShowSharePanel(!showSharePanel)} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:border-[#2563eb] hover:text-[#2563eb] transition">
                <FiShare2 className="text-base" /> Share
              </button>
              {showSharePanel && (
                <div className="absolute right-0 top-12 z-30 bg-white rounded-[16px] border border-gray-200 shadow-xl p-4 w-56">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Share this event</p>
                  <div className="space-y-2">
                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 w-full rounded-[10px] px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition"><FaTwitter className="text-[#1da1f2]" /> Twitter / X</a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 w-full rounded-[10px] px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition"><FaFacebookF className="text-[#1877f2]" /> Facebook</a>
                    <button onClick={handleCopyLink} className="flex items-center gap-3 w-full rounded-[10px] px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition"><FaLink className="text-gray-400" /> {linkCopied ? "Copied!" : "Copy link"}</button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => toggleFavorite(eventDetail)} className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-sm transition ${isFav ? "bg-[#2563eb] text-white" : "bg-white border border-gray-200 text-gray-700"}`}>
              {isFav ? <MdBookmarkAdded /> : <MdOutlineBookmarkAdd />} {isFav ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </section>

      {/* ── GALLERY ── */}
      <section className="px-6 max-w-7xl mx-auto mb-16">
        <div className="relative w-full h-[320px] md:h-[460px] lg:h-[540px] rounded-[28px] overflow-hidden shadow-lg border border-gray-100">
          <img src={galleryImages[activeGalleryIndex] || "/default.jpg"} alt={eventDetail.title} className="w-full h-full object-cover transition-opacity duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-[28px]" />
          {galleryImages.length > 1 && (
            <>
              <button onClick={() => setActiveGalleryIndex((i) => Math.max(i - 1, 0))} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow hover:bg-white transition"><FiChevronLeft className="text-gray-700 text-lg" /></button>
              <button onClick={() => setActiveGalleryIndex((i) => Math.min(i + 1, galleryImages.length - 1))} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow hover:bg-white transition"><FiChevronRight className="text-gray-700 text-lg" /></button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {galleryImages.map((_, i) => (
                  <button key={i} onClick={() => setActiveGalleryIndex(i)} className={`rounded-full transition-all ${i === activeGalleryIndex ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/50 hover:bg-white/80"}`} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── CONTENT + SIDEBAR ── */}
      <section className="pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-8 md:p-10">
              <h2 className="text-2xl font-bold text-[#2563eb] mb-6 pb-4 border-b border-gray-100">About this Experience</h2>
              
              {eventDetail.summary && (
                <div className="mb-10">
                  <div className="article-summary text-[1rem] text-gray-600 leading-[1.8] bg-[#f8fbff] p-6 md:p-8 rounded-2xl border border-blue-50 shadow-sm">
                    <h3 className="text-xs font-bold text-[#2563eb] uppercase tracking-widest mb-4 flex items-center gap-2"><span className="w-8 h-[1px] bg-[#2563eb]"></span> Event Overview</h3>
                    <div className="space-y-3">{eventDetail.summary.split("\n").map((str, idx) => <p key={idx} className="last:mb-0">{str}</p>)}</div>
                  </div>
                </div>
              )}
              <div className="mt-10 flex items-start gap-4 bg-blue-50 border border-blue-100 p-5 rounded-[16px]">
                <FiInfo className="text-xl text-[#2563eb] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1 text-[#2563eb] text-sm">Admission Details</p>
                  <p className="text-sm text-blue-800 leading-relaxed">{eventDetail.price || "Free Admission"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 lg:sticky lg:top-24">
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-5">Key Details</h3>
              <div className="space-y-4">
                {[{ icon: <FiCalendar />, label: "Date", value: formattedDate }, { icon: <FiMapPin />, label: "Location", value: locationStr }].map(({ icon, label, value }) => (
                  <div key={label} className="flex gap-4 items-start"><span className="text-[#2563eb] text-lg mt-0.5 flex-shrink-0">{icon}</span><div><p className="text-xs font-semibold text-gray-900">{label}</p><p className="text-sm text-gray-500 mt-0.5 leading-snug">{value}</p></div></div>
                ))}
              </div>
            </div>

            {/* Rating Card */}
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 relative">
              {showPopup && <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-semibold py-2.5 px-5 rounded-full shadow-xl flex items-center gap-2 z-50">✔ Rating submitted!</div>}
              <h3 className="font-bold text-gray-900 mb-1">Rate your experience</h3>
              <div className="flex flex-col items-center bg-gray-50 rounded-[16px] p-5 mt-4">
                <div className="flex gap-2 text-4xl mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} onClick={() => { if (!isSubmitted) setUserRating(star); }} className={`transition-all duration-200 ${star <= userRating ? "text-yellow-400 scale-110" : "text-gray-200 hover:text-yellow-200"} ${isSubmitted ? "cursor-default" : "cursor-pointer hover:scale-110"}`}>★</span>
                  ))}
                </div>
              </div>
              <button onClick={handleRating} disabled={userRating === 0 || isSubmitted} className={`w-full mt-4 font-semibold py-3 rounded-full transition-all duration-300 ${isSubmitted ? "bg-green-50 text-green-700" : "bg-[#2563eb] text-white"}`}>{isSubmitted ? "Rating Submitted" : "Submit Rating"}</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── MORE TO EXPLORE ── */}
      <section className="py-20 px-6 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div><p className="text-xs font-semibold text-[#2563eb] uppercase tracking-widest mb-2">Nearby</p><h3 className="text-3xl font-bold text-[#2563eb]">More Events to Explore</h3></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {morePlaces.slice(0, 4).map((place) => (
              <div key={place.id} onClick={() => navigate(`/event/${place.id}`)} className="group cursor-pointer bg-white rounded-[20px] border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                <div className="relative h-[180px] overflow-hidden"><img src={place.imageURL || "/default.jpg"} alt={place.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /></div>
                <div className="p-4"><h4 className="font-semibold text-[#2563eb] text-[14px] line-clamp-1">{place.title}</h4><p className="text-xs text-gray-400 mt-1.5 line-clamp-2">{place.summary}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .article-body p, .article-summary p { margin-bottom: 1.25rem; }
        .article-body li, .article-summary li { margin-bottom: 0.75rem; padding-left: 0.5rem; font-weight: 400; }
      `}</style>
      <TourismChatbot />
      <Footer />
    </div>
  );
};

export default EventDetails;