import { useEffect, useMemo, useState } from "react";
import { db, auth } from "../../firebase/config";
import { collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { FaHeart } from "react-icons/fa";
import {
  FiHeart,
  FiSearch,
  FiChevronRight,
  FiMapPin,
  FiGrid,
  FiList,
} from "react-icons/fi";
import { useFavorites } from "../../components/context/FavoritesContext";

const CATEGORIES = [
  "All",
  "Landmark",
  "Historic",
  "Monument",
  "Religious",
  "Public Site",
  "Viewpoint",
];

const normalize = (value) => String(value || "").trim().toLowerCase();

const StarRating = ({ rating }) => {
  const full = Math.floor(rating || 0);
  const half = (rating || 0) - full >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`text-xs ${
            i <= full
              ? "text-yellow-400"
              : i === full + 1 && half
              ? "text-yellow-300"
              : "text-gray-200"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
};

function Landmarks() {
  const [data, setData] = useState([]);
  const [topPlaces, setTopPlaces] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [showHeart, setShowHeart] = useState(null);

  const navigate = useNavigate();
  const { favorites } = useFavorites();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tourismDataSnap, tourismContentSnap] = await Promise.all([
          getDocs(collection(db, "tourismData")),
          getDocs(collection(db, "tourismContent")),
        ]);

        const tourismDataItems = tourismDataSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          _source: "tourismData",
        }));

        const tourismContentItems = tourismContentSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          _source: "tourismContent",
        }));

        const combined = [...tourismDataItems, ...tourismContentItems];

        const landmarksOnly = combined.filter((item) => {
          const contentType = normalize(item.contentType);
          const type = normalize(item.type);
          const category = normalize(item.category);
          const title = normalize(item.title);
          const description = normalize(item.description);
          const summary = normalize(item.summary);

          const isArticle =
            contentType === "article" ||
            contentType === "blog" ||
            category === "news" ||
            category === "article";

          const isEvent = contentType === "event" || category === "event";

          const isLandmark =
            contentType === "landmark" ||
            contentType === "place" ||
            type === "landmark" ||
            type === "historic" ||
            type === "monument" ||
            type === "religious" ||
            type === "viewpoint" ||
            type === "public site" ||
            category === "landmark" ||
            category === "historic" ||
            category === "monument" ||
            category === "religious" ||
            category === "viewpoint" ||
            category === "public site" ||
            title.includes("landmark") ||
            title.includes("monument") ||
            title.includes("plaza") ||
            title.includes("marker") ||
            description.includes("landmark") ||
            summary.includes("landmark");

          return isLandmark && !isArticle && !isEvent;
        });

        const uniqueById = Array.from(
          new Map(landmarksOnly.map((item) => [item.id, item])).values()
        );

        setData(uniqueById);

        const sortedTop = [...uniqueById]
          .filter((item) => Number(item.rating || 0) > 0)
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));

        setTopPlaces(sortedTop.slice(0, 4));
      } catch (error) {
        console.error("Error fetching landmarks:", error);
      }
    };

    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    const query = normalize(searchQuery);

    return data.filter((item) => {
      const itemType = normalize(item.type);
      const itemCategory = normalize(item.category);

      const matchesCategory =
        activeCategory === "All" ||
        itemType === normalize(activeCategory) ||
        itemCategory === normalize(activeCategory);

      const matchesSearch =
        !query ||
        normalize(item.title).includes(query) ||
        normalize(item.name).includes(query) ||
        normalize(item.description).includes(query) ||
        normalize(item.summary).includes(query) ||
        normalize(item.location?.municipality).includes(query) ||
        normalize(item.location?.province).includes(query) ||
        normalize(item.type).includes(query) ||
        normalize(item.category).includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [data, activeCategory, searchQuery]);

  const handleToggleFavorite = async (e, item) => {
    e.stopPropagation();

    const user = auth.currentUser;
    if (!user) return;

    const favRef = doc(db, "users", user.uid, "favorites", String(item.id));
    const isFavorited = favorites.some(
      (fav) => String(fav.id) === String(item.id)
    );

    try {
      if (isFavorited) {
        await deleteDoc(favRef);
      } else {
        await setDoc(favRef, item);
        setShowHeart(item.id);
        setTimeout(() => setShowHeart(null), 400);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
  };

  const handleClearFilters = () => {
    setActiveCategory("All");
    setSearchQuery("");
  };

  const getPlaceTitle = (item) => {
    return item.title || item.name || "Untitled Landmark";
  };

  const getPlaceLocation = (item) => {
    return (
      item.location?.municipality ||
      item.location?.province ||
      "Lanao del Sur"
    );
  };

  const featuredItem = filteredData[0];
  const regularItems = filteredData.slice(1);

  const MiniCard = ({ item }) => {
    const isFav = favorites.some((fav) => String(fav.id) === String(item.id));
    const title = getPlaceTitle(item);

    return (
      <article
        onClick={() => navigate(`/destination/${item.id}`)}
        className="group flex h-full min-h-[330px] cursor-pointer flex-col overflow-hidden rounded-[30px] border border-blue-100 bg-white shadow-[0_8px_22px_rgba(37,99,235,0.07)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_28px_rgba(37,99,235,0.10)]"
      >
        <div className="p-2.5 pb-0">
          <div className="relative h-[190px] overflow-hidden rounded-[24px] border border-blue-100 bg-[#f8fbff] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_6px_16px_rgba(37,99,235,0.06)]">
            <img
              src={item.imageURL || "/default.jpg"}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.005]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />

            <span className="absolute left-4 top-4 rounded-full border border-blue-100 bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm">
              {item.type || item.category || "Landmark"}
            </span>

            <button
              onClick={(e) => handleToggleFavorite(e, item)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/95 shadow-sm transition hover:bg-blue-50"
            >
              {isFav ? (
                <FaHeart className="text-sm text-[#2563eb]" />
              ) : (
                <FiHeart className="text-sm text-gray-500" />
              )}
            </button>

            {showHeart === item.id && (
              <FaHeart className="pointer-events-none absolute inset-0 z-20 m-auto animate-ping text-5xl text-[#2563eb]" />
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col px-6 pb-6 pt-4">
          <h3 className="line-clamp-2 min-h-[44px] text-base font-bold leading-snug text-[#2563eb] transition group-hover:text-blue-700">
            {title}
          </h3>

          <div className="mt-auto pt-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-400">
              <FiMapPin className="shrink-0 text-[#2563eb]" />
              <span className="line-clamp-1">{getPlaceLocation(item)}</span>
            </div>

            {item.rating && (
              <div className="mb-4 flex items-center gap-1.5">
                <StarRating rating={item.rating} />
                <span className="text-xs font-medium text-gray-400">
                  {Number(item.rating).toFixed(1)}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/destination/${item.id}`);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              View landmark <FiChevronRight />
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="min-h-screen bg-[#f3f9ff] pb-24 font-sans text-gray-900">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 pb-10 pt-32 lg:px-8">
       

        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-[#2563eb] shadow-sm">
              <FiMapPin className="text-xs" /> Lanao del Sur
            </span>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#2563eb] md:text-5xl">
              Lanao
              <br className="hidden md:block" /> Landmarks
            </h1>

            <p className="mt-3 max-w-md text-base font-light leading-relaxed text-gray-500">
              Explore iconic landmarks, historic places, and recognizable sites
              across Lanao del Sur.
            </p>
          </div>

          <div className="relative w-full flex-shrink-0 lg:w-80">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400" />

            <input
              type="text"
              placeholder="Search landmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[16px] border border-blue-100 bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none transition hover:border-[#2563eb]/50 focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-20 border-b border-blue-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3 lg:px-8">
          <div
            className="flex flex-1 gap-2 overflow-x-auto pb-0.5"
            style={{ scrollbarWidth: "none" }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeCategory === cat
                    ? "bg-[#2563eb] text-white shadow-sm"
                    : "border border-blue-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-shrink-0 items-center gap-1 rounded-full border border-blue-100 bg-[#f8fbff] p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-full p-2 transition ${
                viewMode === "grid"
                  ? "bg-white text-[#2563eb] shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <FiGrid className="text-sm" />
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`rounded-full p-2 transition ${
                viewMode === "list"
                  ? "bg-white text-[#2563eb] shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <FiList className="text-sm" />
            </button>
          </div>

          <p className="hidden flex-shrink-0 text-xs font-medium text-gray-400 md:block">
            {filteredData.length}{" "}
            {filteredData.length === 1 ? "landmark" : "landmarks"}
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 pt-10 lg:px-8">
        {filteredData.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-blue-100 bg-white py-20 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-400">
              No landmarks found.
            </p>

            <button
              onClick={handleClearFilters}
              className="mt-4 text-sm font-semibold text-[#2563eb] hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-4">
            {filteredData.map((item) => {
              const isFav = favorites.some(
                (fav) => String(fav.id) === String(item.id)
              );

              const title = getPlaceTitle(item);

              return (
                <article
                  key={item.id}
                  onClick={() => navigate(`/destination/${item.id}`)}
                  className="group flex cursor-pointer items-center gap-5 overflow-hidden rounded-[24px] border border-blue-100 bg-white p-4 shadow-[0_8px_22px_rgba(37,99,235,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_12px_28px_rgba(37,99,235,0.09)]"
                >
                  <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-[18px] border border-blue-100 bg-[#f8fbff] shadow-sm">
                    <img
                      src={item.imageURL || "/default.jpg"}
                      alt={title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.005]"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="mb-2 inline-block rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
                      {item.type || item.category || "Landmark"}
                    </span>

                    <h3 className="line-clamp-1 text-base font-bold text-[#2563eb] transition group-hover:text-blue-700">
                      {title}
                    </h3>

                    <p className="mt-2 line-clamp-1 text-sm font-light text-gray-400">
                      {item.description ||
                        item.summary ||
                        "Explore this landmark in Lanao."}
                    </p>

                    {item.rating && (
                      <div className="mt-2">
                        <StarRating rating={item.rating} />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleToggleFavorite(e, item)}
                    className="mr-2 flex-shrink-0 rounded-full bg-blue-50 p-2.5 transition hover:bg-blue-100"
                  >
                    {isFav ? (
                      <FaHeart className="text-sm text-[#2563eb]" />
                    ) : (
                      <FiHeart className="text-sm text-gray-400" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/destination/${item.id}`);
                    }}
                    className="hidden items-center gap-2 rounded-full bg-[#2563eb] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 md:inline-flex"
                  >
                    View landmark <FiChevronRight />
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {featuredItem && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <article
                  onClick={() => navigate(`/destination/${featuredItem.id}`)}
                  className="group relative min-h-[420px] cursor-pointer overflow-hidden rounded-[30px] border border-blue-100 bg-white p-2.5 shadow-[0_10px_28px_rgba(37,99,235,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_14px_34px_rgba(37,99,235,0.11)] md:col-span-2"
                >
                  <div className="relative h-full min-h-[400px] overflow-hidden rounded-[24px] bg-blue-50">
                    <img
                      src={featuredItem.imageURL || "/default.jpg"}
                      alt={getPlaceTitle(featuredItem)}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.005]"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                    <div className="absolute left-5 top-5">
                      <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm">
                        {featuredItem.type ||
                          featuredItem.category ||
                          "Landmark"}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleToggleFavorite(e, featuredItem)}
                      className="absolute right-5 top-5 z-10 rounded-full border border-white/80 bg-white/95 p-2.5 shadow-sm transition hover:bg-blue-50"
                    >
                      {favorites.some(
                        (fav) => String(fav.id) === String(featuredItem.id)
                      ) ? (
                        <FaHeart className="text-base text-[#2563eb]" />
                      ) : (
                        <FiHeart className="text-base text-gray-500" />
                      )}
                    </button>

                    {showHeart === featuredItem.id && (
                      <FaHeart className="pointer-events-none absolute inset-0 z-20 m-auto animate-ping text-6xl text-[#2563eb]" />
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {featuredItem.rating && (
                        <div className="mb-2 flex items-center gap-2">
                          <StarRating rating={featuredItem.rating} />
                          <span className="text-xs text-white/75">
                            {Number(featuredItem.rating).toFixed(1)} (
                            {featuredItem.reviewsCount || 0})
                          </span>
                        </div>
                      )}

                      <h3 className="mb-1 text-2xl font-bold leading-tight text-white">
                        {getPlaceTitle(featuredItem)}
                      </h3>

                      <p className="line-clamp-2 text-sm font-light text-white/70">
                        {featuredItem.description ||
                          featuredItem.summary ||
                          "Explore this landmark in Lanao."}
                      </p>

                      <div className="mt-3 flex items-center gap-2">
                        <FiMapPin className="flex-shrink-0 text-xs text-white/60" />
                        <span className="text-xs text-white/60">
                          {getPlaceLocation(featuredItem)}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>

                <div className="flex flex-col gap-5">
                  {regularItems.slice(0, 2).map((item) => (
                    <MiniCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {regularItems.length > 2 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {regularItems.slice(2).map((item) => (
                  <MiniCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {topPlaces.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl border-t border-blue-50 px-6 py-20 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <span className="mb-3 inline-flex rounded-full border border-blue-100 bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm">
                Most Recommended
              </span>

              <h2 className="text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
                Top Rated Landmarks
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Discover the most highly recommended sites to visit.
              </p>
            </div>

            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                handleClearFilters();
              }}
              className="hidden rounded-full border border-[#2563eb]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#2563eb] shadow-sm transition hover:bg-blue-50 sm:block"
            >
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {topPlaces.map((item) => (
              <MiniCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default Landmarks;