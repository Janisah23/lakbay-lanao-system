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
          autoplay={{ delay: 4000, disableOnInteraction: false }}
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
            Explore Now →
          </button>
        </div>
      </section>

      {/* ─── TRAVEL HIGHLIGHTS ────────────────────────────────────── */}
      {/* CHANGED: removed Navigation module + navigation={true}, increased slide height */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="section-title">Travel Highlights</h2>
          <p className="section-subtitle">Explore the beauty and culture of Lanao del Sur</p>

          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            loop={true}
            slidesPerView={1}
            className="highlight-swiper mt-4 rounded-2xl overflow-hidden shadow-xl"
          >
            {highlights.map((item, index) => (
              <SwiperSlide key={index}>
                <div className="relative rounded-2xl overflow-hidden">
                  <img
                    src={item.imageURL || "https://images.unsplash.com/photo-1506744626753-1fa44f22908f?q=80&w=1600&auto=format&fit=crop"}
                    alt={item.title}
                    className="w-full h-[680px]  object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center text-center bg-gradient-to-t from-black/75 via-black/40 to-transparent text-white pb-16 pt-24 px-6">
                    <h3 className="text-4xl font-bold drop-shadow-lg">{item.title}</h3>
                    {item.summary && (
                      <p className="text-lg mt-3 max-w-2xl text-white/85">{item.summary}</p>
                    )}
                  </div>
                </div>
              </SwiperSlide>
            ))}
            {highlights.length === 0 && (
              <SwiperSlide>
                <div className="w-full h-[680px] bg-gray-200 flex items-center justify-center rounded-2xl">
                  <p className="text-gray-400 text-lg">No highlights available yet.</p>
                </div>
              </SwiperSlide>
            )}
          </Swiper>
        </div>
      </section>


      {/* ─── TOURISM CONTENT ──────────────────────────────────────── */}
      {/* CHANGED: bg-[#f5f7fb] → bg-[#2563eb], text colors adjusted for contrast */}
      <section className="py-20 px-6 md:px-12 lg:px-20 bg-[#2563eb]">
        <div className="max-w-[1800px] mx-auto">

          {/* Section header */}
          <div className="text-center mb-14">
            <h2 className="text-[32px] font-[550] text-white text-center mb-2.5">
              Tourism Content
            </h2>
            <p className="text-white/75 text-center mb-[50px]">
              Stories, highlights, and announcements from Lanao del Sur
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {articles.slice(0, 3).map((article) => (
              <div
                key={article.id}
                onDoubleClick={() => {
                  toggleFavorite(article);
                  setShowHeart(article.id);
                  setTimeout(() => setShowHeart(null), 400);
                }}
                className="relative group rounded-3xl overflow-hidden shadow-md card-hover-lift cursor-pointer h-[420px] bg-gray-100"
              >
                {/* Background image */}
                <img
                  src={article.imageURL || "/default.jpg"}
                  alt={article.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>

                {/* Content type badge */}
                <span className="absolute top-5 left-5 bg-white text-blue-600 text-xs font-bold px-4 py-1.5 rounded-full shadow z-10 uppercase tracking-wider">
                  {article.contentType || "Article"}
                </span>

                {/* Favorite button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(article); }}
                  className="absolute top-5 right-5 bg-white/95 p-2.5 rounded-full shadow z-20 hover:bg-gray-100 transition-colors"
                >
                  {favorites.some((fav) => String(fav.id) === String(article.id)) ? (
                    <FaHeart className="text-blue-600 text-base" />
                  ) : (
                    <FiHeart className="text-blue-600 text-base" />
                  )}
                </button>

                {/* Heart pop animation */}
                {showHeart === article.id && (
                  <FaHeart className="absolute inset-0 m-auto text-blue-500 text-6xl z-30 pointer-events-none drop-shadow-lg" style={{ animation: 'pop 0.4s ease' }} />
                )}

                {/* Text content */}
                <div className="absolute bottom-0 left-0 right-0 p-7 z-10 text-white">
                  <h3 className="text-2xl font-bold leading-tight mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-white/80 text-sm leading-relaxed mb-4 line-clamp-2">
                    {article.summary || "Discover more stories and tourism updates from Lanao del Sur."}
                  </p>
                  <button className="text-white text-sm font-semibold underline underline-offset-4 hover:text-blue-300 transition-colors">
                    Read More →
                  </button>
                </div>
              </div>
            ))}

            {articles.length === 0 && (
              <div className="col-span-3 text-center py-16 text-white/60 text-base">
                No articles available yet.
              </div>
            )}
          </div>
        </div>
      </section>

       {/* ─── MAP ──────────────────────────────────────────────────── */}
      {/* CHANGED: replaced map-section CSS class with Tailwind */}
      <section className="py-16 px-6">
        <h2 className="text-3xl font-semibold text-[#2563eb] text-center mb-2.5">
          Explore Lanao del Sur
        </h2>
        <p className="text-gray-500 text-center mb-12">
          Discover tourist spots using our interactive map.
        </p>
        <div className="max-w-7xl mx-auto w-full rounded-2xl overflow-hidden shadow-lg">
          <LanaoMap />
        </div>
      </section>

      {/* ─── UPCOMING EVENTS ────────*/}
      <section className="py-20 px-6 md:px-12 lg:px-20 bg-white">
        <div className="max-w-[1400px] mx-auto">

          <div className="text-center mb-14">
            <h2 className="section-title">Upcoming Events</h2>
            <p className="section-subtitle">
              Discover festivals and celebrations in Lanao del Sur
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {events.slice(0, 8).map((evt) => (
              <div
                key={evt.id}
                onClick={() => navigate(`/event/${evt.id}`)}
                onDoubleClick={() => {
                  toggleFavorite(evt);
                  setShowHeart(evt.id);
                  setTimeout(() => setShowHeart(null), 400);
                }}
                className="group cursor-pointer bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm card-hover-lift"
              >
                <div className="relative h-[210px] bg-gray-100 overflow-hidden">
                  <img
                    src={evt.imageURL || "/default-event.jpg"}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />

                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(evt); }}
                    className="absolute top-4 right-4 bg-white/95 p-2.5 rounded-full shadow z-10 hover:bg-gray-50 transition-colors"
                  >
                    {favorites.some((fav) => String(fav.id) === String(evt.id)) ? (
                      <FaHeart className="text-blue-600 text-sm" />
                    ) : (
                      <FiHeart className="text-blue-600 text-sm" />
                    )}
                  </button>

                  {showHeart === evt.id && (
                    <FaHeart className="absolute inset-0 m-auto text-blue-500 text-5xl z-20 pointer-events-none drop-shadow-lg" style={{ animation: 'pop 0.4s ease' }} />
                  )}
                </div>

                <div className="p-5 flex flex-col gap-2">
                  <span className="self-start text-[11px] font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wide">
                    {evt.category || "Event"}
                  </span>

                  <h3 className="text-base font-bold text-blue-600 line-clamp-2 group-hover:text-blue-700 transition-colors leading-snug">
                    {evt.title}
                  </h3>

                  <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                    {evt.description || "No description available"}
                  </p>

                  <div className="mt-3 flex items-center gap-1.5 text-gray-400 text-xs font-semibold uppercase tracking-wide">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
              <div className="col-span-4 text-center py-16 text-gray-400 text-base">
                No upcoming events yet.
              </div>
            )}
          </div>

          <div className="mt-12">
            <button
              onClick={() => (window.location.href = "/events")}
              className="border-2 border-blue-600 text-blue-600 font-bold px-8 py-3.5 text-sm rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-200 tracking-wide uppercase"
            >
              See more events
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