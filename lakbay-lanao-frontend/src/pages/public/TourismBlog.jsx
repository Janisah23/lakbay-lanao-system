import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { FiSearch, FiClock, FiTag, FiChevronRight, FiChevronLeft } from "react-icons/fi";

const CATEGORIES = ["All", "Travel Guide", "Culture", "Food", "Events", "News"];
const PER_PAGE = 6;

function TourismBlog() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tourismContent"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPosts(data.filter((item) => item.status === "published"));
    });
    return () => unsubscribe();
  }, []);

  const filtered = posts.filter((item) => {
    const matchesCat = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const featuredPost = paginated[0];
  const gridPosts = paginated.slice(1);

  return (
    <div className="font-sans text-gray-900 min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] pb-24">
      <Navbar />

      {/* ── PAGE HEADER ── */}
      <section className="pt-32 pb-10 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-[#2563eb] mb-4">
              <FiTag className="text-xs" /> Lakbay Lanao
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-[#2563eb] leading-tight tracking-tight">
              Travel Stories &<br className="hidden md:block" /> Local Guides
            </h1>
            <p className="mt-3 text-gray-500 max-w-md text-base font-light leading-relaxed">
              Curated articles, cultural insights, and local guides from across the Lake Lanao region.
            </p>
          </div>

          <div className="relative w-full lg:w-80 flex-shrink-0">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full rounded-[12px] border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm outline-none transition hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* ── STICKY FILTER BAR ── */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="flex gap-2 overflow-x-auto pb-0.5 flex-1" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setPage(1); }}
                className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full transition flex-shrink-0 ${
                  activeCategory === cat
                    ? "bg-[#2563eb] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 font-medium flex-shrink-0 hidden md:block">
            {filtered.length} {filtered.length === 1 ? "article" : "articles"}
          </p>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <main className="max-w-7xl mx-auto px-6 pt-10">
        {filtered.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[28px] border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm font-medium">No articles found.</p>
            <button
              onClick={() => { setActiveCategory("All"); setSearchQuery(""); }}
              className="mt-4 text-sm text-[#2563eb] font-semibold hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Featured Article */}
            {featuredPost && (
              <div
                onClick={() => navigate(`/article/${featuredPost.id}`)}
                className="group cursor-pointer bg-white rounded-[28px] border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden mb-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[280px]">
                  <div className="relative overflow-hidden min-h-[220px] lg:min-h-0">
                    <img
                      src={featuredPost.imageURL || "/default.jpg"}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover absolute inset-0 group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
                    <span className="absolute top-4 left-4 rounded-full bg-[#2563eb] px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                      Featured
                    </span>
                  </div>
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-[#2563eb]">
                        {featuredPost.category || "Travel Guide"}
                      </span>
                      {featuredPost.readTime && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                          <FiClock className="text-xs" /> {featuredPost.readTime} read
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#2563eb] leading-tight mb-3 group-hover:text-blue-700 transition">
                      {featuredPost.title}
                    </h2>
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">
                      {featuredPost.summary || "Discover more about Lanao del Sur in this curated article."}
                    </p>
                    <div className="flex items-center gap-2 mt-6 text-sm font-semibold text-[#2563eb]">
                      Read article <FiChevronRight />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid */}
            {gridPosts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                {gridPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => navigate(`/article/${post.id}`)}
                    className="group cursor-pointer bg-white rounded-[20px] border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
                  >
                    <div className="relative h-[180px] overflow-hidden flex-shrink-0">
                      <img
                        src={post.imageURL || "/default.jpg"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="rounded-full bg-blue-50 border border-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-[#2563eb] uppercase tracking-wider">
                          {post.category || "Article"}
                        </span>
                        {post.readTime && (
                          <span className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                            <FiClock className="text-[10px]" /> {post.readTime}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-[#2563eb] text-[15px] leading-snug mb-2 line-clamp-2 group-hover:text-blue-700 transition flex-1">
                        {post.title}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                        {post.summary || "Read more about this destination."}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-4 mb-10">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#2563eb] hover:text-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiChevronLeft /> Previous
            </button>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`w-9 h-9 rounded-full text-sm font-medium transition ${
                    num === page
                      ? "bg-[#2563eb] text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-[#2563eb] hover:text-[#2563eb]"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#2563eb] hover:text-[#2563eb] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <FiChevronRight />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default TourismBlog;