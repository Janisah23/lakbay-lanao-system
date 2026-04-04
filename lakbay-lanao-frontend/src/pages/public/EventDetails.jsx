import React, { useState, useEffect } from 'react';
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import TourismChatbot from "../../components/chatbot/TourismChatbot";
import { useNavigate, useParams } from 'react-router-dom';

import { db } from "../../firebase/config";
import { doc, getDoc } from "firebase/firestore";

const EventDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const [eventDetail, setEventDetail] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, "tourismContent", id); 
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          setEventDetail({ id: snap.id, ...snap.data() });
        } else {
          console.log("No such event!");
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      }
    };

    if (id) fetchEvent();
  }, [id]);

  // ✅ LOADING STATE (UNCHANGED DESIGN)
  if (!eventDetail) {
    return (
      <div className="font-sans text-gray-900 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Event Details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans text-gray-900 bg-gray-50 min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="relative w-full h-[60vh] flex items-end justify-start overflow-hidden border-b border-gray-200">
        <img
          src={eventDetail.imageURL}
          alt={eventDetail.title}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 pb-12 w-full text-white">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-bold uppercase text-blue-400 bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm">
              {eventDetail.category}
            </span>

            {eventDetail.eventDate && (
              <span className="text-sm font-semibold">
                {new Date(eventDetail.eventDate).toLocaleDateString()}
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
            {eventDetail.title}
          </h1>

          <button
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-white/80 hover:text-white"
          >
            ← Back
          </button>
        </div>
      </section>

      {/* CONTENT */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-bold border-l-4 border-blue-600 pl-4">
              Event Details
            </h2>

            <p className="text-lg text-gray-700">
              {eventDetail.description}
            </p>
          </div>

          {/* RIGHT */}
          <div className="bg-gray-50 p-8 rounded-2xl border space-y-6">

            {/* FIX: handle location object */}
            <p><strong>Location:</strong> {
              eventDetail.location
                ? `${eventDetail.location.municipality}, ${eventDetail.location.province}`
                : "N/A"
            }</p>

            <p><strong>Time:</strong> {eventDetail.time || "N/A"}</p>
            <p><strong>Organizer:</strong> {eventDetail.organizer || "N/A"}</p>
            <p><strong>Admission:</strong> {eventDetail.price || "Free"}</p>

          </div>

        </div>
      </section>

      <TourismChatbot />
      <Footer />
    </div>
  );
};

export default EventDetails;