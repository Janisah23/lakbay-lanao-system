import { useEffect, useState } from "react";
import { db, auth } from "../../firebase/config";
import { collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import { FaHeart } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import { useFavorites } from "../../components/context/FavoritesContext";


function Destinations() {
  const [data, setData] = useState([]);

  const categories = ["All", "Beach", "Mountain", "Waterfall", "Island"];
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();

const { favorites } = useFavorites();
const [showHeart, setShowHeart] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      const snap = await getDocs(collection(db, "tourismData"));

      const items = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setData(items);
    } catch (error) {
      console.error("Error fetching destinations:", error);
    }
  };

  fetchData();
}, []);

const filteredData = activeCategory === "All"
  ? data
  : data.filter(item =>
      item.type?.toLowerCase() === activeCategory.toLowerCase()
    );
  
// Firebase Toggle Favorite function
  const handleToggleFavorite = async (e, item) => {
    e.stopPropagation(); // Prevents navigating to the details page

    const user = auth.currentUser;
    if (!user) {
      console.log("No user logged in");
      // Optional: alert("Please log in to save favorites");
      return;
    }

    const favRef = doc(db, "users", user.uid, "favorites", String(item.id));
    const isFavorited = favorites.some(fav => String(fav.id) === String(item.id));

    try {
      if (isFavorited) {
        // Remove from Firebase
        await deleteDoc(favRef);
      } else {
        // Add to Firebase
        await setDoc(favRef, item);
        
        // Trigger the popping animation
        setShowHeart(item.id);
        setTimeout(() => {
          setShowHeart(null);
        }, 400);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  return (
    <div className="font-sans text-gray-900 bg-white min-h-screen pb-20">
      <Navbar />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* BREADCRUMBS */}
        <div className="text-[10px] text-blue-900 mb-4 tracking-wide uppercase">
          <span className="cursor-pointer hover:underline">Visit Lanao</span>
          <span className="mx-2">{'>'}</span>
          <span className="cursor-pointer hover:underline">Things to do</span>
          <span className="mx-2">{'>'}</span>
          <span className="font-semibold text-gray-500">Sights & Attractions</span>
        </div>

        {/* HERO SECTION */}
        <div className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-lg">
          <img
            src="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2070&auto=format&fit=crop" 
            alt="Hero Background"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
          
          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Sights & <br /> Attractions
            </h1>
            <p className="mt-4 text-white/90 max-w-md text-sm md:text-base font-medium">
              Discover iconic landmarks and record-breaking attractions.
            </p>
          </div>
        </div>

        {/* HOTSPOTS / FILTERS SECTION */}
        <div className="mt-16 md:mt-24">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Lanao's tourist hotspots
          </h2>

          <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap px-4 py-2 text-xs font-semibold rounded-sm transition ${
                    activeCategory === category
                      ? "bg-gray-700 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Navigation Arrows */}
            <div className="flex gap-2 hidden md:flex">
              <button className="w-10 h-10 border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button className="w-10 h-10 border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          {/* DYNAMIC CARD GRID */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredData.map((item) => (
              <div
                key={item.id}
                onDoubleClick={(e) => handleToggleFavorite(e, item)}
                onClick={() => navigate(`/event/${item.id}`)}
                className="group cursor-pointer flex flex-col"
              >
                {/* Image Container with Dynamic Heart */}
                <div className="relative overflow-hidden bg-gray-100 aspect-[4/3] md:aspect-auto md:h-80 w-full rounded-md">
                  <img
                    src={item.imageURL || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop"}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-in-out"
                  />
                  
                  {/* Dynamic Heart Button */}
                  <button
                    onClick={(e) => handleToggleFavorite(e, item)}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-md z-10"
                  >
                    {favorites.some(fav => String(fav.id) === String(item.id)) ? (
                      <FaHeart className="text-blue-600 text-2xl" />
                    ) : (
                      <FiHeart className="text-gray-400 text-2xl hover:text-blue-400 transition" />
                    )}
                  </button>

                  {/* Popping Animation */}
                  {showHeart === item.id && (
                    <FaHeart className="absolute inset-0 m-auto text-blue-600 text-6xl animate-[pop_0.4s_ease] z-20 pointer-events-none" />
                  )}
                </div>

                {/* Card Text Content */}
                <div className="pt-4">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {item.category || "General"}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {item.title}
                  </h3>
                </div>
              </div>
            ))}

            {filteredData.length === 0 && (
              <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-500 text-sm">No destinations found for the "{activeCategory}" category.</p>
              </div>
            )}
          </div>
        </div>

        {/* INTRO SECTION */}
        <div className="mt-24 pt-16 border-t border-gray-100 flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
              Find the best places to visit in Lanao
            </h2>
            <p className="mt-6 text-sm text-gray-600 leading-relaxed max-w-lg">
              Ready for an unforgettable time while sightseeing? Whether you want to treat the family to non-stop thrills at theme parks and waterparks, admire incomparable views from sky-high venues, spend a day in the desert or have a photo opportunity at top attractions in the sunshine, there's always something spectacular to discover in our city.
            </p>
            <button className="mt-8 border border-blue-900 text-blue-900 px-6 py-3 text-sm font-semibold hover:bg-blue-50 transition duration-200">
              Discover 99 things to do
            </button>
          </div>

          <div className="flex-1 relative h-[350px] w-full max-w-md hidden md:block">
            <img 
              src="https://images.unsplash.com/photo-1546412414-e1885259563a?q=80&w=1000&auto=format&fit=crop" 
              alt="Boat attraction" 
              className="absolute top-0 left-0 w-48 h-64 object-cover rounded-tl-3xl rounded-br-3xl shadow-lg z-10"
            />
            <img 
              src="https://images.unsplash.com/photo-1582672060624-ac925d1560f8?q=80&w=1000&auto=format&fit=crop" 
              alt="Modern Architecture" 
              className="absolute bottom-0 right-0 w-64 h-72 object-cover rounded-tl-[4rem] shadow-xl"
            />
          </div>
        </div>

      </main>
    </div>
  );
}

export default Destinations;