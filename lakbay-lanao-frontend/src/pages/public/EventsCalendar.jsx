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

const formatLocation = (location) => {
  if (!location) return "Lanao del Sur";

  if (typeof location === "string") return location;

  return `${location.municipality || ""}${
    location.municipality && location.province ? ", " : ""
  }${location.province || "Lanao del Sur"}`;
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
    <div className="font-sans text-gray-900 min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff]">
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
          background: #f8fbff;
          transition: all 0.2s ease;
        }

        .lakbay-calendar .react-calendar__navigation button:hover,
        .lakbay-calendar .react-calendar__navigation button:focus {
          background: #eff6ff;
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
          height: 58px;
          border-radius: 16px;
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
        }

        .lakbay-calendar .react-calendar__month-view__days__day--neighboringMonth {
          color: #cbd5e1;
        }
      `}</style>

      <Navbar />

      {/* HEADER */}
      <section className="pt-32 pb-10 px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5 font-medium uppercase tracking-wider">
          <span
            className="cursor-pointer hover:text-[#2563eb] transition"
            onClick={() => navigate("/")}
          >
            Home
          </span>
          <span>/</span>
          <span className="text-gray-500">Events Calendar</span>
        </div>

        <div className="flex items-start justify-between gap-8 flex-wrap">
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-100 px-3 py-1 text-xs font-semibold text-red-600 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              Lakbay Lanao Events
            </span>

            <h1 className="text-4xl md:text-5xl font-bold text-[#2563eb] mb-6 tracking-tight leading-tight">
              Events Calendar
            </h1>

            <p className="text-gray-500 max-w-2xl leading-relaxed">
              Discover festivals, cultural gatherings, local celebrations, and
              tourism activities across Lanao del Sur.
            </p>
          </div>

          <div className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-600 shadow-sm">
            {events.length} event{events.length !== 1 ? "s" : ""} available
          </div>
        </div>
      </section>

      {/* FEATURED EVENT */}
      {featuredEvent && (
        <section className="px-6 max-w-7xl mx-auto mb-12">
          <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <div className="grid md:grid-cols-[340px_1fr]">
              <div className="relative h-[260px] md:h-full overflow-hidden">
                <img
                  src={featuredEvent.imageURL || "/default.jpg"}
                  alt={featuredEvent.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
              </div>

              <div className="p-8 md:p-10">
                <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 border border-blue-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#2563eb]">
                  <FiStar />
                  Featured Event
                </span>

                <h2 className="text-3xl font-bold text-[#2563eb] tracking-tight">
                  {featuredEvent.title}
                </h2>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <FiCalendar className="text-[#2563eb]" />
                    <span>{formatDate(featuredEvent.eventDate)}</span>
                  </div>

                  <div className="w-px h-4 bg-gray-200" />

                  <div className="flex items-center gap-1.5">
                    <FiMapPin className="text-[#2563eb]" />
                    <span>{formatLocation(featuredEvent.location)}</span>
                  </div>
                </div>

                <p className="mt-5 line-clamp-3 max-w-3xl text-sm leading-7 text-gray-500">
                  {featuredEvent.summary || "Explore this featured local event."}
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <button
                    onClick={() => setSelectedEvent(featuredEvent)}
                    className="rounded-full bg-[#2563eb] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => navigate(`/event/${featuredEvent.id}`)}
                    className="rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#2563eb] hover:text-[#2563eb]"
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
      <section className="pb-20 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 md:p-8">
              <div className="mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-[#2563eb]">
                  Choose a Date
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Blue dots show days with available events.
                </p>
              </div>

              <div className="lakbay-calendar rounded-[24px] border border-gray-200 bg-white p-4 md:p-6 shadow-sm">
                <Calendar
                  onChange={setDate}
                  value={date}
                  tileContent={({ date }) => {
                    const count = eventMap[date.toDateString()];

                    return count ? (
                      <div className="mt-1 flex justify-center">
                        <span className="h-2 w-2 rounded-full bg-[#2563eb]" />
                      </div>
                    ) : null;
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 md:p-8">
              <div className="mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-[#2563eb]">
                  Events on Selected Date
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {date.toDateString()}
                </p>
              </div>

              {selectedEvents.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-gray-200 bg-[#f8fbff] p-10 text-center">
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
                      className="group flex w-full gap-4 rounded-[24px] border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-100 hover:bg-blue-50/50"
                    >
                      <img
                        src={event.imageURL || "/default.jpg"}
                        alt={event.title}
                        className="h-24 w-24 rounded-[20px] object-cover bg-blue-50"
                      />

                      <div className="min-w-0 flex-1">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                          {event.category || "Event"}
                        </span>

                        <h3 className="mt-2 line-clamp-1 font-bold text-[#2563eb]">
                          {event.title}
                        </h3>

                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-500">
                          {event.summary || "No description available."}
                        </p>
                      </div>

                      <FiChevronRight className="mt-9 text-gray-400 group-hover:text-[#2563eb]" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-2">Selected Date</h3>
              <p className="text-sm text-gray-500">{date.toDateString()}</p>

              <div className="mt-5 flex items-start gap-4 bg-blue-50 border border-blue-100 p-5 rounded-[16px]">
                <FiCalendar className="text-xl text-[#2563eb] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1 text-[#2563eb] text-sm">
                    Event Count
                  </p>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    {selectedEvents.length} event
                    {selectedEvents.length !== 1 ? "s" : ""} available
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900">All Events</h3>
                <span className="text-xs font-semibold text-[#2563eb] bg-blue-50 px-3 py-1 rounded-full">
                  {events.length}
                </span>
              </div>

              {events.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-gray-200 bg-[#f8fbff] p-6 text-center">
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
                      className="w-full rounded-[18px] border border-gray-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      <p className="text-sm font-semibold text-[#2563eb] line-clamp-2">
                        {event.title}
                      </p>

                      <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-400">
                        <FiCalendar />
                        <span>{formatDate(event.eventDate)}</span>
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
          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-xl">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-gray-600 shadow-sm transition hover:bg-blue-50 hover:text-[#2563eb]"
            >
              <FiX />
            </button>

            <img
              src={selectedEvent.imageURL || "/default.jpg"}
              alt={selectedEvent.title}
              className="h-44 w-full object-cover"
            />

            <div className="p-6">
              <span className="mb-3 inline-flex rounded-full bg-blue-50 border border-blue-100 px-4 py-2 text-xs font-semibold text-[#2563eb]">
                {selectedEvent.category || "Lakbay Lanao Event"}
              </span>

              <h2 className="text-2xl font-bold text-[#2563eb]">
                {selectedEvent.title}
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

              <p className="mt-4 line-clamp-5 text-sm leading-6 text-gray-500">
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

      <TourismChatbot />
      <Footer />
    </div>
  );
}

export default EventsCalendar;