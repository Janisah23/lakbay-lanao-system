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

const safeDate = (value) => {
  if (!value) return null;
  if (value?.toDate) return value.toDate();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatEventDate = (value) => {
  const date = safeDate(value);
  if (!date) return null;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

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
  const destinationCount = favorites.filter(
    (item) => getDisplayTab(item) === "Destinations"
  ).length;
  const eventCount = favorites.filter(
    (item) => getDisplayTab(item) === "Events"
  ).length;
  const articleCount = favorites.filter(
    (item) => getDisplayTab(item) === "Articles"
  ).length;

  return (
    <div className="font-sans text-gray-900 min-h-screen bg-[#f3f9ff] pb-24">
      <Navbar />

      <section className="relative mx-4 mt-0 h-[340px] overflow-hidden rounded-b-[48px] md:mx-8">
        <img
          src="/src/assets/favorites-hero.png"
          alt="Favorites"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/25 via-[#0f172a]/45 to-[#0f172a]/70" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-14">
          <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-white/65">
           
            <FiChevronRight className="text-white/40" />
            
          </div>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-4xl font-bold leading-tight text-white drop-shadow md:text-5xl">
                My Favorites
              </h1>
              <p className="mt-2 max-w-xl text-base font-light text-gray-100">
                Your saved destinations, events, and reads — all in one curated
                space.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="rounded-[22px] border border-white/30 bg-white/15 px-5 py-3 text-center shadow-sm backdrop-blur-md">
                <p className="text-2xl font-bold text-white">
                  {totalFavorites}
                </p>
                <p className="mt-0.5 text-xs text-white/80">Saved</p>
              </div>

              <div className="rounded-[22px] border border-white/30 bg-white/15 px-5 py-3 text-center shadow-sm backdrop-blur-md">
                <p className="text-2xl font-bold text-white">
                  {tabs.length - 1}
                </p>
                <p className="mt-0.5 text-xs text-white/80">Categories</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-5 max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[26px] border border-white/80 bg-white/95 px-7 py-5 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-[6px] lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-blue-600">
              Saved Collection
            </h2>
            <p className="mt-0.5 text-sm text-gray-600">
              Browse your saved items by category and open them anytime.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-[#f8fbff] px-4 py-2 text-sm font-medium text-gray-600">
              <FiBookmark className="text-[#2563eb]" />
              {destinationCount} destinations
            </div>
            <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-[#f8fbff] px-4 py-2 text-sm font-medium text-gray-600">
              <FiCalendar className="text-[#2563eb]" />
              {eventCount} events
            </div>
            <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-[#f8fbff] px-4 py-2 text-sm font-medium text-gray-600">
              <FiGrid className="text-[#2563eb]" />
              {articleCount} articles
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 pt-8 pb-24">
        <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-[6px]">
          <div className="border-b border-gray-100 px-6 pb-5 pt-6 md:px-8">
            <div className="flex items-start gap-3 rounded-[18px] border border-blue-100 bg-[#f8fbff] px-4 py-3 text-sm text-gray-600">
              <FiInfo className="mt-0.5 flex-shrink-0 text-[#2563eb]" />
              <p className="leading-relaxed">
                This page keeps the places and content you saved for later.
                Removing a favorite takes it out of your list instantly.
              </p>
            </div>
          </div>

          <div className="px-6 pt-5 md:px-8">
            <div
              className="flex gap-2 overflow-x-auto pb-2"
              style={{ scrollbarWidth: "none" }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeTab === tab
                      ? "bg-[#2563eb] text-white shadow-sm"
                      : "border border-white/80 bg-white/80 text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 md:p-8">
            {filteredFavorites.length === 0 ? (
              <div className="rounded-[24px] border-2 border-dashed border-blue-100 bg-[#f8fbff] py-20 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <FiHeart className="text-2xl text-[#2563eb]" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-blue-600">
                  No favorites yet
                </h3>
                <p className="mx-auto max-w-md text-sm leading-relaxed text-gray-600">
                  Save destinations, events, or articles first, and they will
                  appear here in your personal collection.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFavorites.map((item) => {
                  const badgeClass = getBadgeClass(item);
                  const displayTab = getDisplayTab(item);
                  const title =
                    item.title || item.name || "Untitled Favorite";
                  const locationText =
                    item.location?.municipality ||
                    item.location?.province ||
                    item.category ||
                    "Lanao del Sur";
                  const eventDateText = formatEventDate(item.eventDate);

                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(getItemRoute(item))}
                      className={`group cursor-pointer overflow-hidden rounded-[30px] border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-[6px] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)] ${
                        removingId === item.id
                          ? "scale-95 opacity-0"
                          : "scale-100 opacity-100"
                      }`}
                    >
                      <div className="p-2.5 pb-0">
                        <div className="relative h-[220px] overflow-hidden rounded-[24px] border border-white/70 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.05)] backdrop-blur-sm">
                          <img
                            src={item.imageURL || "/default.jpg"}
                            alt={title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-white/5 to-white/10" />
                          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/20 to-transparent" />

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFavorite(item.id);
                            }}
                            className="absolute right-4 top-4 z-10 rounded-full border border-white/70 bg-white/90 p-2.5 shadow-sm backdrop-blur-md transition hover:bg-white"
                            title="Remove from favorites"
                          >
                            <FaHeart className="text-sm text-[#2563eb] transition-colors hover:text-red-500" />
                          </button>

                          <div className="absolute left-4 top-4">
                            <span
                              className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm ${badgeClass}`}
                            >
                              {displayTab}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex min-h-[160px] flex-col px-5 pb-5 pt-4">
                        <h3 className="line-clamp-2 text-[17px] font-bold leading-snug text-blue-600 transition group-hover:text-blue-700">
                          {title}
                        </h3>

                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">
                          {item.summary ||
                            item.description ||
                            "Open this saved item to view more details and plan your visit."}
                        </p>

                        <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                          <div className="flex min-w-0 items-center gap-2">
                            <FiMapPin className="flex-shrink-0 text-sm text-[#2563eb]" />
                            <span className="truncate text-xs text-gray-600">
                              {locationText}
                            </span>
                          </div>

                          {eventDateText && (
                            <span className="flex-shrink-0 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                              {eventDateText}
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