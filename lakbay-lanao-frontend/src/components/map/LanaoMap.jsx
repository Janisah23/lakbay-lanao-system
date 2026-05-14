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

const defaultCenter = { lat: 7.8731, lng: 124.2863 };
const defaultZoom = 10;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1506744626753-1fa44f22908f?w=800&q=80";

const smoothZoomTo = (map, targetZoom, delay = 85) => {
  if (!map) return () => {};

  const currentZoom = Math.round(map.getZoom() || defaultZoom);

  if (currentZoom === targetZoom) return () => {};

  const direction = targetZoom > currentZoom ? 1 : -1;
  let zoom = currentZoom;

  const timer = setInterval(() => {
    zoom += direction;
    map.setZoom(zoom);

    if (zoom === targetZoom) {
      clearInterval(timer);
    }
  }, delay);

  return () => clearInterval(timer);
};

// 1. MAP CHILD: One safe controller for all map movements
function MapCameraController({ activePopup, userLocation, resetTrigger }) {
  const map = useMap();
  const lastTargetRef = useRef("");

  useEffect(() => {
    if (!map) return;

    let clearZoom = () => {};
    let zoomTimer;

    // Priority 1: selected pin / active popup
    if (activePopup?.coordinates?.lat && activePopup?.coordinates?.lng) {
      const target = {
        lat: Number(activePopup.coordinates.lat),
        lng: Number(activePopup.coordinates.lng),
      };

      const targetKey = spot-${activePopup.id}-${target.lat}-${target.lng};

      if (lastTargetRef.current === targetKey) return;

      lastTargetRef.current = targetKey;

      map.panTo(target);

      zoomTimer = setTimeout(() => {
        clearZoom = smoothZoomTo(map, 15, 85);
      }, 250);

      return () => {
        clearTimeout(zoomTimer);
        clearZoom();
      };
    }

    // Priority 2: user location
    if (userLocation?.lat && userLocation?.lng) {
      const target = {
        lat: Number(userLocation.lat),
        lng: Number(userLocation.lng),
      };

      const targetKey = user-${target.lat}-${target.lng};

      if (lastTargetRef.current === targetKey) return;

      lastTargetRef.current = targetKey;

      map.panTo(target);

      zoomTimer = setTimeout(() => {
        clearZoom = smoothZoomTo(map, 14, 90);
      }, 250);

      return () => {
        clearTimeout(zoomTimer);
        clearZoom();
      };
    }

    // Priority 3: reset when popup closes
    if (resetTrigger > 0) {
      const targetKey = reset-${resetTrigger};

      if (lastTargetRef.current === targetKey) return;

      lastTargetRef.current = targetKey;

      map.panTo(defaultCenter);

      zoomTimer = setTimeout(() => {
        clearZoom = smoothZoomTo(map, defaultZoom, 90);
      }, 250);

      return () => {
        clearTimeout(zoomTimer);
        clearZoom();
      };
    }
  }, [map, activePopup, userLocation, resetTrigger]);

  return null;
}

// 2. MAP CHILD: Handles all markers and clustering safely
function ClusteredMarkers({ spots, onMarkerClick }) {
  const map = useMap();
  const clusterer = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!map) return;

    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
  }, [map]);

  const setMarkerRef = useCallback((marker, key) => {
    if (marker) {
      markersRef.current[key] = marker;
    } else {
      delete markersRef.current[key];
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (clusterer.current) {
        clusterer.current.clearMarkers();
        clusterer.current.addMarkers(Object.values(markersRef.current));
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [spots]);

  return (
    <>
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          ref={(marker) => setMarkerRef(marker, spot.id)}
          position={{
            lat: Number(spot.coordinates.lat),
            lng: Number(spot.coordinates.lng),
          }}
          icon={{
            url: getIconUrl(spot.category),
            scaledSize: { width: 35, height: 45 },
          }}
          onClick={() => onMarkerClick(spot)}
        />
      ))}
    </>
  );
}

