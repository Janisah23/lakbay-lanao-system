import Navbar from "../../components/common/Navbar";
import { useState, useEffect } from "react";
import LanaoMap from "../../components/map/LanaoMap";
import TourismChatbot from "../../components/chatbot/TourismChatbot";
import Footer from "../../components/common/Footer";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { doc, setDoc, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from 'react-router-dom';

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { onAuthStateChanged } from "firebase/auth";
import { useFavorites } from "../../components/context/FavoritesContext";

import "swiper/css";
import "swiper/css/pagination";
import "./Home.css";

function Home() {
  const { favorites } = useFavorites();
  const [showHeart, setShowHeart] = useState(null);
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [content, setContent] = useState([]);

  const heroImages = [
    "/hero1.png",
    "/hero2.png",
    "/hero3.png"
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("AUTH USER:", user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const q = query(
          collection(db, "tourismContent"),
          where("contentType", "==", "Article")
        );
        const snap = await getDocs(q);
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setArticles(items);
      } catch (error) {
        console.error("Error fetching articles:", error);
      }
    };
    fetchArticles();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "tourismContent"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setContent(data);
      },
      (error) => { console.error("Error fetching data:", error); }
    );
    return () => unsubscribe();
  }, []);

  const highlights = content.filter(
    item =>
      item.contentType?.toLowerCase() === "highlight" &&
      item.status?.toLowerCase() === "published"
  );

  const events = content.filter(
    item =>
      item.contentType?.toLowerCase() === "event" &&
      item.status?.toLowerCase() === "published"
  );

  const toggleFavorite = async (item) => {
    const user = auth.currentUser;
    if (!user) return;
    const favRef = doc(db, "users", user.uid, "favorites", item.id);
    const isFav = favorites.some(fav => fav.id === item.id);
    if (isFav) {
      await deleteDoc(favRef);
    } else {
      await setDoc(favRef, item);
    }
  };

  return (
    <div className="font-sans text-gray-900 bg-white min-h-screen pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        body, .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }

        .highlight-swiper .swiper-pagination-bullet-active {
          background: #2563eb;
        }

        @keyframes pop {
          0%   { transform: scale(0.5); opacity: 0; }
          50%  { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1);   opacity: 0; }
        }
        .card-hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .card-hover-lift:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        }
        .section-title {
          font-size: 32px;
          color: #2563eb;
          margin-bottom: 10px;
          font-weight: 550;
          text-align: center;
        }
        .section-subtitle {
          color: #6b7280;
          margin-bottom: 50px;
          text-align: center;
        }
      `}</style>

      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="hero">
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 8000, disableOnInteraction: false }}
          loop={true}
          className="hero-swiper"
        >
          {heroImages.map((img, index) => (
            <SwiperSlide key={index}>
              <div className="hero-slide" style={{ backgroundImage: `url(${img})` }} />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="hero-content">
          <div className="hero-title">
            <img src="/lakbay-logo.png" alt="Lakbay Lanao Logo" className="hero-logo" />
            <h1>LAKBAY LANAO</h1>
          </div>
          <p>
            Lakbay Lanao is your digital companion for exploring the rich
            culture and breathtaking destinations of Lanao del Sur.
          </p>
          <button
            className="explore-btn"
            onClick={() => window.location.href = "/login"}
          >
            Explore Now
          </button>
        </div>
      </section>

          {/* ─── TRAVEL HIGHLIGHTS ────────────────────────────────── */}
      <section className="py-20 px-6"
        style={{ background: 'linear-gradient(135deg, #fff 0%, #f8fbff 50%, #eef4ff 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2563eb] tracking-tight">
              Travel Highlights
            </h2>
            <p className="text-gray-500 mt-2 text-base">
              Explore the beauty and culture of Lanao del Sur
            </p>
          </div>

          <div className="relative rounded-[28px] overflow-hidden shadow-[0_4px_24px_rgba(37,99,235,0.08)]">
            {highlights.length > 0 ? (
              <Swiper
                modules={[Autoplay, Pagination]}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                loop={true}
                className="highlight-swiper"
              >
                {highlights.map((item, index) => (
                  <SwiperSlide key={index}>
                    <div className="relative">
                      <img
                        src={item.imageURL || "https://images.unsplash.com/photo-1506744626753-1fa44f22908f?w=1400&q=80"}
                        alt={item.title}
                        className="w-full h-[560px] object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 px-14 pb-16 text-center text-white">
                        <span className="inline-block bg-white/15 border border-white/30 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
                          {item.category || "Highlight"}
                        </span>
                        <h3 className="text-4xl font-extrabold leading-tight tracking-tight drop-shadow">
                          {item.title}
                        </h3>
                        {item.summary && (
                          <p className="text-white/82 text-base mt-3 max-w-xl mx-auto leading-relaxed">
                            {item.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="w-full h-[560px] bg-blue-50 flex items-center justify-center rounded-[28px]">
                <p className="text-gray-400">No highlights available yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>


        {/* ─── TOURISM CONTENT ──────────────────────────────────── */}
    <section className="py-20 px-6 md:px-12 lg:px-20 bg-[#2563eb]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Tourism Content
          </h2>
          <p className="text-white/70 mt-2 text-base">
            Stories, highlights, and announcements from Lanao del Sur
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.slice(0, 3).map((article) => (
            <div
              key={article.id}
              onDoubleClick={() => {
                toggleFavorite(article);
                setShowHeart(article.id);
                setTimeout(() => setShowHeart(null), 400);
              }}
              className="relative group rounded-[28px] overflow-hidden cursor-pointer h-[400px] bg-blue-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.2)]"
            >
              <img
                src={article.imageURL || "/default.jpg"}
                alt={article.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/25 to-transparent" />

              {/* Badge */}
              <span className="absolute top-[18px] left-[18px] bg-white text-blue-700 text-[10px] font-bold uppercase tracking-widest px-[14px] py-[5px] rounded-full z-10">
                {article.contentType || "Article"}
              </span>

              {/* Fav button */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorite(article); }}
                className="absolute top-[18px] right-[18px] bg-white/95 w-9 h-9 rounded-full flex items-center justify-center shadow z-20 hover:bg-blue-50 transition-colors"
              >
                {favorites.some((fav) => String(fav.id) === String(article.id)) ? (
                  <FaHeart className="text-[#2563eb] text-sm" />
                ) : (
                  <FiHeart className="text-[#2563eb] text-sm" />
                )}
              </button>

              {showHeart === article.id && (
                <FaHeart
                  className="absolute inset-0 m-auto text-blue-400 text-5xl z-30 pointer-events-none"
                  style={{ animation: 'pop 0.4s ease' }}
                />
              )}

              {/* Body */}
              <div className="absolute bottom-0 left-0 right-0 p-[26px] z-10 text-white">
                <h3 className="text-xl font-extrabold leading-snug line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-white/78 text-[13px] leading-relaxed mt-2 line-clamp-2">
                  {article.summary || "Discover more stories from Lanao del Sur."}
                </p>
                <button className="mt-3.5 text-[12px] font-bold text-blue-300 underline underline-offset-4 hover:text-white transition-colors">
                  Read more →
                </button>
              </div>
            </div>
          ))}

          {articles.length === 0 && (
            <div className="col-span-3 text-center py-16 text-white/50 text-sm">
              No articles available yet.
            </div>
          )}
        </div>
      </div>
    </section>

        {/* ─── MAP ──────────────────────────────────────────────── */}
        <section className="py-20 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-[#2563eb] tracking-tight">
                Explore Lanao del Sur
              </h2>
              <p className="text-gray-500 mt-2 text-base">
                Discover tourist spots using our interactive map
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-[28px] overflow-hidden shadow-[0_4px_20px_rgba(37,99,235,0.07)]">
              <LanaoMap />
            </div>
          </div>
        </section>

        {/* ─── UPCOMING EVENTS ──────────────────────────────────── */}
        <section className="py-20 px-6 md:px-12 lg:px-20"
          style={{ background: 'linear-gradient(135deg, #fff 0%, #f8fbff 50%, #eef4ff 100%)' }}>
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-[#2563eb] tracking-tight">
                Upcoming Events
              </h2>
              <p className="text-gray-500 mt-2 text-base">
                Discover festivals and celebrations in Lanao del Sur
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {events.slice(0, 8).map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => navigate(`/event/${evt.id}`)}
                  onDoubleClick={() => {
                    toggleFavorite(evt);
                    setShowHeart(evt.id);
                    setTimeout(() => setShowHeart(null), 400);
                  }}
                  className="group cursor-pointer bg-white border border-gray-200 rounded-[28px] overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(37,99,235,0.09)] hover:border-blue-200"
                >
                  {/* Image */}
                  <div className="relative h-[200px] overflow-hidden bg-blue-50">
                    <img
                      src={evt.imageURL || "/default-event.jpg"}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(evt); }}
                      className="absolute top-3.5 right-3.5 bg-white/95 w-9 h-9 rounded-full flex items-center justify-center shadow-sm z-10 hover:bg-blue-50 transition-colors"
                    >
                      {favorites.some((fav) => String(fav.id) === String(evt.id)) ? (
                        <FaHeart className="text-[#2563eb] text-sm" />
                      ) : (
                        <FiHeart className="text-[#2563eb] text-sm" />
                      )}
                    </button>
                    {showHeart === evt.id && (
                      <FaHeart
                        className="absolute inset-0 m-auto text-[#2563eb] text-5xl z-20 pointer-events-none"
                        style={{ animation: 'pop 0.4s ease' }}
                      />
                    )}
                  </div>

                  {/* Body */}
                  <div className="px-5 pt-4 pb-5 flex flex-col gap-2.5">
                    {/* Category chip */}
                    <span className="self-start bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                      {evt.category || "Event"}
                    </span>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-[#1e3a8a] leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                      {evt.title}
                    </h3>

                    {/* Description */}
                    <p className="text-[12.5px] text-gray-400 leading-relaxed line-clamp-2">
                      {evt.description || "No description available."}
                    </p>

                    {/* Date */}
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold uppercase tracking-wide text-blue-300">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span>
                        {evt.eventDate?.seconds
                          ? new Date(evt.eventDate.seconds * 1000)
                              .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              .toUpperCase()
                          : evt.eventDate
                          ? new Date(evt.eventDate)
                              .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              .toUpperCase()
                          : "TBA"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {events.length === 0 && (
                <div className="col-span-4 text-center py-20 text-gray-400 text-sm">
                  No upcoming events yet.
                </div>
              )}
            </div>

            {/* Footer row */}
            <div className="mt-12 flex items-center justify-between flex-wrap gap-4">
              <span className="text-sm text-gray-400">
                Showing {Math.min(events.length, 8)} of {events.length} events
              </span>
              <button
                onClick={() => (window.location.href = "/events")}
                className="rounded-full bg-white border-2 border-[#2563eb] text-[#2563eb] font-bold text-xs uppercase tracking-widest px-7 py-3 transition-all duration-200 hover:bg-[#2563eb] hover:text-white hover:shadow-[0_4px_14px_rgba(37,99,235,0.2)]"
              >
                See more events →
              </button>
            </div>

          </div>
        </section>

      <TourismChatbot />
      <Footer />
    </div>
  );
}

export default Home;