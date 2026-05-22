import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";

import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiCalendar,
  FiChevronRight,
  FiClock,
} from "react-icons/fi";

const safeDate = (val) => {
  if (!val) return null;
  if (val?.toDate) return val.toDate();

  const parsed = new Date(val);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (val) => {
  const date = safeDate(val);

  if (!date) return "Date TBA";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getLocation = (event) => {
  if (typeof event.location === "string") return event.location;

  if (event.location?.municipality && event.location?.province) {
    return `${event.location.municipality}, ${event.location.province}`;
  }

  if (event.location?.municipality) return event.location.municipality;

  return "Lanao del Sur";
};

const getShortDescription = (text) => {
  const fallback =
    "Join local experiences and discover meaningful events in Lanao del Sur.";

  if (!text) return fallback;

  const cleanText = String(text).replace(/\s+/g, " ").trim();
  const firstSentence = cleanText.match(/[^.!?]+[.!?]/)?.[0] || cleanText;

  if (firstSentence.length <= 120) return firstSentence;

  return `${firstSentence.slice(0, 120).trim()}...`;
};

function Events() {
  const navigate = useNavigate();
  const location = useLocation();

  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    setSearchTerm("");
    setActiveCategory("all");
    setVisibleCount(10);
  }, [location.key]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "tourismContent"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((item) => {
            const type = String(item.contentType || "").toLowerCase();
            const status = String(item.status || "").toLowerCase();

            return type === "event" && status !== "archived";
          })
          .sort((a, b) => {
            const dateA =
              safeDate(a.eventDate)?.getTime() ||
              safeDate(a.createdAt)?.getTime() ||
              0;

            const dateB =
              safeDate(b.eventDate)?.getTime() ||
              safeDate(b.createdAt)?.getTime() ||
              0;

            return dateB - dateA;
          });

        setEvents(data);
      },
      (error) => {
        console.error("Error fetching events:", error);
      }
    );

    return () => unsubscribe();
  }, [location.key]);

  const categories = useMemo(() => {
    const unique = events
      .map((event) => event.category || event.type || event.eventType)
      .filter(Boolean);

    return ["all", ...new Set(unique)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return events.filter((event) => {
      const title = String(event.title || "").toLowerCase();
      const summary = String(event.summary || "").toLowerCase();
      const category = String(
        event.category || event.type || event.eventType || ""
      ).toLowerCase();
      const location = String(getLocation(event)).toLowerCase();

      const matchesSearch =
        title.includes(term) ||
        summary.includes(term) ||
        category.includes(term) ||
        location.includes(term);

      const matchesCategory =
        activeCategory === "all" ||
        category === String(activeCategory).toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [events, searchTerm, activeCategory]);

  const visibleEvents = filteredEvents.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] font-sans text-gray-900">
      <Navbar />

      {/* HEADER */}
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-28 sm:px-6 md:pb-10 md:pt-32 lg:px-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold text-[#2563eb] shadow-sm backdrop-blur-md">
              <FiCalendar className="text-sm" />
              Lakbay Lanao Events
            </span>

            <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#2563eb] sm:text-4xl md:text-5xl">
              Events & Local Experiences
            </h1>

            <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-gray-500 md:text-base">
              Discover cultural celebrations, community gatherings, tourism
              activities, and upcoming experiences across Lanao del Sur.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/80 px-5 py-3 text-sm font-medium text-gray-600 shadow-sm backdrop-blur-md">
            <FiCalendar className="text-[#2563eb]" />
            {events.length} event{events.length !== 1 ? "s" : ""} available
          </div>
        </div>
      </section>

      {/* FILTER PANEL */}
      <section className="mx-auto mb-10 max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-md md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 rounded-full border border-gray-200/80 bg-white/85 px-5 py-3.5 shadow-sm transition focus-within:border-[#2563eb]/40 focus-within:ring-2 focus-within:ring-blue-100 lg:w-[420px]">
              <FiSearch className="text-xl text-[#2563eb]" />

              <input
                type="text"
                placeholder="Search events, locations, activities..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setVisibleCount(10);
                }}
                className="flex-1 bg-transparent text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveCategory(category);
                    setVisibleCount(10);
                  }}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    activeCategory === category
                      ? "bg-[#2563eb] text-white shadow-sm"
                      : "border border-white/80 bg-white/75 text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
                  }`}
                >
                  {category === "all" ? "All" : category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EVENTS GRID */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-10">
        {filteredEvents.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-gray-200 bg-white/75 py-20 text-center shadow-sm backdrop-blur-md">
            <p className="text-sm font-medium text-gray-400">
              No events found.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {visibleEvents.map((event) => (
                <article
                  key={event.id}
                  onClick={() => navigate(`/event/${event.id}`)}
                  className="group flex min-h-[320px] cursor-pointer flex-col overflow-hidden rounded-[22px] border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_12px_30px_rgba(37,99,235,0.08)] sm:min-h-[370px] sm:rounded-[26px] lg:min-h-[455px] lg:rounded-[30px]"
                >
                  {/* IMAGE */}
                  <div className="p-1.5 pb-0 sm:p-2 sm:pb-0 lg:p-2.5 lg:pb-0">
                    <div className="relative h-[120px] shrink-0 overflow-hidden rounded-[16px] border border-white/70 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.05)] backdrop-blur-sm sm:h-[165px] sm:rounded-[20px] lg:h-[238px] lg:rounded-[24px]">
                      <img
                        src={event.imageURL || "/default.jpg"}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-white/5 to-white/10" />
                      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/20 to-transparent" />
                    </div>
                  </div>

                  {/* CONTENT */}
                  <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5 sm:px-4 sm:pb-4 sm:pt-3.5 lg:px-5 lg:pb-5 lg:pt-4">
                    <h2 className="line-clamp-2 min-h-[34px] text-xs font-bold leading-tight text-[#2563eb] sm:min-h-[40px] sm:text-sm lg:min-h-[46px] lg:text-lg lg:leading-[1.25]">
                      {event.title}
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-medium text-gray-400 sm:text-xs lg:gap-x-4">
                      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                        <FiCalendar className="shrink-0 text-[#2563eb]" />
                        <span className="line-clamp-1">
                          {formatDate(event.eventDate)}
                        </span>
                      </div>

                      {event.eventTime && (
                        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                          <FiClock className="shrink-0 text-[#2563eb]" />
                          <span className="line-clamp-1">
                            {event.eventTime}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="mt-2 line-clamp-4 min-h-[76px] text-[11px] leading-relaxed text-gray-500 sm:line-clamp-4 sm:min-h-[80px] sm:text-xs lg:mt-3 lg:line-clamp-3 lg:min-h-[72px] lg:text-sm lg:leading-6">
                      {getShortDescription(event.summary)}
                    </p>

                    <div className="mt-auto pt-3 sm:pt-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/event/${event.id}`);
                        }}
                        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#2563eb] px-3 py-2 text-[10px] font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md sm:w-fit sm:px-4 sm:text-[11px] lg:gap-2 lg:self-start lg:px-5 lg:py-2.5 lg:text-xs"
                      >
                        <span>View event</span>
                        <FiChevronRight className="hidden lg:block" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {visibleCount < filteredEvents.length && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 10)}
                  className="w-full rounded-full border border-white/80 bg-white/80 px-7 py-3 text-sm font-semibold text-[#2563eb] shadow-sm backdrop-blur-md transition hover:bg-blue-50 sm:w-auto"
                >
                  Load more events
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}

export default Events;