// 3. Custom Component to render the 360 Panorama natively and safely
function CustomStreetView({ lat, lng }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && window.google) {
      new window.google.maps.StreetViewPanorama(containerRef.current, {
        position: {
          lat: Number(lat),
          lng: Number(lng),
        },
        disableDefaultUI: true,
        visible: true,
      });
    }
  }, [lat, lng]);

  return <div ref={containerRef} className="h-full w-full" />;
}

// 4. MAIN WRAPPER
export default function LanaoMap({ selectedSpot, onSpotClick }) {
  const [spots, setSpots] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [showStreetView, setShowStreetView] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  const previousPopup = useRef(null);
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
    if (selectedSpot !== undefined) {
      setActivePopup(selectedSpot);
    }
  }, [selectedSpot]);

  useEffect(() => {
    if (previousPopup.current !== null && activePopup === null) {
      setResetTrigger((prev) => prev + 1);
    }

    previousPopup.current = activePopup;
  }, [activePopup]);

  const handleMarkerClick = (spot) => {
    if (activePopup && activePopup.id === spot.id) {
      if (onSpotClick) onSpotClick(null);
      else setActivePopup(null);
    } else {
      if (onSpotClick) onSpotClick(spot);
      else setActivePopup(spot);
    }
  };

  const handleCloseClick = () => {
    if (onSpotClick) onSpotClick(null);
    else setActivePopup(null);
  };

  const handleFindMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setActivePopup(null);

        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        setIsLocating(false);
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
      return ${spot.location.municipality}, ${spot.location.province};
    }

    return spot.location?.municipality || "Lanao del Sur";
  };

  return (
    <>
      <style>{`
        .gm-style-iw-c {
          padding: 0 !important;
          border-radius: 28px !important;
          background: rgba(255, 255, 255, 0.88) !important;
          box-shadow: 0 18px 45px rgba(37, 99, 235, 0.16) !important;
          backdrop-filter: blur(18px) !important;
          -webkit-backdrop-filter: blur(18px) !important;
          border: 1px solid rgba(255, 255, 255, 0.85) !important;
          max-width: calc(100vw - 32px) !important;
        }

        .gm-style-iw-d {
          overflow: hidden !important;
          max-width: calc(100vw - 32px) !important;
        }

        .gm-style-iw-tc::after {
          background: rgba(255, 255, 255, 0.88) !important;
        }

        .gm-ui-hover-effect {
          display: none !important;
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
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          animation: pulse-ring 2s infinite;
        }
      `}</style>

      <div className="relative h-[420px] w-full overflow-hidden rounded-[20px] shadow-sm sm:h-[560px] sm:rounded-[28px] lg:h-[680px]">
        <APIProvider apiKey={GOOGLE_MAPS_KEY}>
          <Map
            defaultCenter={defaultCenter}
            defaultZoom={defaultZoom}
            minZoom={8}
            maxZoom={18}
            disableDefaultUI={true}
            zoomControl={true}
            gestureHandling="greedy"
            clickableIcons={false}
            style={{ width: "100%", height: "100%" }}
          >
            <MapCameraController
              activePopup={activePopup}
              userLocation={userLocation}
              resetTrigger={resetTrigger}
            />

            <ClusteredMarkers spots={spots} onMarkerClick={handleMarkerClick} />

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
                  lat: Number(activePopup.coordinates.lat),
                  lng: Number(activePopup.coordinates.lng),
                }}
                onCloseClick={handleCloseClick}
                pixelOffset={[0, -40]}
                headerDisabled={true}
              >
                <div className="w-[260px] rounded-[28px] p-2.5 text-gray-900 sm:w-[280px]">
                  {!showStreetView ? (
                    <div className="relative h-[150px] overflow-hidden rounded-[22px] border border-white/70 bg-blue-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.06)]">
                      <img
                        src={activePopup.imageURL || FALLBACK_IMAGE}
                        alt={getTitle(activePopup)}
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.015]"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-white/5 to-white/10" />
                      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/20 to-transparent" />

                      <button
                        type="button"
                        onClick={() => {
                          if (onSpotClick) onSpotClick(null);
                          else setActivePopup(null);
                        }}
                        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/95 text-[#2563eb] shadow-sm backdrop-blur-md transition hover:bg-[#2563eb] hover:text-white"
                        aria-label="Close popup"
                      >
                        <FiX className="text-base" />
                      </button>

                      <span className="absolute left-3 top-3 max-w-[132px] truncate rounded-full bg-white/95 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm backdrop-blur-md">
                        {activePopup.category || "Place"}
                      </span>

                      <button
                        type="button"
                        onClick={() => setShowStreetView(true)}
                        className="absolute bottom-3 right-3 z-20 inline-flex max-w-[96px] items-center justify-center gap-1 rounded-full border border-white/80 bg-white/95 px-2.5 py-1.5 text-[10px] font-bold text-[#2563eb] shadow-md backdrop-blur-md transition hover:bg-[#2563eb] hover:text-white sm:max-w-[112px] sm:px-3"
                      >
                        <FiNavigation className="shrink-0 text-xs" />
                        <span className="whitespace-nowrap">360° View</span>
                      </button>
                    </div>
                  ) : (
                    <div className="relative h-[145px] overflow-hidden rounded-[22px] border border-blue-100 shadow-inner sm:h-[170px] lg:h-[180px]">
                      <CustomStreetView
                        lat={activePopup.coordinates.lat}
                        lng={activePopup.coordinates.lng}
                      />

                      <button
                        type="button"
                        onClick={() => {
                          if (onSpotClick) onSpotClick(null);
                          else setActivePopup(null);
                        }}
                        className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-white/80 bg-white/95 text-[#2563eb] shadow-sm backdrop-blur-md transition hover:bg-[#2563eb] hover:text-white"
                        aria-label="Close popup"
                      >
                        <FiX className="text-base" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowStreetView(false)}
                        className="absolute left-3 top-3 z-20 rounded-full bg-white/90 p-1.5 text-gray-800 shadow-md backdrop-blur-md transition hover:bg-white"
                      >
                        <FiChevronRight className="rotate-180 text-sm" />
                      </button>
                    </div>
                  )}

                  <div className="px-2 pb-2 pt-4">
                    <h4 className="line-clamp-2 text-[14px] font-bold leading-snug text-[#2563eb] sm:text-[15px]">
                      {getTitle(activePopup)}
                    </h4>

                    <div className="mt-2 flex items-start gap-2 text-xs font-medium leading-relaxed text-gray-500">
                      <FiMapPin className="mt-0.5 shrink-0 text-[#2563eb]" />
                      <span className="line-clamp-2">
                        {getLocation(activePopup)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(/destination/${activePopup.id})}
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563eb] px-4 py-2.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md sm:text-xs"
                    >
                      Explore place <FiChevronRight />
                    </button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>

          <button
            onClick={handleFindMyLocation}
            disabled={isLocating}
            className="absolute left-4 top-4 z-10 flex items-center justify-center gap-1.5 rounded-full border border-blue-100 bg-white/95 px-3.5 py-2 text-xs font-bold text-gray-700 shadow-[0_8px_20px_rgba(37,99,235,0.12)] backdrop-blur-md transition hover:border-[#2563eb] hover:text-[#2563eb] active:scale-95 disabled:opacity-70 sm:left-6 sm:top-auto sm:bottom-6 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
          >
            {isLocating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2563eb] border-t-transparent" />
            ) : (
              <FiNavigation className="text-sm text-[#2563eb] sm:text-lg" />
            )}

            <span className="hidden sm:inline">
              {isLocating ? "Locating..." : "Find My Location"}
            </span>

            <span className="sm:hidden">
              {isLocating ? "Locating..." : "Locate"}
            </span>
          </button>
        </APIProvider>
      </div>
    </>
  );
}