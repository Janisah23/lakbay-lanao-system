import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { redIcon, blueIcon, goldIcon } from "./MapSetup";

const center = [7.8731, 124.2863];

function LanaoMap() {
  const spots = [
    {
      name: "Misty Cottage",
      type: "establishment",
      position: [7.9205964082159745, 124.17248613682362],
      image: "/misty-cottage.jpg"
    },
    {
      name: "Mt. Matampor",
      type: "destination",
      position: [7.908593, 124.140617],
      image: "/mt-matampor.jpg"
    }
  ];

  return (
    <MapContainer
      center={center}
      zoom={10}
      minZoom={8}
      maxZoom={17}
      style={{ height: "600px", width: "100%" }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {spots.map((spot, index) => {
        let icon;

        if (spot.type === "destination") icon = redIcon;
        else if (spot.type === "event") icon = blueIcon;
        else if (spot.type === "establishment") icon = goldIcon;

        return (
          <Marker key={index} position={spot.position} icon={icon}>
            <Popup closeButton={false}>
              <div className="custom-popup">
                <img src={spot.image} alt={spot.name} />
                <h4>{spot.name}</h4>
                <span>{spot.type}</span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

export default LanaoMap;