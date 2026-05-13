import markerRed from "../../assets/marker-red.png";
import markerBlue from "../../assets/marker-blue.png";
import markerGold from "../../assets/marker-gold.png";
import markerGreen from "../../assets/marker-green.png";

export const getIconUrl = (category) => {
  if (category === "Destination") return markerRed;
  if (category === "Landmark") return markerBlue;
  if (category === "Establishment") return markerGold;
  if (category === "Cultural Heritage Site") return markerGreen;
  
  return markerRed; 
};