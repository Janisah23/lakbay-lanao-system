import React, { useEffect, useState, useRef, useCallback } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import { FiMapPin, FiChevronRight, FiNavigation } from "react-icons/fi";
import { 
  APIProvider, 
  Map, 
  Marker, 
  InfoWindow, 
  useMap 
} from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { getIconUrl } from "./MapSetup";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const defaultCenter = { lat: 7.8731, lng: 124.2863 };

// 1. MapViewController: Handles zooming in to spots and resetting to the main map
function MapViewController({ spot }) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;

    if (spot?.coordinates?.lat && spot?.coordinates?.lng) {
      // Zoom in to the selected spot
      map.panTo({ lat: spot.coordinates.lat, lng: spot.coordinates.lng });
      map.setZoom(15);
    } else {
      // If deselected (null), zoom back out to full Lanao del Sur map
      map.panTo(defaultCenter);
      map.setZoom(10);
    }
  }, [spot, map]);

  return null;
}

// 2. Custom Street View Component for @vis.gl
function StreetView({ lat, lng }) {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (containerRef.current && window.google && window.google.maps) {
      new window.google.maps.StreetViewPanorama(containerRef.current, {
        position: { lat, lng },
        disableDefaultUI: true, // Hides full screen button/address inside the tiny popup
        zoomControl: false,
        panControl: true,
        visible: true
      });
    }
  }, [lat, lng]);

  return <div ref={containerRef} className="h-full w-full rounded-[22px] overflow-hidden" />;
}

