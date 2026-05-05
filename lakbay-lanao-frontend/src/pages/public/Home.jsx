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

  const sectionReveal = {
    hidden: {
      opacity: 0,
      y: 28,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.55,
        ease: "easeOut",
      },
    },
  };

  const headingReveal = {
    hidden: {
      opacity: 0,
      y: 16,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const cardReveal = {
    hidden: {
      opacity: 0,
      y: 22,
      scale: 0.99,
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.45,
        ease: "easeOut",
      },
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

      if (parsedUrl.hostname.includes("youtu.be")) {
        return `https://www.youtube.com/embed${parsedUrl.pathname}`;
      }

      if (parsedUrl.hostname.includes("youtube.com")) {
        const videoId = parsedUrl.searchParams.get("v");

        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

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

  const formatEventDate = (eventDate) => {
    if (eventDate?.seconds) {
      return new Date(eventDate.seconds * 1000)
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase();
    }

    if (eventDate) {
      return new Date(eventDate)
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase();
    }

    return "TBA";
  };

  return (
    <div className="font-sans min-h-screen bg-[#f3f9ff] pb-20 text-gray-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        body, .font-sans {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .highlight-swiper .swiper-pagination-bullet-active {
          background: #2563eb;
        }

        @keyframes pop {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>

      <Navbar />

      {/* HERO */}
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
              src="src/assets/lakbay-logo.png"
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
            className="explore-btn transition-all duration-300 ease-out hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(37,99,235,0.18)] active:scale-[0.98]"
            onClick={() => (window.location.href = "/login")}
          >
            Explore Lanao
          </button>
        </div>
      </section>

      {/* TRAVEL HIGHLIGHTS */}
      <section className="bg-transparent px-6 py-24 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={headingReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.4 }}
            className="mb-14 text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
              Travel Highlights
            </h2>

            <p className="mt-2 text-base text-gray-500">
              Explore the beauty and culture of Lanao del Sur
            </p>
          </motion.div>

          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.18 }}
            className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-white p-3 shadow-[0_10px_28px_rgba(37,99,235,0.08)]"
          >
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
                onSlideChange={(swiper) =>
                  setActiveHighlight(swiper.activeIndex)
                }
                className="highlight-swiper overflow-hidden rounded-[24px]"
              >
                <button className="highlight-prev absolute left-6 top-1/2 z-30 -translate-y-1/2 text-5xl font-light text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-105 hover:text-white/90">
                  ‹
                </button>

                <button className="highlight-next absolute right-6 top-1/2 z-30 -translate-y-1/2 text-5xl font-light text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-105 hover:text-white/90">
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
                            className="h-[560px] w-full"
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
                            className="h-[560px] w-full object-cover"
                          />
                        )}

                        {(!embedURL || !isActive) && (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

                            <div className="absolute bottom-0 left-0 right-0 px-8 pb-12 text-center text-white md:px-14 md:pb-16">
                              <span className="mb-4 inline-block rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
                                {item.category || "Highlight"}
                              </span>

                              <h3 className="text-3xl font-extrabold leading-tight tracking-tight drop-shadow md:text-4xl">
                                {item.title}
                              </h3>

                              {item.summary && (
                                <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/80">
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
              <div className="flex h-[560px] w-full items-center justify-center rounded-[24px] bg-blue-50">
                <p className="text-gray-400">No highlights available yet.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* TOURISM CONTENT */}
      <motion.section
        className="bg-transparent px-6 py-24 md:px-12 lg:px-20"
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.18 }}
      >
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={headingReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.4 }}
            className="mb-14 text-center"
          >
            <span className="inline-block rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-widest text-[#2563eb] border border-blue-100 shadow-sm">
              Stories
            </span>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
              Tourism Content
            </h2>

            <p className="mt-2 text-base text-gray-500">
              Stories, highlights, and announcements from Lanao del Sur
            </p>
          </motion.div>

          <div className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_10px_28px_rgba(37,99,235,0.08)] md:p-7">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {articles.slice(0, 3).map((article, index) => (
                <motion.div
                  key={article.id}
                  variants={cardReveal}
                  initial="hidden"
                  whileInView="show"
                  transition={{
                    delay: index * 0.05,
                  }}
                  viewport={{ once: false, amount: 0.25 }}
                  whileHover={{
                    y: -2,
                    scale: 1.003,
                    transition: { duration: 0.2, ease: "easeOut" },
                  }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(`/article/${article.id}`)}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(article);
                    setShowHeart(article.id);
                    setTimeout(() => setShowHeart(null), 400);
                  }}
                  className="group flex h-full min-h-[430px] cursor-pointer flex-col overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-[0_8px_22px_rgba(37,99,235,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_28px_rgba(37,99,235,0.10)]"
                >
                  <div className="p-2.5 pb-0">
                    <div className="relative h-[235px] shrink-0 overflow-hidden rounded-[24px] border border-blue-100 bg-[#f8fbff] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_6px_16px_rgba(37,99,235,0.06)]">
                      <img
                        src={article.imageURL || "/default.jpg"}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.005]"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(article);
                        }}
                        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/95 shadow-sm transition hover:bg-blue-50"
                      >
                        {favorites.some(
                          (fav) => String(fav.id) === String(article.id)
                        ) ? (
                          <FaHeart className="text-sm text-[#2563eb]" />
                        ) : (
                          <FiHeart className="text-sm text-[#2563eb]" />
                        )}
                      </button>

                      {showHeart === article.id && (
                        <FaHeart
                          className="pointer-events-none absolute inset-0 z-30 m-auto text-5xl text-[#2563eb]"
                          style={{ animation: "pop 0.4s ease" }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col px-6 pb-6 pt-4">
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                        {article.category || article.contentType || "Article"}
                      </span>

                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        Article
                      </span>
                    </div>

                    <h3 className="line-clamp-2 min-h-[44px] text-base font-bold leading-snug text-[#2563eb] transition group-hover:text-blue-700">
                      {article.title}
                    </h3>

                    <p className="mt-2.5 line-clamp-1 min-h-[22px] max-w-[92%] text-sm leading-6 text-gray-500">
                      {getShortDescription(article.summary)}
                    </p>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/article/${article.id}`);
                      }}
                      className="mt-5 self-start rounded-full bg-[#2563eb] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
                    >
                      Read more →
                    </button>
                  </div>
                </motion.div>
              ))}

              {articles.length === 0 && (
                <div className="col-span-full rounded-[28px] border border-dashed border-blue-100 bg-blue-50/40 py-16 text-center text-sm text-gray-400">
                  No articles available yet.
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-6">
              <span className="text-sm text-gray-400">
                Showing {Math.min(articles.length, 3)} of {articles.length}{" "}
                articles
              </span>

              <button
                onClick={() => navigate("/articles")}
                className="rounded-full bg-[#2563eb] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              >
                See more articles →
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* MAP */}
      <motion.section
        className="bg-transparent px-6 py-24 md:px-12 lg:px-20"
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.18 }}
      >
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={headingReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.4 }}
            className="mb-14 text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
              Explore Lanao del Sur
            </h2>

            <p className="mt-2 text-base text-gray-500">
              Discover tourist spots using our interactive map
            </p>
          </motion.div>

          <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white p-2 shadow-[0_10px_28px_rgba(37,99,235,0.08)]">
            <div className="overflow-hidden rounded-[24px]">
              <LanaoMap />
            </div>
          </div>
        </div>
      </motion.section>

      {/* UPCOMING EVENTS */}
      <motion.section
        className="bg-transparent px-6 py-24 md:px-12 lg:px-20"
        variants={sectionReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.18 }}
      >
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={headingReveal}
            initial="hidden"
            whileInView="show"
            viewport={{ once: false, amount: 0.4 }}
            className="mb-14 flex flex-col items-center text-center"
          >
            <span className="mb-4 rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-widest text-[#2563eb] border border-blue-100 shadow-sm">
              Local Celebrations
            </span>

            <h2 className="text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
              Upcoming Events
            </h2>

            <p className="mt-2 max-w-2xl text-gray-500">
              Discover festivals, cultural gatherings, and celebrations
              happening around Lanao del Sur.
            </p>
          </motion.div>

          <div className="rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_10px_28px_rgba(37,99,235,0.08)] md:p-7">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {events.slice(0, 8).map((evt, index) => (
                <motion.div
                  key={evt.id}
                  variants={cardReveal}
                  initial="hidden"
                  whileInView="show"
                  transition={{
                    delay: index * 0.05,
                  }}
                  viewport={{ once: false, amount: 0.25 }}
                  whileHover={{
                    y: -2,
                    scale: 1.003,
                    transition: { duration: 0.2, ease: "easeOut" },
                  }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => navigate(`/event/${evt.id}`)}
                  onDoubleClick={() => {
                    toggleFavorite(evt);
                    setShowHeart(evt.id);
                    setTimeout(() => setShowHeart(null), 400);
                  }}
                  className="group flex h-full min-h-[350px] cursor-pointer flex-col overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-[0_8px_22px_rgba(37,99,235,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_28px_rgba(37,99,235,0.10)]"
                >
                  <div className="p-2.5 pb-0">
                    <div className="relative h-[210px] shrink-0 overflow-hidden rounded-[24px] border border-blue-100 bg-[#f8fbff] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_6px_16px_rgba(37,99,235,0.06)]">
                      <img
                        src={evt.imageURL || "src/assets/default-event.jpg"}
                        alt={evt.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.005]"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(evt);
                        }}
                        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/95 shadow-sm transition hover:bg-blue-50"
                      >
                        {favorites.some(
                          (fav) => String(fav.id) === String(evt.id)
                        ) ? (
                          <FaHeart className="text-sm text-[#2563eb]" />
                        ) : (
                          <FiHeart className="text-sm text-[#2563eb]" />
                        )}
                      </button>

                      {showHeart === evt.id && (
                        <FaHeart
                          className="pointer-events-none absolute inset-0 z-20 m-auto text-5xl text-[#2563eb]"
                          style={{ animation: "pop 0.4s ease" }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col px-6 pb-6 pt-4">
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                        {evt.category || "Event"}
                      </span>

                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        Event
                      </span>
                    </div>

                    <h3 className="line-clamp-2 min-h-[44px] text-base font-bold leading-snug text-[#2563eb] transition group-hover:text-[#2563eb]">
                      {evt.title}
                    </h3>

                    <div className="mt-4 rounded-2xl bg-[#f8fbff] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 ring-1 ring-blue-50">
                      {formatEventDate(evt.eventDate)}
                    </div>
                  </div>
                </motion.div>
              ))}

              {events.length === 0 && (
                <div className="col-span-full rounded-[28px] border border-dashed border-blue-100 bg-blue-50/40 py-20 text-center text-sm text-gray-400">
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
                className="rounded-full bg-[#2563eb] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
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