import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
import {
  FiSearch,
  FiHeart,
  FiMap,
  FiLogOut,
  FiMenu,
  FiX,
  FiMapPin,
  FiHome,
  FiLayers,
  FiMessageCircle,
  FiCalendar,
  FiCompass,
  FiBriefcase,
} from "react-icons/fi";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  // ─────────────────────────────────────
  // STATE
  // ─────────────────────────────────────
  const [user, setUser] = useState(null);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showExplore, setShowExplore] = useState(false);
  const [eventsData, setEventsData] = useState([]);
  const [searchItems, setSearchItems] = useState([]);
  const [openMenu, setOpenMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // ─────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────
  const normalize = (text = "") =>
    text.toString().toLowerCase().replaceAll(" ", "").replaceAll("&", "");

  const navLinkClass =
    "relative cursor-pointer py-1 text-gray-700 font-semibold transition-all duration-300 hover:text-blue-600 hover:drop-shadow-[0_0_10px_rgba(37,99,235,0.4)] after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-600 after:transition-all hover:after:w-full";

  const recentEvents = eventsData
    .filter((item) => item.contentType === "Event")
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 4);

  const filteredResults = searchItems.filter((item) => {
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      item.title?.toLowerCase().includes(term) ||
      item.summary?.toLowerCase().includes(term) ||
      item.searchType?.toLowerCase().includes(term);

    const matchesFilter =
      activeFilter === "all" ||
      normalize(item.searchType).includes(activeFilter);

    return matchesSearch && matchesFilter;
  });

  const closeSearch = () => {
    setShowSearch(false);
    setSearchTerm("");
    setActiveFilter("all");
  };

  const closePanels = () => {
    setShowMobileMenu(false);
    setShowExplore(false);
    setShowFeatures(false);
    setShowEvents(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const handleResultClick = (item) => {
    if (item.routeType === "place") {
      navigate(`/destination/${item.id}`);
    } else if (item.routeType === "article") {
      navigate(`/article/${item.id}`);
    } else if (item.routeType === "event") {
      navigate(`/event/${item.id}`);
    }

    closeSearch();
  };

  // ─────────────────────────────────────
  // CLOSE DROPDOWNS ON OUTSIDE CLICK
  // ─────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenu(false);
      setShowMobileMenu(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ─────────────────────────────────────
  // NAVBAR SCROLL EFFECT
  // ─────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ─────────────────────────────────────
  // FETCH TOURISM CONTENT + SEARCH ITEMS
  // ─────────────────────────────────────
  useEffect(() => {
    const unsubContent = onSnapshot(
      collection(db, "tourismContent"),
      (snapshot) => {
        const contentData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setEventsData(contentData);

        const searchableContent = contentData
          .filter(
            (item) =>
              item.status !== "archived" && item.contentType !== "Highlight"
          )
          .map((item) => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
            imageURL: item.imageURL,
            searchType: item.contentType || "Content",
            routeType: item.contentType?.toLowerCase() || "event",
          }));

        setSearchItems((prev) => {
          const placesOnly = prev.filter((item) => item.routeType === "place");
          return [...placesOnly, ...searchableContent];
        });
      }
    );

    const unsubTourismData = onSnapshot(
      collection(db, "tourismData"),
      (snapshot) => {
        const placesData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((item) => item.status !== "archived")
          .map((item) => ({
            id: item.id,
            title: item.name || item.title,
            summary:
              item.description ||
              `${item.location?.municipality || ""} ${
                item.location?.province || ""
              }`,
            imageURL: item.imageURL,
            searchType: item.category || "Destination",
            routeType: "place",
          }));

        setSearchItems((prev) => {
          const contentOnly = prev.filter((item) => item.routeType !== "place");
          return [...contentOnly, ...placesData];
        });
      }
    );

    return () => {
      unsubContent();
      unsubTourismData();
    };
  }, []);

  // ─────────────────────────────────────
  // AUTH STATE
  // ─────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // ─────────────────────────────────────
  // LOCK BODY WHEN SEARCH MODAL IS OPEN
  // ─────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = showSearch ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showSearch]);

  return (
    <>
      {/* ──────────────────────────────── */}
      {/* NAVBAR */}
      {/* ──────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 w-full z-[1000] flex justify-center transition-all duration-300 ${
          isScrolled ? "pt-2 md:pt-4" : "pt-4 md:pt-6"
        }`}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-[92%] max-w-7xl bg-white/95 backdrop-blur-md border border-gray-200 rounded-full flex items-center justify-between transition-all duration-300 ${
            isScrolled
              ? "shadow-lg py-2 px-4 md:py-2.5 md:px-8"
              : "shadow-md py-2.5 px-4 md:py-3 md:px-10"
          }`}
        >
          {/* BRAND / LOGO */}
          <div
            onClick={() => {
              navigate("/");
              closePanels();
            }}
            className="flex items-center gap-2 md:gap-3 cursor-pointer group min-w-0"
          >
            <img
              src="src/assets/pto.png"
              alt="logo"
              className="w-8 h-8 md:w-9 md:h-9 object-contain group-hover:scale-105 transition-transform flex-shrink-0"
            />

            <span className="hidden sm:block font-bold text-blue-600 text-xs md:text-sm whitespace-nowrap tracking-tight truncate">
              Provincial Tourism Office
            </span>
          </div>

          {/* DESKTOP MENU */}
          <div className="hidden lg:flex items-center gap-8">
            <span onClick={() => navigate("/")} className={navLinkClass}>
              Home
            </span>

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

            <span onClick={() => navigate("/gallery")} className={navLinkClass}>
              Gallery
            </span>

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

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-1.5 md:gap-4 flex-shrink-0">
            {/* MOBILE MENU BUTTON */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileMenu((prev) => !prev);
                setOpenMenu(false);
              }}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition"
              aria-label="Open menu"
            >
              {showMobileMenu ? <FiX size={21} /> : <FiMenu size={21} />}
            </button>

            {/* SEARCH BUTTON */}
            <button
              onClick={() => {
                setShowSearch(true);
                setShowMobileMenu(false);
              }}
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition px-2 md:px-3 py-2 rounded-full hover:bg-gray-50"
            >
              <FiSearch size={20} className="stroke-[2.5]" />
              <span className="text-sm font-semibold hidden md:block">
                Search
              </span>
            </button>

            {/* AUTH BUTTON / PROFILE MENU */}
            {!user ? (
              <button
                onClick={() => {
                  navigate("/login");
                  closePanels();
                }}
                className="border-[1.5px] border-blue-600 text-blue-700 px-4 md:px-6 py-2 rounded-full text-xs md:text-sm font-bold hover:bg-blue-50 transition shadow-sm whitespace-nowrap"
              >
                Sign In
              </button>
            ) : (
              <div className="relative">
                <img
                  src={user.photoURL || "/default-avatar.png"}
                  alt="profile"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu(!openMenu);
                    setShowMobileMenu(false);
                  }}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full cursor-pointer border-2 border-transparent hover:border-blue-600 transition-colors object-cover shadow-sm"
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

                    <div className="border-t border-gray-100 my-1" />

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

      {/* ──────────────────────────────── */}
      {/* MOBILE MENU */}
      {/* ──────────────────────────────── */}
      {showMobileMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed top-[82px] left-0 z-[999] flex w-full justify-center px-4 lg:hidden"
        >
          <div className="w-[92%] rounded-[24px] border border-gray-200 bg-white/95 p-4 shadow-xl backdrop-blur-md">
            <div className="grid gap-2">
              <button
                onClick={() => {
                  navigate("/");
                  setShowMobileMenu(false);
                }}
                className="rounded-[16px] px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition"
              >
                Home
              </button>

              <button
                onClick={() => {
                  navigate("/destinations");
                  setShowMobileMenu(false);
                }}
                className="rounded-[16px] px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition"
              >
                Discover
              </button>

              <button
                onClick={() => {
                  navigate("/map");
                  setShowMobileMenu(false);
                }}
                className="rounded-[16px] px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition"
              >
                Features
              </button>

              <button
                onClick={() => {
                  navigate("/gallery");
                  setShowMobileMenu(false);
                }}
                className="rounded-[16px] px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition"
              >
                Gallery
              </button>

              <button
                onClick={() => {
                  navigate("/events");
                  setShowMobileMenu(false);
                }}
                className="rounded-[16px] px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] transition"
              >
                Events
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────── */}
      {/* SEARCH MODAL */}
      {/* ──────────────────────────────── */}
      {showSearch && (
        <div className="fixed inset-0 z-[1100] flex items-start justify-center bg-black/35 px-4 pt-28 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl rounded-[32px] border border-gray-200 bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] p-4 shadow-xl md:p-6">
            <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-5 py-3.5 transition focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-100">
                <FiSearch className="text-[#2563eb] text-xl" />

                <input
                  type="text"
                  placeholder="Search destinations, events, establishments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400"
                  autoFocus
                />

                <button
                  onClick={closeSearch}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  ✕
                </button>
              </div>

              {/* SEARCH FILTERS */}
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  { label: "All", value: "all" },
                  { label: "Destination", value: "destination" },
                  { label: "Event", value: "event" },
                  { label: "Establishment", value: "establishment" },
                  {
                    label: "Cultural & Heritage",
                    value: "culturalheritagesite",
                  },
                  { label: "Landmark", value: "landmark" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      activeFilter === filter.value
                        ? "bg-[#2563eb] text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* SEARCH RESULTS */}
              <div className="mt-6 max-h-[420px] space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                {searchTerm === "" && (
                  <div className="rounded-[24px] bg-blue-50/60 py-14 text-center">
                    <p className="text-sm font-medium text-gray-400">
                      Start typing to search Lanao del Sur
                    </p>
                  </div>
                )}

                {searchTerm !== "" && filteredResults.length === 0 && (
                  <div className="rounded-[24px] bg-blue-50/60 py-14 text-center">
                    <p className="text-sm font-medium text-gray-400">
                      No results found for "{searchTerm}"
                    </p>
                  </div>
                )}

                {searchTerm !== "" &&
                  filteredResults.map((item) => (
                    <div
                      key={`${item.routeType}-${item.id}`}
                      onClick={() => handleResultClick(item)}
                      className="flex cursor-pointer items-center gap-4 rounded-[24px] border border-gray-100 bg-white p-3 transition hover:border-blue-100 hover:bg-blue-50/50"
                    >
                      <img
                        src={item.imageURL || "/default-image.png"}
                        alt={item.title}
                        className="h-20 w-20 rounded-[20px] object-cover bg-blue-50"
                      />

                      <div className="min-w-0">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                          {item.searchType || "General"}
                        </span>

                        <h3 className="mt-2 line-clamp-1 font-bold text-[#1e3a8a]">
                          {item.title}
                        </h3>

                        <p className="mt-1 line-clamp-1 text-sm text-gray-500">
                          {item.summary || "No description available."}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────── */}
      {/* DISCOVER PANEL */}
      {/* ──────────────────────────────── */}
      {showExplore && (
        <div
          className="hidden lg:flex fixed top-[90px] left-0 w-full z-[990] justify-center animate-fadeIn"
          onMouseLeave={() => setShowExplore(false)}
        >
          <div className="w-[95%] max-w-7xl bg-white shadow-xl border border-gray-100 rounded-2xl p-8 grid grid-cols-2 gap-8">
            <div className="grid grid-cols-2 gap-5">
              {/* Destinations */}
              <div
                onClick={() => {
                  navigate("/destinations");
                  setShowExplore(false);
                }}
                className="group flex items-start gap-4 cursor-pointer rounded-2xl p-4 transition hover:bg-blue-50"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] transition group-hover:bg-[#2563eb] group-hover:text-white">
                  <FiMapPin className="text-lg" />
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600">
                    Destinations
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">Tourist spots</p>
                </div>
              </div>

              {/* Cultural & Heritage */}
              <div
                onClick={() => {
                  navigate("/cultural");
                  setShowExplore(false);
                }}
                className="group flex items-start gap-4 cursor-pointer rounded-2xl p-4 transition hover:bg-blue-50"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] transition group-hover:bg-[#2563eb] group-hover:text-white">
                  <FiLayers className="text-lg" />
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600">
                    Cultural & Heritage
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Traditions & culture
                  </p>
                </div>
              </div>

              {/* Establishments */}
              <div
                onClick={() => {
                  navigate("/establishments");
                  setShowExplore(false);
                }}
                className="group flex items-start gap-4 cursor-pointer rounded-2xl p-4 transition hover:bg-blue-50"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] transition group-hover:bg-[#2563eb] group-hover:text-white">
                  <FiBriefcase className="text-lg" />
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600">
                    Establishments
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Hotels & restaurants
                  </p>
                </div>
              </div>

              {/* Landmarks */}
              <div
                onClick={() => {
                  navigate("/landmarks");
                  setShowExplore(false);
                }}
                className="group flex items-start gap-4 cursor-pointer rounded-2xl p-4 transition hover:bg-blue-50"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] transition group-hover:bg-[#2563eb] group-hover:text-white">
                  <FiHome className="text-lg" />
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600">Landmarks</h4>
                  <p className="mt-1 text-sm text-gray-500">Famous places</p>
                </div>
              </div>
            </div>

            {/* Discover Preview */}
            <div className="flex flex-col items-center justify-center text-center">
              <img
                src="src/assets/explore-preview.png"
                className="w-80 h-38 object-cover rounded-xl shadow"
                alt="Explore Preview"
              />
              <span className="text-sm text-gray-500 mt-">
                Explore Lanao
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────── */}
      {/* FEATURES PANEL */}
      {/* ──────────────────────────────── */}
      {showFeatures && (
        <div
          className="hidden lg:flex fixed top-[90px] left-0 w-full z-[990] justify-center animate-fadeIn"
          onMouseLeave={() => setShowFeatures(false)}
        >
          <div className="w-[95%] max-w-7xl bg-white shadow-xl border border-gray-100 rounded-2xl p-8 grid grid-cols-2 gap-8">
            <div className="grid grid-cols-2 gap-5">
              {/* Interactive Map */}
              <div
                onClick={() => {
                  navigate("/map");
                  setShowFeatures(false);
                }}
                className="group flex items-start gap-4 cursor-pointer rounded-2xl p-4 transition hover:bg-blue-50"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] transition group-hover:bg-[#2563eb] group-hover:text-white">
                  <FiMap className="text-lg" />
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600">
                    Interactive Map
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Explore destinations visually
                  </p>
                </div>
              </div>

              {/* AI Chatbot */}
              <div
                onClick={() => {
                  if (!user) {
                    navigate("/login");
                  } else {
                    window.dispatchEvent(new Event("open-tourism-chatbot"));
                  }

                  setShowFeatures(false);
                }}
                className="group flex items-start gap-4 cursor-pointer rounded-2xl p-4 transition hover:bg-blue-50"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] transition group-hover:bg-[#2563eb] group-hover:text-white">
                  <FiMessageCircle className="text-lg" />
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600">AI Chatbot</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Instant travel assistance
                  </p>
                </div>
              </div>

              {/* Itinerary Builder */}
              <div
                onClick={() => {
                  if (!user) navigate("/login");
                  else navigate("/itinerary");
                  setShowFeatures(false);
                }}
                className="group flex items-start gap-4 cursor-pointer rounded-2xl p-4 transition hover:bg-blue-50"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] transition group-hover:bg-[#2563eb] group-hover:text-white">
                  <FiCompass className="text-lg" />
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600">
                    Itinerary Builder
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Plan your trip smartly
                  </p>
                </div>
              </div>

              {/* Events Calendar */}
              <div
                onClick={() => {
                  navigate("/events");
                  setShowFeatures(false);
                }}
                className="group flex items-start gap-4 cursor-pointer rounded-2xl p-4 transition hover:bg-blue-50"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] transition group-hover:bg-[#2563eb] group-hover:text-white">
                  <FiCalendar className="text-lg" />
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600">
                    Events Calendar
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Stay updated with festivals
                  </p>
                </div>
              </div>
            </div>

            {/* Features Preview */}
            <div className="flex flex-col items-center justify-center text-center">
              <img
                src="src/assets/feature-preview.png"
                className="w-80 h-38 object-cover rounded-2xl shadow-md"
                alt="Features Preview"
              />
              <span className="text-sm text-gray-500 mt-4">
                Explore smarter with Lakbay Lanao
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────── */}
      {/* EVENTS PANEL */}
      {/* ──────────────────────────────── */}
      {showEvents && (
        <div
          className="hidden lg:flex fixed top-[90px] left-0 w-full z-[990] justify-center animate-fadeIn"
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
                    <h4 className="font-semibold text-blue-600 line-clamp-1">
                      {event.title}
                    </h4>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {event.summary || "No description"}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Events Preview */}
            <div className="flex flex-col items-center justify-center text-center">
              <img
                src="src/assets/event-preview.png"
                className="w-80 h-38 object-cover rounded-2xl shadow-md"
                alt="Event Preview"
              />
              <span className="text-sm text-gray-500 mt-4">
                Discover recent events
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;