export default function LanaoMap({ selectedSpot, onSpotClick }) {
  const [spots, setSpots] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  
  // States for Street View
  const [showStreetView, setShowStreetView] = useState(false);
  
  // States for Geolocation
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Refs for Clustering
  const [markers, setMarkers] = useState({});
  const clusterer = useRef(null);
  const map = useMap(); 
  
  const navigate = useNavigate();

  // Reset Street View state whenever a new popup opens
  useEffect(() => {
    if (activePopup) setShowStreetView(false);
  }, [activePopup]);

  // --- DATA FETCHING ---
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tourismData"), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((item) => item.status !== "archived" && item.coordinates?.lat && item.coordinates?.lng);
      setSpots(data);
    });
    return () => unsubscribe();
  }, []);

  // Update this useEffect so it clears the popup when null is passed
  useEffect(() => {
    setActivePopup(selectedSpot || null);
  }, [selectedSpot]);

  // --- MARKER CLUSTERING LOGIC ---
  const setMarkerRef = useCallback((marker, key) => {
    if (marker && markers[key]) return;
    if (!marker && !markers[key]) return;
    setMarkers((prev) => {
      if (marker) return { ...prev, [key]: marker };
      const newMarkers = { ...prev };
      delete newMarkers[key];
      return newMarkers;
    });
  }, [markers]);

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

  // --- GEOLOCATION LOGIC ---
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
        alert("Unable to retrieve your location. Please check your browser permissions.");
        setIsLocating(false);
      }
    );
  };

  const getTitle = (spot) => spot.name || spot.title || "Untitled Place";
  const getLocation = (spot) => {
    if (!spot.location) return "Lanao del Sur";
    if (typeof spot.location === "string") return spot.location;
    if (spot.location?.municipality && spot.location?.province) return `${spot.location.municipality}, ${spot.location.province}`;
    return spot.location?.municipality || "Lanao del Sur";
  };

  return (
    <>
      <style>{`
        .gm-style-iw-c {
          padding: 0 !important; border-radius: 28px !important; background: rgba(255, 255, 255, 0.88) !important;
          box-shadow: 0 18px 45px rgba(37, 99, 235, 0.16) !important; backdrop-filter: blur(18px) !important;
          -webkit-backdrop-filter: blur(18px) !important; border: 1px solid rgba(255, 255, 255, 0.85) !important;
        }
        .gm-style-iw-d { overflow: hidden !important; }
        .gm-ui-hover-effect {
          top: 10px !important; right: 10px !important; background: rgba(255, 255, 255, 0.92) !important;
          border-radius: 999px !important; box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08) !important;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(37, 99, 235, 0); }
          100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
        .user-location-dot {
          width: 16px; height: 16px; background-color: #2563eb; border-radius: 50%;
          border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); animation: pulse-ring 2s infinite;
        }
      `}</style>

      <div className="relative h-[680px] w-full overflow-hidden rounded-[28px] shadow-sm">
        
        <APIProvider apiKey={GOOGLE_MAPS_KEY}>
          <Map
            defaultCenter={defaultCenter}
            defaultZoom={10}
            minZoom={8}
            maxZoom={18}
            disableDefaultUI={true} 
            zoomControl={true}
            gestureHandling="greedy"
            clickableIcons={false} // Prevents default Google POIs from intercepting clicks
          >
            {/* The new MapViewController always renders and handles dynamic zoom/pan logic */}
            <MapViewController spot={selectedSpot} />

            {/* Render Clustered Tourism Markers */}
            {spots.map((spot) => (
              <Marker
                key={spot.id}
                ref={(marker) => setMarkerRef(marker, spot.id)}
                position={{ lat: spot.coordinates.lat, lng: spot.coordinates.lng }}
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

            {/* Render User's Current Location Dot */}
            {userLocation && (
              <InfoWindow
                position={userLocation}
                headerDisabled={true}
                style={{ background: 'transparent', boxShadow: 'none' }} 
              >
                <div className="user-location-dot" title="You are here" />
              </InfoWindow>
            )}

            {/* Render Custom Lakbay Lanao InfoWindow with Street View Toggle */}
            {activePopup && (
              <InfoWindow
                position={{ lat: activePopup.coordinates.lat, lng: activePopup.coordinates.lng }}
                onCloseClick={() => setActivePopup(null)}
                pixelOffset={[0, -40]}
              >
                <div className="w-[280px] rounded-[28px] p-2.5 text-gray-900">
                  
                  {!showStreetView ? (
                    // IMAGE VIEW
                    <div className="relative h-[150px] overflow-hidden rounded-[22px] border border-white/70 bg-blue-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.06)]">
                      <img 
                        src={activePopup.imageURL || "/default.jpg"} 
                        alt={getTitle(activePopup)} 
                        className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.015]" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-white/5 to-white/10" />
                      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/20 to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm backdrop-blur-md">
                        {activePopup.category || "Place"}
                      </span>

                      {/* 360 Toggle Button */}
                      <button 
                        onClick={() => setShowStreetView(true)}
                        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold text-[#2563eb] shadow-md backdrop-blur-md transition hover:bg-white"
                      >
                        <FiNavigation className="text-xs" /> 360° View
                      </button>
                    </div>
                  ) : (
                    // CUSTOM STREET VIEW PANORAMA
                    <div className="relative h-[150px] overflow-hidden rounded-[22px] border border-blue-100 shadow-inner">
                      <StreetView 
                        lat={activePopup.coordinates.lat} 
                        lng={activePopup.coordinates.lng} 
                      />
                      <button 
                        onClick={() => setShowStreetView(false)}
                        className="absolute right-3 top-3 z-[10] rounded-full bg-white/90 p-1.5 text-gray-800 shadow-md backdrop-blur-md transition hover:bg-white"
                      >
                        <FiChevronRight className="rotate-180 text-sm" />
                      </button>
                    </div>
                  )}

                  <div className="px-2 pb-2 pt-4">
                    <h4 className="line-clamp-2 text-[15px] font-bold leading-snug text-[#2563eb]">{getTitle(activePopup)}</h4>
                    <div className="mt-2 flex items-start gap-2 text-xs font-medium leading-relaxed text-gray-500">
                      <FiMapPin className="mt-0.5 shrink-0 text-[#2563eb]" />
                      <span className="line-clamp-2">{getLocation(activePopup)}</span>
                    </div>
                    <button type="button" onClick={() => navigate(`/destination/${activePopup.id}`)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563eb] px-4 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md">
                      Explore place <FiChevronRight />
                    </button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>

          {/* FLOATING GEOLOCATION BUTTON */}
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