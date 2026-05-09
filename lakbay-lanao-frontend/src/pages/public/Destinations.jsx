import { useEffect, useMemo, useState } from "react";
import { db, auth } from "../../firebase/config";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";
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

const CATEGORIES = ["All", "Beach", "Mountain", "Waterfall", "Island"];

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

function Destinations() {
  const [data, setData] = useState([]);
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

        const destinationOnly = combined.filter((item) => {
          const type = normalize(item.type);

          return (
            type === "beach" ||
            type === "mountain" ||
            type === "waterfall" ||
            type === "island"
          );
        });

        const uniqueById = Array.from(
          new Map(destinationOnly.map((item) => [item.id, item])).values()
        );

        setData(uniqueById);
      } catch (error) {
        console.error("Error fetching destinations:", error);
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

  const handleClearFilters = () => {
    setActiveCategory("All");
    setSearchQuery("");
  };

  const getPlaceTitle = (item) => {
    return item.title || item.name || "Untitled Destination";
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
        className="group flex h-full min-h-[330px] cursor-pointer flex-col overflow-hidden rounded-[30px] border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)]"
      >
        <div className="p-2.5 pb-0">
          <div className="relative h-[190px] overflow-hidden rounded-[24px] border border-white/70 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.05)] backdrop-blur-sm">
            <img
              src={item.imageURL || "/default.jpg"}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-white/5 to-white/10" />
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/20 to-transparent" />

            <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm backdrop-blur-md">
              {item.type || item.category || "Destination"}
            </span>

            <button
              onClick={(e) => handleToggleFavorite(e, item)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/95 shadow-sm backdrop-blur-md transition hover:bg-blue-50"
            >
              {isFav ? (
                <FaHeart className="text-sm text-[#2563eb]" />
              ) : (
                <FiHeart className="text-sm text-gray-500" />
              )}
            </button>

            {showHeart === item.id && (
              <FaHeart className="absolute inset-0 z-20 m-auto animate-ping text-5xl text-[#2563eb] pointer-events-none" />
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
              className="inline-flex items-center gap-2 self-start rounded-full bg-[#2563eb] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
            >
              View place <FiChevronRight />
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="font-sans min-h-screen bg-[#f3f9ff] pb-24 text-gray-900">
      <Navbar />

      {/* HEADER */}
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-32 lg:px-8">
       

        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-[#2563eb] shadow-sm">
              <FiMapPin className="text-xs" />
              Lanao del Sur
            </span>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#2563eb] md:text-5xl">
              Sights &<br className="hidden md:block" /> Attractions
            </h1>

            <p className="mt-3 max-w-md text-base font-light leading-relaxed text-gray-500">
              Iconic landmarks, hidden gems, and record-breaking attractions
              across the Lake Lanao region.
            </p>
          </div>

          <div className="relative w-full flex-shrink-0 lg:w-80">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400" />

            <input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[14px] border border-white/80 bg-white/90 py-3 pl-10 pr-4 text-sm shadow-sm outline-none ring-1 ring-white/60 backdrop-blur-sm transition hover:border-blue-100 focus:border-[#2563eb]/40 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </section>

      {/* FILTER BAR */}
      <div className="sticky top-0 z-20 border-b border-white/80 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3 lg:px-8">
          <div
            className="flex flex-1 gap-2 overflow-x-auto pb-0.5"
            style={{ scrollbarWidth: "none" }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeCategory === cat
                    ? "bg-[#2563eb] text-white shadow-sm"
                    : "border border-white/80 bg-white/75 text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-shrink-0 items-center gap-1 rounded-full bg-white/80 p-1 shadow-sm ring-1 ring-white/60">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-full p-2 transition ${
                viewMode === "grid"
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "text-gray-400 hover:text-[#2563eb]"
              }`}
            >
              <FiGrid className="text-sm" />
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`rounded-full p-2 transition ${
                viewMode === "list"
                  ? "bg-[#2563eb] text-white shadow-sm"
                  : "text-gray-400 hover:text-[#2563eb]"
              }`}
            >
              <FiList className="text-sm" />
            </button>
          </div>

          <p className="hidden flex-shrink-0 text-xs font-medium text-gray-400 md:block">
            {filteredData.length}{" "}
            {filteredData.length === 1 ? "place" : "places"}
          </p>
        </div>
      </div>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-6 pt-10 lg:px-8">
        {filteredData.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-blue-100 bg-white/85 py-20 text-center shadow-sm backdrop-blur-sm">
            <p className="text-sm font-medium text-gray-400">
              No destinations found.
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
                  className="group flex cursor-pointer items-center gap-5 overflow-hidden rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
                >
                  <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-[18px] border border-white/70 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.05)]">
                    <img
                      src={item.imageURL || "/default.jpg"}
                      alt={title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="mb-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
                      {item.type || item.category || "Destination"}
                    </span>

                    <h3 className="line-clamp-1 text-base font-bold text-[#2563eb] transition group-hover:text-blue-700">
                      {title}
                    </h3>

                    <div className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-400">
                      <FiMapPin className="text-[#2563eb]" />
                      <span>{getPlaceLocation(item)}</span>
                    </div>

                    {item.rating && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <StarRating rating={item.rating} />
                        <span className="text-xs font-medium text-gray-400">
                          {Number(item.rating).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={(e) => handleToggleFavorite(e, item)}
                    className="mr-1 flex-shrink-0 rounded-full bg-blue-50 p-2.5 transition hover:bg-blue-100"
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
                    View place <FiChevronRight />
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
                  className="group relative min-h-[420px] cursor-pointer overflow-hidden rounded-[30px] border border-white/80 bg-white/90 p-2.5 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)] md:col-span-2"
                >
                  <div className="relative h-full min-h-[400px] overflow-hidden rounded-[24px]">
                    <img
                      src={featuredItem.imageURL || "/default.jpg"}
                      alt={getPlaceTitle(featuredItem)}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                    <div className="absolute left-5 top-5">
                      <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm backdrop-blur-md">
                        {featuredItem.type ||
                          featuredItem.category ||
                          "Destination"}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleToggleFavorite(e, featuredItem)}
                      className="absolute right-5 top-5 z-10 rounded-full border border-white/70 bg-white/95 p-2.5 shadow-sm backdrop-blur-md transition hover:bg-blue-50"
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
                      <FaHeart className="absolute inset-0 z-20 m-auto animate-ping text-6xl text-[#2563eb] pointer-events-none" />
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {featuredItem.rating && (
                        <div className="mb-2 flex items-center gap-2">
                          <StarRating rating={featuredItem.rating} />
                          <span className="text-xs text-white/70">
                            {Number(featuredItem.rating).toFixed(1)}
                          </span>
                        </div>
                      )}

                      <h3 className="mb-3 text-2xl font-bold leading-tight text-white">
                        {getPlaceTitle(featuredItem)}
                      </h3>

                      <div className="mb-5 flex items-center gap-2">
                        <FiMapPin className="flex-shrink-0 text-xs text-white/70" />
                        <span className="text-xs text-white/70">
                          {getPlaceLocation(featuredItem)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/destination/${featuredItem.id}`);
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-[#2563eb] shadow-sm transition hover:bg-blue-50"
                      >
                        View place <FiChevronRight />
                      </button>
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
    </div>
  );
}

export default Destinations;