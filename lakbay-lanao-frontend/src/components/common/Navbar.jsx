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

import ptoLogo from "../../assets/pto.png";
import explorePreview from "../../assets/explore-preview.png";
import featurePreview from "../../assets/feature-preview.png";

function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showExplore, setShowExplore] = useState(false);
  const [eventsData, setEventsData] = useState([]);
  const [searchItems, setSearchItems] = useState([]);
  const [openMenu, setOpenMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const normalize = (text = "") =>
    text.toString().toLowerCase().replaceAll(" ", "").replaceAll("&", "");

  const navLinkClass =
    "relative cursor-pointer py-1 text-gray-700 font-semibold transition-all duration-300 hover:text-blue-600 after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-600 after:transition-all hover:after:w-full";

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
      activeFilter === "all" || normalize(item.searchType).includes(activeFilter);

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

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenu(false);
      setShowMobileMenu(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.body.style.overflow = showSearch ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showSearch]);

  return (
    <>
      {/* NAVBAR */}
      <nav
        className={`fixed left-0 top-0 z-[1000] flex w-full justify-center transition-all duration-300 ${
          isScrolled ? "pt-2 md:pt-4" : "pt-4 md:pt-6"
        }`}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`flex w-[92%] max-w-7xl items-center justify-between rounded-full border border-blue-100 bg-white transition-all duration-300 ${
            isScrolled
              ? "px-4 py-2 shadow-[0_10px_30px_rgba(37,99,235,0.10)] md:px-8 md:py-2.5"
              : "px-4 py-2.5 shadow-[0_8px_24px_rgba(37,99,235,0.08)] md:px-10 md:py-3"
          }`}
        >
          {/* BRAND / LOGO */}
          <div
            onClick={() => {
              navigate("/");
              closePanels();
            }}
            className="group flex min-w-0 cursor-pointer items-center gap-2 md:gap-3"
          >
            <img
              src={ptoLogo}
              alt="logo"
              className="h-8 w-8 flex-shrink-0 object-contain transition-transform group-hover:scale-105 md:h-9 md:w-9"
            />

            <span className="hidden truncate whitespace-nowrap text-xs font-bold tracking-tight text-blue-600 sm:block md:text-sm">
              Provincial Tourism Office
            </span>
          </div>

          {/* DESKTOP MENU */}
          <div className="hidden items-center gap-8 lg:flex">
            <span onClick={() => navigate("/")} className={navLinkClass}>
              Home
            </span>

            <div
              className={navLinkClass}
              onMouseEnter={() => {
                setShowExplore(true);
                setShowFeatures(false);
              }}
            >
              <span>Discover</span>
            </div>

            <div
              className={navLinkClass}
              onMouseEnter={() => {
                setShowFeatures(true);
                setShowExplore(false);
              }}
            >
              <span>Features</span>
            </div>

            <span onClick={() => navigate("/gallery")} className={navLinkClass}>
              Gallery
            </span>

            <span
              onClick={() => {
                navigate("/events");
                setShowExplore(false);
                setShowFeatures(false);
              }}
              className={navLinkClass}
            >
              Events
            </span>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex flex-shrink-0 items-center gap-1.5 md:gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileMenu((prev) => !prev);
                setOpenMenu(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb] lg:hidden"
              aria-label="Open menu"
            >
              {showMobileMenu ? <FiX size={21} /> : <FiMenu size={21} />}
            </button>

            <button
              onClick={() => {
                setShowSearch(true);
                setShowMobileMenu(false);
              }}
              className="flex items-center gap-2 rounded-full px-2 py-2 text-gray-700 transition hover:bg-blue-50 hover:text-blue-600 md:px-3"
            >
              <FiSearch size={20} className="stroke-[2.5]" />
              <span className="hidden text-sm font-semibold md:block">
                Search
              </span>
            </button>

            {!user ? (
              <button
                onClick={() => {
                  navigate("/login");
                  closePanels();
                }}
                className="whitespace-nowrap rounded-full border-[1.5px] border-blue-600 px-4 py-2 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 md:px-6 md:text-sm"
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
                  className="h-9 w-9 cursor-pointer rounded-full border-2 border-transparent object-cover shadow-sm transition-colors hover:border-blue-600 md:h-10 md:w-10"
                />

                {openMenu && (
                  <div className="absolute right-0 z-50 mt-4 w-52 overflow-hidden rounded-[24px] border border-blue-100 bg-white py-2 shadow-[0_14px_35px_rgba(37,99,235,0.10)] animate-dropdown">
                    <button
                      onClick={() => {
                        navigate("/favorites");
                        setOpenMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb]"
                    >
                      <FiHeart className="text-lg text-blue-600" />
                      Top Picks
                    </button>

                    <button
                      onClick={() => {
                        navigate("/itinerary");
                        setOpenMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb]"
                    >
                      <FiMap className="text-lg text-blue-600" />
                      Itineraries
                    </button>

                    <div className="my-1 border-t border-blue-50" />

                    <button
                      onClick={() => {
                        handleLogout();
                        setOpenMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-5 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
                    >
                      <FiLogOut className="text-lg text-red-500" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {showMobileMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed left-0 top-[82px] z-[999] flex w-full justify-center px-4 lg:hidden"
        >
          <div className="w-[92%] rounded-[26px] border border-blue-100 bg-white p-4 shadow-[0_14px_35px_rgba(37,99,235,0.10)]">
            <div className="grid gap-2">
              <button
                onClick={() => {
                  navigate("/");
                  setShowMobileMenu(false);
                }}
                className="rounded-[16px] px-4 py-3 text-left text-sm font-semibold text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb]"
              >
                Home
              </button>

              <button
                onClick={() => {
                  navigate("/destinations");
                  setShowMobileMenu(false);
                }}
                className="rounded-[16px] px-4 py-3 text-left text-sm font-semibold text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb]"
              >
                Discover
              </button>

              <button
                onClick={() => {
                  navigate("/map");
                  setShowMobileMenu(false);
                }}
                className="rounded-[16px] px-4 py-3 text-left text-sm font-semibold text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb]"
              >
                Features
              </button>

              <button
                onClick={() => {
                  navigate("/gallery");
                  setShowMobileMenu(false);
                }}
                className="rounded-[16px] px-4 py-3 text-left text-sm font-semibold text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb]"
              >
                Gallery
              </button>

              <button
                onClick={() => {
                  navigate("/events");
                  setShowMobileMenu(false);
                }}
                className="rounded-[16px] px-4 py-3 text-left text-sm font-semibold text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb]"
              >
                Events
              </button>
            </div>
          </div>
        </div>
      )}


      
     {showSearch && (
      <div className="search-overlay fixed inset-0 z-[1100] flex items-start justify-center px-4 pt-28 animate-fadeIn">
        <div className="search-glass-card w-full max-w-3xl p-4 md:p-6">
          <div className="search-inner-card p-5 md:p-6">
            <div className="search-input-box flex items-center gap-3 px-5 py-3.5">
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
                  className={`search-filter-btn px-4 py-2 text-xs font-semibold ${
                    activeFilter === filter.value ? "active" : ""
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* SEARCH RESULTS */}
            <div className="mt-6 max-h-[420px] space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {searchTerm === "" && (
                <div className="search-empty-state py-14 text-center">
                  <p className="text-sm font-medium text-gray-400">
                    Start typing to search Lanao del Sur
                  </p>
                </div>
              )}

              {searchTerm !== "" && filteredResults.length === 0 && (
                <div className="search-empty-state py-14 text-center">
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
                    className="search-result-card flex cursor-pointer items-center gap-4 p-3"
                  >
                    <img
                      src={item.imageURL || "/default-image.png"}
                      alt={item.title}
                      className="search-result-img h-20 w-20"
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

      {/* DISCOVER PANEL */}
      {showExplore && (
        <div
          className="fixed left-0 top-[90px] z-[990] hidden w-full justify-center animate-fadeIn lg:flex"
          onMouseLeave={() => setShowExplore(false)}
        >
          <div className="grid w-[95%] max-w-7xl grid-cols-2 gap-8 rounded-[30px] border border-blue-100 bg-white p-8 shadow-[0_16px_42px_rgba(37,99,235,0.10)]">
            <div className="grid grid-cols-2 gap-5">
              <div
                onClick={() => {
                  navigate("/destinations");
                  setShowExplore(false);
                }}
                className="group flex cursor-pointer items-start gap-4 rounded-[22px] border border-transparent p-4 transition hover:border-blue-100 hover:bg-blue-50 hover:shadow-sm"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] transition group-hover:bg-[#2563eb] group-hover:text-white">
                  <FiMapPin className="text-lg" />
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600">Destinations</h4>
                  <p className="mt-1 text-sm text-gray-500">Tourist spots</p>
                </div>
              </div>

              <div
                onClick={() => {
                  navigate("/cultural");
                  setShowExplore(false);
                }}
                className="group flex cursor-pointer items-start gap-4 rounded-[22px] border border-transparent p-4 transition hover:border-blue-100 hover:bg-blue-50 hover:shadow-sm"
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

              <div
                onClick={() => {
                  navigate("/establishments");
                  setShowExplore(false);
                }}
                className="group flex cursor-pointer items-start gap-4 rounded-[22px] border border-transparent p-4 transition hover:border-blue-100 hover:bg-blue-50 hover:shadow-sm"
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

              <div
                onClick={() => {
                  navigate("/landmarks");
                  setShowExplore(false);
                }}
                className="group flex cursor-pointer items-start gap-4 rounded-[22px] border border-transparent p-4 transition hover:border-blue-100 hover:bg-blue-50 hover:shadow-sm"
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

            <div className="flex flex-col items-center justify-center text-center">
              <div className="overflow-hidden rounded-[24px] border border-blue-100 bg-[#f8fbff] p-2 shadow-[0_8px_22px_rgba(37,99,235,0.07)]">
                <img
                  src={explorePreview}
                  className="h-38 w-80 rounded-[18px] object-cover"
                  alt="Explore Preview"
                />
              </div>

              <span className="mt-4 text-sm text-gray-500">Explore Lanao</span>
            </div>
          </div>
        </div>
      )}

      {/* FEATURES PANEL */}
      {showFeatures && (
        <div
          className="fixed left-0 top-[90px] z-[990] hidden w-full justify-center animate-fadeIn lg:flex"
          onMouseLeave={() => setShowFeatures(false)}
        >
          <div className="grid w-[95%] max-w-7xl grid-cols-2 gap-8 rounded-[30px] border border-blue-100 bg-white p-8 shadow-[0_16px_42px_rgba(37,99,235,0.10)]">
            <div className="grid grid-cols-2 gap-5">
              <div
                onClick={() => {
                  navigate("/map");
                  setShowFeatures(false);
                }}
                className="group flex cursor-pointer items-start gap-4 rounded-[22px] border border-transparent p-4 transition hover:border-blue-100 hover:bg-blue-50 hover:shadow-sm"
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

              <div
                onClick={() => {
                  if (!user) {
                    navigate("/login");
                  } else {
                    window.dispatchEvent(new Event("open-tourism-chatbot"));
                  }

                  setShowFeatures(false);
                }}
                className="group flex cursor-pointer items-start gap-4 rounded-[22px] border border-transparent p-4 transition hover:border-blue-100 hover:bg-blue-50 hover:shadow-sm"
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

              <div
                onClick={() => {
                  if (!user) navigate("/login");
                  else navigate("/itinerary");
                  setShowFeatures(false);
                }}
                className="group flex cursor-pointer items-start gap-4 rounded-[22px] border border-transparent p-4 transition hover:border-blue-100 hover:bg-blue-50 hover:shadow-sm"
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

              <div
                onClick={() => {
                  navigate("/events-calendar");
                  setShowFeatures(false);
                }}
                className="group flex cursor-pointer items-start gap-4 rounded-[22px] border border-transparent p-4 transition hover:border-blue-100 hover:bg-blue-50 hover:shadow-sm"
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

            <div className="flex flex-col items-center justify-center text-center">
              <div className="overflow-hidden rounded-[24px] border border-blue-100 bg-[#f8fbff] p-2 shadow-[0_8px_22px_rgba(37,99,235,0.07)]">
                <img
                  src={featurePreview}
                  className="h-38 w-80 rounded-[18px] object-cover"
                  alt="Features Preview"
                />
              </div>

              <span className="mt-4 text-sm text-gray-500">
                Explore smarter with Lakbay Lanao
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;