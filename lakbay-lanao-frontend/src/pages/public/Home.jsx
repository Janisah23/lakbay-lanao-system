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
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { onAuthStateChanged } from "firebase/auth";
import { useFavorites } from "../../components/context/FavoritesContext";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "./Home.css";

function Home() {
  const { favorites } = useFavorites();
  const [showHeart, setShowHeart] = useState(null);
  const navigate = useNavigate();

  // States for data fetching
  const [articles, setArticles] = useState([]);
  const [content, setContent] = useState([]);

  // Clearer, more professional images related to nature/architecture (Lanao vibe)
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

  // Fetch Articles specifically from tourismData
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const q = query(
          collection(db, "tourismContent"),
          where("contentType", "==", "Article") // 👈 IMPORTANT
        );

        const snap = await getDocs(q);
        
        const items = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setArticles(items);
      } catch (error) {
        console.error("Error fetching articles:", error);
      }
    };

    fetchArticles();
  }, []);

  // Fetch Highlights and Events from tourismContent
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "tourismContent"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setContent(data);
      },
      (error) => {
        console.error("Error fetching data:", error);
      }
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

  // Dynamically splitting the fetched articles for the "Tourism Content" layout
  const featuredArticle = articles.length > 0 ? articles[0] : null;
  // Slicing up to 3 items so the grid cards remain wider (lg:grid-cols-3)
  const gridArticles = articles.slice(1, 4);

  return (
    <div className="font-sans text-gray-900 bg-white min-h-screen pb-20">
      {/* Custom Styles for the Highlight Swiper Arrows */}
      <style>{`
        .highlight-swiper .swiper-button-next,
        .highlight-swiper .swiper-button-prev {
          background-color: #e60012; 
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .highlight-swiper .swiper-button-next:after,
        .highlight-swiper .swiper-button-prev:after {
          font-size: 16px;
          font-weight: bold;
        }
      `}</style>

      <Navbar />

      {/* HERO */}
      <section className="hero">
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop={true}
          className="hero-swiper"
        >
          {heroImages.map((img, index) => (
            <SwiperSlide key={index}>
              <div
                className="hero-slide"
                style={{ backgroundImage: `url(${img})` }}
              />
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="hero-content">
          <div className="hero-title">
            <img
              src="/lakbay-logo.png"
              alt="Lakbay Lanao Logo"
              className="hero-logo"
            />
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

      {/* TRAVEL HIGHLIGHTS SECTION */}
      <section className="py-16 px-8 md:px-12 lg:px-20 max-w-[1300px] mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Travel Highlights
        </h2>

        <Swiper
          modules={[Navigation]}
          navigation={true}
          spaceBetween={20}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          className="highlight-swiper !px-2 !pb-4"
        >
          {highlights.map((item, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full h-[380px] rounded-lg overflow-hidden group shadow-sm hover:shadow-md transition">
                <img 
                  src={item.imageURL || "https://images.unsplash.com/photo-1506744626753-1fa44f22908f?q=80&w=1000&auto=format&fit=crop"} 
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <div className="border-2 border-white/90 px-6 py-4 text-center backdrop-blur-[2px]">
                    <h3 className="text-white text-xl font-bold leading-snug drop-shadow-md">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
          {highlights.length === 0 && (
             <div className="text-center py-10 text-gray-500">No highlights available yet.</div>
          )}
        </Swiper>
      </section>

      {/* MAP */}
      <section className="map-section">
        <h2>Explore Lanao del Sur</h2>
        <p className="subtitle">
          Discover tourist spots using our interactive map.
        </p>
        <div className="map-container">
          <LanaoMap />
        </div>
      </section>

      {/* TOURISM CONTENT */}
      <section className="py-24 px-8 md:px-12 lg:px-20 bg-white">
        <div className="max-w-[1300px] mx-auto">
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-left">
            Tourism Content
          </h2>

          {/* 1. Featured Big Item - Made smaller, rounded, with heart upper right */}
          {featuredArticle && (
            <div 
              className="flex flex-col md:flex-row border border-gray-200 bg-white mb-8 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
              onDoubleClick={() => {
                toggleFavorite(featuredArticle);
                setShowHeart(featuredArticle.id);
                setTimeout(() => setShowHeart(null), 400);
              }}
            >
              {/* Circular Heart Button Upper Right (Relative to the whole card) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(featuredArticle);
                }}
                className="absolute top-4 right-4 bg-white/95 p-3 rounded-full shadow-md hover:bg-gray-50 transition-colors z-20"
              >
                {favorites.some(fav => String(fav.id) === String(featuredArticle.id)) ? (
                  <FaHeart className="text-blue-800 text-xl" />
                ) : (
                  <FiHeart className="text-blue-800 text-xl hover:text-blue-600 transition" />
                )}
              </button>

              {/* Left Image Side - Height reduced to make item smaller */}
              <div className="w-full md:w-1/2 relative h-[250px] md:h-[320px]">
                <img
                  src={featuredArticle.imageURL || "/default.jpg"}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover"
                />
                {showHeart === featuredArticle.id && (
                  <FaHeart className="absolute inset-0 m-auto text-blue-600 text-6xl animate-[pop_0.4s_ease] z-20 pointer-events-none drop-shadow-lg" />
                )}
              </div>

              {/* Right Text Side - Padding reduced */}
              <div className="w-full md:w-1/2 p-6 md:p-8 lg:p-10 flex flex-col justify-center text-left bg-white">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  {featuredArticle.contentType || "THINGS TO DO"}
                </span>
                
                <h3 className="text-xl md:text-2xl lg:text-3xl font-medium text-gray-900 leading-tight mb-3 pr-10">
                  {featuredArticle.title}
                </h3>
                
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  {featuredArticle.summary || "Experience the city's best sights and attractions."}
                </p>

                {/* Bottom Row: "Read now" */}
                <div className="mt-auto">
                  <button className="text-blue-800 font-semibold text-sm flex items-center hover:underline">
                    Read now <span className="ml-1 text-lg leading-none">›</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. Smaller Grid Items - Made rounded with heart upper right */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridArticles.map((article, index) => (
              <div
                key={index}
                onDoubleClick={() => {
                  toggleFavorite(article);
                  setShowHeart(article.id);
                  setTimeout(() => setShowHeart(null), 400);
                }}
                className="group cursor-pointer flex flex-col relative bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Image Wrapper */}
                <div className="relative h-[200px] w-full bg-gray-100">
                  <img
                    src={article.imageURL || "/default.jpg"}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300"
                  />
                  
                  {/* Circular Heart Button Upper Right */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(article);
                    }}
                    className="absolute top-3 right-3 bg-white/95 p-2.5 rounded-full shadow-md z-10 hover:bg-gray-50 transition-colors"
                  >
                    {favorites.some(fav => String(fav.id) === String(article.id)) ? (
                      <FaHeart className="text-blue-800 text-[15px]" />
                    ) : (
                      <FiHeart className="text-blue-800 text-[15px] hover:text-blue-600 transition" />
                    )}
                  </button>

                  {showHeart === article.id && (
                    <FaHeart className="absolute inset-0 m-auto text-blue-600 text-4xl animate-[pop_0.4s_ease] z-20 pointer-events-none drop-shadow-lg" />
                  )}
                </div>

                {/* Text Content */}
                <div className="p-6 flex-1 flex flex-col bg-white">
                  <h3 className="font-medium text-[16px] text-gray-900 leading-snug group-hover:text-blue-800 transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  <div className="mt-auto pt-5 flex items-center text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <span>
                      {article.readTime ? `${article.readTime} MIN READ` : "Quick Read"}
                    </span>                  
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 3. See More Button */}
          <div className="mt-12 text-left">
            <button 
              onClick={() => window.location.href = "/articles"}
              className="border border-blue-900 text-blue-900 font-semibold px-8 py-3 text-sm hover:bg-blue-50 transition-colors rounded-sm"
            >
              See more articles
            </button>
          </div>

        </div>
      </section>

      {/* UPCOMING EVENTS */}
      <section className="py-20 px-8 md:px-12 lg:px-20 bg-gray-50">
        <div className="max-w-[1400px] mx-auto text-center">
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 text-left">
            Upcoming Events
          </h2>
          <p className="text-gray-500 mb-12 text-lg text-left">
            Discover festivals and celebrations in Lanao del Sur
          </p>

          {/* Grid: Changed to 4 columns to make cards wider, max 8 items for 2 rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {events.slice(0, 8).map((evt) => (
              <div
                key={evt.id}
                onClick={() => navigate(`/event/${evt.id}`)}
                onDoubleClick={() => {
                  toggleFavorite(evt);
                  setShowHeart(evt.id);
                  setTimeout(() => setShowHeart(null), 400);
                }}
                className="group cursor-pointer flex flex-col relative bg-white border border-gray-200 rounded-xl hover:shadow-xl transition-all duration-300 overflow-hidden text-left"
              >
                {/* Image */}
                <div className="relative h-[220px] w-full overflow-hidden bg-gray-100">
                  <img
                    src={evt.imageURL || "/default-event.jpg"}
                    alt={evt.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />

                  {/* ❤️ Heart */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(evt);
                    }}
                    className="absolute top-4 right-4 bg-white/95 p-2.5 rounded-full shadow-md z-10 hover:bg-gray-50"
                  >
                    {favorites.some(fav => String(fav.id) === String(evt.id)) ? (
                      <FaHeart className="text-blue-800 text-[16px]" />
                    ) : (
                      <FiHeart className="text-blue-800 text-[16px]" />
                    )}
                  </button>

                  {/* ❤️ Animation */}
                  {showHeart === evt.id && (
                    <FaHeart className="absolute inset-0 m-auto text-blue-600 text-5xl animate-[pop_0.4s_ease] z-20 pointer-events-none drop-shadow-lg" />
                  )}
                </div>

                    {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-3 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-md self-start">
                      {evt.category || "Event"}
                    </span>

                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-800 transition-colors line-clamp-2">
                      {evt.title}
                    </h3>

                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {evt.description || "No description available"}
                    </p>

                    <div className="mt-auto pt-5 flex items-center text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                      <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>

                      <span>
                        {evt.eventDate?.seconds
                          ? new Date(evt.eventDate.seconds * 1000)
                              .toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                              .toUpperCase()
                          : evt.eventDate
                          ? new Date(evt.eventDate)
                              .toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                              .toUpperCase()
                          : "TBA"}
  
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>


          {/* See More Button */}
          <div className="mt-14 text-left">
            <button 
              onClick={() => window.location.href = "/events"}
              className="border border-blue-900 text-blue-900 font-semibold px-8 py-3 text-sm hover:bg-blue-50 transition-colors rounded-sm"
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