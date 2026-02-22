import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";


delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow
});

// Custom icons
const redIcon = new L.Icon({
  iconUrl: "/marker-red.png",
  iconSize: [35, 45],
  iconAnchor: [17, 45],
  popupAnchor: [0, -40]
});

const blueIcon = new L.Icon({
  iconUrl: "/marker-blue.png",
  iconSize: [35, 45],
  iconAnchor: [17, 45],
  popupAnchor: [0, -40]
});

const goldIcon = new L.Icon({
  iconUrl: "/marker-gold.png",
  iconSize: [35, 45],
  iconAnchor: [17, 45],
  popupAnchor: [0, -40]
});

export { redIcon, blueIcon, goldIcon };