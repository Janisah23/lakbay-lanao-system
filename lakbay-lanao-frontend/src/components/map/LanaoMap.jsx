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
const defaultZoom = 10;
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1506744626753-1fa44f22908f?w=800&q=80";

// 1. MAP CHILD: Flies to a selected tourist destination
function FlyToSpot({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (map && lat && lng) {
      map.panTo({ lat, lng });
      map.setZoom(15);
    }
  }, [lat, lng, map]); 
  return null;
}

// 2. MAP CHILD: Flies to the user's GPS location
function FlyToLocation({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (map && lat && lng) {
      map.panTo({ lat, lng });
      map.setZoom(14);
    }
  }, [lat, lng, map]); 
  return null;
}

// 3. MAP CHILD: Resets the map to the default full view
function FlyToDefault({ trigger }) {
  const map = useMap();
  useEffect(() => {
    if (map && trigger > 0) {
      map.panTo(defaultCenter);
      map.setZoom(defaultZoom);
    }
  }, [trigger, map]);
  return null;
}

// 4. MAP CHILD: Handles all Markers and Clustering safely
function ClusteredMarkers({ spots, onMarkerClick }) {
  const map = useMap();
  const clusterer = useRef(null);
  const markersRef = useRef({}); 

  // Initialize Clusterer
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
          position={{ lat: spot.coordinates.lat, lng: spot.coordinates.lng }}
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

// 5. Custom Component to render the 360 Panorama natively and safely
function CustomStreetView({ lat, lng }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && window.google) {
      new window.google.maps.StreetViewPanorama(containerRef.current, {
        position: { lat, lng },
        disableDefaultUI: true, 
        visible: true,
      });
    }
  }, [lat, lng]); 

  return <div ref={containerRef} className="h-full w-full" />;
}

// 6. MAIN WRAPPER
export default function LanaoMap({ selectedSpot, onSpotClick }) {
  const [spots, setSpots] = useState([]);
  const [activePopup, setActivePopup] = useState(null);
  const [showStreetView, setShowStreetView] = useState(false);
  
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0); 
  
  const previousPopup = useRef(null); // Keeps track of what was open
  const navigate = useNavigate();

  // Reset street view when a new popup opens
  useEffect(() => {
    if (activePopup) setShowStreetView(false);
  }, [activePopup]);

  // Fetch data
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tourismData"), (snapshot) => {
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((item) => item.status !== "archived" && item.coordinates?.lat && item.coordinates?.lng);
      setSpots(data);
    });
    return () => unsubscribe();
  }, []);

  // Sync external selection from sidebar Map.jsx
  useEffect(() => {
    if (selectedSpot !== undefined) {
      setActivePopup(selectedSpot);
    }
  }, [selectedSpot]);

  // SMART ZOOM OUT: Watch activePopup and trigger reset if it becomes null
  useEffect(() => {
    if (previousPopup.current !== null && activePopup === null) {
      // If we had a popup open and now we don't, trigger zoom out!
      setResetTrigger(prev => prev + 1);
    }
    previousPopup.current = activePopup;
  }, [activePopup]);

  // Handle Marker Toggle Logic
  const handleMarkerClick = (spot) => {
    if (activePopup && activePopup.id === spot.id) {
      // Deselect (clicking the same active marker)
      if (onSpotClick) onSpotClick(null);
      else setActivePopup(null);
    } else {
      // Select
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
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsLocating(false);
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

      <div className="relative h-full min-h-[400px] lg:h-[680px] w-full overflow-hidden rounded-[20px] sm:rounded-[28px] shadow-sm">
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
          >
            {activePopup && <FlyToSpot lat={activePopup.coordinates.lat} lng={activePopup.coordinates.lng} />}
            {userLocation && <FlyToLocation lat={userLocation.lat} lng={userLocation.lng} />}
            <FlyToDefault trigger={resetTrigger} />
            
            <ClusteredMarkers 
              spots={spots} 
              onMarkerClick={handleMarkerClick} 
            />

            {userLocation && (
              <InfoWindow position={userLocation} headerDisabled={true} style={{ background: 'transparent', boxShadow: 'none' }}>
                <div className="user-location-dot" title="You are here" />
              </InfoWindow>
            )}

            {activePopup && (
              <InfoWindow
                position={{ lat: activePopup.coordinates.lat, lng: activePopup.coordinates.lng }}
                onCloseClick={handleCloseClick}
                pixelOffset={[0, -40]}
              >
                <div className="w-[260px] sm:w-[280px] rounded-[28px] p-2.5 text-gray-900">
                  {!showStreetView ? (
                    <div className="relative h-[150px] overflow-hidden rounded-[22px] border border-white/70 bg-blue-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.06)]">
                      <img src={activePopup.imageURL || FALLBACK_IMAGE} alt={getTitle(activePopup)} className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.015]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-white/5 to-white/10" />
                      <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/20 to-transparent" />
                      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm backdrop-blur-md">
                        {activePopup.category || "Place"}
                      </span>
                      <button onClick={() => setShowStreetView(true)} className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold text-[#2563eb] shadow-md backdrop-blur-md transition hover:bg-white">
                        <FiNavigation className="text-xs" /> 360° View
                      </button>
                    </div>
                  ) : (
                    <div className="relative h-[150px] overflow-hidden rounded-[22px] border border-blue-100 shadow-inner">
                      <CustomStreetView lat={activePopup.coordinates.lat} lng={activePopup.coordinates.lng} />
                      <button onClick={() => setShowStreetView(false)} className="absolute right-3 top-3 z-[10] rounded-full bg-white/90 p-1.5 text-gray-800 shadow-md backdrop-blur-md transition hover:bg-white">
                        <FiChevronRight className="rotate-180 text-sm" />
                      </button>
                    </div>
                  )}

                  <div className="px-2 pb-2 pt-4">
                    <h4 className="line-clamp-2 text-[14px] sm:text-[15px] font-bold leading-snug text-[#2563eb]">{getTitle(activePopup)}</h4>
                    <div className="mt-2 flex items-start gap-2 text-xs font-medium leading-relaxed text-gray-500">
                      <FiMapPin className="mt-0.5 shrink-0 text-[#2563eb]" />
                      <span className="line-clamp-2">{getLocation(activePopup)}</span>
                    </div>
                    <button type="button" onClick={() => navigate(`/destination/${activePopup.id}`)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2563eb] px-4 py-2.5 text-[11px] sm:text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md">
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
            className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 z-10 flex items-center justify-center gap-2 rounded-full border border-blue-100 bg-white px-4 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-sm font-bold text-gray-700 shadow-[0_8px_20px_rgba(37,99,235,0.12)] transition hover:border-[#2563eb] hover:text-[#2563eb] active:scale-95 disabled:opacity-70"
          >
            {isLocating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2563eb] border-t-transparent" /> : <FiNavigation className="text-sm sm:text-lg text-[#2563eb]" />}
            {isLocating ? "Locating..." : "Find My Location"}
          </button>
        </APIProvider>
      </div>
    </>
  );
}