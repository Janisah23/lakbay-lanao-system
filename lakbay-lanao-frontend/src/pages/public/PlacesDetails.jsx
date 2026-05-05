import React, { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import TourismChatbot from "../../components/chatbot/TourismChatbot";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiMapPin,
  FiCalendar,
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
} from "react-icons/fi";
import { MdOutlineBookmarkAdd, MdBookmarkAdded } from "react-icons/md";
import {
  FaHeart,
  FaTwitter,
  FaFacebookF,
  FaLink,
  FaDirections,
} from "react-icons/fa";

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
  query,
  where,
  limit,
} from "firebase/firestore";
import { useFavorites } from "../../components/context/FavoritesContext";

const PlacesDetails = () => {
  const [morePlaces, setMorePlaces] = useState([]);
  const [nearbyHotels, setNearbyHotels] = useState([]);

  const navigate = useNavigate();
  const { id } = useParams();

  const [destinationDetail, setDestinationDetail] = useState(null);

  const [userRating, setUserRating] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showLoginNotice, setShowLoginNotice] = useState(false);

  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
  }, [id]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
        const colRef = collection(db, destinationDetail._source);

        const qMore = query(
          colRef,
          where("type", "==", destinationDetail.type),
          limit(6)
        );

        const snapMore = await getDocs(qMore);
        const itemsMore = snapMore.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setMorePlaces(itemsMore.filter((item) => item.id !== id));

        if (destinationDetail.location?.municipality) {
          const dataColRef = collection(db, "tourismData");

          const qHotels = query(
            dataColRef,
            where(
              "location.municipality",
              "==",
              destinationDetail.location.municipality
            )
          );

          const snapHotels = await getDocs(qHotels);

          const hotelItems = snapHotels.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((item) => {
              const type = String(item.type || "").toLowerCase();
              const cat = String(item.category || "").toLowerCase();

              const isHotel =
                type === "hotel" ||
                type === "resort" ||
                type === "inn" ||
                type === "accommodation" ||
                cat === "hotel";

              return isHotel && item.id !== id;
            });

          setNearbyHotels(hotelItems.slice(0, 4));
        }
      } catch (error) {
        console.error("Error fetching related data:", error);
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

  const getBreadcrumbData = () => {
    if (!destinationDetail) {
      return { label: "Destinations", path: "/destinations" };
    }

    const cat = String(
      destinationDetail.category || destinationDetail.contentType || ""
    ).toLowerCase();

    if (cat.includes("establishment")) {
      return { label: "Establishments", path: "/establishment" };
    }

    if (cat.includes("landmark")) {
      return { label: "Landmarks", path: "/landmarks" };
    }

    if (cat.includes("cultural") || cat.includes("heritage")) {
      return { label: "Cultural Heritage", path: "/cultural" };
    }

    return { label: "Destinations", path: "/destinations" };
  };

  const renderPlaceCard = (place, buttonLabel = "View place") => (
    <article
      key={place.id}
      onClick={() => navigate(`/destination/${place.id}`)}
      className="group flex h-full min-h-[330px] cursor-pointer flex-col overflow-hidden rounded-[30px] border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)]"
    >
      <div className="p-2.5 pb-0">
        <div className="relative h-[190px] overflow-hidden rounded-[24px] border border-white/70 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.05)] backdrop-blur-sm">
          <img
            src={place.imageURL || "/default.jpg"}
            alt={place.title || place.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-white/5 to-white/10" />
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/20 to-transparent" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(place);
            }}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/95 shadow-sm backdrop-blur-md transition hover:bg-blue-50"
          >
            {favorites.some((fav) => String(fav.id) === String(place.id)) ? (
              <FaHeart className="text-sm text-[#2563eb]" />
            ) : (
              <FiHeart className="text-sm text-gray-500" />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-4">
        <span className="mb-2 self-start rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
          {place.type || place.category || "Place"}
        </span>

        <h4 className="line-clamp-2 min-h-[44px] text-base font-bold leading-snug text-[#2563eb] transition group-hover:text-blue-700">
          {place.name || place.title}
        </h4>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/destination/${place.id}`);
          }}
          className="mt-auto inline-flex items-center gap-2 self-start rounded-full bg-[#2563eb] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
        >
          {buttonLabel} <FiChevronRight />
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

  const galleryImages = [
    destinationDetail.imageURL,
    ...(destinationDetail.galleryImages || []),
  ].filter(Boolean);

  const mapQuery = destinationDetail?.location
    ? encodeURIComponent(
        `${destinationDetail.location.municipality || ""}, ${
          destinationDetail.location.province || "Lanao del Sur"
        }, Philippines`
      )
    : encodeURIComponent("Lanao del Sur, Philippines");

  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&output=embed`;
  const mapDirectionsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  const locationStr = destinationDetail.location
    ? `${destinationDetail.location.municipality}, ${destinationDetail.location.province}`
    : "Lanao del Sur";

  const saveCount = destinationDetail.saveCount || 0;

  return (
    <div className="font-sans min-h-screen bg-[#f3f9ff] text-gray-900">
      <Navbar />

      {/* HEADER */}
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-32">
        

        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="min-w-0 flex-1">
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

            <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-[#2563eb] md:text-5xl">
              {destinationDetail.title || destinationDetail.name}
            </h1>

            <p className="mb-6 max-w-2xl text-lg font-light leading-relaxed text-gray-500">
              {destinationDetail.summary ||
                "Discover the cultural heritage and stunning natural beauty of Lanao del Sur."}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="text-base tracking-widest text-yellow-400">
                  {"★".repeat(Math.floor(destinationDetail.rating || 4))}
                  <span className="text-yellow-200">
                    {"★".repeat(
                      5 - Math.floor(destinationDetail.rating || 4)
                    )}
                  </span>
                </span>

                <span className="font-bold text-gray-900">
                  {destinationDetail.rating
                    ? destinationDetail.rating.toFixed(1)
                    : "—"}
                </span>

                <span className="text-gray-400">
                  ({destinationDetail.reviewsCount || 0})
                </span>
              </div>

              <div className="h-4 w-px bg-gray-200" />

              <div className="flex items-center gap-1.5 text-gray-500">
                <FiBookmark className="text-sm" />
                <span>{saveCount.toLocaleString()} saves</span>
              </div>

              <div className="h-4 w-px bg-gray-200" />

              <div className="flex items-center gap-1.5 text-gray-500">
                <FiMapPin className="text-sm" />
                <span>{locationStr}</span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-shrink-0 items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowSharePanel(!showSharePanel)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#2563eb] hover:text-[#2563eb]"
              >
                <FiShare2 className="text-base" />
                Share
              </button>

              {showSharePanel && (
                <div className="absolute right-0 top-12 z-30 w-56 rounded-[16px] border border-gray-200 bg-white p-4 shadow-xl">
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
                      Twitter / X
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

            <button
              onClick={() => toggleFavorite(destinationDetail)}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-sm transition ${
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
          </div>
        </div>
      </section>

      {/* GALLERY */}
     
      <section className="mx-auto mb-16 max-w-7xl px-6">
        <div
          onClick={() => setLightboxOpen(true)}
          className="group relative h-[320px] w-full cursor-zoom-in overflow-hidden rounded-[28px] border border-blue-100 bg-white p-2 shadow-[0_10px_28px_rgba(37,99,235,0.08)] md:h-[460px] lg:h-[540px]"
        >
          <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-blue-50">
            <img
              src={galleryImages[activeGalleryIndex] || "/default.jpg"}
              alt={destinationDetail.title || destinationDetail.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.005]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

            {/* Fullscreen button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              className="absolute bottom-4 right-4 rounded-full border border-white/70 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-blue-50 hover:text-[#2563eb]"
            >
              View fullscreen
            </button>

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveGalleryIndex((i) => Math.max(i - 1, 0));
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-white/95 p-2 shadow-sm transition hover:bg-blue-50"
                >
                  <FiChevronLeft className="text-lg text-gray-700" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveGalleryIndex((i) =>
                      Math.min(i + 1, galleryImages.length - 1)
                    );
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-white/95 p-2 shadow-sm transition hover:bg-blue-50"
                >
                  <FiChevronRight className="text-lg text-gray-700" />
                </button>

                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2"
                >
                  {galleryImages.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveGalleryIndex(i)}
                      className={`rounded-full transition-all ${
                        i === activeGalleryIndex
                          ? "h-2 w-6 bg-white"
                          : "h-2 w-2 bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {galleryImages.length > 1 && (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {galleryImages.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveGalleryIndex(i)}
                className={`h-14 w-20 flex-shrink-0 overflow-hidden rounded-[14px] border-2 bg-blue-50 transition ${
                  i === activeGalleryIndex
                    ? "border-[#2563eb] shadow-md"
                    : "border-transparent opacity-60 hover:opacity-90"
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
        )}
      </section>

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/92 p-4">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-sm transition hover:bg-white/20"
          >
            <FiX className="text-2xl" />
          </button>

          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setActiveGalleryIndex((i) =>
                    i === 0 ? galleryImages.length - 1 : i - 1
                  )
                }
                className="absolute left-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-sm transition hover:bg-white/20"
              >
                <FiChevronLeft className="text-4xl" />
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveGalleryIndex((i) =>
                    i === galleryImages.length - 1 ? 0 : i + 1
                  )
                }
                className="absolute right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-sm transition hover:bg-white/20"
              >
                <FiChevronRight className="text-4xl" />
              </button>
            </>
          )}

          <div className="w-full max-w-6xl">
            <img
              src={galleryImages[activeGalleryIndex] || "/default.jpg"}
              alt={destinationDetail.title || destinationDetail.name}
              className="mx-auto max-h-[88vh] max-w-full rounded-[18px] object-contain shadow-2xl"
            />
          </div>

          {galleryImages.length > 1 && (
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/70">
              {activeGalleryIndex + 1} / {galleryImages.length}
            </p>
          )}
        </div>
      )}

      {/* LIGHTBOX */}
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
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm md:p-10">
              <h2 className="mb-6 border-b border-gray-100 pb-4 text-2xl font-bold text-[#2563eb]">
                About this Destination
              </h2>

              <div className="space-y-5 text-[1.0625rem] leading-[1.9] text-gray-700">
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

              <div className="mt-10 flex items-start gap-4 rounded-[16px] border border-blue-100 bg-blue-50 p-5">
                <FiInfo className="mt-0.5 flex-shrink-0 text-xl text-[#2563eb]" />

                <div>
                  <p className="mb-1 text-sm font-bold text-[#2563eb]">
                    Entrance / Admission Details
                  </p>

                  <p className="text-sm leading-relaxed text-blue-800">
                    {destinationDetail.price ||
                      destinationDetail.admissionFee ||
                      "This destination is open to the public free of charge. Local environmental fees may apply."}
                  </p>
                </div>
              </div>
            </div>

            {/* MAP MOBILE */}
            <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm lg:hidden">
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

              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
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
                  className="flex items-center gap-2 rounded-full bg-[#2563eb] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <FaDirections />
                  Directions
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-5 font-bold text-gray-900">Key Details</h3>

              <div className="space-y-4">
                {[
                  {
                    icon: <FiMapPin />,
                    label: "Location",
                    value: locationStr,
                  },
                  {
                    icon: <FiTag />,
                    label: "Category",
                    value:
                      destinationDetail.type ||
                      destinationDetail.category ||
                      "Tourist Attraction",
                  },
                  {
                    icon: <FiSun />,
                    label: "Best Time to Visit",
                    value:
                      destinationDetail.bestTime ||
                      "Early morning or late afternoon",
                  },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4">
                    <span className="mt-0.5 flex-shrink-0 text-lg text-[#2563eb]">
                      {icon}
                    </span>

                    <div>
                      <p className="text-xs font-semibold text-gray-900">
                        {label}
                      </p>
                      <p className="mt-0.5 text-sm leading-snug text-gray-500">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RATING */}
            <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-sm ring-1 ring-white/60 backdrop-blur-[2px]">
              {showPopup && (
                <div className="absolute -top-12 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xl">
                  <span className="text-lg leading-none text-green-400">
                    ✔
                  </span>
                  Rating submitted!
                </div>
              )}

              <div className="mb-5">
                <h3 className="font-bold text-gray-900">Rate this place</h3>

                <p className="mt-1 text-sm leading-relaxed text-gray-400">
                  Share your thoughts with other travelers.
                </p>
              </div>

              {showLoginNotice && (
                <div className="mb-5 rounded-[22px] border border-red-100 bg-red-50 p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-red-600 shadow-sm">
                      <FiAlertCircle className="text-lg" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-red-700">
                            Login required
                          </p>

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

              <div className="flex flex-col items-center rounded-[22px] border border-blue-50 bg-[#f8fbff] p-5 shadow-sm">
                <div className="mb-2 flex gap-2 text-4xl">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => {
                        if (!isSubmitted) {
                          setUserRating(star);
                          setShowLoginNotice(false);
                        }
                      }}
                      className={`transition-all duration-200 ${
                        star <= userRating
                          ? "scale-110 text-yellow-400"
                          : "text-gray-200 hover:text-yellow-200"
                      } ${
                        isSubmitted
                          ? "cursor-default"
                          : "cursor-pointer hover:scale-110"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {userRating > 0
                    ? `${userRating} out of 5 Stars`
                    : "Select a rating"}
                </p>
              </div>

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
                    <span className="text-lg leading-none text-green-600">
                      ✔
                    </span>
                    Rating Submitted
                  </>
                ) : (
                  "Submit Rating"
                )}
              </button>
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
                  <p className="text-sm font-semibold text-gray-900">
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

      {/* NEARBY HOTELS */}
      {nearbyHotels.length > 0 && (
        <section className="border-t border-blue-50 bg-[#f3f9ff] px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm">
                  Recommended Stays
                </span>

                <h3 className="mt-4 text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
                  Hotels Near{" "}
                  {destinationDetail.location?.municipality || "This Place"}
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
                  Top-rated accommodations to rest and recharge during your
                  visit.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {nearbyHotels.map((place) => renderPlaceCard(place, "View stay"))}
            </div>
          </div>
        </section>
      )}

      {/* MORE TO EXPLORE */}
      {morePlaces.length > 0 && (
        <section className="border-t border-blue-50 bg-[#f3f9ff] px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm">
                  Explore More
                </span>

                <h3 className="mt-4 text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
                  Similar Places to Explore
                </h3>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
                  Discover other stunning destinations with the same travel
                  appeal.
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

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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