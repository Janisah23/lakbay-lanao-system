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
} from "react-icons/fi";
import { MdOutlineBookmarkAdd, MdBookmarkAdded } from "react-icons/md";
import { FaTwitter, FaFacebookF, FaLink } from "react-icons/fa";

import { db, auth } from "../../firebase/config";
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

  const [showSharePanel, setShowSharePanel] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const { favorites } = useFavorites();
  const isFav = favorites.some((fav) => String(fav.id) === String(id));

  const galleryImages = articleDetail
    ? [articleDetail.imageURL, ...(articleDetail.galleryImages || [])].filter(
        Boolean
      )
    : [];

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

  if (!articleDetail) {
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
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-32">
        <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-400">
          <span
            className="cursor-pointer transition hover:text-[#2563eb]"
            onClick={() => navigate("/articles")}
          >
            Articles
          </span>
          <span>/</span>
          <span className="text-gray-500">
            {articleDetail.category || "Travel Guide"}
          </span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="min-w-0 flex-1">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-[#2563eb] shadow-sm">
              <FiTag className="text-xs" />
              {articleDetail.category || "Travel Guide"}
            </span>

            <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-[#2563eb] md:text-5xl">
              {articleDetail.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5 text-gray-500">
                <FiBookmark className="text-sm" />
                <span>{saveCount.toLocaleString()} saves</span>
              </div>

              <div className="h-4 w-px bg-gray-200" />

              <div className="flex items-center gap-1.5 text-gray-500">
                <FiClock className="text-sm" />
                <span>{articleDetail.readTime || "5 Min"} read</span>
              </div>

              <div className="h-4 w-px bg-gray-200" />

              <div className="flex items-center gap-1.5 text-gray-500">
                <FiCalendar className="text-sm" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-shrink-0 items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowSharePanel(!showSharePanel)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#2563eb] hover:text-[#2563eb]"
              >
                <FiShare2 className="text-base" />
                Share
              </button>

              {showSharePanel && (
                <div className="absolute right-0 top-12 z-30 w-56 rounded-[16px] border border-gray-200 bg-white p-4 shadow-xl">
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

            <button
              onClick={() => toggleFavorite(articleDetail)}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-sm transition ${
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
          </div>
        </div>
      </section>

      {/* HERO IMAGE */}
      <section className="mx-auto mb-16 max-w-7xl px-6">
        <div className="relative h-[320px] w-full overflow-hidden rounded-[28px] border border-gray-100 shadow-lg md:h-[460px] lg:h-[540px]">
          <img
            src={
              galleryImages[activeGalleryIndex] ||
              articleDetail.imageURL ||
              "/default.jpg"
            }
            alt={articleDetail.title}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 rounded-[28px] bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {galleryImages.length > 1 && (
            <>
              <button
                onClick={() =>
                  setActiveGalleryIndex((i) => Math.max(i - 1, 0))
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow transition hover:bg-white"
              >
                <FiChevronLeft className="text-lg text-gray-700" />
              </button>

              <button
                onClick={() =>
                  setActiveGalleryIndex((i) =>
                    Math.min(i + 1, galleryImages.length - 1)
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow transition hover:bg-white"
              >
                <FiChevronRight className="text-lg text-gray-700" />
              </button>

              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {galleryImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveGalleryIndex(i)}
                    className={`rounded-full transition-all ${
                      i === activeGalleryIndex
                        ? "h-2 w-6 bg-white"
                        : "h-2 w-2 bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CONTENT + SIDEBAR */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-3">
          {/* LEFT CONTENT */}
          <div className="space-y-8 lg:col-span-2">
            <div className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm md:p-10">
              <h2 className="mb-6 border-b border-gray-100 pb-4 text-2xl font-bold text-[#2563eb]">
                Read Article
              </h2>

              {articleDetail.summary && (
                <div className="mb-10">
                  <div className="article-summary rounded-2xl border border-blue-50 bg-[#f8fbff] p-6 text-[1rem] leading-[1.8] text-gray-600 shadow-sm md:p-8">
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

              <div className="mt-12 flex items-start gap-4 rounded-[20px] border border-gray-100 bg-gray-50 p-6">
                <FiInfo className="mt-0.5 flex-shrink-0 text-xl text-gray-400" />

                <div>
                  <p className="mb-1 text-sm font-bold text-gray-900">
                    Traveler Information
                  </p>

                  <p className="text-sm leading-relaxed text-gray-500">
                    Verified at the time of writing. We recommend verifying
                    local protocols before your visit.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-5 font-bold text-gray-900">
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
                    icon: <FiClock />,
                    label: "Read Time",
                    value: articleDetail.readTime || "5 Minutes",
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
                    value: articleDetail.author || "Lakbay Lanao Staff",
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
      <section className="border-t border-blue-50 bg-[#f3f9ff] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm">
                Keep Reading
              </span>

              <h3 className="mt-4 text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
                Related Articles
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
                Continue exploring more travel stories and cultural features
                from Lanao del Sur.
              </p>
            </div>

            <button
              onClick={() => navigate("/articles")}
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
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {moreArticles.map((article) => (
                <article
                  key={article.id}
                  onClick={() => navigate(`/article/${article.id}`)}
                  className="group flex h-full min-h-[360px] cursor-pointer flex-col overflow-hidden rounded-[30px] border border-blue-50 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
                >
                  <div className="p-2.5 pb-0">
                    <div className="relative h-[190px] overflow-hidden rounded-[24px] bg-blue-50">
                      <img
                        src={article.imageURL || "/default.jpg"}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

                      <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm">
                        {article.category || "Article"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col px-6 pb-6 pt-4">
                    <h4 className="line-clamp-2 min-h-[48px] text-base font-bold leading-snug text-[#2563eb] transition group-hover:text-blue-700">
                      {article.title}
                    </h4>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/article/${article.id}`);
                      }}
                      className="mt-auto inline-flex items-center gap-2 self-start rounded-full bg-[#2563eb] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                    >
                      Read more <FiChevronRight />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate("/articles")}
            className="mt-8 flex items-center justify-center gap-2 rounded-full border border-[#2563eb]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#2563eb] shadow-sm transition hover:border-[#2563eb]/40 hover:bg-blue-50 md:hidden"
          >
            View all articles <FiChevronRight />
          </button>
        </div>
      </section>

     

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