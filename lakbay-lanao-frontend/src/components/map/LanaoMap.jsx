import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { redIcon, blueIcon, goldIcon, greenIcon } from "./MapSetup";
import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiChevronRight } from "react-icons/fi";

const center = [7.7818039, 124.0087275];
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

function FlyToSpot({ spot }) {
  const map = useMap();

  useEffect(() => {
    if (spot?.coordinates?.lat && spot?.coordinates?.lng) {
      map.flyTo([spot.coordinates.lat, spot.coordinates.lng], 14, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [spot, map]);

  return null;
}

function FixMapSize() {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

function LanaoMap({ selectedSpot, onSpotClick }) {
  const [spots, setSpots] = useState([]);
  const navigate = useNavigate();
  const markerRefs = useRef({});

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

        setSpots(data);
      },
      (error) => console.error("Map load error:", error)
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedSpot && markerRefs.current[selectedSpot.id]) {
      markerRefs.current[selectedSpot.id].openPopup();
    }
  }, [selectedSpot]);

  const getIcon = (category) => {
    if (category === "Destination") return redIcon;
    if (category === "Landmark") return blueIcon;
    if (category === "Establishment") return goldIcon;
    if (category === "Cultural Heritage Site") return greenIcon;
    return redIcon;
  };

  const getTitle = (spot) => {
    return spot.name || spot.title || "Untitled Place";
  };

  const getLocation = (spot) => {
    if (!spot.location) return "Lanao del Sur";

    if (typeof spot.location === "string") return spot.location;

    if (spot.location?.municipality && spot.location?.province) {
      return `${spot.location.municipality}, ${spot.location.province}`;
    }

    return spot.location?.municipality || "Lanao del Sur";
  };

  return (
    <>
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 28px !important;
          padding: 0 !important;
          border: 1px solid rgba(255, 255, 255, 0.85) !important;
          background: rgba(255, 255, 255, 0.88) !important;
          box-shadow: 0 18px 45px rgba(37, 99, 235, 0.16) !important;
          backdrop-filter: blur(18px) !important;
          -webkit-backdrop-filter: blur(18px) !important;
        }

        .leaflet-popup-content {
          margin: 0 !important;
          width: auto !important;
        }

        .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.88) !important;
          border: 1px solid rgba(255, 255, 255, 0.85) !important;
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.08) !important;
        }

        .leaflet-container a.leaflet-popup-close-button {
          top: 14px !important;
          right: 14px !important;
          width: 30px !important;
          height: 30px !important;
          border-radius: 999px !important;
          background: rgba(255, 255, 255, 0.92) !important;
          color: #64748b !important;
          font-size: 18px !important;
          line-height: 28px !important;
          text-align: center !important;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08) !important;
          transition: all 0.2s ease !important;
        }

        .leaflet-container a.leaflet-popup-close-button:hover {
          background: #eff6ff !important;
          color: #2563eb !important;
        }
      `}</style>

     <MapContainer
        center={center}
        zoom={9}
        minZoom={8}
        maxZoom={10}
        zoomControl={false}
        className="h-[680px] w-full"
      >
        <FixMapSize />

       <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
          url={`https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`}
        />

        {selectedSpot && <FlyToSpot spot={selectedSpot} />}

        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.coordinates.lat, spot.coordinates.lng]}
            icon={getIcon(spot.category)}
            ref={(ref) => {
              if (ref) markerRefs.current[spot.id] = ref;
            }}
            eventHandlers={{
              click: () => onSpotClick && onSpotClick(spot),
            }}
          >
            <Popup closeButton={true} minWidth={260}>
              <div className="w-[260px] overflow-hidden rounded-[28px] bg-white/80 p-2.5 text-gray-900 backdrop-blur-xl">
                <div className="relative h-[150px] overflow-hidden rounded-[22px] border border-white/70 bg-blue-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.06)]">
                  <img
                    src={spot.imageURL || "/default.jpg"}
                    alt={getTitle(spot)}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.015]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-white/5 to-white/10" />
                  <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/20 to-transparent" />

                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm backdrop-blur-md">
                    {spot.category || "Place"}
                  </span>
                </div>

                <div className="px-2 pb-2 pt-4">
                  <h4 className="line-clamp-2 text-[15px] font-bold leading-snug text-[#2563eb]">
                    {getTitle(spot)}
                  </h4>

                  <div className="mt-2 flex items-start gap-2 text-xs font-medium leading-relaxed text-gray-500">
                    <FiMapPin className="mt-0.5 shrink-0 text-[#2563eb]" />
                    <span className="line-clamp-2">{getLocation(spot)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/destination/${spot.id}`)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563eb] px-4 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                  >
                    Explore place <FiChevronRight />
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}

export default LanaoMap;