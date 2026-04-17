import React, { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import TourismChatbot from "../../components/chatbot/TourismChatbot";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiClock, FiCalendar, FiUser, FiInfo, FiTag,
  FiShare2, FiBookmark, FiChevronLeft, FiChevronRight,
} from "react-icons/fi";
import { MdOutlineBookmarkAdd, MdBookmarkAdded } from "react-icons/md";
import { FaTwitter, FaFacebookF, FaLink } from "react-icons/fa";

import { db, auth } from "../../firebase/config";
import {
  doc, getDoc, setDoc, deleteDoc, getDocs, collection,
  query, where, limit, updateDoc, increment,
} from "firebase/firestore";
import { useFavorites } from "../../components/context/FavoritesContext";

const ArticleDetails = () => {
  const [moreArticles, setMoreArticles] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();
  const [articleDetail, setArticleDetail] = useState(null);

  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

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
          await updateDoc(docRef, { viewCount: increment(1) }).catch(() => {});
        }
      } catch (error) {
        console.error("Error fetching article:", error);
      }
    };
    if (id) fetchArticle();
  }, [id]);

  // Fetch related articles
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

  // Convert Firebase Timestamp to Readable Date
  const formattedDate = articleDetail.createdAt?.toDate 
    ? articleDetail.createdAt.toDate().toLocaleDateString(undefined, {
        year: "numeric", 
        month: "long", 
        day: "numeric"
      })
    : "Recently Published";

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

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5 text-gray-500">
                <FiBookmark className="text-sm" />
                <span>{saveCount.toLocaleString()} saves</span>
              </div>
              <div className="w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-1.5 text-gray-500">
                <FiClock className="text-sm" />
                <span>{articleDetail.readTime || "5 Min"} read</span>
              </div>
              <div className="w-px h-4 bg-gray-200" />
              <div className="flex items-center gap-1.5 text-gray-500">
                <FiCalendar className="text-sm" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

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
                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(articleDetail.title)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 w-full rounded-[10px] px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition">
                      <FaTwitter className="text-[#1da1f2]" /> Twitter / X
                    </a>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 w-full rounded-[10px] px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition">
                      <FaFacebookF className="text-[#1877f2]" /> Facebook
                    </a>
                    <button onClick={handleCopyLink} className="flex items-center gap-3 w-full rounded-[10px] px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition">
                      <FaLink className="text-gray-400" /> {linkCopied ? "Copied!" : "Copy link"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => toggleFavorite(articleDetail)} className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-sm transition ${isFav ? "bg-[#2563eb] text-white hover:bg-blue-700" : "bg-white border border-gray-200 text-gray-700 hover:border-[#2563eb] hover:text-[#2563eb]"}`}>
              {isFav ? <MdBookmarkAdded className="text-base" /> : <MdOutlineBookmarkAdd className="text-base" />}
              {isFav ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </section>

      {/* ── HERO IMAGE ── */}
      <section className="px-6 max-w-7xl mx-auto mb-16">
        <div className="relative w-full h-[320px] md:h-[460px] lg:h-[540px] rounded-[28px] overflow-hidden shadow-lg border border-gray-100">
          <img src={galleryImages[activeGalleryIndex] || articleDetail.imageURL || "/default.jpg"} alt={articleDetail.title} className="w-full h-full object-cover" />
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
          
          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-8 md:p-10">
              
              <h2 className="text-2xl font-bold text-[#2563eb] mb-6 pb-4 border-b border-gray-100">
                Read Article
              </h2>

              {/* Professional Summary Section (Introductory Style) */}
              {articleDetail.summary && (
                <div className="mb-10">
                  <div className="article-summary text-[1rem] text-gray-600 leading-[1.8] bg-[#f8fbff] p-6 md:p-8 rounded-2xl border border-blue-50 shadow-sm">
                    <h3 className="text-xs font-bold text-[#2563eb] uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-8 h-[1px] bg-[#2563eb]"></span> Quick Summary
                    </h3>
                    <div className="space-y-3">
                      {articleDetail.summary.split("\n").map((str, idx) => (
                        <p key={idx} className="last:mb-0">{str}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Information Note */}
              <div className="mt-12 flex items-start gap-4 bg-gray-50 border border-gray-100 p-6 rounded-[20px]">
                <FiInfo className="text-xl text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1 text-gray-900 text-sm">Traveler Information</p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Verified at the time of writing. We recommend verifying local protocols before your visit.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-5 lg:sticky lg:top-24">
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-5">Article Details</h3>
              <div className="space-y-4">
                {[
                  { icon: <FiCalendar />, label: "Published On", value: formattedDate },
                  { icon: <FiClock />, label: "Read Time", value: articleDetail.readTime || "5 Minutes" },
                  { icon: <FiTag />, label: "Category", value: articleDetail.category || articleDetail.type || "General" },
                  { icon: <FiUser />, label: "Written By", value: articleDetail.author || "Lakbay Lanao Staff" },
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

      {/* ── RELATED ── */}
      <section className="py-20 px-6 bg-[#f8fbff] border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div><p className="text-xs font-semibold text-[#2563eb] uppercase tracking-widest mb-2">Keep Reading</p><h3 className="text-3xl font-bold text-[#2563eb]">Related News</h3></div>
            <button onClick={() => navigate("/articles")} className="rounded-full border border-[#2563eb] text-[#2563eb] px-5 py-2.5 text-sm font-medium hover:bg-blue-50 transition hidden md:flex items-center gap-2">All articles <FiChevronRight /></button>
          </div>
          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm overflow-hidden">
            {moreArticles.map((article, index) => (
              <div key={article.id} onClick={() => navigate(`/article/${article.id}`)} className={`flex items-center justify-between p-5 cursor-pointer hover:bg-[#f8fbff] transition-colors ${index !== moreArticles.length - 1 ? "border-b border-gray-100" : ""}`}>
                <div className="pr-4 flex-1">
                  <div className="flex items-center gap-2 mb-2"><div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" /><span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{article.category || "News"}</span></div>
                  <h4 className="text-[15px] font-semibold text-gray-900 line-clamp-2 leading-snug hover:text-[#2563eb] transition">{article.title}</h4>
                </div>
                <div className="flex-shrink-0 ml-4"><img src={article.imageURL || "/default.jpg"} alt={article.title} className="w-[100px] h-[68px] object-cover rounded-[12px] border border-gray-100" /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer & Chatbot */}
      <TourismChatbot />
      <Footer />

      <style jsx>{`
        .article-body p, .article-summary p { margin-bottom: 1.25rem; }
        .article-body ol, .article-summary ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 1.5rem; }
        .article-body ul, .article-summary ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1.5rem; }
        .article-body li, .article-summary li { margin-bottom: 0.75rem; padding-left: 0.5rem; font-weight: 400; }
      `}</style>

    </div>
  );
};

export default ArticleDetails;