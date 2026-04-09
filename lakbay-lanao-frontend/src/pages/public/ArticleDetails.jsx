import React, { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import TourismChatbot from "../../components/chatbot/TourismChatbot";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiClock, FiCalendar, FiUser, FiInfo, FiHeart, FiTag,
  FiShare2, FiBookmark, FiChevronLeft, FiChevronRight, FiX,
} from "react-icons/fi";
import { MdOutlineBookmarkAdd, MdBookmarkAdded } from "react-icons/md";
import { FaHeart, FaTwitter, FaFacebookF, FaLink } from "react-icons/fa";

import { db, auth } from "../../firebase/config";
import {
  doc, getDoc, setDoc, deleteDoc, getDocs, collection,
  query, where, limit, updateDoc, serverTimestamp, increment,
} from "firebase/firestore";
import { useFavorites } from "../../components/context/FavoritesContext";

const ArticleDetails = () => {
  const [morePlaces, setMorePlaces] = useState([]);
  const [moreArticles, setMoreArticles] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();
  const [articleDetail, setArticleDetail] = useState(null);

  const [userRating, setUserRating] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const [showSharePanel, setShowSharePanel] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const { favorites } = useFavorites();
  const isFav = favorites.some((fav) => String(fav.id) === String(id));

  const galleryImages = articleDetail
    ? [articleDetail.imageURL, ...(articleDetail.galleryImages || [])].filter(Boolean)
    : [];

  // Fetch article + increment viewCount
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const docRef = doc(db, "tourismContent", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setArticleDetail({ id: snap.id, ...snap.data() });
          await updateDoc(docRef, { viewCount: increment(1) });
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      }
    };
    if (id) fetchArticle();
  }, [id]);

  // Fetch places to explore
  useEffect(() => {
    const fetchMorePlaces = async () => {
      try {
        const snap = await getDocs(collection(db, "tourismContent"));
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMorePlaces(items.filter((item) => item.contentType !== "Article").slice(0, 4));
      } catch (error) {
        console.error("Error fetching places:", error);
      }
    };
    fetchMorePlaces();
  }, []);

  // Fetch related articles
  useEffect(() => {
    if (!articleDetail) return;
    const fetchOtherArticles = async () => {
      try {
        const q = query(collection(db, "tourismContent"), where("contentType", "==", "Article"), limit(4));
        const snap = await getDocs(q);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setMoreArticles(items.filter((item) => item.id !== articleDetail.id).slice(0, 3));
      } catch (error) {
        console.error("Error fetching other articles:", error);
      }
    };
    fetchOtherArticles();
  }, [articleDetail]);

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
    try {
      // Save to tourismContent/{id}/reviews/{uid}
      const reviewRef = doc(db, "tourismContent", articleDetail.id, "reviews", user.uid);
      await setDoc(reviewRef, {
        userId: user.uid,
        rating: userRating,
        createdAt: serverTimestamp(),
      });

      const currentRating = articleDetail.rating || 0;
      const currentCount = articleDetail.reviewsCount || 0;
      const newCount = currentCount + 1;
      const newAverage = ((currentRating * currentCount) + userRating) / newCount;

      const articleRef = doc(db, "tourismContent", articleDetail.id);
      await updateDoc(articleRef, {
        rating: newAverage,
        reviewsCount: newCount,
      });

      setArticleDetail((prev) => ({ ...prev, rating: newAverage, reviewsCount: newCount }));
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

  if (!articleDetail) {
    return (
      <div className="font-sans min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb] mx-auto" />
          <p className="mt-4 text-gray-500 font-medium">Loading article...</p>
        </div>
      </div>
    );
  }

  const formattedDate = articleDetail.publishDate || articleDetail.createdAt
    ? new Date(articleDetail.publishDate || articleDetail.createdAt).toLocaleDateString(undefined, {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    : new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const saveCount = articleDetail.saveCount || 0;

  return (
    <div className="font-sans text-gray-900 min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff]">
      <Navbar />

      {/* ── HEADER ── */}
      <section className="pt-32 pb-10 px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5 font-medium uppercase tracking-wider">
          <span className="cursor-pointer hover:text-[#2563eb] transition" onClick={() => navigate("/articles")}>
            Articles
          </span>
          <span>/</span>
          <span className="text-gray-500">{articleDetail.category || "Travel Guide"}</span>
        </div>

        <div className="flex items-start justify-between gap-8 flex-wrap">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-[#2563eb] mb-4">
              <FiTag className="text-xs" />
              {articleDetail.category || "Travel Guide"}
            </span>

            <h1 className="text-4xl md:text-5xl font-bold text-[#2563eb] mb-4 tracking-tight leading-tight">
              {articleDetail.title}
            </h1>

            <p className="text-lg text-gray-500 mb-6 font-light max-w-2xl leading-relaxed">
              {articleDetail.summary || "Discover the cultural heritage and beauty of Lanao del Sur."}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-400 tracking-widest text-base">
                  {"★".repeat(Math.floor(articleDetail.rating || 4))}
                  <span className="text-yellow-200">{"★".repeat(5 - Math.floor(articleDetail.rating || 4))}</span>
                </span>
                <span className="font-bold text-gray-900">
                  {articleDetail.rating ? articleDetail.rating.toFixed(1) : "—"}
                </span>
                <span className="text-gray-400">({articleDetail.reviewsCount || 0})</span>
              </div>
              <div className="w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-1.5 text-gray-500">
                <FiBookmark className="text-sm" />
                <span>{saveCount.toLocaleString()} saves</span>
              </div>
              <div className="w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-1.5 text-gray-500">
                <FiClock className="text-sm" />
                <span>{articleDetail.readTime || "5 Min"} read</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 flex-shrink-0 mt-2">
            <div className="relative">
              <button
                onClick={() => setShowSharePanel(!showSharePanel)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:border-[#2563eb] hover:text-[#2563eb] transition"
              >
                <FiShare2 className="text-base" /> Share
              </button>
              {showSharePanel && (
                <div className="absolute right-0 top-12 z-30 bg-white rounded-[16px] border border-gray-200 shadow-xl p-4 w-56">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Share this article</p>
                  <div className="space-y-2">
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(articleDetail.title)}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 w-full rounded-[10px] px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition"
                    >
                      <FaTwitter className="text-[#1da1f2]" /> Twitter / X
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 w-full rounded-[10px] px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition"
                    >
                      <FaFacebookF className="text-[#1877f2]" /> Facebook
                    </a>
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-3 w-full rounded-[10px] px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition"
                    >
                      <FaLink className="text-gray-400" /> {linkCopied ? "Copied!" : "Copy link"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => toggleFavorite(articleDetail)}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-sm transition ${
                isFav
                  ? "bg-[#2563eb] text-white hover:bg-blue-700"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-[#2563eb] hover:text-[#2563eb]"
              }`}
            >
              {isFav ? <MdBookmarkAdded className="text-base" /> : <MdOutlineBookmarkAdd className="text-base" />}
              {isFav ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </section>

      {/* ── HERO IMAGE / GALLERY ── */}
      <section className="px-6 max-w-7xl mx-auto mb-16">
        <div className="relative w-full h-[320px] md:h-[460px] lg:h-[540px] rounded-[28px] overflow-hidden shadow-lg border border-gray-100">
          <img
            src={galleryImages[activeGalleryIndex] || articleDetail.imageURL || "/default.jpg"}
            alt={articleDetail.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-[28px]" />

          {galleryImages.length > 1 && (
            <>
              <button
                onClick={() => setActiveGalleryIndex((i) => Math.max(i - 1, 0))}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow hover:bg-white transition"
              >
                <FiChevronLeft className="text-gray-700 text-lg" />
              </button>
              <button
                onClick={() => setActiveGalleryIndex((i) => Math.min(i + 1, galleryImages.length - 1))}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow hover:bg-white transition"
              >
                <FiChevronRight className="text-gray-700 text-lg" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {galleryImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveGalleryIndex(i)}
                    className={`rounded-full transition-all ${i === activeGalleryIndex ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/50 hover:bg-white/80"}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setLightboxOpen(true)}
                className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-semibold text-gray-800 shadow hover:bg-white transition"
              >
                View all {galleryImages.length} photos
              </button>
            </>
          )}
        </div>

        {galleryImages.length > 1 && (
          <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
            {galleryImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveGalleryIndex(i)}
                className={`flex-shrink-0 w-20 h-14 rounded-[12px] overflow-hidden border-2 transition ${
                  i === activeGalleryIndex ? "border-[#2563eb] shadow-md" : "border-transparent opacity-60 hover:opacity-90"
                }`}
              >
                <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <button onClick={() => setLightboxOpen(false)} className="absolute top-5 right-5 text-white/70 hover:text-white">
            <FiX className="text-2xl" />
          </button>
          <button onClick={() => setActiveGalleryIndex((i) => Math.max(i - 1, 0))} className="absolute left-4 text-white/70 hover:text-white">
            <FiChevronLeft className="text-4xl" />
          </button>
          <img src={galleryImages[activeGalleryIndex]} alt="" className="max-h-[85vh] max-w-full rounded-[16px] object-contain" />
          <button onClick={() => setActiveGalleryIndex((i) => Math.min(i + 1, galleryImages.length - 1))} className="absolute right-4 text-white/70 hover:text-white">
            <FiChevronRight className="text-4xl" />
          </button>
          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {activeGalleryIndex + 1} / {galleryImages.length}
          </p>
        </div>
      )}

      {/* ── CONTENT + SIDEBAR ── */}
      <section className="pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-8 md:p-10">
              <h2 className="text-2xl font-bold text-[#2563eb] mb-6 pb-4 border-b border-gray-100">Read Article</h2>
              <div className="text-[1.0625rem] text-gray-700 leading-[1.9] space-y-5">
                {(articleDetail.description || articleDetail.content)
                  ? (articleDetail.description || articleDetail.content).split("\n").map((str, idx) => (
                      <p key={idx}>{str}</p>
                    ))
                  : <p className="text-gray-500">The full content of this article is being updated. Check back soon for an insightful read on Lanao del Sur.</p>
                }
              </div>

              <div className="mt-10 flex items-start gap-4 bg-blue-50 border border-blue-100 p-5 rounded-[16px]">
                <FiInfo className="text-xl text-[#2563eb] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1 text-[#2563eb] text-sm">Editor's Note</p>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    Information in this article was verified at the time of publishing. Opening hours, prices, and availability may change — we recommend checking official local sources before planning your trip.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-5 lg:sticky lg:top-24">

            {/* Stats */}
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Article Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: saveCount.toLocaleString(), label: "Saves" },
                  { value: articleDetail.reviewsCount || 0, label: "Ratings" },
                  { value: articleDetail.rating ? articleDetail.rating.toFixed(1) : "—", label: "Avg Rating" },
                ].map(({ value, label }) => (
                  <div key={label} className="bg-gradient-to-br from-blue-50 to-[#eef4ff] rounded-[16px] p-4 text-center">
                    <p className="text-2xl font-bold text-[#2563eb]">{value}</p>
                    <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Rating Card */}
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 relative">
              {showPopup && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-semibold py-2.5 px-5 rounded-full shadow-xl flex items-center gap-2 z-50 whitespace-nowrap">
                  <span className="text-green-400 text-lg leading-none">✔</span> Rating submitted!
                </div>
              )}
              <h3 className="font-bold text-gray-900 mb-1">Rate this article</h3>
              <p className="text-sm text-gray-400 mb-5">Did you find this guide helpful?</p>
              <div className="flex flex-col items-center bg-gradient-to-br from-gray-50 to-[#f0f5ff] rounded-[16px] p-5 border border-gray-100">
                <div className="flex gap-2 text-4xl mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => { if (!isSubmitted) setUserRating(star); }}
                      className={`transition-all duration-200 ${star <= userRating ? "text-yellow-400 scale-110" : "text-gray-200 hover:text-yellow-200"} ${isSubmitted ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {userRating > 0 ? `${userRating} out of 5 Stars` : "Select a rating"}
                </p>
              </div>
              <button
                onClick={handleRating}
                disabled={userRating === 0 || isSubmitted}
                className={`w-full mt-4 font-semibold py-3 px-4 rounded-full transition-all duration-300 flex items-center justify-center gap-2 text-sm ${
                  isSubmitted
                    ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                    : userRating > 0
                    ? "bg-[#2563eb] hover:bg-blue-700 text-white shadow-sm"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isSubmitted ? <><span className="text-green-600 text-lg leading-none">✔</span> Submitted</> : "Submit Rating"}
              </button>
            </div>

            {/* Article Details */}
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-5">Article Details</h3>
              <div className="space-y-4">
                {[
                  { icon: <FiCalendar />, label: "Published On", value: formattedDate },
                  { icon: <FiClock />, label: "Read Time", value: articleDetail.readTime || "5 Minutes" },
                  { icon: <FiTag />, label: "Category", value: articleDetail.category || "Travel Guide" },
                  { icon: <FiUser />, label: "Written By", value: articleDetail.author || "Lakbay Lanao Editorial" },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex gap-4 items-start">
                    <span className="text-[#2563eb] text-lg mt-0.5 flex-shrink-0">{icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500 mt-0.5 leading-snug">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXPLORE DESTINATIONS ── */}
      <section className="py-20 px-6 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold text-[#2563eb] uppercase tracking-widest mb-2">Discover More</p>
              <h3 className="text-3xl font-bold text-[#2563eb]">Explore Destinations</h3>
              <p className="text-gray-500 mt-1.5 text-sm">Stunning places mentioned in our guides.</p>
            </div>
            {morePlaces.length >= 4 && (
              <button
                onClick={() => navigate("/destinations")}
                className="rounded-full border border-[#2563eb] text-[#2563eb] px-5 py-2.5 text-sm font-medium hover:bg-blue-50 transition hidden md:flex items-center gap-2"
              >
                View all <FiChevronRight />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {morePlaces.map((place) => (
              <div
                key={place.id}
                onClick={() => navigate(`/event/${place.id}`)}
                className="group cursor-pointer bg-white rounded-[20px] border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <div className="relative h-[180px] overflow-hidden">
                  <img
                    src={place.imageURL || "/default.jpg"}
                    alt={place.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(place); }}
                    className="absolute top-3 right-3 bg-white/95 p-2 rounded-full shadow-md z-10 hover:bg-white transition"
                  >
                    {favorites.some((fav) => String(fav.id) === String(place.id))
                      ? <FaHeart className="text-[#2563eb] text-sm" />
                      : <FiHeart className="text-gray-500 text-sm" />}
                  </button>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-[#2563eb] text-[14px] line-clamp-1 group-hover:text-blue-700 transition">
                    {place.name || place.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {place.description || "Discover this amazing place in Lanao."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RELATED ARTICLES ── */}
      <section className="py-20 px-6 bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-semibold text-[#2563eb] uppercase tracking-widest mb-2">Keep Reading</p>
              <h3 className="text-3xl font-bold text-[#2563eb]">Related Travel News</h3>
            </div>
            <button
              onClick={() => navigate("/articles")}
              className="rounded-full border border-[#2563eb] text-[#2563eb] px-5 py-2.5 text-sm font-medium hover:bg-blue-50 transition hidden md:flex items-center gap-2"
            >
              All articles <FiChevronRight />
            </button>
          </div>

          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm overflow-hidden">
            {moreArticles.length > 0 ? (
              moreArticles.map((article, index) => (
                <div
                  key={article.id}
                  onClick={() => navigate(`/article/${article.id}`)}
                  className={`flex items-center justify-between p-5 cursor-pointer hover:bg-[#f8fbff] transition-colors ${
                    index !== moreArticles.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <div className="pr-4 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                        {article.category || "Travel News"}
                      </span>
                    </div>
                    <h4 className="text-[15px] font-semibold text-gray-900 line-clamp-2 leading-snug hover:text-[#2563eb] transition">
                      {article.title}
                    </h4>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <img
                      src={article.imageURL || "/default.jpg"}
                      alt={article.title}
                      className="w-[100px] h-[68px] object-cover rounded-[12px] border border-gray-100"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-gray-400">No related articles available at the moment.</div>
            )}
          </div>
        </div>
      </section>

      <TourismChatbot />
      <Footer />
    </div>
  );
};

export default ArticleDetails;