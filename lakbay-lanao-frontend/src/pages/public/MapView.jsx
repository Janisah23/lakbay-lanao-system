import Navbar from "../../components/common/Navbar";
import LanaoMap from "../../components/map/LanaoMap";
import { useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
const FILTERS = ["All", "Destination", "Landmark", "Establishment", "Cultural Heritage Site"];

const CATEGORY_COLORS = {
  Destination: "text-red-500 bg-red-50",
  Landmark: "text-blue-500 bg-blue-50",
  Establishment: "text-yellow-600 bg-yellow-50",
  "Cultural Heritage Site": "text-green-600 bg-green-50",
};

function Map() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [places, setPlaces] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);

  // Realtime listener - sidebar updates whenever ManageTourismData adds/edits
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

      <section className="pt-28 px-6 pb-10 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-semibold text-blue-600">
            Explore Lanao del Sur
          </h1>
          <p className="text-gray-500 mt-2">
            Discover tourist spots using our interactive map.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">

            {/* ── SIDEBAR ───────────────────────────────────────── */}
            <div className="lg:col-span-1 bg-white rounded-2xl shadow-md border p-5 h-[620px] flex flex-col">

              {/* Search */}
              <div className="relative mb-3">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder="Search destinations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border rounded-full pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Filter pills */}
              <div className="flex gap-2 flex-wrap mb-4">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      activeFilter === f
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Count */}
              <p className="text-xs text-gray-400 mb-3">
                {filteredPlaces.length} place{filteredPlaces.length !== 1 ? "s" : ""} found
              </p>

              {/* List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {filteredPlaces.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm mt-10">
                    No places found.
                  </p>
                ) : (
                  filteredPlaces.map((place) => (
                    <div
                      key={place.id}
                      onClick={() => setSelectedSpot(place)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                        selectedSpot?.id === place.id
                          ? "border-blue-400 bg-blue-50 shadow-sm"
                          : "bg-gray-50 hover:shadow-md hover:border-blue-200"
                      }`}
                    >
                      <img
                        src={place.imageURL || "/default.jpg"}
                        alt={place.name}
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                            CATEGORY_COLORS[place.category] ||
                            "text-blue-600 bg-blue-50"
                          }`}
                        >
                          {place.category}
                        </span>
                        <h3 className="font-semibold text-gray-800 text-sm mt-0.5 truncate">
                          {place.name}
                        </h3>
                        <p className="text-xs text-gray-400 truncate">
                          {place.location?.municipality}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── MAP ───────────────────────────────────────────── */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl overflow-hidden shadow-lg border h-[620px]">
                <LanaoMap
                  selectedSpot={selectedSpot}
                  onSpotClick={setSelectedSpot}
                />
              </div>

              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-4 px-1">
                {[
                  { label: "Destination", color: "bg-red-500" },
                  { label: "Landmark", color: "bg-blue-500" },
                  { label: "Establishment", color: "bg-yellow-500" },
                  { label: "Cultural Heritage Site", color: "bg-green-500" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded-full ${l.color}`} />
                    <span className="text-xs text-gray-500">{l.label}</span>
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