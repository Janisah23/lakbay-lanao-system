import Navbar from "../../components/common/Navbar";
import { useState, useEffect } from "react";
import LanaoMap from "../../components/map/LanaoMap";
import TourismChatbot from "../../components/chatbot/TourismChatbot";
import Footer from "../../components/common/Footer";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { doc, setDoc, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { FiHeart } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { onAuthStateChanged } from "firebase/auth";
import { useFavorites } from "../../components/context/FavoritesContext";
import { motion } from "framer-motion";

import "swiper/css";
import "swiper/css/pagination";
import "./Home.css";
import "swiper/css/navigation";

function Home() {
  const { favorites } = useFavorites();
  const [showHeart, setShowHeart] = useState(null);
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [content, setContent] = useState([]);
  const [activeHighlight, setActiveHighlight] = useState(0);

  const heroImages = [
    "src/assets/hero1.png",
    "src/assets/hero2.png",
    "src/assets/hero3.png",
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
        const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
      (error) => {
        console.error("Error fetching data:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  const highlights = content.filter(
    (item) =>
      item.contentType?.toLowerCase() === "highlight" &&
      item.status?.toLowerCase() === "published"
  );

  const events = content.filter(
    (item) =>
      item.contentType?.toLowerCase() === "event" &&
      item.status?.toLowerCase() === "published"
  );

  const getYouTubeEmbedURL = (url) => {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url);

    // Shortened youtu.be links
    if (parsedUrl.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed${parsedUrl.pathname}`;
    }

    // Standard youtube watch links
    if (parsedUrl.hostname.includes("youtube.com")) {
      const videoId = parsedUrl.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // Already embed link
    if (url.includes("/embed/")) {
      return url;
    }

    return "";
  } catch (error) {
    return "";
  }
};

  const toggleFavorite = async (item) => {
    const user = auth.currentUser;
    if (!user) return;

    const favRef = doc(db, "users", user.uid, "favorites", item.id);
    const isFav = favorites.some((fav) => fav.id === item.id);

    if (isFav) {
      await deleteDoc(favRef);
    } else {
      await setDoc(favRef, item);
    }
  };

  return (
    <div className="font-sans text-gray-900 min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] pb-20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        body, .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }

        .highlight-swiper .swiper-pagination-bullet-active {
          background: #2563eb;
        }

        @keyframes pop {
          0%   { transform: scale(0.5); opacity: 0; }
          50%  { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>

      <Navbar />

      {/* HERO */}
      <section className="hero">
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 8000, disableOnInteraction: false }}
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
              src="src/assets/lakbay-logo.png"
              alt="Lakbay Lanao Logo"
              className="hero-logo"
            />
            <h1>LAKBAY LANAO</h1>
          </div>

          <p>
            Lakbay Lanao is your digital companion for exploring the rich culture
            and breathtaking destinations of Lanao del Sur.
          </p>

          <button
            className="explore-btn transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(37,99,235,0.25)] active:scale-[0.98]"
            onClick={() => (window.location.href = "/login")}
          >
            Explore Lanao
          </button>
        </div>
      </section>
{/* TRAVEL HIGHLIGHTS */}
<section className="py-24 px-6 md:px-12 lg:px-20 bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff]">
  <div className="max-w-7xl mx-auto">
    <div className="text-center mb-14">
      <h2 className="text-3xl md:text-4xl font-bold text-[#2563eb] tracking-tight">
        Travel Highlights
      </h2>
      <p className="text-gray-500 mt-2 text-base">
        Explore the beauty and culture of Lanao del Sur
      </p>
    </div>

    <div className="relative rounded-[28px] overflow-hidden border border-gray-200 bg-white p-3 shadow-sm">
      {highlights.length > 0 ? (
        <Swiper
          modules={[Pagination, Navigation]}
          pagination={{ clickable: true }}
          navigation={{
            nextEl: ".highlight-next",
            prevEl: ".highlight-prev",
          }}
          loop={false}
          allowTouchMove={false}
          onSlideChange={(swiper) => setActiveHighlight(swiper.activeIndex)}
          className="highlight-swiper rounded-[24px] overflow-hidden"
        >
         <button className="highlight-prev absolute left-6 top-1/2 z-30 -translate-y-1/2 text-5xl font-light text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)] transition-all duration-300 hover:scale-110 hover:text-white/90">
          ‹
        </button>

        <button className="highlight-next absolute right-6 top-1/2 z-30 -translate-y-1/2 text-5xl font-light text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)] transition-all duration-300 hover:scale-110 hover:text-white/90">
          ›
        </button>

          {highlights.map((item, index) => {
            const embedURL = getYouTubeEmbedURL(item.videoURL);
            const isActive = activeHighlight === index;

            return (
              <SwiperSlide key={index}>
                <div className="relative">
                  {embedURL && isActive ? (
                    <iframe
                      src={embedURL}
                      title={item.title}
                      className="w-full h-[560px]"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <img
                      src={
                        item.imageURL ||
                        "https://images.unsplash.com/photo-1506744626753-1fa44f22908f?w=1400&q=80"
                      }
                      alt={item.title}
                      className="w-full h-[560px] object-cover"
                    />
                  )}

                  {(!embedURL || !isActive) && (
                    <>
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
                    </>
                  )}
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      ) : (
        <div className="w-full h-[560px] bg-blue-50 flex items-center justify-center rounded-[24px]">
          <p className="text-gray-400">No highlights available yet.</p>
        </div>
      )}
    </div>
  </div>
</section>

      {/* TOURISM CONTENT */}
      <motion.section
        className="py-24 px-6 md:px-12 lg:px-20 bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff]"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block rounded-full bg-blue-50 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-[#2563eb]">
              Stories
            </span>

            <h2 className="mt-4 text-3xl md:text-4xl font-bold text-[#2563eb] tracking-tight">
              Tourism Content
            </h2>

            <p className="text-gray-500 mt-2 text-base">
              Stories, highlights, and announcements from Lanao del Sur
            </p>
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-white p-5 md:p-7 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.slice(0, 3).map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.06,
                    ease: "easeOut",
                  }}
                  viewport={{ once: true, amount: 0.25 }}
                  onClick={() => navigate(`/article/${article.id}`)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(article);
                    setShowHeart(article.id);
                    setTimeout(() => setShowHeart(null), 400);
                  }}
                  className="group flex h-full min-h-[470px] cursor-pointer flex-col overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="relative h-[235px] shrink-0 overflow-hidden bg-blue-50">
                    <img
                      src={article.imageURL || "/default.jpg"}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/5 to-transparent" />

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(article);
                      }}
                      className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:bg-blue-50"
                    >
                      {favorites.some(
                        (fav) => String(fav.id) === String(article.id)
                      ) ? (
                        <FaHeart className="text-[#2563eb] text-sm" />
                      ) : (
                        <FiHeart className="text-[#2563eb] text-sm" />
                      )}
                    </button>

                    {showHeart === article.id && (
                      <FaHeart
                        className="absolute inset-0 z-30 m-auto text-[#2563eb] text-5xl pointer-events-none"
                        style={{ animation: "pop 0.4s ease" }}
                      />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                        {article.category || article.contentType || "Article"}
                      </span>

                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        Article
                      </span>
                    </div>

                    <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#2563eb] transition group-hover:text-blue-700">
                      {article.title}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-2">
                      {article.summary || "Discover more stories from Lanao del Sur."}
                    </p>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/article/${article.id}`);
                      }}
                      className="mt-auto self-start rounded-full bg-[#2563eb] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                    >
                      Read more →
                    </button>
                  </div>
                </motion.div>
              ))}

              {articles.length === 0 && (
                <div className="col-span-full rounded-[28px] border border-dashed border-gray-200 bg-blue-50/40 py-16 text-center text-sm text-gray-400">
                  No articles available yet.
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-6">
              <span className="text-sm text-gray-400">
                Showing {Math.min(articles.length, 3)} of {articles.length} articles
              </span>

              <button
                onClick={() => navigate("/articles")}
                className="rounded-full bg-[#2563eb] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
              >
                See more articles →
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* MAP */}
      <motion.section
        className="py-24 px-6 md:px-12 lg:px-20 bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff]"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2563eb] tracking-tight">
              Explore Lanao del Sur
            </h2>
            <p className="text-gray-500 mt-2 text-base">
              Discover tourist spots using our interactive map
            </p>
          </div>

       <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white p-2 shadow-sm">
          <div className="overflow-hidden rounded-[24px]">
            <LanaoMap />
          </div>
        </div>
        </div>
      </motion.section>

      {/* UPCOMING EVENTS */}
      <motion.section
        className="py-24 px-6 md:px-12 lg:px-20 bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff]"
        initial={{ opacity: 0, y: 45 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-14 flex flex-col items-center text-center">
            <span className="mb-4 rounded-full bg-blue-50 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-[#2563eb]">
              Local Celebrations
            </span>

            <h2 className="text-3xl md:text-4xl font-bold text-[#2563eb] tracking-tight">
              Upcoming Events
            </h2>

            <p className="text-gray-500 mt-2 max-w-2xl">
              Discover festivals, cultural gatherings, and celebrations happening
              around Lanao del Sur.
            </p>
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-white p-5 md:p-7 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {events.slice(0, 8).map((evt, index) => (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.06,
                    ease: "easeOut",
                  }}
                  viewport={{ once: true, amount: 0.25 }}
                  onClick={() => navigate(`/event/${evt.id}`)}
                  onDoubleClick={() => {
                    toggleFavorite(evt);
                    setShowHeart(evt.id);
                    setTimeout(() => setShowHeart(null), 400);
                  }}
                  className="group flex h-full min-h-[390px] cursor-pointer flex-col overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="relative h-[210px] shrink-0 overflow-hidden bg-blue-50">
                    <img
                      src={evt.imageURL || "src/assets/default-event.jpg"}
                      alt={evt.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(evt);
                      }}
                      className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:bg-blue-50"
                    >
                      {favorites.some((fav) => String(fav.id) === String(evt.id)) ? (
                        <FaHeart className="text-[#2563eb] text-sm" />
                      ) : (
                        <FiHeart className="text-[#2563eb] text-sm" />
                      )}
                    </button>

                    {showHeart === evt.id && (
                      <FaHeart
                        className="absolute inset-0 z-20 m-auto text-[#2563eb] text-5xl pointer-events-none"
                        style={{ animation: "pop 0.4s ease" }}
                      />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                        {evt.category || "Event"}
                      </span>

                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        Event
                      </span>
                    </div>

                    <h3 className="line-clamp-2 text-base font-bold leading-snug text-[#2563eb] transition group-hover:text-[#2563eb]">
                      {evt.title}
                    </h3>

                    <div className="mt-auto flex items-center gap-2 rounded-2xl bg-gray-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
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
                    </div>
                  </div>
                </motion.div>
              ))}

              {events.length === 0 && (
                <div className="col-span-full rounded-[28px] border border-dashed border-gray-200 bg-blue-50/40 py-20 text-center text-sm text-gray-400">
                  No upcoming events yet.
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-6">
              <span className="text-sm text-gray-400">
                Showing {Math.min(events.length, 8)} of {events.length} events
              </span>

              <button
                onClick={() => (window.location.href = "/events")}
                className="rounded-full bg-[#2563eb] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
              >
                See more events →
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      <TourismChatbot />
      <Footer />
    </div>
  );
}

export default Home;