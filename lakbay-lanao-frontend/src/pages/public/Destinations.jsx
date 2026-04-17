import { useEffect, useMemo, useState } from "react";
import { db, auth } from "../../firebase/config";
import { collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { FaHeart } from "react-icons/fa";
import { FiHeart, FiSearch, FiChevronRight, FiMapPin, FiGrid, FiList, FiStar } from "react-icons/fi";
import { useFavorites } from "../../components/context/FavoritesContext";

// Strictly Hardcoded Categories for Tabs
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
  const [topPlaces, setTopPlaces] = useState([]);
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
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

        // 1. MAIN DESTINATIONS LOGIC
        const destinationOnly = combined.filter((item) => {
          const type = normalize(item.type);

          const isDestinationLike =
            type === "beach" || type === "mountain" || type === "waterfall" ||
            type === "island";
          return isDestinationLike;
        });

        const uniqueById = Array.from(new Map(destinationOnly.map((item) => [item.id, item])).values());
        setData(uniqueById);

        // 2. TOP PLACES LOGIC (Sort destinations by rating, get top 4)
        const sortedTop = [...uniqueById].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setTopPlaces(sortedTop.slice(0, 4));

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
    const isFavorited = favorites.some((fav) => String(fav.id) === String(item.id));

    try {
      if (isFavorited) {
        await deleteDoc(favRef);
      } else {
        await setDoc(favRef, item);
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

  const featuredItem = filteredData[0];
  const regularItems = filteredData.slice(1);

  // Reusable component for the bottom section cards
  const MiniCard = ({ item }) => {
    const isFav = favorites.some((fav) => String(fav.id) === String(item.id));
    return (
      <div
        onClick={() => navigate(`/destination/${item.id}`)}
        className="group cursor-pointer bg-white rounded-[20px] border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
      >
        <div className="relative h-[160px] overflow-hidden">
          <img
            src={item.imageURL || "/default.jpg"}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          
          <div className="absolute top-3 left-3">
            <span className="rounded-full bg-[#2563eb] px-2.5 py-1 text-[9px] font-bold text-white uppercase tracking-wider shadow-sm">
              {item.type || item.category || "Place"}
            </span>
          </div>

          <button
            onClick={(e) => handleToggleFavorite(e, item)}
            className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-md z-10 hover:bg-white transition"
          >
            {isFav ? <FaHeart className="text-[#2563eb] text-sm" /> : <FiHeart className="text-gray-500 text-sm" />}
          </button>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-[#2563eb] text-[15px] group-hover:text-blue-700 transition line-clamp-1">
            {item.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 line-clamp-1">
            <FiMapPin className="text-gray-400" />
            {item.location?.municipality || "Lanao del Sur"}
          </p>
          {item.rating && (
            <div className="flex items-center gap-1.5 mt-2">
              <StarRating rating={item.rating} />
              <span className="text-xs text-gray-400 font-medium">{item.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="font-sans text-gray-900 min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] pb-24">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-10 px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 font-medium uppercase tracking-wider">
          <span className="cursor-pointer hover:text-[#2563eb] transition" onClick={() => navigate("/")}>
            Discover
          </span>
          <span>/</span>
          <span className="text-gray-500">Sights & Attractions</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-[#2563eb] mb-4">
              <FiMapPin className="text-xs" /> Lanao del Sur
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-[#2563eb] leading-tight tracking-tight">
              Sights &<br className="hidden md:block" /> Attractions
            </h1>
            <p className="mt-3 text-gray-500 max-w-md text-base font-light leading-relaxed">
              Iconic landmarks, hidden gems, and record-breaking attractions across the Lake Lanao region.
            </p>
          </div>

          <div className="relative w-full lg:w-80 flex-shrink-0">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search destinations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[12px] border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm outline-none transition hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Sticky Filters */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center gap-4">
          <div className="flex gap-2 overflow-x-auto pb-0.5 flex-1" style={{ scrollbarWidth: "none" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
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

          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1 flex-shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-full transition ${viewMode === "grid" ? "bg-white shadow-sm text-[#2563eb]" : "text-gray-400 hover:text-gray-600"}`}
            >
              <FiGrid className="text-sm" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-full transition ${viewMode === "list" ? "bg-white shadow-sm text-[#2563eb]" : "text-gray-400 hover:text-gray-600"}`}
            >
              <FiList className="text-sm" />
            </button>
          </div>

          <p className="text-xs text-gray-400 font-medium flex-shrink-0 hidden md:block">
            {filteredData.length} {filteredData.length === 1 ? "place" : "places"}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 pt-10">
        {filteredData.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[28px] border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm font-medium">No destinations found.</p>
            <button onClick={handleClearFilters} className="mt-4 text-sm text-[#2563eb] font-semibold hover:underline">
              Clear filters
            </button>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-4">
            {filteredData.map((item) => {
              const isFav = favorites.some((fav) => String(fav.id) === String(item.id));
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(`/destination/${item.id}`)}
                  className="group cursor-pointer bg-white rounded-[20px] border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-5 p-4 overflow-hidden"
                >
                  <div className="relative w-28 h-20 flex-shrink-0 rounded-[12px] overflow-hidden bg-gray-100">
                    <img src={item.imageURL || "/default.jpg"} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="inline-block rounded-full bg-[#2563eb] px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm mb-1.5">
                      {item.type || item.category || "Destination"}
                    </span>
                    <h3 className="font-bold text-[#2563eb] text-base group-hover:text-blue-700 transition line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-1 font-light">{item.description || item.summary}</p>
                    {item.rating && <StarRating rating={item.rating} />}
                  </div>

                  <button onClick={(e) => handleToggleFavorite(e, item)} className="flex-shrink-0 p-2.5 bg-gray-50 rounded-full hover:bg-blue-50 transition mr-2">
                    {isFav ? <FaHeart className="text-[#2563eb] text-sm" /> : <FiHeart className="text-gray-400 text-sm" />}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {featuredItem && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div
                  onClick={() => navigate(`/destination/${featuredItem.id}`)}
                  className="group cursor-pointer relative bg-white rounded-[28px] border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden md:col-span-2 min-h-[420px]"
                >
                  <img src={featuredItem.imageURL || "/default.jpg"} alt={featuredItem.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  <div className="absolute top-5 left-5">
                    <span className="rounded-full bg-[#2563eb] px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                      {featuredItem.type || featuredItem.category || "Destination"}
                    </span>
                  </div>

                  <button onClick={(e) => handleToggleFavorite(e, featuredItem)} className="absolute top-5 right-5 bg-white/90 p-2.5 rounded-full shadow-md z-10 hover:bg-white transition">
                    {favorites.some((fav) => String(fav.id) === String(featuredItem.id)) ? <FaHeart className="text-[#2563eb] text-base" /> : <FiHeart className="text-gray-500 text-base" />}
                  </button>

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    {featuredItem.rating && (
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={featuredItem.rating} />
                        <span className="text-white/70 text-xs">{featuredItem.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-white leading-tight mb-1">{featuredItem.title}</h3>
                    <p className="text-white/70 text-sm line-clamp-2 font-light">{featuredItem.description || featuredItem.summary}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <FiMapPin className="text-white/60 text-xs flex-shrink-0" />
                      <span className="text-white/60 text-xs">{featuredItem.location?.municipality || "Lanao del Sur"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  {regularItems.slice(0, 2).map((item) => <MiniCard key={item.id} item={item} />)}
                </div>
              </div>
            )}

            {regularItems.length > 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {regularItems.slice(2).map((item) => <MiniCard key={item.id} item={item} />)}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Top Places Section */}
      {topPlaces.length > 0 && (
        <section className="mt-20 px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2563eb] tracking-tight">Top Rated Places</h2>
              <p className="text-sm text-gray-500 mt-1">Discover the highest-rated destinations in Lanao del Sur.</p>
            </div>
            <button 
              onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); handleClearFilters(); }} 
              className="text-sm font-semibold text-[#2563eb] hover:underline hidden sm:block"
            >
              View all places
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {topPlaces.map((item) => <MiniCard key={item.id} item={item} />)}
          </div>
        </section>
      )}

    </div>
  );
}

export default Destinations;