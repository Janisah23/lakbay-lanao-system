import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
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
  FiUser,
  FiEdit3,
  FiChevronRight,
  FiImage,
  FiArrowLeft,
} from "react-icons/fi";
import "./Navbar.css";

import ptoLogo from "../../assets/pto.png";
import explorePreview from "../../assets/explore-preview.png";
import featurePreview from "../../assets/feature-preview.png";
import { logAction } from "../../utils/logAction";

function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [showFeatures, setShowFeatures] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showExplore, setShowExplore] = useState(false);
  const [searchItems, setSearchItems] = useState([]);
  const [openMenu, setOpenMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [mobileDropdown, setMobileDropdown] = useState(null);

  const normalize = (text = "") =>
    text.toString().toLowerCase().replaceAll(" ", "").replaceAll("&", "");

  const navLinkClass =
    "relative cursor-pointer py-1 text-gray-700 font-semibold transition-all duration-300 hover:text-blue-600 hover:drop-shadow-[0_0_10px_rgba(37,99,235,0.4)] after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-blue-600 after:transition-all hover:after:w-full";

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

  const displayUsername =
    userProfile?.username ||
    user?.displayName ||
    userProfile?.fullName ||
    user?.email?.split("@")[0] ||
    "Tourist";

  const displayFullName =
    userProfile?.fullName ||
    user?.displayName ||
    userProfile?.username ||
    "Tourist";

  const displayEmail = user?.email || userProfile?.email || "";

  const displayInitial = displayUsername?.charAt(0)?.toUpperCase() || "U";

  const displayRole = userProfile?.role
    ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)
    : "Tourist";

  const displayLocation =
    userProfile?.location?.addressText ||
    userProfile?.location?.municipality ||
    userProfile?.location?.province ||
    userProfile?.country ||
    "";

  const isDashboardUser = userProfile?.role === "admin" || userProfile?.role === "staff";

  const closeSearch = () => {
    setShowSearch(false);
    setSearchTerm("");
    setActiveFilter("all");
  };

  const closePanels = () => {
    setShowMobileMenu(false);
    setShowExplore(false);
    setShowFeatures(false);
    setMobileDropdown(null);
  };

  const refreshNavigate = (path) => {
    closePanels();
    setOpenMenu(false);
    closeSearch();

    if (window.location.pathname === path) {
      window.location.reload();
      return;
    }

    navigate(path);
  };

  const handleOpenChatbot = () => {
    if (!user) {
      refreshNavigate("/login");
      return;
    }

    closePanels();
    setOpenMenu(false);

    sessionStorage.setItem("openLakbayChatbot", "true");

    navigate("/", {
      state: {
        openChatbot: true,
      },
    });
  };

  const handleLogout = async () => {
    const currentUser = auth.currentUser;

    if (currentUser) {
      await logAction(
        {
          action: "Logout",
          module: "Authentication",
          targetModule: "System",
          details: "User successfully logged out of the session.",
        },
        currentUser
      );
    }

    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setOpenMenu(false);
    closePanels();
    navigate("/login");
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
      setMobileDropdown(null);
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const unsubContent = onSnapshot(collection(db, "tourismContent"), (snapshot) => {
      const contentData = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      const searchableContent = contentData
        .filter(
          (item) => item.status !== "archived" && item.contentType !== "Highlight"
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
    });

    const unsubTourismData = onSnapshot(collection(db, "tourismData"), (snapshot) => {
      const placesData = snapshot.docs
        .map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
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
    });

    return () => {
      unsubContent();
      unsubTourismData();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setUserProfile(null);
        return;
      }

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserProfile(userSnap.data());
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      }
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
      <nav
        className={`fixed left-0 top-0 z-[1000] flex w-full justify-center transition-all duration-300 ${
          isScrolled ? "pt-2 md:pt-4" : "pt-4 md:pt-6"
        }`}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`flex w-[92%] max-w-7xl items-center justify-between rounded-full border border-gray-200 bg-white/95 backdrop-blur-md transition-all duration-300 ${
            isScrolled
              ? "px-4 py-2 shadow-lg md:px-8 md:py-2.5"
              : "px-4 py-2.5 shadow-md md:px-10 md:py-3"
          }`}
        >
          <div
            onClick={() => refreshNavigate("/")}
            className="group flex min-w-0 cursor-pointer items-center gap-2 md:gap-3"
          >
            <img
              src={ptoLogo}
              alt="logo"
              className="h-8 w-8 flex-shrink-0 object-contain transition-transform group-hover:scale-105 md:h-9 md:w-9"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />

            <div className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="truncate whitespace-nowrap text-xs font-bold tracking-tight text-blue-600 md:text-sm">
                Provincial Tourism, Culture, and the Arts Office
              </span>

              <span className="mt-0.8 truncate whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.1em] text-blue-900">
                Lanao del Sur
              </span>
            </div>
          </div>

          <div className="hidden items-center gap-8 lg:flex">
            <span onClick={() => refreshNavigate("/")} className={navLinkClass}>
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

            <span onClick={() => refreshNavigate("/gallery")} className={navLinkClass}>
              Gallery
            </span>

            <span onClick={() => refreshNavigate("/events")} className={navLinkClass}>
              Events
            </span>
          </div>

          <div className="flex flex-shrink-0 items-center gap-1.5 md:gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileMenu((prev) => !prev);
                setOpenMenu(false);
                setMobileDropdown(null);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb] lg:hidden"
              aria-label="Open menu"
            >
              {showMobileMenu ? <FiX size={21} /> : <FiMenu size={21} />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSearch(true);
                setShowMobileMenu(false);
                setMobileDropdown(null);
              }}
              className="flex items-center gap-2 rounded-full px-2 py-2 text-gray-700 transition hover:bg-gray-50 hover:text-blue-600 md:px-3"
            >
              <FiSearch size={20} className="stroke-[2.5]" />
              <span className="hidden text-sm font-semibold md:block">
                Search
              </span>
            </button>

            {!user ? (
              <button
                onClick={() => refreshNavigate("/login")}
                className="whitespace-nowrap rounded-full border-[1.5px] border-blue-600 px-4 py-2 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-50 md:px-6 md:text-sm"
              >
                Sign In
              </button>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu((prev) => !prev);
                    setShowMobileMenu(false);
                    setMobileDropdown(null);
                    setShowExplore(false);
                    setShowFeatures(false);
                  }}
                  className="flex items-center gap-2 rounded-full border border-blue-100 bg-white p-1 pr-2 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                  aria-label="Open profile menu"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="profile"
                      className="h-9 w-9 rounded-full border-2 border-blue-500 object-cover shadow-[0_0_0_4px_rgba(37,99,235,0.10)] md:h-10 md:w-10"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://ui-avatars.com/api/?name=" +
                          displayInitial +
                          "&background=3b82f6&color=fff";
                      }}
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-blue-500 bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white shadow-[0_0_0_4px_rgba(37,99,235,0.10)] md:h-10 md:w-10">
                      {displayInitial}
                    </div>
                  )}

                  <span className="hidden max-w-[90px] truncate text-xs font-semibold text-gray-700 md:block">
                    {displayUsername}
                  </span>

                  <FiChevronRight
                    className={`hidden text-gray-400 transition md:block ${
                      openMenu ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {openMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-[calc(100%+16px)] z-[1200] max-h-[calc(100vh-100px)] w-[280px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-[20px] border border-blue-100 bg-white/95 shadow-[0_24px_60px_rgba(37,99,235,0.20)] backdrop-blur-xl animate-dropdown sm:top-[calc(100%+22px)] sm:w-[300px] sm:rounded-[28px]"
                  >
                    <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 px-3 py-3 sm:px-4 sm:py-4">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="profile"
                            className="h-10 w-10 rounded-full border-2 border-blue-500 object-cover shadow-[0_0_0_4px_rgba(37,99,235,0.10)] sm:h-12 sm:w-12"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://ui-avatars.com/api/?name=" +
                                displayInitial +
                                "&background=3b82f6&color=fff";
                            }}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-500 bg-gradient-to-br from-blue-500 to-blue-700 text-sm font-bold text-white shadow-[0_0_0_4px_rgba(37,99,235,0.10)] sm:h-12 sm:w-12 sm:text-base">
                            {displayInitial}
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="truncate text-xs font-bold text-gray-800 sm:text-sm">
                            {displayFullName}
                          </h4>

                          <p className="truncate text-[11px] text-gray-500 sm:text-xs">
                            {displayEmail}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700 sm:px-2.5 sm:text-[10px]">
                              {displayRole}
                            </span>

                            <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-green-700 sm:px-2.5 sm:text-[10px]">
                              Verified
                            </span>
                          </div>

                          {displayLocation && (
                            <p className="mt-1 truncate text-[10px] text-gray-400 sm:text-[11px]">
                              {displayLocation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-1 sm:p-1.5">
                      <button
                        onClick={() => refreshNavigate("/profile")}
                        className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb] sm:rounded-[16px] sm:px-4 sm:py-2.5 sm:text-sm"
                      >
                        <FiUser className="text-base text-blue-600 sm:text-lg" />
                        View Profile
                      </button>

                      <button
                        onClick={() => refreshNavigate("/profile/edit")}
                        className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb] sm:rounded-[16px] sm:px-4 sm:py-2.5 sm:text-sm"
                      >
                        <FiEdit3 className="text-base text-blue-600 sm:text-lg" />
                        Edit Profile
                      </button>

                      <div className="my-1 border-t border-blue-50" />

                      <button
                        onClick={() => refreshNavigate("/favorites")}
                        className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb] sm:rounded-[16px] sm:px-4 sm:py-2.5 sm:text-sm"
                      >
                        <FiHeart className="text-base text-blue-600 sm:text-lg" />
                        Top Picks
                      </button>

                      <button
                        onClick={() => refreshNavigate("/itinerary")}
                        className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb] sm:rounded-[16px] sm:px-4 sm:py-2.5 sm:text-sm"
                      >
                        <FiMap className="text-base text-blue-600 sm:text-lg" />
                        My Itinerary
                      </button>

                      <div className="my-1 border-t border-blue-50" />

                      {isDashboardUser ? (
                        <button
                          onClick={() => refreshNavigate(`/${userProfile.role}/dashboard`)}
                          className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 sm:rounded-[16px] sm:px-4 sm:py-2.5 sm:text-sm"
                        >
                          <FiArrowLeft className="text-base text-blue-600 sm:text-lg" />
                          Return to Dashboard
                        </button>
                      ) : (
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-[14px] px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50 sm:rounded-[16px] sm:px-4 sm:py-2.5 sm:text-sm"
                        >
                          <FiLogOut className="text-base text-red-500 sm:text-lg" />
                          Logout
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {showMobileMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed left-0 top-[70px] z-[999] flex w-full justify-center px-4 sm:top-[82px] lg:hidden"
        >
          <div className="w-full max-w-[340px] max-h-[calc(100vh-130px)] overflow-y-auto custom-scrollbar rounded-[24px] border border-blue-100/80 bg-white/90 p-2.5 shadow-[0_18px_45px_rgba(37,99,235,0.14)] backdrop-blur-2xl animate-dropdown">
            <div className="grid gap-1.5">
              <button
                onClick={() => refreshNavigate("/")}
                className="group flex w-full items-center gap-2.5 rounded-[18px] border border-transparent px-3 py-2.5 text-xs font-semibold text-gray-700 transition-all duration-200 hover:border-blue-100 hover:bg-blue-50/80 hover:text-blue-700"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:bg-white">
                  <FiHome size={16} />
                </span>
                <span>Home</span>
              </button>

              <button
                onClick={() =>
                  setMobileDropdown((prev) =>
                    prev === "discover" ? null : "discover"
                  )
                }
                className={`group flex w-full items-center justify-between rounded-[18px] border px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  mobileDropdown === "discover"
                    ? "border-blue-100 bg-blue-50/90 text-blue-700 shadow-[0_6px_16px_rgba(37,99,235,0.08)]"
                    : "border-transparent text-gray-700 hover:border-blue-100 hover:bg-blue-50/80 hover:text-blue-700"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:bg-white">
                    <FiCompass size={16} />
                  </span>
                  Discover
                </span>

                <FiChevronRight
                  size={16}
                  className={`text-gray-400 transition-transform duration-200 ${
                    mobileDropdown === "discover" ? "rotate-90 text-blue-600" : ""
                  }`}
                />
              </button>

              {mobileDropdown === "discover" && (
                <div className="animate-dropdown rounded-[18px] border border-blue-50 bg-gradient-to-br from-white via-[#f8fbff] to-blue-50/70 p-1.5">
                  <div className="grid gap-1">
                    <button
                      onClick={() => refreshNavigate("/destinations")}
                      className="flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2 text-left text-[11px] font-semibold text-gray-600 transition hover:bg-white hover:text-blue-700 hover:shadow-sm"
                    >
                      <FiMapPin className="text-blue-500" size={14} />
                      Destinations
                    </button>

                    <button
                      onClick={() => refreshNavigate("/landmarks")}
                      className="flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2 text-left text-[11px] font-semibold text-gray-600 transition hover:bg-white hover:text-blue-700 hover:shadow-sm"
                    >
                      <FiHome className="text-blue-500" size={14} />
                      Landmarks
                    </button>

                    <button
                      onClick={() => refreshNavigate("/cultural")}
                      className="flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2 text-left text-[11px] font-semibold text-gray-600 transition hover:bg-white hover:text-blue-700 hover:shadow-sm"
                    >
                      <FiLayers className="text-blue-500" size={14} />
                      Cultural & Heritage
                    </button>

                    <button
                      onClick={() => refreshNavigate("/establishments")}
                      className="flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2 text-left text-[11px] font-semibold text-gray-600 transition hover:bg-white hover:text-blue-700 hover:shadow-sm"
                    >
                      <FiBriefcase className="text-blue-500" size={14} />
                      Establishments
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() =>
                  setMobileDropdown((prev) =>
                    prev === "features" ? null : "features"
                  )
                }
                className={`group flex w-full items-center justify-between rounded-[18px] border px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  mobileDropdown === "features"
                    ? "border-blue-100 bg-blue-50/90 text-blue-700 shadow-[0_6px_16px_rgba(37,99,235,0.08)]"
                    : "border-transparent text-gray-700 hover:border-blue-100 hover:bg-blue-50/80 hover:text-blue-700"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:bg-white">
                    <FiLayers size={16} />
                  </span>
                  Features
                </span>

                <FiChevronRight
                  size={16}
                  className={`text-gray-400 transition-transform duration-200 ${
                    mobileDropdown === "features" ? "rotate-90 text-blue-600" : ""
                  }`}
                />
              </button>

              {mobileDropdown === "features" && (
                <div className="animate-dropdown rounded-[18px] border border-blue-50 bg-gradient-to-br from-white via-[#f8fbff] to-blue-50/70 p-1.5">
                  <div className="grid gap-1">
                    <button
                      onClick={() => refreshNavigate("/map")}
                      className="flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2 text-left text-[11px] font-semibold text-gray-600 transition hover:bg-white hover:text-blue-700 hover:shadow-sm"
                    >
                      <FiMap className="text-blue-500" size={14} />
                      Interactive Map
                    </button>

                    <button
                      onClick={handleOpenChatbot}
                      className="flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2 text-left text-[11px] font-semibold text-gray-600 transition hover:bg-white hover:text-blue-700 hover:shadow-sm"
                    >
                      <FiMessageCircle className="text-blue-500" size={14} />
                      AI Chatbot
                    </button>

                    <button
                      onClick={() => refreshNavigate("/events-calendar")}
                      className="flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2 text-left text-[11px] font-semibold text-gray-600 transition hover:bg-white hover:text-blue-700 hover:shadow-sm"
                    >
                      <FiCalendar className="text-blue-500" size={14} />
                      Events Calendar
                    </button>

                    <button
                      onClick={() => refreshNavigate("/itinerary")}
                      className="flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2 text-left text-[11px] font-semibold text-gray-600 transition hover:bg-white hover:text-blue-700 hover:shadow-sm"
                    >
                      <FiCompass className="text-blue-500" size={14} />
                      Itinerary Builder
                    </button>

                    <button
                      onClick={() => refreshNavigate("/favorites")}
                      className="flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2 text-left text-[11px] font-semibold text-gray-600 transition hover:bg-white hover:text-blue-700 hover:shadow-sm"
                    >
                      <FiHeart className="text-blue-500" size={14} />
                      Top Picks
                    </button>
                  </div>
                </div>
              )}

              <div className="my-0.5 border-t border-blue-50" />

              <button
                onClick={() => refreshNavigate("/gallery")}
                className="group flex w-full items-center gap-2.5 rounded-[18px] border border-transparent px-3 py-2.5 text-xs font-semibold text-gray-700 transition-all duration-200 hover:border-blue-100 hover:bg-blue-50/80 hover:text-blue-700"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:bg-white">
                  <FiImage size={16} />
                </span>
                Gallery
              </button>

              <button
                onClick={() => refreshNavigate("/events")}
                className="group flex w-full items-center gap-2.5 rounded-[18px] border border-transparent px-3 py-2.5 text-xs font-semibold text-gray-700 transition-all duration-200 hover:border-blue-100 hover:bg-blue-50/80 hover:text-blue-700"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition group-hover:bg-white">
                  <FiCalendar size={16} />
                </span>
                Events
              </button>

              {!user ? (
                <button
                  onClick={() => refreshNavigate("/login")}
                  className="mt-2 w-full rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-[0_10px_22px_rgba(37,99,235,0.20)] transition hover:scale-[1.01]"
                >
                  Sign In
                </button>
              ) : (
                <>
                  {isDashboardUser ? (
                    <button
                      onClick={() => refreshNavigate(`/${userProfile.role}/dashboard`)}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      <FiArrowLeft className="text-sm" />
                      Return to Dashboard
                    </button>
                  ) : (
                    <button
                      onClick={handleLogout}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-2.5 text-xs font-bold text-red-500 shadow-sm transition hover:bg-red-100"
                    >
                      <FiLogOut className="text-sm" />
                      Logout
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showSearch && (
        <div className="fixed inset-0 z-[1100] flex items-start justify-center bg-black/35 px-4 pt-28 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl rounded-[32px] border border-gray-200 bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] p-4 shadow-xl md:p-6">
            <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-5 py-3.5 transition focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-100">
                <FiSearch className="text-xl text-[#2563eb]" />

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
                        className="h-20 w-20 rounded-[20px] bg-blue-50 object-cover"
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

      {showExplore && (
        <div
          className="fixed left-0 top-[90px] z-[990] hidden w-full justify-center animate-fadeIn lg:flex"
          onMouseLeave={() => setShowExplore(false)}
        >
          <div className="grid w-[95%] max-w-7xl grid-cols-2 gap-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
            <div className="grid grid-cols-2 gap-5">
              <div
                onClick={() => {
                  navigate("/destinations");
                  setShowExplore(false);
                }}
                className="group flex cursor-pointer items-start gap-4 rounded-2xl p-4 transition hover:bg-blue-50"
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
                className="group flex cursor-pointer items-start gap-4 rounded-2xl p-4 transition hover:bg-blue-50"
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
                className="group flex cursor-pointer items-start gap-4 rounded-2xl p-4 transition hover:bg-blue-50"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] transition group-hover:bg-[#2563eb] group-hover:text-white">
                  <FiBriefcase className="text-lg" />
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600">Establishments</h4>
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
                className="group flex cursor-pointer items-start gap-4 rounded-2xl p-4 transition hover:bg-blue-50"
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
              <img
                src={explorePreview}
                className="h-38 w-80 rounded-xl object-cover shadow"
                alt="Explore Preview"
              />
              <span className="mt-2 text-sm text-gray-500">Explore Lanao</span>
            </div>
          </div>
        </div>
      )}

      {showFeatures && (
        <div
          className="fixed left-0 top-[90px] z-[990] hidden w-full justify-center animate-fadeIn lg:flex"
          onMouseLeave={() => setShowFeatures(false)}
        >
          <div className="grid w-[95%] max-w-7xl grid-cols-2 gap-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
            <div className="grid grid-cols-2 gap-5">
              <div
                onClick={() => {
                  navigate("/map");
                  setShowFeatures(false);
                }}
                className="group flex cursor-pointer items-start gap-4 rounded-2xl p-4 transition hover:bg-blue-50"
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
                onClick={handleOpenChatbot}
                className="group flex cursor-pointer items-start gap-4 rounded-2xl p-4 transition hover:bg-blue-50"
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
                  navigate("/events-calendar");
                  setShowFeatures(false);
                }}
                className="group flex cursor-pointer items-start gap-4 rounded-2xl p-4 transition hover:bg-blue-50"
              >
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2563eb] transition group-hover:bg-[#2563eb] group-hover:text-white">
                  <FiCalendar className="text-lg" />
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600">
                    Events Calendar
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    View events in calendar format
                  </p>
                </div>
              </div>

              <div
                onClick={() => {
                  if (!user) navigate("/login");
                  else navigate("/itinerary");

                  setShowFeatures(false);
                }}
                className="group flex cursor-pointer items-start gap-4 rounded-2xl p-4 transition hover:bg-blue-50"
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
            </div>

            <div className="flex flex-col items-center justify-center text-center">
              <img
                src={featurePreview}
                className="h-38 w-80 rounded-2xl object-cover shadow-md"
                alt="Features Preview"
              />
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