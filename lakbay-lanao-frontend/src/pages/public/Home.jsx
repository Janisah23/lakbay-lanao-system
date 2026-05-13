import Navbar from "../../components/common/Navbar";
import { useState, useEffect } from "react";
import LanaoMap from "../../components/map/LanaoMap";
import TourismChatbot from "../../components/chatbot/TourismChatbot";
import Footer from "../../components/common/Footer";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import {
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { FiHeart, FiMousePointer, FiMove } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { onAuthStateChanged } from "firebase/auth";
import { useFavorites } from "../../components/context/FavoritesContext";
import { motion } from "framer-motion";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "./Home.css";

// 1. FIX: Import images directly so the bundler includes them in production
import hero1 from "../../assets/hero1.png";
import hero2 from "../../assets/hero2.png";
import hero3 from "../../assets/hero3.png";
import lakbayLogo from "../../assets/lakbay-logo.png";

function Home() {
  const { favorites } = useFavorites();

  const [showHeart, setShowHeart] = useState(null);
  const [articles, setArticles] = useState([]);
  const [content, setContent] = useState([]);
  const [activeHighlight, setActiveHighlight] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  // FIX: Use imported variables
  const heroImages = [hero1, hero2, hero3];

  const fallbackHighlightImage =
    "https://images.unsplash.com/photo-1506744626753-1fa44f22908f?w=1400&q=80";

  const sectionReveal = {
    hidden: { opacity: 0, y: 28 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: "easeOut" },
    },
  };

  const scrollToMap = () => {
    const mapSection = document.getElementById("map-section");
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const headingReveal = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const cardReveal = {
    hidden: { opacity: 0, y: 22, scale: 0.99 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.45, ease: "easeOut" },
    },
  };

  const getShortDescription = (text) => {
    const fallback = "Discover more stories from Lanao del Sur.";
    if (!text) return fallback;

    const cleanText = String(text).replace(/\s+/g, " ").trim();
    const firstSentence = cleanText.match(/[^.!?]+[.!?]/)?.[0] || cleanText;

    if (firstSentence.length <= 72) return firstSentence;
    return `${firstSentence.slice(0, 72).trim()}...`;
  };

  const getVideoEmbedURL = (url) => {
    if (!url) return "";
    try {
      const cleanUrl = url.trim();
      const parsedUrl = new URL(cleanUrl);
      const host = parsedUrl.hostname.replace("www.", "");

      if (host.includes("youtu.be")) {
        const videoId = parsedUrl.pathname.replace("/", "").split("?")[0];
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }

      if (host.includes("youtube.com")) {
        const videoId = parsedUrl.searchParams.get("v");
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        if (cleanUrl.includes("/embed/")) return cleanUrl;
        if (cleanUrl.includes("/shorts/")) {
          const shortsId = cleanUrl.split("/shorts/")[1]?.split("?")[0];
          if (shortsId) return `https://www.youtube.com/embed/${shortsId}`;
        }
      }

      if (host.includes("facebook.com") || host.includes("m.facebook.com") || host.includes("fb.watch")) {
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(cleanUrl)}&show_text=false&width=900`;
      }

      return "";
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (location.state?.openChatbot) {
      setTimeout(() => {
        window.dispatchEvent(new Event("open-tourism-chatbot"));
      }, 300);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("AUTH USER:", user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const q = query(collection(db, "tourismContent"), where("contentType", "==", "Article"));
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
    (item) => item.contentType?.toLowerCase() === "highlight" && item.status?.toLowerCase() === "published"
  );

  const events = content.filter(
    (item) => item.contentType?.toLowerCase() === "event" && item.status?.toLowerCase() === "published"
  );

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

  const formatEventDate = (eventDate) => {
    if (eventDate?.seconds) {
      return new Date(eventDate.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
    }
    if (eventDate) {
      return new Date(eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase();
    }
    return "TBA";
  };

  return (
    <div className="font-sans min-h-screen bg-[#f3f9ff] text-gray-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body, .font-sans { font-family: 'Plus Jakarta Sans', sans-serif; }
        .highlight-swiper .swiper-pagination-bullet-active { background: #2563eb; }
        .highlight-swiper .swiper-pagination-bullet { background: rgba(37, 99, 235, 0.45); }
        @keyframes pop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes mapHintFloat {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-3px); }
        }
        .map-hint-float { animation: mapHintFloat 2.8s ease-in-out infinite; }
      `}</style>

      <Navbar />

      {/* RESTORED HERO SECTION (Uses Home.css classes) */}
      <section className="hero">
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 12000, disableOnInteraction: false }}
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
              src={lakbayLogo}
              alt="Lakbay Lanao Logo"
              className="hero-logo"
            />
            <h1>LAKBAY LANAO</h1>
          </div>

          <p>
            Lakbay Lanao is your digital companion for exploring the rich
            culture and breathtaking destinations of Lanao del Sur.
          </p>

          <button className="explore-btn" onClick={scrollToMap}>
            Explore Lanao
          </button>
        </div>
      </section>

      {/* TRAVEL HIGHLIGHTS */}
      <section className="bg-transparent px-4 sm:px-6 md:px-12 lg:px-20 py-16 md:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div variants={headingReveal} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.4 }} className="mb-10 md:mb-14 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#2563eb]">Travel Highlights</h2>
            <p className="mt-2 text-sm sm:text-base text-gray-500">Explore the beauty and culture of Lanao del Sur</p>
          </motion.div>

          <motion.div variants={sectionReveal} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.18 }} className="relative overflow-hidden rounded-[20px] sm:rounded-[28px] border border-blue-100 bg-white p-2 sm:p-3 shadow-[0_10px_28px_rgba(37,99,235,0.08)]">
            {highlights.length > 0 ? (
              <Swiper
                modules={[Autoplay, Pagination, Navigation]}
                autoplay={{ delay: 20000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                pagination={{ clickable: true }}
                navigation={{ nextEl: ".highlight-next", prevEl: ".highlight-prev" }}
                loop={highlights.length > 1}
                allowTouchMove={true}
                onSlideChange={(swiper) => setActiveHighlight(swiper.realIndex)}
                className="highlight-swiper overflow-hidden rounded-[16px] sm:rounded-[24px]"
              >
                <button className="highlight-prev absolute left-2 sm:left-6 top-1/2 z-30 -translate-y-1/2 text-3xl sm:text-5xl font-light text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-105 hover:text-white/90">‹</button>
                <button className="highlight-next absolute right-2 sm:right-6 top-1/2 z-30 -translate-y-1/2 text-3xl sm:text-5xl font-light text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-105 hover:text-white/90">›</button>

                {highlights.map((item, index) => {
                  const embedURL = getVideoEmbedURL(item.videoURL);
                  const hasVideo = Boolean(embedURL);
                  const isActive = activeHighlight === index;

                  return (
                    <SwiperSlide key={item.id || index}>
                      <div className="relative overflow-hidden rounded-[16px] sm:rounded-[24px] bg-gray-100">
                        {hasVideo && isActive ? (
                          <div className="relative w-full overflow-hidden bg-black aspect-[4/3] sm:aspect-video">
                            <iframe key={embedURL} src={embedURL} title={item.title || "Highlight Video"} className="absolute inset-0 h-full w-full border-0 bg-black" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                          </div>
                        ) : (
                          <img src={item.imageURL || fallbackHighlightImage} alt={item.title || "Travel Highlight"} className="aspect-[4/3] sm:aspect-video w-full object-cover" onError={(e) => { e.currentTarget.src = fallbackHighlightImage; }} />
                        )}

                        {!hasVideo && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 px-5 pb-10 sm:px-14 sm:pb-16 text-center text-white">
                              <span className="mb-2 sm:mb-4 inline-block rounded-full border border-white/25 bg-white/15 px-3 py-1 sm:px-4 sm:py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white">
                                {item.category || "Highlight"}
                              </span>
                              <h3 className="text-xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight drop-shadow">{item.title}</h3>
                              {item.summary && (
                                <p className="mx-auto mt-2 sm:mt-3 max-w-xl text-xs sm:text-base leading-relaxed text-white/80 line-clamp-3 sm:line-clamp-none">
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
              <div className="flex h-[300px] sm:h-[560px] w-full items-center justify-center rounded-[16px] sm:rounded-[24px] bg-blue-50">
                <p className="text-sm sm:text-base text-gray-400">No highlights available yet.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* TOURISM CONTENT - RESPONSIVE CARDS */}
      <motion.section className="bg-transparent px-4 sm:px-6 md:px-12 lg:px-20 py-16 md:py-20 lg:py-24" variants={sectionReveal} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.18 }}>
        <div className="mx-auto max-w-7xl">
          <motion.div variants={headingReveal} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.4 }} className="mb-10 md:mb-14 text-center">
            <span className="inline-block rounded-full bg-white px-4 py-1.5 sm:px-5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-[#2563eb] border border-blue-100 shadow-sm">
              Stories
            </span>
            <h2 className="mt-3 sm:mt-4 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#2563eb]">Tourism Content</h2>
            <p className="mt-2 text-sm sm:text-base text-gray-500">Stories, highlights, and announcements from Lanao del Sur</p>
          </motion.div>

          <div className="rounded-[20px] sm:rounded-[28px] border border-blue-100 bg-white p-3 sm:p-5 md:p-7 shadow-[0_10px_28px_rgba(37,99,235,0.08)]">
            
            {/* GRID LAYOUT FOR CARDS */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {articles.slice(0, 3).map((article, index) => (
                <motion.div
                  key={article.id}
                  variants={cardReveal}
                  initial="hidden"
                  whileInView="show"
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: false, amount: 0.25 }}
                  whileHover={{ y: -2, scale: 1.003, transition: { duration: 0.2, ease: "easeOut" } }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(`/article/${article.id}`)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(article);
                    setShowHeart(article.id);
                    setTimeout(() => setShowHeart(null), 400);
                  }}
                  className="group flex flex-col cursor-pointer overflow-hidden rounded-[20px] sm:rounded-[24px] border border-blue-100 bg-white shadow-sm min-h-[250px] sm:min-h-[310px] transition-all hover:border-blue-200"
                >
                  <div className="p-1.5 pb-0 sm:p-2 sm:pb-0">
                    <div className="relative h-[120px] sm:h-[165px] shrink-0 overflow-hidden rounded-[16px] sm:rounded-[20px] bg-[#f8fbff]">
                      <img src={article.imageURL || "/default.jpg"} alt={article.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(article); }} className="absolute right-2 top-2 sm:right-3 sm:top-3 z-20 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/95 shadow-sm">
                        {favorites.some((fav) => String(fav.id) === String(article.id)) ? <FaHeart className="text-xs sm:text-sm text-[#2563eb]" /> : <FiHeart className="text-xs sm:text-sm text-[#2563eb]" />}
                      </button>

                      {showHeart === article.id && <FaHeart className="pointer-events-none absolute inset-0 z-30 m-auto text-3xl sm:text-4xl text-[#2563eb]" style={{ animation: "pop 0.4s ease" }} />}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
                    <div className="mb-1.5 sm:mb-2 flex items-center justify-between gap-1">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-blue-700 line-clamp-1">
                        {article.category || article.contentType || "Article"}
                      </span>
                    </div>

                    <h3 className="line-clamp-2 min-h-[34px] sm:min-h-[40px] text-xs sm:text-sm font-bold leading-tight text-[#2563eb]">
                      {article.title}
                    </h3>

                    <p className="mt-1.5 sm:mt-2 line-clamp-2 text-[11px] sm:text-xs text-gray-500 flex-1">
                      {getShortDescription(article.summary)}
                    </p>

                    <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/article/${article.id}`); }} className="mt-3 sm:mt-4 w-full rounded-full bg-[#2563eb] px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-[11px] font-medium text-white transition hover:bg-blue-700">
                      Read more →
                    </button>
                  </div>
                </motion.div>
              ))}

              {articles.length === 0 && (
                <div className="col-span-full rounded-[24px] border border-dashed border-blue-100 bg-blue-50/40 py-16 text-center text-sm text-gray-400">
                  No articles available yet.
                </div>
              )}
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-gray-100 pt-5 sm:pt-6">
              <span className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
                Showing {Math.min(articles.length, 3)} of {articles.length} articles
              </span>
              <button onClick={() => navigate("/articles")} className="w-full sm:w-auto rounded-full bg-[#2563eb] px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
                See more articles →
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* MAP */}
      <motion.section id="map-section" className="scroll-mt-20 sm:scroll-mt-24 bg-transparent px-4 sm:px-6 md:px-12 lg:px-20 py-16 md:py-20 lg:py-24" variants={sectionReveal} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.18 }}>
        <div className="mx-auto max-w-7xl">
          <motion.div variants={headingReveal} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.4 }} className="mb-10 md:mb-14 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#2563eb]">Explore Lanao del Sur</h2>
            <p className="mt-2 text-sm sm:text-base text-gray-500">Discover tourist spots using our interactive map</p>
          </motion.div>

          <div className="relative overflow-hidden rounded-[20px] sm:rounded-[28px] border border-blue-100 bg-white p-1.5 sm:p-2 shadow-[0_10px_28px_rgba(37,99,235,0.08)]">
            <div className="map-hint-float pointer-events-none absolute left-1/2 top-4 sm:top-6 z-[30] hidden -translate-x-1/2 items-center gap-2 rounded-full border border-blue-100 bg-white/95 px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-semibold text-[#2563eb] shadow-md md:flex">
              <span className="flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-blue-50">
                <FiMove className="text-[10px] sm:text-sm" />
              </span>
              <span>Drag to explore the map</span>
            </div>

            <div className="pointer-events-none absolute bottom-4 sm:bottom-5 left-1/2 z-[30] flex -translate-x-1/2 items-center gap-2 rounded-full border border-blue-100 bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-[#2563eb] shadow-md md:hidden">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50">
                <FiMousePointer className="text-[10px]" />
              </span>
              <span>Swipe or pinch to explore</span>
            </div>

            <div className="overflow-hidden rounded-[16px] sm:rounded-[24px]">
              <LanaoMap />
            </div>
          </div>
        </div>
      </motion.section>

      {/* UPCOMING EVENTS - RESPONSIVE CARDS */}
      <motion.section className="bg-transparent px-4 sm:px-6 md:px-12 lg:px-20 py-16 md:py-20 lg:py-24" variants={sectionReveal} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.18 }}>
        <div className="mx-auto max-w-7xl">
          <motion.div variants={headingReveal} initial="hidden" whileInView="show" viewport={{ once: false, amount: 0.4 }} className="mb-10 md:mb-14 flex flex-col items-center text-center">
            <span className="mb-3 sm:mb-4 rounded-full bg-white px-4 py-1.5 sm:px-5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-[#2563eb] border border-blue-100 shadow-sm">
              Local Celebrations
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#2563eb]">Upcoming Events</h2>
            <p className="mt-2 text-sm sm:text-base max-w-2xl text-gray-500">Discover festivals, cultural gatherings, and celebrations happening around Lanao del Sur.</p>
          </motion.div>

          <div className="rounded-[20px] sm:rounded-[28px] border border-blue-100 bg-white p-3 sm:p-5 md:p-7 shadow-[0_10px_28px_rgba(37,99,235,0.08)]">
            
            {/* GRID LAYOUT FOR CARDS */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {events.slice(0, 8).map((evt, index) => (
                <motion.div
                  key={evt.id}
                  variants={cardReveal}
                  initial="hidden"
                  whileInView="show"
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: false, amount: 0.25 }}
                  whileHover={{ y: -2, scale: 1.003, transition: { duration: 0.2, ease: "easeOut" } }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(`/event/${evt.id}`)}
                  onDoubleClick={() => {
                    toggleFavorite(evt);
                    setShowHeart(evt.id);
                    setTimeout(() => setShowHeart(null), 400);
                  }}
                  className="group flex flex-col cursor-pointer overflow-hidden rounded-[20px] sm:rounded-[24px] border border-blue-100 bg-white shadow-sm min-h-[250px] sm:min-h-[310px] transition-all hover:border-blue-200"
                >
                  <div className="p-1.5 pb-0 sm:p-2 sm:pb-0">
                    <div className="relative h-[120px] sm:h-[165px] shrink-0 overflow-hidden rounded-[16px] sm:rounded-[20px] bg-[#f8fbff]">
                      {/* FIX: Use imported default image for events */}
                      <img src={evt.imageURL || defaultEventImg} alt={evt.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(evt); }} className="absolute right-2 top-2 sm:right-3 sm:top-3 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white/95 shadow-sm">
                        {favorites.some((fav) => String(fav.id) === String(evt.id)) ? <FaHeart className="text-xs sm:text-sm text-[#2563eb]" /> : <FiHeart className="text-xs sm:text-sm text-[#2563eb]" />}
                      </button>

                      {showHeart === evt.id && <FaHeart className="pointer-events-none absolute inset-0 z-20 m-auto text-3xl sm:text-4xl text-[#2563eb]" style={{ animation: "pop 0.4s ease" }} />}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
                    <div className="mb-1.5 sm:mb-2 flex items-center justify-between gap-1">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-blue-700 line-clamp-1">
                        {evt.category || "Event"}
                      </span>
                    </div>

                    <h3 className="line-clamp-2 min-h-[34px] sm:min-h-[40px] text-xs sm:text-sm font-bold leading-tight text-[#2563eb]">
                      {evt.title}
                    </h3>

                    <div className="mt-auto pt-2 sm:pt-3">
                      <div className="rounded-xl bg-[#f8fbff] px-2 py-1.5 sm:px-3 sm:py-2 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-gray-500 ring-1 ring-blue-50 text-center">
                        {formatEventDate(evt.eventDate)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {events.length === 0 && (
                <div className="col-span-full rounded-[24px] border border-dashed border-blue-100 bg-blue-50/40 py-16 text-center text-sm text-gray-400">
                  No upcoming events yet.
                </div>
              )}
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-gray-100 pt-5 sm:pt-6">
              <span className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
                Showing {Math.min(events.length, 8)} of {events.length} events
              </span>
              <button onClick={() => navigate("/events")} className="w-full sm:w-auto rounded-full bg-[#2563eb] px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white shadow-sm transition hover:bg-blue-700">
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