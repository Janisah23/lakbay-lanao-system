import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
import { FiSearch, FiHeart, FiMap, FiLogOut } from "react-icons/fi";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showExplore, setShowExplore] = useState(false);
  const [eventsData, setEventsData] = useState([]);
  const [openMenu, setOpenMenu] = useState(false);
  
  // State for scroll effect
  const [isScrolled, setIsScrolled] = useState(false);

  const recentEvents = eventsData
    .filter(item => item.contentType === "Event") 
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)) 
    .slice(0, 4); 

  const filteredResults = eventsData.filter((item) => {
    const matchSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter = activeFilter === "all" || item.contentType?.toLowerCase() === activeFilter.toLowerCase();
    return matchSearch && matchFilter;
  });

  // Handle outside click for avatar menu
  useEffect(() => {
    const handleClickOutside = () => setOpenMenu(false);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Handle scroll for professional sticky navbar effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch data
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "tourismContent"),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEventsData(data);
      }
    );
    return () => unsubscribe();
  }, []);

  // Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Lock body scroll when search is open
  useEffect(() => {
    if (showSearch) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [showSearch]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // Reusable professional hover class for Nav Links (Glow + Underline)
  const navLinkClass = "relative cursor-pointer py-1 text-gray-700 font-semibold transition-all duration-300 hover:text-blue-600 hover:drop-shadow-[0_0_10px_rgba(37,99,235,0.4)] after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-600 after:transition-all hover:after:w-full";

  return (
    <>
      {/* NAVBAR */}
      <nav
        className={`fixed top-0 left-0 w-full z-[1000] flex justify-center transition-all duration-300 ${
          isScrolled ? "pt-2 md:pt-4" : "pt-4 md:pt-6"
        }`}
      >
        <div 
          className={`w-[95%] max-w-7xl bg-white/95 backdrop-blur-md border border-gray-200 rounded-full flex items-center justify-between transition-all duration-300 ${
            isScrolled ? "shadow-lg py-2.5 px-6 md:px-8" : "shadow-md py-3 px-6 md:px-10"
          }`}
        >

          {/* LEFT LOGO */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/pto.png"
              alt="logo"
              className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="font-bold text-blue-600 text-sm whitespace-nowrap tracking-tight">
              Provincial Tourism Office
            </span>
          </div>

          {/* CENTER NAVIGATION (Updated with Glowing Underline) */}
          <div className="hidden lg:flex items-center gap-8">
            <span
              onClick={() => navigate("/")}
              className={navLinkClass}
            >
              Home
            </span>

            {/* EXPLORE */}
            <div
              className={navLinkClass}
              onMouseEnter={() => {
                setShowExplore(true);
                setShowFeatures(false);
                setShowEvents(false);
              }}
            >
              <span>Discover</span>
            </div>

            {/* FEATURES */}
            <div
              className={navLinkClass}
              onMouseEnter={() => {
                setShowFeatures(true);
                setShowExplore(false);
                setShowEvents(false);
              }}
            >
              <span>Features</span>
            </div>

            {/* GALLERY */}
            <span
              onClick={() => navigate("/gallery")}
              className={navLinkClass}
            >
              Gallery
            </span>

            {/* EVENTS */}
            <div
              className={navLinkClass}
              onMouseEnter={() => {
                setShowEvents(true);
                setShowExplore(false);
                setShowFeatures(false);
              }}
            >
              <span>Events</span>
            </div>
          </div>

          {/* RIGHT SIDE (Search & Auth matching the image) */}
          <div className="flex items-center gap-2 md:gap-4">
            
            {/* SEARCH */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition px-3 py-2 rounded-full hover:bg-gray-50"
            >
              <FiSearch size={20} className="stroke-[2.5]" />
              <span className="text-sm font-semibold hidden sm:block">Search</span>
            </button>

            {!user ? (
              // NOT LOGGED IN
              <button
                onClick={() => navigate("/login")}
                className="border-[1.5px] border-blue-600 text-blue-700 px-6 py-2 rounded-full text-sm font-bold hover:bg-blue-50 transition shadow-sm whitespace-nowrap"
              >
                Sign In
              </button>

            ) : (
              // LOGGED IN AVATAR
              <div className="relative">
                <img
                  src={user.photoURL || "/default-avatar.png"}
                  alt="profile"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu(!openMenu);
                  }}
                  className="w-10 h-10 rounded-full cursor-pointer border-2 border-transparent hover:border-blue-600 transition-colors object-cover shadow-sm"
                />
                
                {openMenu && (
                  <div className="absolute right-0 mt-4 w-52 bg-white rounded-2xl shadow-xl py-2 z-50 border border-gray-100 animate-dropdown">
                    <button
                      onClick={() => {
                        navigate("/favorites");
                        setOpenMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      <FiHeart className="text-blue-600 text-lg" />
                      Top Picks
                    </button>

                    <button
                      onClick={() => {
                        navigate("/itinerary");
                        setOpenMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      <FiMap className="text-blue-600 text-lg" />
                      Itineraries
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={() => {
                        handleLogout();
                        setOpenMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition"
                    >
                      <FiLogOut className="text-red-500 text-lg" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* SEARCH MODAL */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1100] flex justify-center items-start pt-28 animate-fadeIn">
          <div className="bg-white w-[95%] max-w-2xl rounded-3xl shadow-2xl p-8 border border-gray-100">
            
            {/* SEARCH INPUT */}
            <div className="flex items-center gap-3 border-2 border-blue-100 focus-within:border-blue-500 rounded-full px-5 py-3.5 shadow-sm transition-colors">
              <FiSearch className="text-blue-500 text-xl"/>
              <input
                type="text"
                placeholder="Search destinations, events, establishments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none text-base font-medium text-gray-800 placeholder-gray-400 bg-transparent"
                autoFocus
              />
              <button
                onClick={() => setShowSearch(false)}
                className="text-gray-400 hover:text-red-500 text-lg font-bold bg-gray-50 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* FILTERS */}
            <div className="flex gap-2 mt-6 flex-wrap">
              {[
                { label: "All", value: "all" },
                { label: "Destination", value: "destination" },
                { label: "Event", value: "event" },
                { label: "Establishment", value: "establishment" },
                { label: "Cultural & Heritage", value: "culturalheritage" },
                { label: "Landmarks", value: "landmark" }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition
                    ${activeFilter === filter.value
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* RESULTS */}
            <div className="space-y-2 mt-8 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {searchTerm === "" && (
                <div className="text-center py-10">
                  <p className="text-gray-400 font-medium">Start typing to search Lanao del Sur</p>
                </div>
              )}

              {searchTerm !== "" && filteredResults.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-gray-400 font-medium">No results found for "{searchTerm}"</p>
                </div>
              )}

              {filteredResults.map((item, index) => (
                <div
                  key={index}
                  onClick={() => {
                    navigate(`/${item.contentType?.toLowerCase() || 'event'}/${item.id}`);
                    setShowSearch(false);
                  }}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition cursor-pointer"
                >
                  <img
                    src={item.imageURL || "/default-image.png"}
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded-xl shadow-sm"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">
                      {item.contentType || "General"}
                    </span>
                    <h3 className="font-bold text-gray-900 mt-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                      {item.summary || "No description available."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- DROPDOWN PANELS (Original Design, Fixed Positioning) --- */}

      {/* EXPLORE PANEL */}
      {showExplore && (
        <div
          className="fixed top-[90px] left-0 w-full z-[990] flex justify-center animate-fadeIn"
          onMouseLeave={() => setShowExplore(false)}
        >
          <div className="w-[95%] max-w-7xl bg-white shadow-xl border border-gray-100 rounded-2xl p-8 grid grid-cols-2 gap-8">
            <div className="grid grid-cols-2 gap-6">
              <div
                onClick={() => {
                  navigate("/destinations");
                  setShowExplore(false);
                }}
                className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
              >
                <h4 className="font-semibold text-blue-600">Destinations</h4>
                <p className="text-sm text-gray-500">Tourist spots</p>
              </div>
              <div
                onClick={() => {
                  navigate("/cultural");
                  setShowExplore(false);
                }}
                className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
              >
                <h4 className="font-semibold text-blue-600">Cultural & Heritage</h4>
                <p className="text-sm text-gray-500">Traditions & culture</p>
              </div>
              <div
                onClick={() => {
                  navigate("/establishment");
                  setShowExplore(false);
                }}
                className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
              >
                <h4 className="font-semibold text-blue-600">Establishments</h4>
                <p className="text-sm text-gray-500">Hotels & restaurants</p>
              </div>
              <div
                onClick={() => {
                  navigate("/landmarks");
                  setShowExplore(false);
                }}
                className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
              >
                <h4 className="font-semibold text-blue-600">Landmarks</h4>
                <p className="text-sm text-gray-500">Famous places</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <img src="/explore-preview.png" className="w-60 h-24 object-cover rounded-xl shadow" alt="Explore Preview" />
              <span className="text-sm text-gray-500 mt-4">Explore Lanao</span>
            </div>
          </div>
        </div>
      )}

      {/* FEATURES PANEL */}
      {showFeatures && (
        <div
          className="fixed top-[90px] left-0 w-full z-[990] flex justify-center animate-fadeIn"
          onMouseLeave={() => setShowFeatures(false)}
        >
          <div className="w-[95%] max-w-7xl bg-white shadow-xl border border-gray-100 rounded-2xl p-8 grid grid-cols-2 gap-8">
            <div className="grid grid-cols-2 gap-6">
              <div
                onClick={() => {
                  navigate("/map");
                  setShowFeatures(false);
                }}
                className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
              >
                <h4 className="font-semibold text-blue-600">Interactive Map</h4>
                <p className="text-sm text-gray-500">Explore destinations visually</p>
              </div>
              <div
                onClick={() => {
                  if (!user) {
                    navigate("/login");
                  } else {
                    navigate("/chatbot");
                  }
                  setShowFeatures(false);
                }}
                className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
              >
                <h4 className="font-semibold text-blue-600">AI Chatbot</h4>
                <p className="text-sm text-gray-500">Instant travel assistance</p>
              </div>
              <div
                onClick={() => {
                  if (!user) {
                    navigate("/login");
                  } else {
                    navigate("/itinerary");
                  }
                  setShowFeatures(false);
                }}
                className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
              >
                <h4 className="font-semibold text-blue-600">Itinerary Builder</h4>
                <p className="text-sm text-gray-500">Plan your trip smartly</p>
              </div>
              <div
                onClick={() => {
                  navigate("/events");
                  setShowFeatures(false);
                }}
                className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
              >
                <h4 className="font-semibold text-blue-600">Events Calendar</h4>
                <p className="text-sm text-gray-500">Stay updated with festivals</p>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <img src="/feature-preview.png" className="w-64 rounded-xl shadow" alt="Features Preview" />
              <span className="text-sm text-gray-500 mt-4">Explore smarter with Lakbay Lanao</span>
            </div>
          </div>
        </div>
      )}

      {/* EVENTS PANEL */}
      {showEvents && (
        <div
          className="fixed top-[90px] left-0 w-full z-[990] flex justify-center animate-fadeIn"
          onMouseLeave={() => setShowEvents(false)}
        >
          <div className="w-[95%] max-w-7xl bg-white shadow-xl border border-gray-100 rounded-2xl p-8 grid grid-cols-2 gap-8">
            <div className="grid grid-cols-2 gap-6">
              {recentEvents.length === 0 ? (
                <p className="text-gray-400 text-sm">No events available</p>
              ) : (
                recentEvents.map((event) => (
                  <div 
                    key={event.id}
                    onClick={() => {
                      navigate(`/event/${event.id}`);
                      setShowEvents(false);
                    }}
                    className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
                  >
                    <h4 className="font-semibold text-blue-600 line-clamp-1">{event.title}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2">{event.summary || "No description"}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex flex-col items-center justify-center text-center">
              <img src="/event-preview.png" className="w-64 rounded-xl shadow" alt="Event Preview" />
              <span className="text-sm text-gray-500 mt-4">Discover recent events</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;