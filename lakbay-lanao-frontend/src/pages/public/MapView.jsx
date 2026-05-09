import Navbar from "../../components/common/Navbar";
import LanaoMap from "../../components/map/LanaoMap";
import { useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";

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
          .filter(
            (item) =>
              item.status !== "archived" &&
              item.coordinates?.lat &&
              item.coordinates?.lng
          );

        setPlaces(data);
      },
      (error) => console.error("Sidebar load error:", error)
    );

    return () => unsubscribe();
  }, []);

  const filteredPlaces = places.filter((place) => {
    const matchSearch = place.name
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchFilter =
      activeFilter === "All" || place.category === activeFilter;

    return matchSearch && matchFilter;
  });

  return (
    <>
      <Navbar />

      <section className="min-h-screen bg-[#f3f9ff] px-6 pb-20 pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
                Explore Lanao del Sur
              </h1>

              <p className="mt-2 max-w-2xl text-gray-500">
                Discover tourist spots using our interactive map.
              </p>
            </div>

            <div className="rounded-full border border-blue-100 bg-white px-5 py-3 text-sm font-medium text-gray-500 shadow-sm">
              {places.length} mapped place{places.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* SIDEBAR */}
            <div className="flex h-[620px] flex-col rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_10px_28px_rgba(37,99,235,0.08)] lg:col-span-1">
              {/* Search */}
              <div className="relative mb-3">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400" />

                <input
                  type="text"
                  placeholder="Search destinations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full border border-blue-100 bg-[#f8fbff] py-2.5 pl-10 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 hover:border-blue-200 focus:border-[#2563eb] focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Filter pills */}
              <div className="mb-4 flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
                      activeFilter === f
                        ? "border-[#2563eb] bg-[#2563eb] text-white shadow-sm"
                        : "border-blue-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
                    }`}
                  >
                    {formatFilterLabel(f)}
                  </button>
                ))}
              </div>

              {/* Count */}
              <p className="mb-3 text-xs font-medium text-gray-400">
                {filteredPlaces.length} place
                {filteredPlaces.length !== 1 ? "s" : ""} found
              </p>

              {/* List */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {filteredPlaces.length === 0 ? (
                  <div className="mt-10 rounded-[22px] border border-dashed border-blue-100 bg-[#f8fbff] px-4 py-10 text-center">
                    <p className="text-sm font-medium text-gray-400">
                      No places found.
                    </p>
                  </div>
                ) : (
                  filteredPlaces.map((place) => (
                    <div
                      key={place.id}
                      onClick={() => setSelectedSpot(place)}
                      className={`flex cursor-pointer items-center gap-3 rounded-[22px] border p-3 transition-all duration-300 ${
                        selectedSpot?.id === place.id
                          ? "border-[#2563eb]/30 bg-blue-50 shadow-sm"
                          : "border-blue-50 bg-[#f8fbff] hover:border-blue-100 hover:bg-white hover:shadow-[0_8px_20px_rgba(37,99,235,0.07)]"
                      }`}
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[16px] border border-white bg-blue-50 shadow-sm">
                        <img
                          src={place.imageURL || "/default.jpg"}
                          alt={place.name}
                          className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.005]"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold leading-snug text-[#2563eb]">
                          {place.name}
                        </h3>

                        <p className="mt-0.5 truncate text-xs text-gray-400">
                          {place.location?.municipality || "Lanao del Sur"}
                        </p>

                        <span
                          className={`mt-1.5 inline-flex max-w-[92px] rounded-full border px-2 py-[2px] text-[8px] font-bold uppercase tracking-wide ${
                            CATEGORY_COLORS[place.category] ||
                            "border-blue-100 bg-blue-50 text-blue-600"
                          }`}
                        >
                          <span className="truncate">
                            {formatCategoryLabel(place.category)}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* MAP */}
            <div className="lg:col-span-3">
              <div className="h-[620px] overflow-hidden rounded-[28px] border border-blue-100 bg-white p-2 shadow-[0_10px_28px_rgba(37,99,235,0.08)]">
                <div className="h-full overflow-hidden rounded-[24px]">
                  <LanaoMap
                    selectedSpot={selectedSpot}
                    onSpotClick={setSelectedSpot}
                  />
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-3 rounded-[22px] border border-blue-100 bg-white px-5 py-3 shadow-sm">
                {[
                  { label: "Destination", color: "bg-red-500" },
                  { label: "Landmark", color: "bg-blue-500" },
                  { label: "Stay / Food", color: "bg-yellow-500" },
                  { label: "Cultural", color: "bg-green-500" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className={`h-3 w-3 rounded-full ${l.color}`} />
                    <span className="text-xs font-medium text-gray-500">
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Map;