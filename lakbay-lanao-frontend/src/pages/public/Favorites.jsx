import { db, auth } from "../../firebase/config";
import { doc, deleteDoc } from "firebase/firestore";
import { useFavorites } from "../../components/context/FavoritesContext";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { FaHeart } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Favorites() {
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const [removingId, setRemovingId] = useState(null);

  // Determine active tab. Default to "All"
  const [activeTab, setActiveTab] = useState("All");

  const removeFavorite = async (id) => {
    setRemovingId(id);

    setTimeout(async () => {
      const user = auth.currentUser;
      if (!user) return;

      await deleteDoc(doc(db, "users", user.uid, "favorites", id));
      setRemovingId(null);
    }, 300);
  };

  // Dynamic Tabs generation: Combine a base list with actual categories from favorites
  const baseCategories = ["All", "Events", "Destinations", "Articles", "Highlights"];
  
  // Extract unique categories from actual favorites
  const favoriteCategories = favorites.map(item => item.category).filter(Boolean);
  const uniqueCategories = [...new Set([...baseCategories, ...favoriteCategories])];


  // Filter favorites based on the active tab
  const filteredFavorites = activeTab === "All" 
    ? favorites 
    : favorites.filter(item => item.category === activeTab);


  return (
    <div className="font-sans text-gray-900 bg-white min-h-screen">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative w-full h-[300px] md:h-[400px] overflow-hidden flex items-end pb-12 px-8 md:px-16">
        <img 
          src="https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?q=80&w=2070&auto=format&fit=crop" 
          alt="Favorites Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="relative z-10 max-w-[1300px] w-full mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-md">
            My Favorites
          </h1>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <section className="py-16 px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto">
        
        {/* INSTRUCTIONS HEADER */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Check Favorites
          </h2>
          <p className="text-gray-600 mb-3 text-sm md:text-base">
            On My Favorites list, you can view travel information you saved according to the category in Lanao del Sur.
          </p>
          <p className="text-gray-400 text-xs md:text-sm flex items-start gap-1">
            <span className="text-blue-500 font-bold mt-0.5">※</span> 
            <span>
              If you delete stored cookies on your browser, all saved information will be erased. <br className="hidden md:block" />
              Cookie expiration lasts for one year and upon the passing of one year all Favorites history will be erased.
            </span>
          </p>
        </div>

        {/* TABS NAVIGATION */}
        <div className="border-b border-gray-200 mb-8 overflow-x-auto scrollbar-hide">
          <div className="flex w-max min-w-full justify-between sm:justify-start sm:gap-12 px-2">
            {uniqueCategories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === category
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENT GRID OR EMPTY STATE */}
        {filteredFavorites.length === 0 ? (
          
          /* EMPTY STATE (Matches screenshot design) */
          <div className="bg-[#E6F3FB] rounded-sm py-24 flex flex-col items-center justify-center text-center px-4">
            <div className="bg-[#0070B8] rounded-full p-4 mb-4">
              <FiHeart className="text-white text-3xl" />
              <div className="absolute w-[2px] h-8 bg-white rotate-45 transform -translate-x-3 -translate-y-6"></div>
            </div>
            <p className="text-[#0070B8] font-medium">
              There are currently no selections in your My Favorites list.
            </p>
          </div>

        ) : (

          /* FAVORITES GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredFavorites.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/event/${item.id}`)}
                className={`group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col
                  ${removingId === item.id ? "opacity-0 scale-95" : "opacity-100 scale-100"}
                `}
              >
                {/* IMAGE */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <img
                    src={item.imageURL || "/default-event.jpg"}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* REMOVE BUTTON */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevents navigation
                      removeFavorite(item.id);
                    }}
                    className="absolute top-3 right-3 bg-white/95 p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors z-10"
                    title="Remove from favorites"
                  >
                    <FaHeart className="text-blue-600 text-[15px] hover:text-red-500 transition-colors" />
                  </button>
                </div>

                {/* TEXT CONTENT */}
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2 inline-block bg-blue-50 border border-blue-100 px-2 py-1 rounded-md self-start">
                    {item.category || "General"}
                  </span>
                  
                  <h3 className="font-semibold text-[15px] text-gray-900 leading-snug group-hover:text-blue-800 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  
                  {item.eventDate && (
                    <div className="mt-auto pt-4 flex items-center text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <span>
                        {new Date(item.eventDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </section>

      <Footer />
    </div>
  );
}

export default Favorites;