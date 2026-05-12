import React, { useEffect, useState, useRef, useCallback } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiChevronRight, FiNavigation, FiX } from "react-icons/fi";
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { getIconUrl } from "./MapSetup";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const defaultCenter = { lat: 7.9111453, lng: 124.252998 };

// Handles zooming in to spots and resetting to the main map
function MapViewController({ spot }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (spot?.coordinates?.lat && spot?.coordinates?.lng) {
      map.panTo({ lat: spot.coordinates.lat, lng: spot.coordinates.lng });
      map.setZoom(15);
    } else {
      map.panTo(defaultCenter);
      map.setZoom(10);
    }
  }, [spot, map]);

  return null;
}

// Custom Street View Component
function StreetView({ lat, lng }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && window.google && window.google.maps) {
      new window.google.maps.StreetViewPanorama(containerRef.current, {
        position: { lat, lng },
        disableDefaultUI: true,
        zoomControl: false,
        panControl: true,
        visible: true,
      });
    }
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden rounded-[22px]"
    />
  );
}

export default function LanaoMap({ selectedSpot, onSpotClick }) {
  const [spots, setSpots] = useState([]);
  const [activePopup, setActivePopup] = useState(null);

  const [showStreetView, setShowStreetView] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const [markers, setMarkers] = useState({});
  const clusterer = useRef(null);
  const map = useMap();

  const navigate = useNavigate();

  useEffect(() => {
    if (activePopup) setShowStreetView(false);
  }, [activePopup]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tourismData"), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(
          (item) =>
            item.status !== "archived" &&
            item.coordinates?.lat &&
            item.coordinates?.lng
        );

      setSpots(data);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setActivePopup(selectedSpot || null);
  }, [selectedSpot]);

  const setMarkerRef = useCallback(
    (marker, key) => {
      if (marker && markers[key]) return;
      if (!marker && !markers[key]) return;

      setMarkers((prev) => {
        if (marker) return { ...prev, [key]: marker };

        const newMarkers = { ...prev };
        delete newMarkers[key];
        return newMarkers;
      });
    },
    [markers]
  );

  useEffect(() => {
    if (!map) return;

    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
  }, [map]);

  useEffect(() => {
    if (clusterer.current) {
      clusterer.current.clearMarkers();
      clusterer.current.addMarkers(Object.values(markers));
    }
  }, [markers]);

  const handleFindMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLoc = { lat: latitude, lng: longitude };

        setUserLocation(currentLoc);
        setIsLocating(false);

        if (map) {
          map.panTo(currentLoc);
          map.setZoom(14);
        }
      },
      () => {
        alert(
          "Unable to retrieve your location. Please check your browser permissions."
        );
        setIsLocating(false);
      }
    );
  };

  const getTitle = (spot) => spot.name || spot.title || "Untitled Place";

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
        .gm-style-iw-c {
          padding: 0 !important;
          border-radius: 28px !important;
          background: rgba(255, 255, 255, 0.92) !important;
          box-shadow:
            0 18px 42px rgba(37, 99, 235, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(18px) !important;
          -webkit-backdrop-filter: blur(18px) !important;
          border: 1px solid rgba(219, 231, 255, 0.95) !important;
          max-width: 350px !important;
        }

        .gm-style-iw-d {
          overflow: hidden !important;
          max-width: 350px !important;
        }

        .gm-style-iw-tc::after {
          background: rgba(255, 255, 255, 0.92) !important;
          border: 1px solid rgba(219, 231, 255, 0.85) !important;
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.1) !important;
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
          }

          70% {
            transform: scale(1);
            box-shadow: 0 0 0 15px rgba(37, 99, 235, 0);
          }

          100% {
            transform: scale(0.8);
            box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
          }
        }

        .user-location-dot {
          width: 16px;
          height: 16px;
          background-color: #2563eb;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          animation: pulse-ring 2s infinite;
        }
      `}</style>

      <div className="relative h-[680px] w-full overflow-hidden rounded-[28px] shadow-sm">
        <APIProvider apiKey={GOOGLE_MAPS_KEY}>
          <Map
            defaultCenter={defaultCenter}
            defaultZoom={15}
            minZoom={8}
            maxZoom={18}
            disableDefaultUI={true}
            zoomControl={true}
            gestureHandling="greedy"
            clickableIcons={false}
          >
            <MapViewController spot={selectedSpot} />

            {spots.map((spot) => (
              <Marker
                key={spot.id}
                ref={(marker) => setMarkerRef(marker, spot.id)}
                position={{
                  lat: spot.coordinates.lat,
                  lng: spot.coordinates.lng,
                }}
                icon={{
                  url: getIconUrl(spot.category),
                  scaledSize: { width: 35, height: 45 },
                }}
                onClick={() => {
                  setActivePopup(spot);
                  if (onSpotClick) onSpotClick(spot);
                }}
              />
            ))}

            {userLocation && (
              <InfoWindow
                position={userLocation}
                headerDisabled={true}
                style={{ background: "transparent", boxShadow: "none" }}
              >
                <div className="user-location-dot" title="You are here" />
              </InfoWindow>
            )}

            {activePopup && (
              <InfoWindow
                position={{
                  lat: activePopup.coordinates.lat,
                  lng: activePopup.coordinates.lng,
                }}
                onCloseClick={() => setActivePopup(null)}
                pixelOffset={[0, -42]}
                headerDisabled={true}
              >
                <div className="w-[320px] rounded-[28px] bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] p-2.5 text-gray-900">
                  {!showStreetView ? (
                    <div className="relative h-[170px] overflow-hidden rounded-[22px] border border-white/80 bg-blue-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_20px_rgba(37,99,235,0.07)]">
                      <img
                        src={activePopup.imageURL || "/default.jpg"}
                        alt={getTitle(activePopup)}
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/28 via-[#2563eb]/5 to-white/10" />
                      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/25 to-transparent" />

                      {/* X BUTTON INSIDE IMAGE */}
                      <button
                        type="button"
                        onClick={() => setActivePopup(null)}
                        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/95 text-[#2563eb] shadow-sm backdrop-blur-md transition hover:bg-[#2563eb] hover:text-white"
                        aria-label="Close popup"
                      >
                        <FiX className="text-base" />
                      </button>

                      <span className="absolute left-3 top-3 rounded-full border border-white/80 bg-white/95 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[#2563eb] shadow-sm backdrop-blur-md">
                        {activePopup.category || "Place"}
                      </span>

                      <button
                        type="button"
                        onClick={() => setShowStreetView(true)}
                        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-3.5 py-1.5 text-[10px] font-bold text-[#2563eb] shadow-[0_7px_16px_rgba(37,99,235,0.12)] backdrop-blur-md transition hover:bg-[#2563eb] hover:text-white"
                      >
                        <FiNavigation className="text-xs" />
                        360° View
                      </button>
                    </div>
                  ) : (
                    <div className="relative h-[170px] overflow-hidden rounded-[22px] border border-blue-100 bg-blue-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.07)]">
                      <StreetView
                        lat={activePopup.coordinates.lat}
                        lng={activePopup.coordinates.lng}
                      />

                      {/* X BUTTON INSIDE STREET VIEW */}
                      <button
                        type="button"
                        onClick={() => setActivePopup(null)}
                        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/95 text-[#2563eb] shadow-sm backdrop-blur-md transition hover:bg-[#2563eb] hover:text-white"
                        aria-label="Close popup"
                      >
                        <FiX className="text-base" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowStreetView(false)}
                        className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-[10px] font-bold text-[#2563eb] shadow-sm backdrop-blur-md transition hover:bg-[#2563eb] hover:text-white"
                      >
                        <FiChevronRight className="rotate-180 text-sm" />
                        Back
                      </button>
                    </div>
                  )}

                  <div className="px-2.5 pb-2.5 pt-4">
                    <h4 className="line-clamp-2 text-[17px] font-bold leading-tight tracking-tight text-[#2563eb]">
                      {getTitle(activePopup)}
                    </h4>

                    <div className="mt-2.5 flex items-start gap-2 rounded-[16px] border border-blue-100/80 bg-white/75 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-gray-600 shadow-sm backdrop-blur-sm">
                      <FiMapPin className="mt-0.5 shrink-0 text-base text-[#2563eb]" />
                      <span className="line-clamp-2">
                        {getLocation(activePopup)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/destination/${activePopup.id}`)
                      }
                      className="mt-3.5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563eb] px-4 py-3 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.16)] transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_12px_24px_rgba(37,99,235,0.2)]"
                    >
                      Explore place
                      <FiChevronRight className="text-sm" />
                    </button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>

          <button
            onClick={handleFindMyLocation}
            disabled={isLocating}
            className="absolute bottom-6 left-6 z-10 flex items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-5 py-3 text-sm font-bold text-gray-700 shadow-[0_8px_20px_rgba(37,99,235,0.12)] transition hover:border-[#2563eb] hover:text-[#2563eb] active:scale-95 disabled:opacity-70"
          >
            {isLocating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2563eb] border-t-transparent" />
            ) : (
              <FiNavigation className="text-lg text-[#2563eb]" />
            )}

            {isLocating ? "Locating..." : "Find My Location"}
          </button>
        </APIProvider>
      </div>
    </>
  );
}