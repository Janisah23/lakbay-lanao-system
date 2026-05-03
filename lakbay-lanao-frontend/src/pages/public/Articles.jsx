import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import TourismChatbot from "../../components/chatbot/TourismChatbot";
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
    <div className="font-sans text-gray-900 min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff]">
      <Navbar />

      {/* HEADER */}
      <section className="pt-32 pb-10 px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5 font-medium uppercase tracking-wider">
          <span
            className="cursor-pointer hover:text-[#2563eb] transition"
            onClick={() => navigate("/")}
          >
            Home
          </span>
          <span>/</span>
          <span className="text-gray-500">Articles</span>
        </div>

        <div className="flex items-start justify-between gap-8 flex-wrap">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-[#2563eb] mb-4">
              <FiBookOpen className="text-sm" />
              Lakbay Lanao Stories
            </span>

            <h1 className="text-4xl md:text-5xl font-bold text-[#2563eb] mb-6 tracking-tight leading-tight">
              Articles & Travel Stories
            </h1>

            <p className="text-gray-500 max-w-2xl leading-relaxed">
              Read tourism stories, travel guides, cultural features, and local
              updates from Lanao del Sur.
            </p>
          </div>

          <div className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 shadow-sm">
            {articles.length} article{articles.length !== 1 ? "s" : ""} available
          </div>
        </div>
      </section>

      {/* FILTER PANEL */}
      <section className="px-6 max-w-7xl mx-auto mb-10">
        <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-5 py-3.5 transition focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-100 lg:w-[420px]">
              <FiSearch className="text-[#2563eb] text-xl" />
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

            <div className="flex flex-wrap gap-2">
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
                      : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
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
      <section className="pb-20 px-6 max-w-7xl mx-auto">
        {filteredArticles.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-gray-200 bg-white py-20 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-400">
              No articles found.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleArticles.map((article) => (
                <article
                  key={article.id}
                  onClick={() => navigate(`/article/${article.id}`)}
                  className="group flex h-full min-h-[455px] cursor-pointer flex-col overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="relative h-[230px] shrink-0 overflow-hidden bg-blue-50">
                    <img
                      src={article.imageURL || "/default.jpg"}
                      alt={article.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm">
                      {article.category || article.type || "Article"}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-400">
                      <FiCalendar className="text-[#2563eb]" />
                      <span>{formatDate(article.createdAt)}</span>
                    </div>

                    <h2 className="line-clamp-2 text-lg font-bold leading-snug text-[#2563eb]">
                      {article.title}
                    </h2>

                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-gray-500">
                      {article.summary ||
                        "Discover more stories from Lanao del Sur."}
                    </p>

                    <button
                      type="button"
                      className="mt-auto flex items-center gap-2 self-start rounded-full bg-[#2563eb] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                    >
                      Read more <FiChevronRight />
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {visibleCount < filteredArticles.length && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 9)}
                  className="rounded-full border border-[#2563eb] bg-white px-7 py-3 text-sm font-semibold text-[#2563eb] shadow-sm transition hover:bg-blue-50"
                >
                  Load more articles
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <TourismChatbot />
      <Footer />
    </div>
  );
}

export default Articles;