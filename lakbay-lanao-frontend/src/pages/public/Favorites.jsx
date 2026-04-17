import { db, auth } from "../../firebase/config";
import { doc, deleteDoc } from "firebase/firestore";
import { useFavorites } from "../../components/context/FavoritesContext";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { FaHeart } from "react-icons/fa";
import {
  FiHeart,
  FiChevronRight,
  FiMapPin,
  FiCalendar,
  FiBookmark,
  FiGrid,
  FiInfo,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

const BASE_TABS = ["All", "Events", "Destinations", "Articles", "Highlights"];

const normalize = (value) => String(value || "").trim().toLowerCase();

const getItemRoute = (item) => {
  const contentType = normalize(item.contentType);
  const category = normalize(item.category);
  const type = normalize(item.type);

  if (
    contentType === "article" ||
    contentType === "blog" ||
    category === "articles" ||
    category === "article" ||
    category === "news"
  ) {
    return `/article/${item.id}`;
  }

  if (
    contentType === "event" ||
    category === "events" ||
    category === "event"
  ) {
    return `/event/${item.id}`;
  }

  if (
    contentType === "destination" ||
    contentType === "place" ||
    contentType === "establishment" ||
    contentType === "cultural heritage" ||
    contentType === "cultural-heritage" ||
    category === "destinations" ||
    category === "destination" ||
    category === "establishment" ||
    category === "cultural heritage" ||
    category === "cultural-heritage" ||
    type === "beach" ||
    type === "mountain" ||
    type === "waterfall" ||
    type === "island" ||
    type === "cultural" ||
    type === "historic"
  ) {
    return `/place/${item.id}`;
  }

  return `/event/${item.id}`;
};

const getDisplayTab = (item) => {
  const contentType = normalize(item.contentType);
  const category = normalize(item.category);
  const type = normalize(item.type);

  if (
    contentType === "article" ||
    contentType === "blog" ||
    category === "article" ||
    category === "articles" ||
    category === "news"
  ) {
    return "Articles";
  }

  if (
    contentType === "event" ||
    category === "event" ||
    category === "events"
  ) {
    return "Events";
  }

  if (
    contentType === "destination" ||
    contentType === "place" ||
    contentType === "establishment" ||
    contentType === "cultural heritage" ||
    contentType === "cultural-heritage" ||
    type === "beach" ||
    type === "mountain" ||
    type === "waterfall" ||
    type === "island" ||
    type === "cultural" ||
    type === "historic"
  ) {
    return "Destinations";
  }

  return item.category || "Highlights";
};

const getBadgeClass = (item) => {
  const contentType = normalize(item.contentType);
  const category = normalize(item.category);
  const type = normalize(item.type);

  if (
    contentType === "article" ||
    contentType === "blog" ||
    category === "article" ||
    category === "articles" ||
    category === "news"
  ) {
    return "text-amber-600 bg-amber-50 border-amber-100";
  }

  if (
    contentType === "event" ||
    category === "event" ||
    category === "events"
  ) {
    return "text-red-600 bg-red-50 border-red-100";
  }

  if (
    contentType === "destination" ||
    contentType === "place" ||
    contentType === "establishment" ||
    contentType === "cultural heritage" ||
    contentType === "cultural-heritage" ||
    type === "beach" ||
    type === "mountain" ||
    type === "waterfall" ||
    type === "island" ||
    type === "cultural" ||
    type === "historic"
  ) {
    return "text-blue-600 bg-blue-50 border-blue-100";
  }

  return "text-gray-600 bg-gray-50 border-gray-200";
};

function Favorites() {
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const [removingId, setRemovingId] = useState(null);
  const [activeTab, setActiveTab] = useState("All");

  const removeFavorite = async (id) => {
    setRemovingId(id);

    setTimeout(async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        await deleteDoc(doc(db, "users", user.uid, "favorites", id));
      } catch (error) {
        console.error("Failed to remove favorite:", error);
      } finally {
        setRemovingId(null);
      }
    }, 250);
  };

  const tabs = useMemo(() => {
    const derived = favorites.map(getDisplayTab).filter(Boolean);
    return [...new Set([...BASE_TABS, ...derived])];
  }, [favorites]);

  const filteredFavorites = useMemo(() => {
    if (activeTab === "All") return favorites;
    return favorites.filter((item) => getDisplayTab(item) === activeTab);
  }, [favorites, activeTab]);

  const totalFavorites = favorites.length;
  const destinationCount = favorites.filter((item) => getDisplayTab(item) === "Destinations").length;
  const eventCount = favorites.filter((item) => getDisplayTab(item) === "Events").length;
  const articleCount = favorites.filter((item) => getDisplayTab(item) === "Articles").length;

  return (
    <div className="font-sans text-gray-900 min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] pb-24">
      <Navbar />

      <section className="relative w-full h-[340px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?q=80&w=2070&auto=format&fit=crop"
          alt="Favorites"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />

        <div className="relative z-10 h-full flex flex-col justify-end pb-14 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-white/60 mb-4 font-medium uppercase tracking-wider">
            <span>Visit Lanao</span>
             <span className="cursor-pointer hover:text-[#2563eb] transition" onClick={() => navigate("itinerary/")}>
            Itinerary
          </span>

            <FiChevronRight className="text-white/40" />
            <span className="text-white/80">My Favorites</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow leading-tight">
                My Favorites
              </h1>
              <p className="text-gray-100 text-base mt-2 max-w-xl font-light">
                Your saved destinations, events, and reads — all in one curated space.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl px-5 py-3 text-center">
                <p className="text-2xl font-bold text-white">{totalFavorites}</p>
                <p className="text-white/80 text-xs mt-0.5">Saved</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl px-5 py-3 text-center">
                <p className="text-2xl font-bold text-white">{tabs.length - 1}</p>
                <p className="text-white/80 text-xs mt-0.5">Categories</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-5 relative z-10">
        <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm px-7 py-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div>
            <h2 className="text-lg font-bold text-blue-600">Saved Collection</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              Browse your saved items by category and open them anytime.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-600 flex items-center gap-2">
              <FiBookmark className="text-[#2563eb]" />
              {destinationCount} destinations
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-600 flex items-center gap-2">
              <FiCalendar className="text-[#2563eb]" />
              {eventCount} events
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-600 flex items-center gap-2">
              <FiGrid className="text-[#2563eb]" />
              {articleCount} articles
            </div>
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 pt-8">
        <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 md:px-8 pt-6 pb-5 border-b border-gray-100">
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-[16px] px-4 py-3 text-sm text-gray-600">
              <FiInfo className="flex-shrink-0 mt-0.5 text-[#2563eb]" />
              <p className="leading-relaxed">
                This page keeps the places and content you saved for later. Removing a favorite takes it out of your list instantly.
              </p>
            </div>
          </div>

          <div className="px-6 md:px-8 pt-5">
            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab
                      ? "bg-[#2563eb] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 md:p-8">
            {filteredFavorites.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-[24px] bg-gradient-to-br from-blue-50/60 to-white">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <FiHeart className="text-[#2563eb] text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-blue-600 mb-2">No favorites yet</h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  Save destinations, events, or articles first, and they will appear here in your personal collection.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFavorites.map((item) => {
                  const badgeClass = getBadgeClass(item);
                  const displayTab = getDisplayTab(item);

                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(getItemRoute(item))}
                      className={`group cursor-pointer bg-white rounded-[24px] border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
                        removingId === item.id ? "opacity-0 scale-95" : "opacity-100 scale-100"
                      }`}
                    >
                      <div className="relative h-[220px] overflow-hidden bg-gray-100">
                        <img
                          src={item.imageURL || "/default.jpg"}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFavorite(item.id);
                          }}
                          className="absolute top-4 right-4 bg-white/95 p-2.5 rounded-full shadow-md z-10 hover:bg-white transition"
                          title="Remove from favorites"
                        >
                          <FaHeart className="text-[#2563eb] text-sm hover:text-red-500 transition-colors" />
                        </button>

                        <div className="absolute top-4 left-4">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${badgeClass}`}>
                            {displayTab}
                          </span>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-blue-600 text-[17px] leading-snug group-hover:text-blue-700 transition line-clamp-2">
                          {item.title}
                        </h3>

                        <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                          {item.summary || item.description || "Open this saved item to view more details and plan your visit."}
                        </p>

                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 min-w-0">
                            <FiMapPin className="text-gray-600 text-sm flex-shrink-0" />
                            <span className="text-xs text-gray-600 truncate">
                              {item.location?.municipality ||
                                item.location?.province ||
                                item.category ||
                                "Lanao del Sur"}
                            </span>
                          </div>

                          {item.eventDate && (
                            <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider flex-shrink-0">
                              {new Date(item.eventDate).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Favorites;