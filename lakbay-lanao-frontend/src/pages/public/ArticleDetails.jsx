import React, { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import { useNavigate, useParams } from "react-router-dom";
import {
  FiClock,
  FiCalendar,
  FiUser,
  FiInfo,
  FiTag,
  FiShare2,
  FiBookmark,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import { MdOutlineBookmarkAdd, MdBookmarkAdded } from "react-icons/md";
import { FaTwitter, FaFacebookF, FaLink } from "react-icons/fa";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { db, auth } from "../../firebase/config";
import { onAuthStateChanged } from "firebase/auth"; // Added for tracking authentication state
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  query,
  where,
  limit,
  updateDoc,
  increment,
} from "firebase/firestore";
import { useFavorites } from "../../components/context/FavoritesContext";

const ArticleDetails = () => {
  const [moreArticles, setMoreArticles] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();

  const [articleDetail, setArticleDetail] = useState(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Main Swiper instance for syncing thumbnails/lightbox
  const [mainSwiper, setMainSwiper] = useState(null);

  const [showSharePanel, setShowSharePanel] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track if user is logged in

  const { favorites } = useFavorites();
  const isFav = favorites.some((fav) => String(fav.id) === String(id));

  const galleryImages = [
    ...(articleDetail?.imageURLs || []),
  ].filter(Boolean);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  // Reset states on ID change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setIsNavigating(false);
    setShowSharePanel(false);
    setLinkCopied(false);
    setActiveGalleryIndex(0);
    setLightboxOpen(false);
    if (mainSwiper) mainSwiper.slideTo(0);
  }, [id, mainSwiper]);

  // Sync main Swiper when activeGalleryIndex changes (e.g., from lightbox arrows)
  useEffect(() => {
    if (mainSwiper && mainSwiper.activeIndex !== activeGalleryIndex) {
      mainSwiper.slideTo(activeGalleryIndex);
    }
  }, [activeGalleryIndex, mainSwiper]);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const docRef = doc(db, "tourismContent", id);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          setArticleDetail({ id: snap.id, ...snap.data() });
          await updateDoc(docRef, { viewCount: increment(1) }).catch(() => {});
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      }
    };

    if (id) fetchArticle();
  }, [id]);

  useEffect(() => {
    if (!articleDetail) return;

    const fetchOtherArticles = async () => {
      try {
        const q = query(
          collection(db, "tourismContent"),
          where("contentType", "==", "Article"),
          limit(4)
        );

        const snap = await getDocs(q);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setMoreArticles(
          items.filter((item) => item.id !== articleDetail.id).slice(0, 3)
        );
      } catch (error) {
        console.error("Error fetching other articles:", error);
      }
    };

    fetchOtherArticles();
  }, [articleDetail]);

  const toggleFavorite = async (item) => {
    const user = auth.currentUser;

    if (!user) {
      alert("Please log in to add to your list.");
      return;
    }

    const favRef = doc(db, "users", user.uid, "favorites", item.id);

    if (isFav) {
      await deleteDoc(favRef);
      await updateDoc(doc(db, "tourismContent", item.id), {
        saveCount: increment(-1),
      }).catch(() => {});
    } else {
      await setDoc(favRef, item);
      await updateDoc(doc(db, "tourismContent", item.id), {
        saveCount: increment(1),
      }).catch(() => {});
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const getShortDescription = (text) => {
    const fallback = "Discover more stories from Lanao del Sur.";
    if (!text) return fallback;

    const cleanText = String(text).replace(/\s+/g, " ").trim();
    const firstSentence = cleanText.match(/[^.!?]+[.!?]/)?.[0] || cleanText;

    if (firstSentence.length <= 72) return firstSentence;
    return `${firstSentence.slice(0, 72).trim()}...`;
  };

  const handleDelayedNavigate = (path) => {
    setIsNavigating(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    setTimeout(() => {
      navigate(path);
    }, 2000);
  };

  // Show spinner during initial load OR simulated navigation
  if (!articleDetail || isNavigating) {
    return (
      <div className="font-sans flex min-h-screen items-center justify-center bg-[#f3f9ff]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#2563eb]" />
          <p className="mt-4 font-medium text-gray-500">Loading article...</p>
        </div>
      </div>
    );
  }

  const formattedDate = articleDetail.createdAt?.toDate
    ? articleDetail.createdAt.toDate().toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently Published";

  const saveCount = articleDetail.saveCount || 0;

  return (
    <div className="font-sans min-h-screen bg-[#f3f9ff] text-gray-900">
      <Navbar />

      {/* HEADER */}
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-28 sm:px-6 md:pt-32 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-start">
          <div className="min-w-0 flex-1">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-[#2563eb] shadow-sm">
              <FiTag className="text-xs" />
              {articleDetail.category || "Travel Guide"}
            </span>

            <h1 className="mb-4 max-w-4xl text-2xl font-bold leading-snug tracking-tight text-[#2563eb] sm:text-3xl md:text-4xl lg:text-5xl">
              {articleDetail.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-600 sm:text-sm">
              <div className="flex items-center gap-1.5 text-gray-500">
                <FiBookmark className="text-sm" />
                <span>{saveCount.toLocaleString()} saves</span>
              </div>
              <div className="hidden h-4 w-px bg-gray-200 sm:block" />

              <div className="flex items-center gap-1.5 text-gray-500">
                <FiCalendar className="text-sm" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-shrink-0 items-center gap-3 sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setShowSharePanel(!showSharePanel)}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#2563eb] hover:text-[#2563eb] sm:w-auto"
              >
                <FiShare2 className="text-base" />
                Share
              </button>

              {showSharePanel && (
                <div className="absolute left-0 top-12 z-30 w-56 rounded-[16px] border border-gray-200 bg-white p-4 shadow-xl sm:left-auto sm:right-0">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Share this article
                  </p>

                  <div className="space-y-2">
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                        window.location.href
                      )}&text=${encodeURIComponent(articleDetail.title)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb]"
                    >
                      <FaTwitter className="text-[#1da1f2]" />
                      Twitter / X
                    </a>

                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        window.location.href
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb]"
                    >
                      <FaFacebookF className="text-[#1877f2]" />
                      Facebook
                    </a>

                    <button
                      onClick={handleCopyLink}
                      className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb]"
                    >
                      <FaLink className="text-gray-400" />
                      {linkCopied ? "Copied!" : "Copy link"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ONLY VISIBLE IF LOGGED IN (ADD TO FAVORITE BUTTON) */}
            {isLoggedIn && (
              <button
                onClick={() => toggleFavorite(articleDetail)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-sm transition sm:flex-none ${
                  isFav
                    ? "bg-[#2563eb] text-white hover:bg-blue-700"
                    : "border border-gray-200 bg-white text-gray-700 hover:border-[#2563eb] hover:text-[#2563eb]"
                }`}
              >
                {isFav ? (
                  <MdBookmarkAdded className="text-base" />
                ) : (
                  <MdOutlineBookmarkAdd className="text-base" />
                )}
                {isFav ? "Saved" : "Save"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* GALLERY (SWIPER MAIN PREVIEW) */}
      <section className="mx-auto mb-12 max-w-7xl px-4 sm:px-6 md:mb-16 lg:px-10">
        <div className="group relative w-full h-[240px] sm:h-[320px] md:h-[460px] lg:h-[540px] cursor-zoom-in overflow-hidden rounded-[20px] border border-blue-100 bg-white p-1.5 shadow-[0_10px_28px_rgba(37,99,235,0.08)] sm:rounded-[24px] sm:p-2 lg:rounded-[28px]">
          <div className="relative h-full w-full overflow-hidden rounded-[16px] bg-blue-50 sm:rounded-[20px] lg:rounded-[24px]">

            <Swiper
              onSwiper={setMainSwiper}
              onSlideChange={(swiper) => setActiveGalleryIndex(swiper.activeIndex)}
              observer={true}
              observeParents={true}
              modules={[Autoplay, Navigation]}
              autoplay={{ delay: 30000, disableOnInteraction: false }}
              speed={1200}
              className="h-full w-full"
            >
              {galleryImages.length > 0 ? (
                galleryImages.map((img, i) => (
                  <SwiperSlide key={i} className="h-full w-full">
                    <img
                      src={img}
                      alt={`${articleDetail.title} ${i + 1}`}
                      onClick={() => setLightboxOpen(true)}
                      className="h-full w-full cursor-zoom-in object-cover transition-transform duration-700 hover:scale-[1.005]"
                    />
                  </SwiperSlide>
                ))
              ) : (
                <SwiperSlide className="h-full w-full">
                  <img
                    src="/default.jpg"
                    alt={articleDetail.title}
                    className="h-full w-full object-cover"
                  />
                </SwiperSlide>
              )}
            </Swiper>

            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute bottom-3 right-3 z-20 rounded-full border border-white/70 bg-white px-3 py-1.5 text-[10px] font-semibold text-gray-800 shadow-sm transition hover:bg-blue-50 hover:text-[#2563eb] sm:bottom-4 sm:right-4 sm:px-4 sm:py-2 sm:text-xs"
            >
              View fullscreen
            </button>

            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    mainSwiper?.slidePrev();
                  }}
                  className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all duration-300 hover:bg-white/40 opacity-0 group-hover:opacity-100 sm:left-4 sm:h-12 sm:w-12"
                >
                  <FiChevronLeft className="text-xl sm:text-2xl" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    mainSwiper?.slideNext();
                  }}
                  className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all duration-300 hover:bg-white/40 opacity-0 group-hover:opacity-100 sm:right-4 sm:h-12 sm:w-12"
                >
                  <FiChevronRight className="text-xl sm:text-2xl" />
                </button>
              </>
            )}

            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 left-0 z-20 w-full px-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:bottom-6 sm:px-6">
                <div className="flex gap-2 overflow-x-auto pb-1 sm:gap-3 justify-center">
                  {galleryImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveGalleryIndex(i);
                        if (mainSwiper) mainSwiper.slideTo(i);
                      }}
                      className={`h-12 w-16 flex-shrink-0 overflow-hidden rounded-[10px] border-2 bg-blue-50 transition-all sm:h-14 sm:w-20 sm:rounded-[12px] md:h-16 md:w-24 ${
                        i === activeGalleryIndex
                          ? "border-white shadow-[0_0_0_2px_rgba(255,255,255,0.4)]"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Gallery ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LIGHTBOX (FULLSCREEN VIEW) */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black p-0"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
            className="absolute right-5 top-5 z-[100000] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <FiX className="text-2xl" />
          </button>

          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveGalleryIndex((i) =>
                    i === 0 ? galleryImages.length - 1 : i - 1
                  );
                }}
                className="absolute left-4 top-1/2 z-[100000] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <FiChevronLeft className="text-4xl" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveGalleryIndex((i) =>
                    i === galleryImages.length - 1 ? 0 : i + 1
                  );
                }}
                className="absolute right-4 top-1/2 z-[100000] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <FiChevronRight className="text-4xl" />
              </button>
            </>
          )}

          <img
            src={galleryImages[activeGalleryIndex] || "/default.jpg"}
            alt={articleDetail.title}
            onClick={(e) => e.stopPropagation()}
            className="max-h-screen max-w-screen object-contain"
          />

          {galleryImages.length > 1 && (
            <p className="absolute bottom-5 left-1/2 z-[100000] -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/70">
              {activeGalleryIndex + 1} / {galleryImages.length}
            </p>
          )}
        </div>
      )}

      {/* CONTENT + SIDEBAR */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3 lg:gap-10">
          {/* LEFT CONTENT */}
          <div className="space-y-8 lg:col-span-2">
            <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-8 md:p-10">
              <h2 className="mb-6 border-b border-gray-100 pb-4 text-xl font-bold text-[#2563eb] sm:text-2xl">
                Read Article
              </h2>

              {articleDetail.summary && (
                <div className="mb-8 sm:mb-10">
                  <div className="article-summary rounded-2xl border border-blue-50 bg-[#f8fbff] p-5 text-sm leading-[1.8] text-gray-600 shadow-sm sm:p-6 sm:text-[1rem] md:p-8">
                    <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#2563eb]">
                      <span className="h-[1px] w-8 bg-[#2563eb]" />
                      Quick Summary
                    </h3>

                    <div className="space-y-3">
                      {articleDetail.summary.split("\n").map((str, idx) => (
                        <p key={idx} className="last:mb-0">
                          {str}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-6">
              <h3 className="mb-5 font-bold text-[#2563eb]">
                Article Details
              </h3>

              <div className="space-y-4">
                {[
                  {
                    icon: <FiCalendar />,
                    label: "Published On",
                    value: formattedDate,
                  },
                  {
                    icon: <FiTag />,
                    label: "Category",
                    value:
                      articleDetail.category ||
                      articleDetail.type ||
                      "General",
                  },
                  {
                    icon: <FiUser />,
                    label: "Written By",
                    value: articleDetail.writtenBy || "Unknown Author",
                  },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4">
                    <span className="mt-0.5 flex-shrink-0 text-lg text-[#2563eb]">
                      {icon}
                    </span>

                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        {label}
                      </p>

                      <p className="mt-0.5 text-sm leading-snug text-gray-500">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RELATED ARTICLES */}
      <section className="border-t border-blue-50 bg-[#f3f9ff] px-4 py-16 sm:px-6 md:px-12 md:py-20 lg:px-20 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm">
                Keep Reading
              </span>

              <h3 className="mt-4 text-2xl font-bold tracking-tight text-[#2563eb] sm:text-3xl md:text-4xl">
                Related Articles
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
                Continue exploring more travel stories and cultural features
                from Lanao del Sur.
              </p>
            </div>

            <button
              onClick={() => handleDelayedNavigate("/articles")}
              className="hidden items-center gap-2 self-start rounded-full border border-[#2563eb]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#2563eb] shadow-sm transition hover:border-[#2563eb]/40 hover:bg-blue-50 md:flex"
            >
              View all articles <FiChevronRight />
            </button>
          </div>

          {moreArticles.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-blue-100 bg-white py-16 text-center shadow-sm">
              <p className="text-sm font-medium text-gray-400">
                No related articles available yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {moreArticles.map((article) => (
                <article
                  key={article.id}
                  onClick={() => handleDelayedNavigate(`/article/${article.id}`)}
                  className="group flex min-h-[250px] cursor-pointer flex-col overflow-hidden rounded-[20px] border border-blue-50 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md sm:min-h-[310px] sm:rounded-[24px]"
                >
                  <div className="p-1.5 pb-0 sm:p-2 sm:pb-0">
                    <div className="relative h-[120px] overflow-hidden rounded-[16px] bg-blue-50 sm:h-[165px] sm:rounded-[20px]">
                      <img
                        src={article.imageURL || "/default.jpg"}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

                      <span className="absolute left-2 top-2 max-w-[105px] truncate rounded-full bg-white/95 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm sm:left-3 sm:top-3 sm:max-w-[140px] sm:px-2.5 sm:py-1 sm:text-[9px]">
                        {article.category || "Article"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3">
                    <h4 className="line-clamp-2 min-h-[34px] text-xs font-bold leading-tight text-[#2563eb] transition group-hover:text-blue-700 sm:min-h-[40px] sm:text-sm">
                      {article.title}
                    </h4>

                    <p className="mt-1.5 line-clamp-2 flex-1 text-[11px] leading-relaxed text-gray-500 sm:mt-2 sm:text-xs">
                      {getShortDescription(article.summary)}
                    </p>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelayedNavigate(`/article/${article.id}`);
                      }}
                      className="mt-3 w-full rounded-full bg-[#2563eb] px-3 py-1.5 text-[10px] font-medium text-white shadow-sm transition hover:bg-blue-700 sm:mt-4 sm:w-fit sm:px-4 sm:py-2 sm:text-[11px]"
                    >
                      Read more →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <button
            onClick={() => handleDelayedNavigate("/articles")}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-[#2563eb]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#2563eb] shadow-sm transition hover:border-[#2563eb]/40 hover:bg-blue-50 sm:w-auto md:hidden"
          >
            View all articles <FiChevronRight />
          </button>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        .article-body p,
        .article-summary p {
          margin-bottom: 1.25rem;
        }

        .article-body ol,
        .article-summary ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .article-body ul,
        .article-summary ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .article-body li,
        .article-summary li {
          margin-bottom: 0.75rem;
          padding-left: 0.5rem;
          font-weight: 400;
        }
      `}</style>
    </div>
  );
};

export default ArticleDetails;