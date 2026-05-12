// MapSetup.js
export const getIconUrl = (category) => {
  if (category === "Destination") return "src/assets/marker-red.png";
  if (category === "Landmark") return "src/assets/marker-blue.png";
  if (category === "Establishment") return "src/assets/marker-gold.png";
  if (category === "Cultural Heritage Site") return "src/assets/marker-green.png";
  return "src/assets/marker-red.png"; // Default
};