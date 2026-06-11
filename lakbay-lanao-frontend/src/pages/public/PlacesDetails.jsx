import React, { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import { useNavigate, useParams } from "react-router-dom";
import {
  FiMapPin,
  FiInfo,
  FiHeart,
  FiShare2,
  FiBookmark,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiTag,
  FiSun,
  FiAlertCircle,
  FiLock,
} from "react-icons/fi";
import { MdOutlineBookmarkAdd, MdBookmarkAdded } from "react-icons/md";
import {
  FaHeart,
  FaTwitter,
  FaFacebookF,
  FaLink,
  FaDirections,
} from "react-icons/fa";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../../firebase/config";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  collection,
  updateDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { useFavorites } from "../../components/context/FavoritesContext";

const normalize = (value) => String(value || "").trim().toLowerCase();

const PlacesDetails = () => {
  const [morePlaces, setMorePlaces] = useState([]);

  const navigate = useNavigate();
  const { id } = useParams();

  const [destinationDetail, setDestinationDetail] = useState(null);

  const [userRating, setUserRating] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showLoginNotice, setShowLoginNotice] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mainSwiper, setMainSwiper] = useState(null);

  const [showSharePanel, setShowSharePanel] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const { favorites } = useFavorites();
  const isFav = favorites.some((fav) => String(fav.id) === String(id));

  useEffect(() => {
    setShowLoginNotice(false);
    setShowPopup(false);
    setShowSharePanel(false);
    setLinkCopied(false);
    setActiveGalleryIndex(0);
    setLightboxOpen(false);
    if (mainSwiper) mainSwiper.slideTo(0);
  }, [id, mainSwiper]);

  useEffect(() => {
    if (mainSwiper && mainSwiper.activeIndex !== activeGalleryIndex) {
      mainSwiper.slideTo(activeGalleryIndex);
    }
  }, [activeGalleryIndex, mainSwiper]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoggedIn(!!user);
      if (user && id) {
        try {
          let reviewRef = doc(db, "tourismData", id, "reviews", user.uid);
          let reviewSnap = await getDoc(reviewRef);

          if (!reviewSnap.exists()) {
            reviewRef = doc(db, "tourismContent", id, "reviews", user.uid);
            reviewSnap = await getDoc(reviewRef);
          }

          if (reviewSnap.exists()) {
            setUserRating(reviewSnap.data().rating);
            setIsSubmitted(true);
          } else {
            setUserRating(0);
            setIsSubmitted(false);
          }
        } catch (error) {
          console.error("Error checking user review:", error);
        }
      } else {
        setUserRating(0);
        setIsSubmitted(false);
      }
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    const fetchDestination = async () => {
      try {
        let docRef = doc(db, "tourismData", id);
        let snap = await getDoc(docRef);
        let sourceCollection = "tourismData";

        if (!snap.exists()) {
          docRef = doc(db, "tourismContent", id);
          snap = await getDoc(docRef);
          sourceCollection = "tourismContent";
        }

        if (snap.exists()) {
          setDestinationDetail({
            id: snap.id,
            _source: sourceCollection,
            ...snap.data(),
          });

          await updateDoc(docRef, { viewCount: increment(1) }).catch(() => {});
        } else {
          console.log("No such destination found!");
        }
      } catch (error) {
        console.error("Error fetching destination:", error);
      }
    };

    if (id) fetchDestination();
  }, [id]);

  useEffect(() => {
    if (!destinationDetail) return;

    const fetchRelatedData = async () => {
      try {
        const [tourismDataSnap, tourismContentSnap] = await Promise.all([
          getDocs(collection(db, "tourismData")),
          getDocs(collection(db, "tourismContent")),
        ]);

        const tourismDataItems = tourismDataSnap.docs.map((d) => ({
          id: d.id,
          _source: "tourismData",
          ...d.data(),
        }));

        const tourismContentItems = tourismContentSnap.docs.map((d) => ({
          id: d.id,
          _source: "tourismContent",
          ...d.data(),
        }));

        const allItems = [...tourismDataItems, ...tourismContentItems];

        const currentType = normalize(destinationDetail.type);
        const currentCategory = normalize(destinationDetail.category);
        const currentContentType = normalize(destinationDetail.contentType);

        const related = allItems
          .filter((item) => {
            if (String(item.id) === String(id)) return false;
            if (item.status === "archived") return false;

            const itemType = normalize(item.type);
            const itemCategory = normalize(item.category);
            const itemContentType = normalize(item.contentType);

            const isArticle =
              itemContentType === "article" ||
              itemContentType === "blog" ||
              itemCategory === "article" ||
              itemCategory === "news";

            const isEvent =
              itemContentType === "event" || itemCategory === "event";

            if (isArticle || isEvent) return false;

            const sameType = currentType && itemType === currentType;
            const sameCategory =
              currentCategory && itemCategory === currentCategory;
            const sameContentType =
              currentContentType && itemContentType === currentContentType;

            return sameType || sameCategory || sameContentType;
          })
          .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));

        const uniqueRelated = Array.from(
          new Map(related.map((item) => [item.id, item])).values()
        );

        setMorePlaces(uniqueRelated.slice(0, 8));
      } catch (error) {
        console.error("Error fetching similar places:", error);
      }
    };

    fetchRelatedData();
  }, [destinationDetail, id]);

  const toggleFavorite = async (item) => {
    const user = auth.currentUser;

    if (!user) {
      setShowLoginNotice(true);
      return;
    }

    const favRef = doc(db, "users", user.uid, "favorites", item.id);
    const sourceCol = destinationDetail?._source || "tourismData";

    if (isFav) {
      await deleteDoc(favRef);
      await updateDoc(doc(db, sourceCol, item.id), {
        saveCount: increment(-1),
      }).catch(() => {});
    } else {
      await setDoc(favRef, item);
      await updateDoc(doc(db, sourceCol, item.id), {
        saveCount: increment(1),
      }).catch(() => {});
    }
  };

  const handleRating = async () => {
    const user = auth.currentUser;

    if (!user) {
      setShowLoginNotice(true);
      return;
    }

    if (isSubmitted) return;
    if (!destinationDetail) return;

    try {
      const sourceCol = destinationDetail._source || "tourismData";
      const reviewRef = doc(
        db,
        sourceCol,
        destinationDetail.id,
        "reviews",
        user.uid
      );

      await setDoc(reviewRef, {
        userId: user.uid,
        rating: userRating,
        createdAt: serverTimestamp(),
      });

      const currentRating = destinationDetail.rating || 0;
      const currentCount = destinationDetail.reviewsCount || 0;
      const newCount = currentCount + 1;
      const newAverage =
        (currentRating * currentCount + userRating) / newCount;

      const placeRef = doc(db, sourceCol, destinationDetail.id);

      await updateDoc(placeRef, {
        rating: newAverage,
        reviewsCount: newCount,
        isTopDestination: newAverage >= 4.5 && newCount >= 5,
      });

      setDestinationDetail((prev) => ({
        ...prev,
        rating: newAverage,
        reviewsCount: newCount,
      }));

      setIsSubmitted(true);
      setShowLoginNotice(false);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleExplorePlaceClick = (placeId) => {
    window.location.href = `/destination/${placeId}`;
  };

  const getBreadcrumbData = () => {
    if (!destinationDetail) {
      return { label: "Destinations", path: "/destinations" };
    }

    const cat = String(
      destinationDetail.category || destinationDetail.contentType || ""
    ).toLowerCase();

    if (cat.includes("establishment")) {
      return { label: "Establishments", path: "/establishments" };
    }

    if (cat.includes("landmark")) {
      return { label: "Landmarks", path: "/landmarks" };
    }

    if (cat.includes("cultural") || cat.includes("heritage")) {
      return { label: "Cultural Heritage", path: "/cultural" };
    }

    return { label: "Destinations", path: "/destinations" };
  };

  const getLocationText = (place) => {
    if (!place?.location) return "Lanao del Sur";

    if (typeof place.location === "string") return place.location;

    const parts = [
      place.location.street,
      place.location.barangay,
      place.location.municipality,
      place.location.province,
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(", ");

    return "Lanao del Sur";
  };

  const getShortLocationText = (place) => {
    if (!place?.location) return "Lanao del Sur";

    if (typeof place.location === "string") return place.location;

    if (place.location?.municipality && place.location?.province) {
      return `${place.location.municipality}, ${place.location.province}`;
    }

    return place.location?.municipality || "Lanao del Sur";
  };

  const renderPlaceCard = (place, buttonLabel = "Explore place") => (
    <article
      key={place.id}
      onClick={() => handleExplorePlaceClick(place.id)}
      className="group flex min-h-[250px] cursor-pointer flex-col overflow-hidden rounded-[20px] border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)] sm:min-h-[310px] sm:rounded-[24px] lg:min-h-[330px] lg:rounded-[30px]"
    >
      <div className="p-1.5 pb-0 sm:p-2 sm:pb-0 lg:p-2.5 lg:pb-0">
        <div className="relative h-[120px] overflow-hidden rounded-[16px] border border-white/70 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.05)] backdrop-blur-sm sm:h-[165px] sm:rounded-[20px] lg:h-[190px] lg:rounded-[24px]">
          
          {place.imageURLs && place.imageURLs.length > 1 ? (
            <div className="group/cardSwiper relative h-full w-full">
              <Swiper
                modules={[Autoplay, Navigation, Pagination]}
                autoplay={{ delay: 30000, disableOnInteraction: false }}
                speed={1000}
                loop={true}
                navigation={{
                  prevEl: `.prev-${place.id}`,
                  nextEl: `.next-${place.id}`,
                }}
                pagination={{
                  clickable: true,
                  el: `.pag-${place.id}`,
                  renderBullet: function (index, className) {
                    return `<span class="${className} inline-block h-1.5 w-1.5 rounded-full bg-white/60 transition-all hover:bg-white cursor-pointer [&.swiper-pagination-bullet-active]:w-3 [&.swiper-pagination-bullet-active]:bg-white"></span>`;
                  },
                }}
                className="h-full w-full"
              >
                {place.imageURLs.map((url, i) => (
                  <SwiperSlide key={i}>
                    <img
                      src={url}
                      alt={`${place.name || place.title} ${i}`}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>

              <button
                onClick={(e) => e.stopPropagation()}
                className={`prev-${place.id} absolute left-2 top-1/2 z-20 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-black/40 group-hover/cardSwiper:opacity-100`}
              >
                <FiChevronLeft size={14} />
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className={`next-${place.id} absolute right-2 top-1/2 z-20 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-black/40 group-hover/cardSwiper:opacity-100`}
              >
                <FiChevronRight size={14} />
              </button>
              <div
                onClick={(e) => e.stopPropagation()}
                className={`pag-${place.id} absolute bottom-2 left-0 z-20 flex w-full justify-center gap-1 opacity-0 transition-opacity duration-300 group-hover/cardSwiper:opacity-100`}
              ></div>
            </div>
          ) : (
            <img
              src={place.imageURL || "/default.jpg"}
              alt={place.title || place.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
            />
          )}

          <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-t from-black/10 via-white/5 to-white/10" />
          <div className="absolute inset-x-0 top-0 z-10 pointer-events-none h-16 bg-gradient-to-b from-white/20 to-transparent" />

          {isLoggedIn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(place);
              }}
              className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/95 shadow-sm backdrop-blur-md transition hover:bg-blue-50 sm:right-3 sm:top-3 sm:h-8 sm:w-8 lg:right-4 lg:top-4 lg:h-9 lg:w-9"
            >
              {favorites.some((fav) => String(fav.id) === String(place.id)) ? (
                <FaHeart className="text-xs text-[#2563eb] sm:text-sm" />
              ) : (
                <FiHeart className="text-xs text-gray-500 sm:text-sm" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-2 sm:px-4 sm:pb-4 sm:pt-3 lg:px-6 lg:pb-6 lg:pt-4">
        <span className="mb-1.5 max-w-[110px] truncate self-start rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-[#2563eb] sm:mb-2 sm:max-w-[140px] sm:px-2.5 sm:py-1 sm:text-[9px] lg:px-3 lg:text-[10px]">
          {place.type || place.category || "Place"}
        </span>

        <h4 className="line-clamp-2 min-h-[34px] text-xs font-bold leading-tight text-[#2563eb] transition group-hover:text-blue-700 sm:min-h-[40px] sm:text-sm lg:min-h-[44px] lg:text-base lg:leading-snug">
          {place.name || place.title}
        </h4>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleExplorePlaceClick(place.id);
          }}
          className="mt-auto w-full rounded-full bg-[#2563eb] px-3 py-1.5 text-[10px] font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md sm:w-fit sm:px-4 sm:py-2 sm:text-[11px] lg:inline-flex lg:items-center lg:gap-2 lg:self-start lg:px-5 lg:py-2.5 lg:text-xs"
        >
          {buttonLabel} <FiChevronRight className="hidden lg:inline" />
        </button>
      </div>
    </article>
  );

  if (!destinationDetail) {
    return (
      <div className="font-sans flex min-h-screen items-center justify-center bg-[#f3f9ff]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#2563eb]" />
          <p className="mt-4 font-medium text-gray-500">
            Loading destination...
          </p>
        </div>
      </div>
    );
  }

  const breadcrumb = getBreadcrumbData();

  const rawGalleryImages = [
    destinationDetail.imageURL,
    ...(destinationDetail.imageURLs || []),
    ...(destinationDetail.galleryImages || []),
  ].filter(Boolean);

  const galleryImages = Array.from(new Set(rawGalleryImages));

  const mapQuery = destinationDetail?.location
    ? encodeURIComponent(
        `${destinationDetail.location.municipality || ""}, ${
          destinationDetail.location.province || "Lanao del Sur"
        }, Philippines`
      )
    : encodeURIComponent("Lanao del Sur, Philippines");

  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
  const mapDirectionsUrl = `https://maps.google.com/maps?q=${mapQuery}`;

  const locationStr = getLocationText(destinationDetail);
  const shortLocationStr = getShortLocationText(destinationDetail);

  const saveCount = destinationDetail.saveCount || 0;

  return (
    <div className="font-sans min-h-screen bg-[#f3f9ff] text-gray-700">
      <Navbar />

      {/* HEADER */}
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-28 sm:px-6 md:pt-32 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-start">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => navigate(breadcrumb.path)}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-[#2563eb] shadow-sm transition hover:bg-blue-50"
            >
              <FiChevronLeft />
              Back to {breadcrumb.label}
            </button>

            {destinationDetail.isTopDestination ||
            (destinationDetail.rating >= 4.5 &&
              destinationDetail.reviewsCount > 5) ? (
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                Top Destination
              </span>
            ) : (
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700 shadow-sm">
                {destinationDetail.category ||
                  destinationDetail.type ||
                  "Attraction"}
              </span>
            )}

            <h1 className="mb-4 max-w-4xl text-2xl font-bold leading-snug tracking-tight text-[#2563eb] sm:text-3xl md:text-4xl lg:text-5xl">
              {destinationDetail.title || destinationDetail.name}
            </h1>

            <p className="mb-6 max-w-2xl text-sm font-light leading-relaxed text-gray-500 sm:text-base md:text-lg">
              {destinationDetail.summary ||
                "Discover the cultural heritage and stunning natural beauty of Lanao del Sur."}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-gray-600 sm:text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-sm tracking-widest text-yellow-400 sm:text-base">
                  {"★".repeat(Math.floor(destinationDetail.rating || 4))}
                  <span className="text-yellow-200">
                    {"★".repeat(
                      5 - Math.floor(destinationDetail.rating || 4)
                    )}
                  </span>
                </span>

                <span className="font-bold text-gray-700">
                  {destinationDetail.rating
                    ? destinationDetail.rating.toFixed(1)
                    : "—"}
                </span>

                <span className="text-gray-400">
                  ({destinationDetail.reviewsCount || 0})
                </span>
              </div>

              <div className="hidden h-4 w-px bg-gray-200 sm:block" />

              <div className="flex items-center gap-1.5 text-gray-500">
                <FiBookmark className="text-sm" />
                <span>{saveCount.toLocaleString()} saves</span>
              </div>

              <div className="hidden h-4 w-px bg-gray-200 sm:block" />

              <div className="flex items-center gap-1.5 text-gray-500">
                <FiMapPin className="text-sm" />
                <span>{shortLocationStr}</span>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-shrink-0 items-center gap-3 sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <button
                onClick={() => setShowSharePanel(!showSharePanel)}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#2563eb] hover:text-[#2563eb] sm:w-auto"
              >
                <FiShare2 className="text-base" />
                Share
              </button>

              {showSharePanel && (
                <div className="absolute left-0 top-12 z-30 w-56 rounded-[16px] border border-gray-200 bg-white p-4 shadow-xl sm:left-auto sm:right-0">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Share this place
                  </p>

                  <div className="space-y-2">
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                        window.location.href
                      )}&text=${encodeURIComponent(
                        destinationDetail.title || destinationDetail.name
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb]"
                    >
                      <FaTwitter className="text-[#1da1f2]" />
                      X
                    </a>

                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                        window.location.href
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb]"
                    >
                      <FaFacebookF className="text-[#1877f2]" />
                      Facebook
                    </a>

                    <button
                      onClick={handleCopyLink}
                      className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb]"
                    >
                      <FaLink className="text-gray-400" />
                      {linkCopied ? "Copied!" : "Copy link"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isLoggedIn && (
              <button
                onClick={() => toggleFavorite(destinationDetail)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-sm transition sm:flex-none ${
                  isFav
                    ? "bg-[#2563eb] text-white hover:bg-blue-700"
                    : "border border-gray-200 bg-white text-gray-700 hover:border-[#2563eb] hover:text-[#2563eb]"
                }`}
              >
                {isFav ? (
                  <MdBookmarkAdded className="text-base" />
                ) : (
                  <MdOutlineBookmarkAdd className="text-base" />
                )}
                {isFav ? "Saved" : "Save"}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* GALLERY (SWIPER MAIN PREVIEW) */}
      <section className="mx-auto mb-12 max-w-7xl px-4 sm:px-6 md:mb-16 lg:px-10">
        <div className="group relative w-full h-[240px] sm:h-[320px] md:h-[460px] lg:h-[540px] cursor-zoom-in overflow-hidden rounded-[20px] border border-blue-100 bg-white p-1.5 shadow-[0_10px_28px_rgba(37,99,235,0.08)] sm:rounded-[24px] sm:p-2 lg:rounded-[28px]">
          <div className="relative h-full w-full overflow-hidden rounded-[16px] bg-blue-50 sm:rounded-[20px] lg:rounded-[24px]">
            <Swiper
              onSwiper={setMainSwiper}
              onSlideChange={(swiper) => setActiveGalleryIndex(swiper.activeIndex)}
              observer={true}
              observeParents={true}
              modules={[Autoplay, Navigation]}
              autoplay={{ delay: 30000, disableOnInteraction: false }}
              speed={1200}
              className="h-full w-full"
            >
              {galleryImages.length > 0 ? (
                galleryImages.map((img, i) => (
                  <SwiperSlide key={i} className="h-full w-full">
                    <img
                      src={img}
                      alt={`${destinationDetail.title || destinationDetail.name} ${i + 1}`}
                      onClick={() => setLightboxOpen(true)}
                      className="h-full w-full cursor-zoom-in object-cover transition-transform duration-700 hover:scale-[1.005]"
                    />
                  </SwiperSlide>
                ))
              ) : (
                <SwiperSlide className="h-full w-full">
                  <img
                    src="/default.jpg"
                    alt={destinationDetail.title || destinationDetail.name}
                    className="h-full w-full object-cover"
                  />
                </SwiperSlide>
              )}
            </Swiper>

            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute bottom-3 right-3 z-20 rounded-full border border-white/70 bg-white px-3 py-1.5 text-[10px] font-semibold text-gray-800 shadow-sm transition hover:bg-blue-50 hover:text-[#2563eb] sm:bottom-4 sm:right-4 sm:px-4 sm:py-2 sm:text-xs"
            >
              View fullscreen
            </button>

            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    mainSwiper?.slidePrev();
                  }}
                  className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all duration-300 hover:bg-white/40 opacity-0 group-hover:opacity-100 sm:left-4 sm:h-12 sm:w-12"
                >
                  <FiChevronLeft className="text-xl sm:text-2xl" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    mainSwiper?.slideNext();
                  }}
                  className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-all duration-300 hover:bg-white/40 opacity-0 group-hover:opacity-100 sm:right-4 sm:h-12 sm:w-12"
                >
                  <FiChevronRight className="text-xl sm:text-2xl" />
                </button>
              </>
            )}

            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 left-0 z-20 w-full px-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:bottom-6 sm:px-6">
                <div className="flex gap-2 overflow-x-auto pb-1 sm:gap-3 justify-center">
                  {galleryImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveGalleryIndex(i);
                        if (mainSwiper) mainSwiper.slideTo(i);
                      }}
                      className={`h-12 w-16 flex-shrink-0 overflow-hidden rounded-[10px] border-2 bg-blue-50 transition-all sm:h-14 sm:w-20 sm:rounded-[12px] md:h-16 md:w-24 ${
                        i === activeGalleryIndex
                          ? "border-white shadow-[0_0_0_2px_rgba(255,255,255,0.4)]"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Gallery ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black p-0"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(false);
            }}
            className="absolute right-5 top-5 z-[100000] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <FiX className="text-2xl" />
          </button>

          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveGalleryIndex((i) =>
                    i === 0 ? galleryImages.length - 1 : i - 1
                  );
                }}
                className="absolute left-4 top-1/2 z-[100000] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <FiChevronLeft className="text-4xl" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveGalleryIndex((i) =>
                    i === galleryImages.length - 1 ? 0 : i + 1
                  );
                }}
                className="absolute right-4 top-1/2 z-[100000] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <FiChevronRight className="text-4xl" />
              </button>
            </>
          )}

          <img
            src={galleryImages[activeGalleryIndex] || "/default.jpg"}
            alt={destinationDetail.title || destinationDetail.name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-screen max-w-screen object-contain"
          />

          {galleryImages.length > 1 && (
            <p className="absolute bottom-5 left-1/2 z-[100000] -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/70">
              {activeGalleryIndex + 1} / {galleryImages.length}
            </p>
          )}
        </div>
      )}

      {/* CONTENT + SIDEBAR */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3 lg:gap-10">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-8 md:p-10">
              <h2 className="mb-6 border-b border-gray-100 pb-4 text-xl font-bold text-[#2563eb] sm:text-2xl">
                About this Destination
              </h2>

              <div className="space-y-5 text-sm leading-[1.8] text-gray-700 sm:text-[1.0625rem] sm:leading-[1.9]">
                {destinationDetail.description ? (
                  destinationDetail.description
                    .split("\n")
                    .map((str, idx) => <p key={idx}>{str}</p>)
                ) : (
                  <p className="text-gray-500">
                    Detailed description is being finalized. Prepare for an
                    unforgettable adventure exploring the wonders of Lanao del
                    Sur.
                  </p>
                )}
              </div>
            </div>

            {/* MAP MOBILE */}
            <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm sm:rounded-[28px] lg:hidden">
              <div className="relative h-[220px] w-full">
                <iframe
                  title="Location Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={mapEmbedUrl}
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>

              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {locationStr}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Lanao del Sur, Philippines
                  </p>
                </div>

                <a
                  href={mapDirectionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#2563eb] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:w-auto"
                >
                  <FaDirections />
                  Directions
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm sm:rounded-[28px] sm:p-6">
              <h3 className="mb-5 font-bold text-gray-700">Key Details</h3>

              <div className="space-y-4">
                {[
                  {
                    icon: <FiMapPin />,
                    label: "Location",
                    value: locationStr,
                    subValue:
                      destinationDetail.location &&
                      typeof destinationDetail.location === "object" &&
                      (destinationDetail.location.street ||
                        destinationDetail.location.barangay)
                        ? [
                            destinationDetail.location.street,
                            destinationDetail.location.barangay,
                            destinationDetail.location.municipality,
                            destinationDetail.location.province,
                          ]
                            .filter(Boolean)
                            .join(", ")
                        : null,
                  },
                  {
                    icon: <FiTag />,
                    label: "Category",
                    value:
                      destinationDetail.type ||
                      destinationDetail.category ||
                      "Tourist Attraction",
                  },
                ].map(({ icon, label, value, subValue }) => (
                  <div key={label} className="flex items-start gap-4">
                    <span className="mt-0.5 flex-shrink-0 text-lg text-[#2563eb]">
                      {icon}
                    </span>

                    <div>
                      <p className="text-xs font-semibold text-gray-700">
                        {label}
                      </p>
                      <p className="mt-0.5 text-sm leading-snug text-gray-500">
                        {subValue || value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RATING CARD — always visible, locked for guests */}
            <div className="relative overflow-hidden rounded-[24px] border border-white/80 bg-white/90 p-5 shadow-sm ring-1 ring-white/60 backdrop-blur-[2px] sm:rounded-[28px] sm:p-6">
              {showPopup && (
                <div className="absolute -top-12 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-gray-700 px-5 py-2.5 text-sm font-semibold text-white shadow-xl">
                  <span className="text-lg leading-none text-green-400">✔</span>
                  Rating submitted!
                </div>
              )}

              <div className="mb-5">
                <h3 className="font-bold text-gray-700">Rate this place</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  Share your thoughts with other travelers.
                </p>
              </div>

              {/* Stars — interactive if logged in, decorative if guest */}
              <div className="flex flex-col items-center rounded-[22px] border border-blue-50 bg-[#f8fbff] p-5 shadow-sm">
                <div className="mb-2 flex gap-1.5 text-3xl sm:gap-2 sm:text-4xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => {
                        if (isLoggedIn && !isSubmitted) {
                          setUserRating(star);
                          setShowLoginNotice(false);
                        }
                      }}
                      className={`transition-all duration-200 ${
                        star <= userRating
                          ? "scale-110 text-yellow-400"
                          : "text-gray-200 hover:text-yellow-200"
                      } ${
                        !isLoggedIn || isSubmitted
                          ? "cursor-default"
                          : "cursor-pointer hover:scale-110"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {!isLoggedIn
                    ? "Sign in to rate this place"
                    : userRating > 0
                    ? `${userRating} out of 5 Stars`
                    : "Select a rating"}
                </p>
              </div>

              {/* Guest lock notice */}
              {!isLoggedIn ? (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-400">
                  <FiLock className="text-base" />
                  Sign in to submit a rating
                </div>
              ) : (
                <>
                  {showLoginNotice && (
                    <div className="mb-4 mt-4 rounded-[22px] border border-red-100 bg-red-50 p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-red-600 shadow-sm">
                          <FiAlertCircle className="text-lg" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-red-700">Login required</p>
                              <p className="mt-1 text-xs leading-relaxed text-red-500">
                                Please log in first before submitting your rating.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowLoginNotice(false)}
                              className="rounded-full p-1 text-red-400 transition hover:bg-white hover:text-red-600"
                            >
                              <FiX />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleRating}
                    disabled={userRating === 0 || isSubmitted}
                    className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                      isSubmitted
                        ? "cursor-default border border-green-200 bg-green-50 text-green-700"
                        : userRating > 0
                        ? "bg-[#2563eb] text-white shadow-sm hover:bg-blue-700"
                        : "cursor-not-allowed bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isSubmitted ? (
                      <>
                        <span className="text-lg leading-none text-green-600">✔</span>
                        Rating Submitted
                      </>
                    ) : (
                      "Submit Rating"
                    )}
                  </button>
                </>
              )}
            </div>

            {/* MAP DESKTOP */}
            <div className="hidden overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm lg:block">
              <div className="relative h-[200px] w-full">
                <iframe
                  title="Location Map"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={mapEmbedUrl}
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    {locationStr}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">Philippines</p>
                </div>

                <a
                  href={mapDirectionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-full bg-[#2563eb] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <FaDirections />
                  Directions
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIMILAR PLACES */}
      {morePlaces.length > 0 && (
        <section className="border-t border-blue-50 bg-[#f3f9ff] px-4 py-16 sm:px-6 md:px-12 md:py-20 lg:px-20 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm">
                  Explore More
                </span>

                <h3 className="mt-4 text-2xl font-bold tracking-tight text-[#2563eb] sm:text-3xl md:text-4xl">
                  Similar Places to Explore
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
                  Discover other places with the same category and travel appeal.
                </p>
              </div>

              {morePlaces.length > 4 && (
                <button
                  onClick={() => navigate("/destinations")}
                  className="hidden items-center gap-2 self-start rounded-full border border-[#2563eb]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#2563eb] shadow-sm transition hover:border-[#2563eb]/40 hover:bg-blue-50 md:flex"
                >
                  View all <FiChevronRight />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {morePlaces.slice(0, 4).map((place) => renderPlaceCard(place))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default PlacesDetails;