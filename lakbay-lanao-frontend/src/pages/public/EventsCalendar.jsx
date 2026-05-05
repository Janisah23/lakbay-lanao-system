import { useEffect, useMemo, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import TourismChatbot from "../../components/chatbot/TourismChatbot";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiChevronRight,
  FiMapPin,
  FiStar,
  FiX,
} from "react-icons/fi";

const safeDate = (val) => {
  if (!val) return null;

  if (val?.toDate) return val.toDate();

  const parsed = new Date(val);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const sameDay = (a, b) => {
  if (!a || !b) return false;
  return a.toDateString() === b.toDateString();
};

const formatDate = (val) => {
  const date = safeDate(val);

  if (!date) return "Date TBA";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatShortDate = (val) => {
  const date = safeDate(val);

  if (!date) return "TBA";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatLocation = (location) => {
  if (!location) return "Lanao del Sur";

  if (typeof location === "string") return location;

  return `${location.municipality || ""}${
    location.municipality && location.province ? ", " : ""
  }${location.province || "Lanao del Sur"}`;
};

const getEventTitle = (event) => {
  return event?.title || event?.name || "Untitled Event";
};

function EventsCalendar() {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "tourismContent"),
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((item) => {
            const type = String(item.contentType || "").toLowerCase();
            const status = String(item.status || "").toLowerCase();

            return type === "event" && status !== "archived";
          })
          .sort((a, b) => {
            const dateA = safeDate(a.eventDate)?.getTime() || 0;
            const dateB = safeDate(b.eventDate)?.getTime() || 0;
            return dateB - dateA;
          });

        setEvents(data);
      },
      (error) => {
        console.error("Events calendar load error:", error);
      }
    );

    return () => unsub();
  }, []);

  const selectedEvents = useMemo(() => {
    return events.filter((event) => sameDay(safeDate(event.eventDate), date));
  }, [events, date]);

  const featuredEvent = events[0];

  const eventMap = useMemo(() => {
    const map = {};

    events.forEach((event) => {
      const eventDate = safeDate(event.eventDate);
      if (!eventDate) return;

      const key = eventDate.toDateString();
      map[key] = (map[key] || 0) + 1;
    });

    return map;
  }, [events]);

  return (
    <div className="font-sans min-h-screen bg-[#f3f9ff] text-gray-900">
      <style>{`
        .lakbay-calendar .react-calendar {
          width: 100%;
          border: none;
          background: transparent;
          font-family: inherit;
        }

        .lakbay-calendar .react-calendar__navigation {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
        }

        .lakbay-calendar .react-calendar__navigation button {
          min-width: 42px;
          border-radius: 999px;
          padding: 10px;
          font-weight: 700;
          color: #2563eb;
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(219, 234, 254, 0.85);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.04);
          transition: all 0.2s ease;
        }

        .lakbay-calendar .react-calendar__navigation button:hover,
        .lakbay-calendar .react-calendar__navigation button:focus {
          background: #eff6ff;
          box-shadow: 0 6px 14px rgba(37, 99, 235, 0.07);
        }

        .lakbay-calendar .react-calendar__navigation button:disabled {
          background: rgba(248, 251, 255, 0.8);
          color: #cbd5e1;
          box-shadow: none;
        }

        .lakbay-calendar .react-calendar__month-view__weekdays {
          margin-bottom: 8px;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .lakbay-calendar .react-calendar__month-view__weekdays abbr {
          text-decoration: none;
        }

        .lakbay-calendar .react-calendar__tile {
          position: relative;
          height: 58px;
          border-radius: 18px;
          color: #334155;
          transition: all 0.2s ease;
        }

        .lakbay-calendar .react-calendar__tile:hover {
          background: #eff6ff;
          color: #2563eb;
        }

        .lakbay-calendar .react-calendar__tile--now {
          background: #dbeafe;
          color: #2563eb;
          font-weight: 700;
        }

        .lakbay-calendar .react-calendar__tile--active {
          background: #2563eb !important;
          color: white !important;
          font-weight: 700;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.16);
        }

        .lakbay-calendar .react-calendar__tile--active .event-dot {
          background: white;
        }

        .lakbay-calendar .react-calendar__month-view__days__day--neighboringMonth {
          color: #cbd5e1;
        }
      `}</style>

      <Navbar />

      {/* HEADER */}
      <section className="mx-auto max-w-7xl px-6 pb-10 pt-32">
       
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="min-w-0 flex-1">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#2563eb] shadow-sm">
              <FiCalendar className="text-xs" />
              Lakbay Lanao Events
            </span>

            <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-[#2563eb] md:text-5xl">
              Events Calendar
            </h1>

            <p className="max-w-2xl leading-relaxed text-gray-500">
              Discover festivals, cultural gatherings, local celebrations, and
              tourism activities across Lanao del Sur.
            </p>
          </div>

          <div className="rounded-full border border-white/80 bg-white/90 px-5 py-3 text-sm font-medium text-gray-600 shadow-sm ring-1 ring-white/60 backdrop-blur-[2px]">
            {events.length} event{events.length !== 1 ? "s" : ""} available
          </div>
        </div>
      </section>

      {/* FEATURED EVENT */}
   
      {featuredEvent && (
        <section className="mx-auto mb-12 max-w-7xl px-6">
          <div className="overflow-hidden rounded-[30px] border border-white/80 bg-white/85 p-2.5 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-[2px]">
            <div className="grid overflow-hidden rounded-[24px] bg-white md:grid-cols-[300px_1fr]">
              <div className="relative h-[220px] overflow-hidden bg-blue-50 md:h-[260px]">
                <img
                  src={featuredEvent.imageURL || "/default.jpg"}
                  alt={getEventTitle(featuredEvent)}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.005]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/5 to-transparent" />

                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm">
                  {featuredEvent.category || "Event"}
                </span>
              </div>

              <div className="p-6 md:p-8">
                <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#2563eb]">
                  <FiStar />
                  Featured Event
                </span>

                <h2 className="line-clamp-2 text-2xl font-bold tracking-tight text-[#2563eb] md:text-3xl">
                  {getEventTitle(featuredEvent)}
                </h2>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <FiCalendar className="text-[#2563eb]" />
                    <span>{formatDate(featuredEvent.eventDate)}</span>
                  </div>

                  <div className="hidden h-4 w-px bg-gray-200 sm:block" />

                  <div className="flex items-center gap-1.5">
                    <FiMapPin className="text-[#2563eb]" />
                    <span>{formatLocation(featuredEvent.location)}</span>
                  </div>
                </div>

                <p className="mt-4 line-clamp-2 max-w-3xl text-sm leading-6 text-gray-500">
                  {featuredEvent.summary || "Explore this featured local event."}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => setSelectedEvent(featuredEvent)}
                    className="rounded-full bg-[#2563eb] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => navigate(`/event/${featuredEvent.id}`)}
                    className="rounded-full border border-[#2563eb]/20 bg-white px-5 py-2.5 text-sm font-medium text-[#2563eb] shadow-sm transition hover:border-[#2563eb]/40 hover:bg-blue-50"
                  >
                    Open Full Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-3">
          {/* LEFT */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-sm ring-1 ring-white/60 backdrop-blur-[2px] md:p-8">
              <div className="mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold text-[#2563eb]">
                  Choose a Date
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Blue dots show days with available events.
                </p>
              </div>

              <div className="lakbay-calendar rounded-[24px] border border-white/80 bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_8px_20px_rgba(37,99,235,0.04)] backdrop-blur-[2px] md:p-6">
                <Calendar
                  onChange={setDate}
                  value={date}
                  tileContent={({ date }) => {
                    const count = eventMap[date.toDateString()];

                    return count ? (
                      <div className="mt-1 flex justify-center">
                        <span className="event-dot h-2 w-2 rounded-full bg-[#2563eb]" />
                      </div>
                    ) : null;
                  }}
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-sm ring-1 ring-white/60 backdrop-blur-[2px] md:p-8">
              <div className="mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold text-[#2563eb]">
                  Events on Selected Date
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {date.toDateString()}
                </p>
              </div>

              {selectedEvents.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-blue-100 bg-[#f8fbff] p-10 text-center">
                  <FiCalendar className="mx-auto mb-3 text-3xl text-gray-300" />
                  <p className="text-sm font-medium text-gray-400">
                    No events for this date.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {selectedEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="group flex w-full gap-4 rounded-[24px] border border-white/80 bg-white/90 p-4 text-left shadow-sm ring-1 ring-white/60 backdrop-blur-[2px] transition hover:border-blue-100 hover:bg-blue-50/50"
                    >
                      <img
                        src={event.imageURL || "/default.jpg"}
                        alt={getEventTitle(event)}
                        className="h-24 w-24 rounded-[20px] bg-blue-50 object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                          {event.category || "Event"}
                        </span>

                        <h3 className="mt-2 line-clamp-1 font-bold text-[#2563eb]">
                          {getEventTitle(event)}
                        </h3>

                        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-400">
                          <FiMapPin className="text-[#2563eb]" />
                          <span className="line-clamp-1">
                            {formatLocation(event.location)}
                          </span>
                        </div>
                      </div>

                      <FiChevronRight className="mt-9 text-gray-400 transition group-hover:text-[#2563eb]" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-sm ring-1 ring-white/60 backdrop-blur-[2px]">
              <h3 className="mb-2 font-bold text-gray-900">Selected Date</h3>
              <p className="text-sm text-gray-500">{date.toDateString()}</p>

              <div className="mt-5 flex items-start gap-4 rounded-[16px] border border-blue-100 bg-blue-50 p-5">
                <FiCalendar className="mt-0.5 flex-shrink-0 text-xl text-[#2563eb]" />

                <div>
                  <p className="mb-1 text-sm font-bold text-[#2563eb]">
                    Event Count
                  </p>

                  <p className="text-sm leading-relaxed text-blue-800">
                    {selectedEvents.length} event
                    {selectedEvents.length !== 1 ? "s" : ""} available
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-sm ring-1 ring-white/60 backdrop-blur-[2px]">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">All Events</h3>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563eb]">
                  {events.length}
                </span>
              </div>

              {events.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-blue-100 bg-[#f8fbff] p-6 text-center">
                  <FiCalendar className="mx-auto mb-3 text-2xl text-gray-300" />

                  <p className="text-sm text-gray-400">
                    No events found. Check contentType, status, and eventDate.
                  </p>
                </div>
              ) : (
                <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                  {events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full rounded-[18px] border border-white/80 bg-white/90 p-4 text-left shadow-sm ring-1 ring-white/60 transition hover:border-blue-100 hover:bg-blue-50/60"
                    >
                      <p className="line-clamp-2 text-sm font-semibold text-[#2563eb]">
                        {getEventTitle(event)}
                      </p>

                      <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                        <FiCalendar className="text-[#2563eb]" />
                        <span>{formatShortDate(event.eventDate)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/40 px-6 backdrop-blur-sm">
          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/80 bg-white/95 p-2.5 shadow-xl ring-1 ring-white/60 backdrop-blur-[2px]">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute right-5 top-5 z-10 rounded-full bg-white/90 p-2 text-gray-600 shadow-sm transition hover:bg-blue-50 hover:text-[#2563eb]"
            >
              <FiX />
            </button>

            <div className="overflow-hidden rounded-[22px] bg-blue-50">
              <img
                src={selectedEvent.imageURL || "/default.jpg"}
                alt={getEventTitle(selectedEvent)}
                className="h-44 w-full object-cover"
              />
            </div>

            <div className="px-4 pb-5 pt-5">
              <span className="mb-3 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold text-[#2563eb]">
                {selectedEvent.category || "Lakbay Lanao Event"}
              </span>

              <h2 className="line-clamp-2 text-2xl font-bold text-[#2563eb]">
                {getEventTitle(selectedEvent)}
              </h2>

              <div className="mt-4 flex flex-col gap-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-[#2563eb]" />
                  <span>{formatDate(selectedEvent.eventDate)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <FiMapPin className="text-[#2563eb]" />
                  <span>{formatLocation(selectedEvent.location)}</span>
                </div>
              </div>

              <p className="mt-4 line-clamp-4 text-sm leading-6 text-gray-500">
                {selectedEvent.summary || "No event summary available."}
              </p>

              <button
                onClick={() => navigate(`/event/${selectedEvent.id}`)}
                className="mt-6 w-full rounded-full bg-[#2563eb] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
              >
                Open Full Page
              </button>
            </div>
          </div>
        </div>
      )}

      
      <Footer />
    </div>
  );
}

export default EventsCalendar;