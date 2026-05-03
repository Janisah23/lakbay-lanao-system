import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { redIcon, blueIcon, goldIcon, greenIcon } from "./MapSetup";
import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useNavigate } from "react-router-dom";

const center = [7.8731, 124.2863];

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

  return (
    <MapContainer
      center={center}
      zoom={10}
      minZoom={8}
      maxZoom={17}
      zoomControl={false}
      className="h-[680px] w-full"
    >
      <FixMapSize />

      <TileLayer
        attribution="© OpenStreetMap contributors © CARTO"
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
          <Popup closeButton={true} minWidth={230}>
            <div className="w-[230px]">
              <img
                src={spot.imageURL || "/default.jpg"}
                alt={spot.name}
                className="mb-4 h-[120px] w-full rounded-lg object-cover"
              />

              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                {spot.category}
              </span>

              <h4 className="mt-1.5 text-sm font-bold leading-tight text-blue-600">
                {spot.name}
              </h4>

              <p className="mt-0.5 text-xs text-gray-400">
                {spot.location?.municipality}, {spot.location?.province}
              </p>

              <button
                onClick={() => navigate(`/destination/${spot.id}`)}
                className="mt-3 w-full rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
              >
                Explore →
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default LanaoMap;