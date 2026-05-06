import React, { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import { useNavigate, useParams } from "react-router-dom";
import {
  FiMapPin,
  FiCalendar,
  FiInfo,
  FiShare2,
  FiBookmark,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiX,
} from "react-icons/fi";
import { MdOutlineBookmarkAdd, MdBookmarkAdded } from "react-icons/md";
import { FaTwitter, FaFacebookF, FaLink } from "react-icons/fa";

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

const EventDetails = () => {
  const [morePlaces, setMorePlaces] = useState([]);
  const navigate = useNavigate();
  const { id } = useParams();
  const [eventDetail, setEventDetail] = useState(null);

  const [userRating, setUserRating] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showLoginNotice, setShowLoginNotice] = useState(false);

  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  const [showSharePanel, setShowSharePanel] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const { favorites } = useFavorites();
  const isFav = favorites.some((fav) => String(fav.id) === String(id));

  useEffect(() => {
    setEventDetail(null);
    setActiveGalleryIndex(0);
    setShowSharePanel(false);
    setLinkCopied(false);
    setShowLoginNotice(false);
    setShowPopup(false);
  }, [id]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && id) {
        try {
          const reviewRef = doc(db, "tourismContent", id, "reviews", user.uid);
          const reviewSnap = await getDoc(reviewRef);

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
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, "tourismContent", id);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          setEventDetail({ id: snap.id, ...snap.data() });
          setActiveGalleryIndex(0);
          await updateDoc(docRef, { viewCount: increment(1) }).catch(() => {});
        }
      } catch (error) {
        console.error("Error fetching event:", error);
      }
    };

    if (id) fetchEvent();
  }, [id]);

  useEffect(() => {
    if (!eventDetail) return;

    const fetchMorePlaces = async () => {
      try {
        const snap = await getDocs(collection(db, "tourismContent"));
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        setMorePlaces(
          items.filter(
            (item) =>
              String(item.id) !== String(id) &&
              String(item.contentType || "").toLowerCase() ===
                String(eventDetail.contentType || "").toLowerCase() &&
              String(item.status || "").toLowerCase() !== "archived"
          )
        );
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchMorePlaces();
  }, [eventDetail, id]);

  const toggleFavorite = async (item) => {
    const user = auth.currentUser;

    if (!user) {
      setShowLoginNotice(true);
      return;
    }

    const favRef = doc(db, "users", user.uid, "favorites", item.id);

    if (isFav) {
      await deleteDoc(favRef);
      await updateDoc(doc(db, "tourismContent", item.id), {
        saveCount: increment(-1),
      }).catch(() => {});
    } else {
      await setDoc(favRef, item);
      await updateDoc(doc(db, "tourismContent", item.id), {
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
    if (!eventDetail) return;

    try {
      const reviewRef = doc(
        db,
        "tourismContent",
        eventDetail.id,
        "reviews",
        user.uid
      );

      await setDoc(reviewRef, {
        userId: user.uid,
        rating: userRating,
        createdAt: serverTimestamp(),
      });

      const currentRating = eventDetail.rating || 0;
      const currentCount = eventDetail.reviewsCount || 0;
      const newCount = currentCount + 1;
      const newAverage =
        (currentRating * currentCount + userRating) / newCount;

      const placeRef = doc(db, "tourismContent", eventDetail.id);

      await updateDoc(placeRef, {
        rating: newAverage,
        reviewsCount: newCount,
        isTopDestination: newAverage >= 4.5 && newCount >= 5,
      });

      setEventDetail((prev) => ({
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

  const handleMoreEventClick = (eventId) => {
    setActiveGalleryIndex(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/event/${eventId}`);
  };

  const safeDate = (value) => {
    if (!value) return null;
    if (value?.toDate) return value.toDate();

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatEventDate = (value) => {
    const date = safeDate(value);

    if (!date) return "TBA";

    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getEventLocation = (event) => {
    if (!event?.location) return "Lanao del Sur";

    if (typeof event.location === "string") return event.location;

    if (event.location?.municipality && event.location?.province) {
      return `${event.location.municipality}, ${event.location.province}`;
    }

    return event.location?.municipality || "Lanao del Sur";
  };

  const getEventTitle = (event) => {
    return event?.title || event?.name || "Untitled Event";
  };

  if (!eventDetail) {
    return (
      <div className="font-sans flex min-h-screen items-center justify-center bg-[#f3f9ff]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-[#2563eb]" />
          <p className="mt-4 font-medium text-gray-500">Loading details...</p>
        </div>
      </div>
    );
  }

  const galleryImages = [
    eventDetail.imageURL,
    ...(eventDetail.galleryImages || []),
  ].filter(Boolean);

  const formattedDate = formatEventDate(eventDetail.eventDate);
  const locationStr = getEventLocation(eventDetail);
  const saveCount = eventDetail.saveCount || 0;

  const MoreEventCard = ({ event }) => {
    const title = getEventTitle(event);

    return (
      <article
        onClick={() => handleMoreEventClick(event.id)}
        className="group flex h-full min-h-[330px] cursor-pointer flex-col overflow-hidden rounded-[30px] border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)]"
      >
        <div className="p-2.5 pb-0">
          <div className="relative h-[190px] overflow-hidden rounded-[24px] border border-white/70 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.05)] backdrop-blur-sm">
            <img
              src={event.imageURL || "/default.jpg"}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-white/5 to-white/10" />
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/20 to-transparent" />

            <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm backdrop-blur-md">
              {event.category || event.eventType || "Event"}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-6 pb-6 pt-4">
          <h4 className="line-clamp-2 min-h-[46px] text-base font-bold leading-snug text-[#2563eb] transition group-hover:text-blue-700">
            {title}
          </h4>

          <div className="mt-auto pt-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-400">
              <FiCalendar className="shrink-0 text-[#2563eb]" />
              <span className="line-clamp-1">
                {formatEventDate(event.eventDate)}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleMoreEventClick(event.id);
              }}
              className="inline-flex items-center gap-2 self-start rounded-full bg-[#2563eb] px-5 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
            >
              View event <FiChevronRight />
            </button>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="font-sans min-h-screen bg-[#f3f9ff] text-gray-900">
      <Navbar />

      {/* HEADER */}
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-32">
        

        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="min-w-0 flex-1">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700 shadow-sm">
              <FiCalendar className="text-xs" />
              Event Experience
            </span>

            <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-[#2563eb] md:text-5xl">
              {eventDetail.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <span className="text-base tracking-widest text-yellow-400">
                  {"★".repeat(Math.floor(eventDetail.rating || 4))}
                  <span className="text-yellow-200">
                    {"★".repeat(5 - Math.floor(eventDetail.rating || 4))}
                  </span>
                </span>

                <span className="font-bold text-gray-900">
                  {eventDetail.rating ? eventDetail.rating.toFixed(1) : "—"}
                </span>

                <span className="text-gray-400">
                  ({eventDetail.reviewsCount || 0})
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
                    Share this event
                  </p>

                  <div className="space-y-2">
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                        window.location.href
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
              onClick={() => toggleFavorite(eventDetail)}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-sm transition ${
                isFav
                  ? "bg-[#2563eb] text-white hover:bg-blue-700"
                  : "border border-gray-200 bg-white text-gray-700 hover:border-[#2563eb] hover:text-[#2563eb]"
              }`}
            >
              {isFav ? <MdBookmarkAdded /> : <MdOutlineBookmarkAdd />}
              {isFav ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="mx-auto mb-16 max-w-7xl px-6">
        <div className="relative h-[320px] w-full overflow-hidden rounded-[28px] border border-white/80 bg-white/80 p-2 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-sm md:h-[460px] lg:h-[540px]">
          <div className="relative h-full w-full overflow-hidden rounded-[24px]">
            <img
              src={galleryImages[activeGalleryIndex] || "/default.jpg"}
              alt={eventDetail.title}
              className="h-full w-full object-cover transition-opacity duration-500"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setActiveGalleryIndex((i) => Math.max(i - 1, 0))
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow transition hover:bg-white"
                >
                  <FiChevronLeft className="text-lg text-gray-700" />
                </button>

                <button
                  onClick={() =>
                    setActiveGalleryIndex((i) =>
                      Math.min(i + 1, galleryImages.length - 1)
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow transition hover:bg-white"
                >
                  <FiChevronRight className="text-lg text-gray-700" />
                </button>

                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {galleryImages.map((_, i) => (
                    <button
                      key={i}
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
      </section>

      {/* CONTENT + SIDEBAR */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-[28px] border border-gray-200 bg-white p-8 shadow-sm md:p-10">
              <h2 className="mb-6 border-b border-gray-100 pb-4 text-2xl font-bold text-[#2563eb]">
                About this Experience
              </h2>

              {eventDetail.summary && (
                <div className="mb-10">
                  <div className="article-summary rounded-2xl border border-blue-50 bg-[#f8fbff] p-6 text-[1rem] leading-[1.8] text-gray-600 shadow-sm md:p-8">
                    <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#2563eb]">
                      <span className="h-[1px] w-8 bg-[#2563eb]" />
                      Event Overview
                    </h3>

                    <div className="space-y-3">
                      {eventDetail.summary.split("\n").map((str, idx) => (
                        <p key={idx} className="last:mb-0">
                          {str}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-10 flex items-start gap-4 rounded-[16px] border border-blue-100 bg-blue-50 p-5">
                <FiInfo className="mt-0.5 flex-shrink-0 text-xl text-[#2563eb]" />

                <div>
                  <p className="mb-1 text-sm font-bold text-[#2563eb]">
                    Admission Details
                  </p>

                  <p className="text-sm leading-relaxed text-blue-800">
                    {eventDetail.price || "Free Admission"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-5 font-bold text-gray-900">Key Details</h3>

              <div className="space-y-4">
                {[
                  {
                    icon: <FiCalendar />,
                    label: "Date",
                    value: formattedDate,
                  },
                  {
                    icon: <FiMapPin />,
                    label: "Location",
                    value: locationStr,
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

            {/* RATING / FEEDBACK CARD */}
            <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-sm ring-1 ring-white/60 backdrop-blur-[2px]">
              {showPopup && (
                <div className="absolute -top-12 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xl">
                  ✔ Rating submitted!
                </div>
              )}

              <div className="mb-5">
                <h3 className="font-bold text-gray-900">
                  Rate your experience
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-gray-400">
                  Share your feedback with other travelers.
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
                    ? `${userRating} out of 5 stars`
                    : "Select a rating"}
                </p>
              </div>

              <button
                onClick={handleRating}
                disabled={userRating === 0 || isSubmitted}
                className={`mt-4 w-full rounded-full py-3 text-sm font-semibold transition-all duration-300 ${
                  isSubmitted
                    ? "cursor-default border border-green-100 bg-green-50 text-green-700"
                    : userRating > 0
                    ? "bg-[#2563eb] text-white shadow-sm hover:bg-blue-700"
                    : "cursor-not-allowed bg-gray-100 text-gray-400"
                }`}
              >
                {isSubmitted ? "Rating Submitted" : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MORE EVENTS */}
      <section className="border-t border-blue-50 bg-[#f3f9ff] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm">
                Nearby
              </span>

              <h3 className="mt-4 text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
                More Events to Explore
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
                Discover more cultural gatherings, celebrations, and community
                experiences around Lanao del Sur.
              </p>
            </div>

            <button
              onClick={() => navigate("/events")}
              className="hidden items-center gap-2 self-start rounded-full border border-[#2563eb]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#2563eb] shadow-sm transition hover:border-[#2563eb]/40 hover:bg-blue-50 md:flex"
            >
              View all events <FiChevronRight />
            </button>
          </div>

          {morePlaces.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-blue-100 bg-white/85 py-16 text-center shadow-sm backdrop-blur-sm">
              <p className="text-sm font-medium text-gray-400">
                No more events available.
              </p>
            </div>
          ) : (
            <div className="rounded-[28px] border border-white/75 bg-white/70 p-5 shadow-sm backdrop-blur-md md:p-7">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {morePlaces.slice(0, 4).map((event) => (
                  <MoreEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => navigate("/events")}
            className="mt-8 flex items-center justify-center gap-2 rounded-full border border-[#2563eb]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#2563eb] shadow-sm transition hover:border-[#2563eb]/40 hover:bg-blue-50 md:hidden"
          >
            View all events <FiChevronRight />
          </button>
        </div>
      </section>

      <style jsx>{`
        .article-body p,
        .article-summary p {
          margin-bottom: 1.25rem;
        }

        .article-body li,
        .article-summary li {
          margin-bottom: 0.75rem;
          padding-left: 0.5rem;
          font-weight: 400;
        }
      `}</style>

      
      <Footer />
    </div>
  );
};

export default EventDetails;