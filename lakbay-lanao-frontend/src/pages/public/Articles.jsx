import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiBookOpen, FiCalendar, FiChevronRight } from "react-icons/fi";

const safeDate = (val) => {
  if (!val) return null;
  if (val?.toDate) return val.toDate();

  const parsed = new Date(val);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (val) => {
  const date = safeDate(val);

  if (!date) return "Recently Published";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getShortDescription = (text) => {
  const fallback = "Discover more stories from Lanao del Sur.";

  if (!text) return fallback;

  const cleanText = String(text).replace(/\s+/g, " ").trim();
  const firstSentence = cleanText.match(/[^.!?]+[.!?]/)?.[0] || cleanText;

  if (firstSentence.length <= 96) return firstSentence;

  return `${firstSentence.slice(0, 96).trim()}...`;
};

function Articles() {
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "tourismContent"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((item) => {
            const type = String(item.contentType || "").toLowerCase();
            const status = String(item.status || "").toLowerCase();

            return type === "article" && status !== "archived";
          })
          .sort((a, b) => {
            const dateA = safeDate(a.createdAt)?.getTime() || 0;
            const dateB = safeDate(b.createdAt)?.getTime() || 0;
            return dateB - dateA;
          });

        setArticles(data);
      },
      (error) => {
        console.error("Error fetching articles:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const categories = useMemo(() => {
    const unique = articles
      .map((article) => article.category || article.type)
      .filter(Boolean);

    return ["all", ...new Set(unique)];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return articles.filter((article) => {
      const title = String(article.title || "").toLowerCase();
      const summary = String(article.summary || "").toLowerCase();
      const category = String(article.category || article.type || "").toLowerCase();

      const matchesSearch =
        title.includes(term) ||
        summary.includes(term) ||
        category.includes(term);

      const matchesCategory =
        activeCategory === "all" ||
        category === String(activeCategory).toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [articles, searchTerm, activeCategory]);

  const visibleArticles = filteredArticles.slice(0, visibleCount);

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] text-gray-900">
      <Navbar />

      {/* HEADER */}
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-28 sm:px-6 md:pt-32 lg:px-10">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="min-w-0 flex-1">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold text-[#2563eb] shadow-sm backdrop-blur-md">
              <FiBookOpen className="text-sm" />
              Lakbay Lanao Stories
            </span>

            <h1 className="mb-4 max-w-4xl text-2xl font-bold leading-snug tracking-tight text-[#2563eb] sm:text-3xl md:mb-6 md:text-5xl md:leading-tight">
              Articles & Travel Stories
            </h1>

            <p className="max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
              Read tourism stories, travel guides, cultural features, and local
              updates from Lanao del Sur.
            </p>
          </div>

          <div className="rounded-full border border-white/70 bg-white/80 px-5 py-3 text-sm font-medium text-gray-600 shadow-sm backdrop-blur-md">
            {articles.length} article{articles.length !== 1 ? "s" : ""} available
          </div>
        </div>
      </section>

      {/* FILTER PANEL */}
      <section className="mx-auto mb-10 max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-md md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 rounded-full border border-gray-200/80 bg-white/85 px-5 py-3.5 shadow-sm transition focus-within:border-[#2563eb]/40 focus-within:ring-2 focus-within:ring-blue-100 lg:w-[420px]">
              <FiSearch className="text-xl text-[#2563eb]" />

              <input
                type="text"
                placeholder="Search articles, guides, stories..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setVisibleCount(9);
                }}
                className="flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveCategory(category);
                    setVisibleCount(9);
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    activeCategory === category
                      ? "bg-[#2563eb] text-white shadow-sm"
                      : "border border-white/80 bg-white/75 text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
                  }`}
                >
                  {category === "all" ? "All" : category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ARTICLE GRID */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-10">
        {filteredArticles.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-gray-200 bg-white/75 py-20 text-center shadow-sm backdrop-blur-md">
            <p className="text-sm font-medium text-gray-400">
              No articles found.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {visibleArticles.map((article) => (
                <article
                  key={article.id}
                  onClick={() => navigate(`/article/${article.id}`)}
                  className="group flex min-h-[250px] cursor-pointer flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)] sm:min-h-[310px] sm:rounded-[24px] lg:min-h-[438px] lg:rounded-[30px]"
                >
                  {/* IMAGE */}
                  <div className="p-1.5 pb-0 sm:p-2 sm:pb-0 lg:p-2.5 lg:pb-0">
                    <div className="relative h-[120px] shrink-0 overflow-hidden rounded-[16px] border border-white/70 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.05)] backdrop-blur-sm sm:h-[165px] sm:rounded-[20px] lg:h-[248px] lg:rounded-[24px]">
                      <img
                        src={article.imageURL || "/default.jpg"}
                        alt={article.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-white/5 to-white/10" />
                      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/20 to-transparent" />

                      <span className="absolute left-2 top-2 max-w-[105px] truncate rounded-full bg-white/90 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm backdrop-blur-md sm:left-3 sm:top-3 sm:max-w-[140px] sm:px-2.5 sm:py-1 sm:text-[9px] lg:left-4 lg:top-4 lg:px-3 lg:text-[10px]">
                        {article.category || article.type || "Article"}
                      </span>
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="flex flex-1 flex-col px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3 lg:px-5 lg:pb-5">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium text-gray-400 sm:gap-2 sm:text-xs">
                      <FiCalendar className="shrink-0 text-[#2563eb]" />
                      <span className="truncate">{formatDate(article.createdAt)}</span>
                    </div>

                    <h2 className="line-clamp-2 min-h-[34px] text-xs font-bold leading-tight text-[#2563eb] sm:min-h-[40px] sm:text-sm lg:min-h-0 lg:text-lg lg:leading-[1.25]">
                      {article.title}
                    </h2>

                    <p className="mt-1.5 line-clamp-2 flex-1 text-[11px] leading-relaxed text-gray-500 sm:mt-2 sm:text-xs lg:line-clamp-1 lg:text-sm lg:leading-6">
                      {getShortDescription(article.summary)}
                    </p>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/article/${article.id}`);
                      }}
                      className="mt-3 w-full rounded-full bg-[#2563eb] px-3 py-1.5 text-[10px] font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md sm:mt-4 sm:w-fit sm:px-4 sm:py-2 sm:text-[11px] lg:mt-auto lg:flex lg:items-center lg:gap-2 lg:self-start lg:px-5 lg:py-2.5 lg:text-xs"
                    >
                      <span>Read more</span>
                      <FiChevronRight className="hidden lg:block" />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {visibleCount < filteredArticles.length && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 9)}
                  className="w-full rounded-full border border-white/80 bg-white/80 px-7 py-3 text-sm font-semibold text-[#2563eb] shadow-sm backdrop-blur-md transition hover:bg-blue-50 sm:w-auto"
                >
                  Load more articles
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}

export default Articles;