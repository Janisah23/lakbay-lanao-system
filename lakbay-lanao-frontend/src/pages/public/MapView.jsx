import Navbar from "../../components/common/Navbar";
import LanaoMap from "../../components/map/LanaoMap";
import { useState, useEffect } from "react";
import { FiSearch, FiMapPin, FiMap } from "react-icons/fi";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1506744626753-1fa44f22908f?w=800&q=80";

const FILTERS = [
  "All",
  "Destination",
  "Landmark",
  "Establishment",
  "Cultural Heritage Site",
];

const CATEGORY_COLORS = {
  Destination: "text-red-500 bg-red-50 border-red-100",
  Landmark: "text-blue-500 bg-blue-50 border-blue-100",
  Establishment: "text-yellow-600 bg-yellow-50 border-yellow-100",
  "Cultural Heritage Site": "text-green-600 bg-green-50 border-green-100",
};

const formatCategoryLabel = (category) => {
  if (category === "Cultural Heritage Site") return "Cultural";
  if (category === "Establishment") return "Stay / Food";
  return category || "Place";
};

const formatFilterLabel = (filter) => {
  if (filter === "Cultural Heritage Site") return "Cultural";
  if (filter === "Establishment") return "Stay / Food";
  return filter;
};

function Map() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [places, setPlaces] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "tourismData"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((item) => {
            // STRICT VALIDATION: Ensure coordinates exist and are valid numbers
            if (item.status === "archived") return false;
            if (!item.coordinates?.lat || !item.coordinates?.lng) return false;
            
            const lat = parseFloat(item.coordinates.lat);
            const lng = parseFloat(item.coordinates.lng);
            
            return !isNaN(lat) && !isNaN(lng);
          });

        setPlaces(data);
      },
      (error) => console.error("Sidebar load error:", error)
    );

    return () => unsubscribe();
  }, []);

  const filteredPlaces = places.filter((place) => {
    const placeName = String(place.name || "").toLowerCase();

    const location =
      typeof place.location === "string"
        ? place.location
        : place.location?.municipality || place.location?.province || "";

    const matchSearch =
      placeName.includes(search.toLowerCase()) ||
      String(location).toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      activeFilter === "All" || place.category === activeFilter;

    return matchSearch && matchFilter;
  });

  // Auto-deselect the spot if it gets hidden by a search or category filter
  useEffect(() => {
    if (selectedSpot) {
      const isStillVisible = filteredPlaces.some((p) => p.id === selectedSpot.id);
      if (!isStillVisible) {
        setSelectedSpot(null);
      }
    }
  }, [filteredPlaces, selectedSpot]);

  const handlePlaceClick = (place) => {
    // Safety check: ensure strict numbers before passing to the map
    const safeLat = parseFloat(place.coordinates?.lat);
    const safeLng = parseFloat(place.coordinates?.lng);

    if (isNaN(safeLat) || isNaN(safeLng)) {
      console.warn("Invalid coordinates for:", place.name);
      return; 
    }

    if (selectedSpot?.id === place.id) {
      setSelectedSpot(null);
    } else {
      // Pass perfectly parsed data down to the map component
      setSelectedSpot({
        ...place,
        coordinates: { lat: safeLat, lng: safeLng }
      });
      
      // Smoothly scroll back up to the map so the user can see the location
      const mapEl = document.getElementById("mobile-map-container");
      if (mapEl) {
        const yOffset = -100; // Account for the sticky Navbar height
        const y = mapEl.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <Navbar />

      <section className="min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] px-4 sm:px-6 lg:px-10 pt-28 md:pt-32 pb-20 font-sans text-gray-900">
        <div className="mx-auto max-w-7xl">
          {/* HEADER */}
          <div className="flex flex-col justify-between gap-6 sm:gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="mb-3 sm:mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-[10px] sm:text-xs font-semibold text-[#2563eb] shadow-sm backdrop-blur-md">
                <FiMap className="text-[10px] sm:text-sm" />
                Lakbay Lanao Map
              </span>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#2563eb] md:text-5xl">
                Explore Lanao del Sur
              </h1>

              <p className="mt-3 sm:mt-4 max-w-2xl text-xs sm:text-sm font-medium leading-relaxed text-gray-500 md:text-base">
                Discover destinations, landmarks, establishments, and cultural
                heritage sites using our interactive tourism map.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 shadow-sm backdrop-blur-md">
              <FiMapPin className="text-[#2563eb]" />
              {places.length} mapped place{places.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* FILTER */}
          <div className="mt-8 sm:mt-10 rounded-[20px] sm:rounded-[28px] border border-blue-100 bg-white p-4 sm:p-5 shadow-[0_10px_28px_rgba(37,99,235,0.08)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative w-full lg:w-[420px]">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-base sm:text-lg text-[#2563eb]" />

                <input
                  type="text"
                  placeholder="Search destinations, places..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full border border-blue-100 bg-white py-2.5 sm:py-3 pl-10 sm:pl-11 pr-4 text-xs sm:text-sm font-medium text-gray-700 outline-none transition placeholder:text-gray-400 hover:border-blue-200 focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Filter buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`w-auto rounded-full border px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs md:text-sm font-medium transition flex-grow sm:flex-grow-0 text-center ${
                      activeFilter === filter
                        ? "border-[#2563eb] bg-[#2563eb] text-white shadow-sm"
                        : "border-blue-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
                    }`}
                  >
                    {formatFilterLabel(filter)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="mt-6 sm:mt-8 flex flex-col lg:grid lg:grid-cols-4 gap-6">
            
            {/* MAP CONTAINER */}
            <div id="mobile-map-container" className="order-1 lg:order-2 lg:col-span-3">
              <div className="h-[380px] sm:h-[480px] lg:h-[680px] w-full overflow-hidden rounded-[20px] sm:rounded-[28px] border border-blue-100 bg-white shadow-[0_10px_28px_rgba(37,99,235,0.08)]">
                <LanaoMap
                  selectedSpot={selectedSpot}
                  onSpotClick={handlePlaceClick} 
                />
              </div>

              {/* Legend */}
              <div className="mt-4 sm:mt-5 flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 rounded-[16px] sm:rounded-[22px] border border-blue-100 bg-white px-4 py-3 sm:px-6 sm:py-4 shadow-sm">
                {[
                  { label: "Destination", color: "bg-red-500", border: "border-red-200" },
                  { label: "Landmark", color: "bg-blue-500", border: "border-blue-200" },
                  { label: "Stay / Food", color: "bg-yellow-500", border: "border-yellow-200" },
                  { label: "Cultural", color: "bg-green-500", border: "border-green-200" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 sm:gap-2">
                    <span className={`h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 rounded-full border shadow-sm ${item.color} ${item.border}`} />
                    <span className="text-[11px] sm:text-[13px] font-medium text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SIDEBAR / CARD GRID */}
            <aside className="order-2 lg:order-1 flex h-[500px] lg:h-[680px] flex-col rounded-[20px] lg:rounded-[28px] border border-blue-100 bg-white p-4 sm:p-5 shadow-[0_10px_28px_rgba(37,99,235,0.08)] lg:col-span-1">
              {/* Sidebar header */}
              <div className="mb-3 sm:mb-4 flex items-center justify-between border-b border-blue-50 pb-3 sm:pb-4 shrink-0">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#2563eb]">
                    Destinations
                  </h2>
                  <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-medium text-gray-400">
                    Results ({filteredPlaces.length})
                  </p>
                </div>

                {selectedSpot && (
                  <button
                    type="button"
                    onClick={() => setSelectedSpot(null)}
                    className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-[#2563eb] transition hover:bg-[#2563eb] hover:text-white"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* LIST / CARDS */}
              <div
                className="flex-1 overflow-y-auto pr-1 sm:pr-2 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-1 lg:flex lg:flex-col lg:gap-3"
                style={{ scrollbarWidth: "thin" }}
              >
                {filteredPlaces.length === 0 ? (
                  <div className="col-span-2 mt-4 sm:mt-8 rounded-[16px] sm:rounded-[22px] border border-dashed border-blue-100 bg-[#f8fbff] px-4 py-8 sm:py-10 text-center lg:col-span-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-400">
                      No places found.
                    </p>
                  </div>
                ) : (
                  filteredPlaces.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handlePlaceClick(place)}
                      className={`group flex flex-col lg:flex-row w-full cursor-pointer lg:items-center gap-2 sm:gap-3 rounded-[20px] sm:rounded-[24px] lg:rounded-[22px] border p-1.5 pb-2 sm:p-2 sm:pb-3 lg:p-3 text-left transition-all duration-300 ${
                        selectedSpot?.id === place.id
                          ? "scale-[1.02] border-[#2563eb] bg-blue-50 shadow-[0_4px_12px_rgba(37,99,235,0.12)]"
                          : "border-gray-100 bg-white hover:border-blue-200 hover:bg-[#f8fbff]"
                      }`}
                    >
                      {/* Image */}
                      <div className="relative shrink-0 overflow-hidden rounded-[16px] sm:rounded-[20px] lg:rounded-[16px] bg-blue-50 shadow-sm h-[120px] sm:h-[165px] lg:h-14 lg:w-14 w-full">
                        <img
                          src={place.imageURL || FALLBACK_IMAGE}
                          alt={place.name || "Tourism place"}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                        />
                      </div>

                      {/* Content Area */}
                      <div className="flex flex-col px-1.5 sm:px-2 lg:p-0 min-w-0 flex-1">
                        <h3 className="line-clamp-2 min-h-[34px] sm:min-h-[40px] lg:min-h-0 text-xs sm:text-sm lg:text-sm font-bold leading-tight text-[#2563eb]">
                          {place.name || "Untitled Place"}
                        </h3>

                        <p className="mt-0.5 sm:mt-1 lg:mt-0.5 flex items-center gap-1 truncate text-[11px] sm:text-xs lg:text-[11px] font-medium text-gray-500">
                          <FiMapPin className="shrink-0 text-[#2563eb]" />
                          {place.location?.municipality || "Lanao del Sur"}
                        </p>

                        <span
                          className={`mt-1.5 sm:mt-2 lg:mt-1.5 inline-flex w-fit max-w-full rounded-full border px-2 py-0.5 sm:px-2.5 sm:py-[3px] text-[9px] sm:text-[10px] font-medium ${
                            CATEGORY_COLORS[place.category] ||
                            "border-blue-100 bg-blue-50 text-[#2563eb]"
                          }`}
                        >
                          <span className="truncate">
                            {formatCategoryLabel(place.category)}
                          </span>
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}

export default Map;