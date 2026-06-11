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

// NEW: Import Swiper modules
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import Footer from "../../components/common/Footer";

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
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  const navigate = useNavigate();
  const { favorites } = useFavorites();

  // Track auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

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
          // Strictly exclude archived items
          if (String(item.status || "").toLowerCase() === "archived") {
            return false;
          }

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
        className="group flex min-h-[250px] cursor-pointer flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)] sm:min-h-[310px] sm:rounded-[24px] lg:min-h-[330px] lg:rounded-[30px]"
      >
        <div className="p-1.5 pb-0 sm:p-2 sm:pb-0 lg:p-2.5 lg:pb-0">
          <div className="relative h-[120px] overflow-hidden rounded-[16px] border border-white/70 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.05)] backdrop-blur-sm sm:h-[165px] sm:rounded-[20px] lg:h-[190px] lg:rounded-[24px]">
            
            {/* Multi-image Slider Logic for MiniCard */}
            {item.imageURLs && item.imageURLs.length > 1 ? (
              <Swiper
                modules={[Autoplay]}
                autoplay={{ delay: 30000, disableOnInteraction: false }}
                speed={1000}
                loop={true}
                className="h-full w-full"
              >
                {item.imageURLs.map((url, i) => (
                  <SwiperSlide key={i}>
                    <img
                      src={url}
                      alt={`${title} ${i}`}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <img
                src={item.imageURL || "/default.jpg"}
                alt={title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
              />
            )}

            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/10 via-white/5 to-white/10 pointer-events-none" />
            <div className="absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

            <span className="absolute left-2 top-2 z-20 max-w-[100px] truncate rounded-full bg-white/95 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm backdrop-blur-md sm:left-3 sm:top-3 sm:max-w-[140px] sm:px-2.5 sm:py-1 sm:text-[9px] lg:left-4 lg:top-4 lg:px-3 lg:text-[10px]">
              {item.type || item.category || "Destination"}
            </span>

            {/* Only show heart button if user is logged in */}
            {currentUser && (
              <button
                onClick={(e) => handleToggleFavorite(e, item)}
                className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/95 shadow-sm backdrop-blur-md transition hover:bg-blue-50 sm:right-3 sm:top-3 sm:h-8 sm:w-8 lg:right-4 lg:top-4 lg:h-9 lg:w-9"
              >
                {isFav ? (
                  <FaHeart className="text-xs text-[#2563eb] sm:text-sm" />
                ) : (
                  <FiHeart className="text-xs text-gray-500 sm:text-sm" />
                )}
              </button>
            )}

            {showHeart === item.id && (
              <FaHeart className="pointer-events-none absolute inset-0 z-30 m-auto animate-ping text-3xl text-[#2563eb] sm:text-4xl lg:text-5xl" />
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3 lg:px-6 lg:pb-6 lg:pt-4">
          <h3 className="line-clamp-2 min-h-[34px] text-xs font-bold leading-tight text-[#2563eb] transition group-hover:text-blue-700 sm:min-h-[40px] sm:text-sm lg:min-h-[44px] lg:text-base lg:leading-snug">
            {title}
          </h3>

          <div className="mt-auto pt-2 sm:pt-3 lg:pt-4">
            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium text-gray-400 sm:mb-3 sm:gap-2 sm:text-xs">
              <FiMapPin className="shrink-0 text-[#2563eb]" />
              <span className="line-clamp-1">{getPlaceLocation(item)}</span>
            </div>

            {item.rating && (
              <div className="mb-3 flex items-center gap-1.5 sm:mb-4">
                <StarRating rating={item.rating} />
                <span className="text-[10px] font-medium text-gray-400 sm:text-xs">
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
              className="w-full rounded-full bg-[#2563eb] px-3 py-1.5 text-[10px] font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md sm:w-fit sm:px-4 sm:py-2 sm:text-[11px] lg:inline-flex lg:items-center lg:gap-2 lg:self-start lg:px-5 lg:py-2.5 lg:text-xs"
            >
              View place <FiChevronRight className="hidden lg:inline" />
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="font-sans flex flex-col min-h-screen bg-[#f3f9ff] text-gray-900">
      <Navbar />

      {/* HEADER */}
     <section className="mx-auto w-full max-w-7xl px-4 pb-8 pt-28 sm:px-6 md:pt-32 lg:px-10">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-[#2563eb] shadow-sm">
              <FiMapPin className="text-xs" />
              Lanao del Sur
            </span>

            <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#2563eb] sm:text-4xl md:text-5xl">
              Sights &
              <br className="hidden md:block" />
              Attractions
            </h1>

            <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-gray-500 sm:text-base">
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
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
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
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 pb-24 pt-8 sm:px-6 lg:px-10">
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
                  className="group flex cursor-pointer items-center gap-3 overflow-hidden rounded-[20px] border border-white/80 bg-white/90 p-3 shadow-sm ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md sm:gap-5 sm:rounded-[24px] sm:p-4"
                >
                  <div className="relative h-20 w-24 flex-shrink-0 overflow-hidden rounded-[16px] border border-white/70 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.05)] sm:h-24 sm:w-32 sm:rounded-[18px]">
                    
                    {/* Multi-image Slider Logic for List View */}
                    {item.imageURLs && item.imageURLs.length > 1 ? (
                      <Swiper
                        modules={[Autoplay]}
                        autoplay={{ delay: 30000, disableOnInteraction: false }}
                        speed={1000}
                        loop={true}
                        className="h-full w-full"
                      >
                        {item.imageURLs.map((url, i) => (
                          <SwiperSlide key={i}>
                            <img
                              src={url}
                              alt={`${title} ${i}`}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                            />
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    ) : (
                      <img
                        src={item.imageURL || "/default.jpg"}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                      />
                    )}

                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="mb-1.5 inline-block max-w-[120px] truncate rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[#2563eb] sm:mb-2 sm:max-w-none sm:px-3 sm:py-1 sm:text-[10px]">
                      {item.type || item.category || "Destination"}
                    </span>

                    <h3 className="line-clamp-1 text-xs font-bold text-[#2563eb] transition group-hover:text-blue-700 sm:text-base">
                      {title}
                    </h3>

                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-medium text-gray-400 sm:mt-2 sm:gap-2 sm:text-xs">
                      <FiMapPin className="shrink-0 text-[#2563eb]" />
                      <span className="truncate">{getPlaceLocation(item)}</span>
                    </div>

                    {item.rating && (
                      <div className="mt-1.5 flex items-center gap-1.5 sm:mt-2">
                        <StarRating rating={item.rating} />
                        <span className="text-[10px] font-medium text-gray-400 sm:text-xs">
                          {Number(item.rating).toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Only show heart button in list view if user is logged in */}
                  {currentUser && (
                    <button
                      onClick={(e) => handleToggleFavorite(e, item)}
                      className="mr-0 flex-shrink-0 z-10 rounded-full bg-blue-50 p-2 transition hover:bg-blue-100 sm:mr-1 sm:p-2.5"
                    >
                      {isFav ? (
                        <FaHeart className="text-xs text-[#2563eb] sm:text-sm" />
                      ) : (
                        <FiHeart className="text-xs text-gray-400 sm:text-sm" />
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/destination/${item.id}`);
                    }}
                    className="hidden items-center z-10 gap-2 rounded-full bg-[#2563eb] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 md:inline-flex"
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
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
                <article
                  onClick={() => navigate(`/destination/${featuredItem.id}`)}
                  className="group relative min-h-[300px] cursor-pointer overflow-hidden rounded-[20px] border border-white/80 bg-white/90 p-1.5 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)] sm:min-h-[360px] sm:rounded-[24px] sm:p-2 lg:col-span-2 lg:min-h-[420px] lg:rounded-[30px] lg:p-2.5"
                >
                  <div className="relative h-full min-h-[285px] overflow-hidden rounded-[16px] sm:min-h-[344px] sm:rounded-[20px] lg:min-h-[400px] lg:rounded-[24px]">
                    
                    {/* Multi-image Slider Logic for Featured Item */}
                    {featuredItem.imageURLs && featuredItem.imageURLs.length > 1 ? (
                      <Swiper
                        modules={[Autoplay]}
                        autoplay={{ delay: 30000, disableOnInteraction: false }}
                        speed={1000}
                        loop={true}
                        className="absolute inset-0 h-full w-full z-0"
                      >
                        {featuredItem.imageURLs.map((url, i) => (
                          <SwiperSlide key={i}>
                            <img
                              src={url}
                              alt={`${getPlaceTitle(featuredItem)} ${i}`}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                            />
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    ) : (
                      <img
                        src={featuredItem.imageURL || "/default.jpg"}
                        alt={getPlaceTitle(featuredItem)}
                        className="absolute inset-0 h-full w-full z-0 object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                      />
                    )}

                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

                    <div className="absolute left-4 top-4 z-20 sm:left-5 sm:top-5">
                      <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm backdrop-blur-md">
                        {featuredItem.type ||
                          featuredItem.category ||
                          "Destination"}
                      </span>
                    </div>

                    {/* Only show heart button on featured card if user is logged in */}
                    {currentUser && (
                      <button
                        onClick={(e) => handleToggleFavorite(e, featuredItem)}
                        className="absolute right-4 top-4 z-20 rounded-full border border-white/70 bg-white/95 p-2.5 shadow-sm backdrop-blur-md transition hover:bg-blue-50 sm:right-5 sm:top-5"
                      >
                        {favorites.some(
                          (fav) => String(fav.id) === String(featuredItem.id)
                        ) ? (
                          <FaHeart className="text-base text-[#2563eb]" />
                        ) : (
                          <FiHeart className="text-base text-gray-500" />
                        )}
                      </button>
                    )}

                    {showHeart === featuredItem.id && (
                      <FaHeart className="pointer-events-none absolute inset-0 z-30 m-auto animate-ping text-5xl text-[#2563eb] sm:text-6xl" />
                    )}

                    <div className="absolute bottom-0 left-0 right-0 z-20 p-5 sm:p-6 pointer-events-none">
                      {featuredItem.rating && (
                        <div className="mb-2 flex items-center gap-2">
                          <StarRating rating={featuredItem.rating} />
                          <span className="text-xs text-white/70">
                            {Number(featuredItem.rating).toFixed(1)}
                          </span>
                        </div>
                      )}

                      <h3 className="mb-3 text-xl font-bold leading-tight text-white sm:text-2xl">
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
                        className="inline-flex items-center gap-2 pointer-events-auto rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-[#2563eb] shadow-sm transition hover:bg-blue-50"
                      >
                        View place <FiChevronRight />
                      </button>
                    </div>
                  </div>
                </article>

                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:flex lg:flex-col lg:gap-5">
                  {regularItems.slice(0, 2).map((item) => (
                    <MiniCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {regularItems.length > 2 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                {regularItems.slice(2).map((item) => (
                  <MiniCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
    
  );
}

export default Destinations;