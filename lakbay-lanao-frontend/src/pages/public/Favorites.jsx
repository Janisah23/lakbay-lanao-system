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
    <div className="font-sans min-h-screen bg-[#f3f9ff] pb-24 text-gray-900">
      <Navbar />

      {/* HERO */}
      <section className="relative mx-4 mt-0 h-[300px] overflow-hidden rounded-b-[32px] sm:h-[340px] sm:rounded-b-[48px] md:mx-8">
        <img
          src="/src/assets/favorites-hero.png"
          alt="Favorites"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/25 via-[#0f172a]/45 to-[#0f172a]/70" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-10 sm:px-6 sm:pb-14">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold leading-tight text-white drop-shadow sm:text-4xl md:text-5xl">
                My Favorites
              </h1>

              <p className="mt-2 max-w-xl text-sm font-light leading-relaxed text-gray-100 sm:text-base">
                Your saved destinations, events, and reads — all in one curated
                space.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
              <div className="rounded-[18px] border border-white/30 bg-white/15 px-4 py-2.5 text-center shadow-sm backdrop-blur-md sm:rounded-[22px] sm:px-5 sm:py-3">
                <p className="text-xl font-bold text-white sm:text-2xl">
                  {totalFavorites}
                </p>
                <p className="mt-0.5 text-[11px] text-white/80 sm:text-xs">
                  Saved
                </p>
              </div>

              <div className="rounded-[18px] border border-white/30 bg-white/15 px-4 py-2.5 text-center shadow-sm backdrop-blur-md sm:rounded-[22px] sm:px-5 sm:py-3">
                <p className="text-xl font-bold text-white sm:text-2xl">
                  {tabs.length - 1}
                </p>
                <p className="mt-0.5 text-[11px] text-white/80 sm:text-xs">
                  Categories
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUMMARY BAR */}
      <div className="relative z-10 mx-auto -mt-5 max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[24px] border border-white/80 bg-white/95 px-4 py-5 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-[6px] sm:rounded-[26px] sm:px-7 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-base font-bold text-blue-600 sm:text-lg">
              Saved Collection
            </h2>

            <p className="mt-0.5 text-xs leading-relaxed text-gray-600 sm:text-sm">
              Browse your saved items by category and open them anytime.
            </p>
          </div>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto lg:flex lg:flex-wrap lg:gap-3">
            <div className="flex items-center justify-center gap-2 rounded-full border border-blue-100 bg-[#f8fbff] px-3 py-2 text-xs font-medium text-gray-600 sm:text-sm">
              <FiBookmark className="text-[#2563eb]" />
              {destinationCount} destinations
            </div>

            <div className="flex items-center justify-center gap-2 rounded-full border border-blue-100 bg-[#f8fbff] px-3 py-2 text-xs font-medium text-gray-600 sm:text-sm">
              <FiCalendar className="text-[#2563eb]" />
              {eventCount} events
            </div>

            <div className="flex items-center justify-center gap-2 rounded-full border border-blue-100 bg-[#f8fbff] px-3 py-2 text-xs font-medium text-gray-600 sm:text-sm">
              <FiGrid className="text-[#2563eb]" />
              {articleCount} articles
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <section className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-10">
        <div className="overflow-hidden rounded-[24px] border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-[6px] sm:rounded-[28px]">
          <div className="border-b border-gray-100 px-4 pb-5 pt-5 sm:px-6 md:px-8 md:pt-6">
            <div className="flex items-start gap-3 rounded-[18px] border border-blue-100 bg-[#f8fbff] px-4 py-3 text-xs text-gray-600 sm:text-sm">
              <FiInfo className="mt-0.5 flex-shrink-0 text-[#2563eb]" />
              <p className="leading-relaxed">
                This page keeps the places and content you saved for later.
                Removing a favorite takes it out of your list instantly.
              </p>
            </div>
          </div>

          <div className="px-4 pt-5 sm:px-6 md:px-8">
            <div
              className="flex gap-2 overflow-x-auto pb-2"
              style={{ scrollbarWidth: "none" }}
            >
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition sm:text-sm ${
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

          <div className="p-4 sm:p-6 md:p-8">
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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
                      className={`group flex min-h-[250px] cursor-pointer flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-[6px] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)] sm:min-h-[310px] sm:rounded-[24px] lg:min-h-[390px] lg:rounded-[30px] ${
                        removingId === item.id
                          ? "scale-95 opacity-0"
                          : "scale-100 opacity-100"
                      }`}
                    >
                      <div className="p-1.5 pb-0 sm:p-2 sm:pb-0 lg:p-2.5 lg:pb-0">
                        <div className="relative h-[120px] overflow-hidden rounded-[16px] border border-white/70 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.05)] backdrop-blur-sm sm:h-[165px] sm:rounded-[20px] lg:h-[220px] lg:rounded-[24px]">
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
                            className="absolute right-2 top-2 z-10 rounded-full border border-white/70 bg-white/90 p-2 shadow-sm backdrop-blur-md transition hover:bg-white sm:right-3 sm:top-3 lg:right-4 lg:top-4 lg:p-2.5"
                            title="Remove from favorites"
                          >
                            <FaHeart className="text-xs text-[#2563eb] transition-colors hover:text-red-500 sm:text-sm" />
                          </button>

                          <div className="absolute left-2 top-2 sm:left-3 sm:top-3 lg:left-4 lg:top-4">
                            <span
                              className={`inline-flex max-w-[95px] truncate rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider shadow-sm sm:max-w-[130px] sm:px-2.5 sm:py-1 sm:text-[9px] lg:max-w-none lg:px-3 lg:text-[10px] ${badgeClass}`}
                            >
                              {displayTab}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3 lg:px-5 lg:pb-5 lg:pt-4">
                        <h3 className="line-clamp-2 min-h-[34px] text-xs font-bold leading-tight text-blue-600 transition group-hover:text-blue-700 sm:min-h-[40px] sm:text-sm lg:min-h-0 lg:text-[17px] lg:leading-snug">
                          {title}
                        </h3>

                        <p className="mt-1.5 line-clamp-2 flex-1 text-[11px] leading-relaxed text-gray-600 sm:mt-2 sm:text-xs lg:text-sm">
                          {item.summary ||
                            item.description ||
                            "Open this saved item to view more details and plan your visit."}
                        </p>

                        <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3 sm:mt-4 sm:pt-4 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <FiMapPin className="flex-shrink-0 text-xs text-[#2563eb] sm:text-sm" />
                            <span className="truncate text-[10px] text-gray-600 sm:text-xs">
                              {locationText}
                            </span>
                          </div>

                          {eventDateText && (
                            <span className="flex-shrink-0 text-[9px] font-semibold uppercase tracking-wider text-gray-500 sm:text-[11px]">
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