import { useEffect, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import Navbar from "../../components/common/Navbar";
import { useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiChevronRight,
  FiClock,
  FiMapPin,
  FiStar,
  FiX,
} from "react-icons/fi";

const safeDate = (val) => {
  if (!val) return null;
  if (val?.toDate) return val.toDate();
  return new Date(val);
};

function EventsCalendar() {
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tourismContent"), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((i) => i.contentType === "Event");

      setEvents(data);
    });

    return () => unsub();
  }, []);

  const norm = (d) => (d ? new Date(d).toDateString() : "");

  const selectedEvents = events.filter(
    (e) => safeDate(e.eventDate)?.toDateString() === date.toDateString()
  );

  const todayEvent =
    events.find((e) => norm(safeDate(e.eventDate)) === norm(new Date())) ||
    events[0];

  const today = new Date().toDateString();

  const timeline = {
    today: events.filter(
      (e) => safeDate(e.eventDate)?.toDateString() === today
    ),
    upcoming: events.filter((e) => safeDate(e.eventDate) > new Date()),
  };

  const eventMap = {};
  events.forEach((e) => {
    const key = safeDate(e.eventDate)?.toDateString();
    if (!key) return;
    eventMap[key] = (eventMap[key] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff]">
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

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-32">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-[#2563eb] shadow-sm">
              <FiCalendar />
              Lakbay Lanao Events
            </div>

            <h1 className="text-3xl font-bold text-[#2563eb] md:text-4xl">
              Events Calendar
            </h1>

            <p className="mt-2 max-w-2xl text-gray-500">
              Discover festivals, cultural gatherings, local celebrations, and
              tourism activities across Lanao del Norte.
            </p>
          </div>

          <div className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-gray-600 shadow-sm">
            {events.length} event{events.length !== 1 ? "s" : ""} available
          </div>
        </div>

        {todayEvent && (
          <section className="mb-8 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <div className="grid md:grid-cols-[260px_1fr]">
              <img
                src={todayEvent.imageURL || "/default.jpg"}
                alt={todayEvent.title}
                className="h-56 w-full object-cover md:h-full"
              />

              <div className="p-7">
                <span className="mb-3 inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#2563eb]">
                  <FiStar />
                  Today’s Featured
                </span>

                <h2 className="text-2xl font-bold text-gray-900">
                  {todayEvent.title}
                </h2>

                <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-gray-500">
                  {todayEvent.summary || "Explore this featured local event."}
                </p>

                <button
                  onClick={() => setSelectedEvent(todayEvent)}
                  className="mt-6 rounded-full bg-[#2563eb] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                >
                  View Details
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-4">
          <aside className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm lg:h-[640px] lg:overflow-y-auto">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Timeline</h3>
              <FiClock className="text-[#2563eb]" />
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Today
            </p>

            {timeline.today.length === 0 && (
              <p className="mb-5 rounded-[16px] bg-gray-50 p-4 text-sm text-gray-400">
                No events today.
              </p>
            )}

            {timeline.today.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedEvent(e)}
                className="mb-3 w-full rounded-[18px] border border-blue-100 bg-blue-50 p-4 text-left transition hover:border-[#2563eb]"
              >
                <p className="text-sm font-semibold text-[#2563eb]">
                  {e.title}
                </p>
              </button>
            ))}

            <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Upcoming
            </p>

            {timeline.upcoming.slice(0, 6).map((e) => (
              <button
                key={e.id}
                onClick={() => setSelectedEvent(e)}
                className="mb-3 w-full rounded-[18px] border border-gray-200 bg-white p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
              >
                <p className="text-sm font-semibold text-gray-800">{e.title}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {safeDate(e.eventDate)?.toDateString()}
                </p>
              </button>
            ))}
          </aside>

          <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-gray-900">
                Choose a Date
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Blue dots show days with available events.
              </p>
            </div>

            <div className="lakbay-calendar rounded-[24px] border border-gray-200 bg-white p-4">
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

          <aside className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm lg:h-[640px] lg:overflow-y-auto">
            <h3 className="font-bold text-gray-900">Selected Date</h3>
            <p className="mt-1 text-sm text-gray-500">{date.toDateString()}</p>

            <div className="mt-5">
              {selectedEvents.length === 0 && (
                <div className="rounded-[20px] border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                  <FiCalendar className="mx-auto mb-3 text-2xl text-gray-300" />
                  <p className="text-sm text-gray-400">
                    No events for this date.
                  </p>
                </div>
              )}

              {selectedEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="mb-3 flex w-full gap-3 rounded-[20px] border border-gray-200 bg-white p-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <img
                    src={event.imageURL || "/default.jpg"}
                    alt={event.title}
                    className="h-16 w-16 rounded-[16px] object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <h4 className="line-clamp-1 font-semibold text-[#2563eb]">
                      {event.title}
                    </h4>
                    <p className="mt-1 text-xs text-gray-500">
                      {event.category || "Local Event"}
                    </p>
                  </div>

                  <FiChevronRight className="mt-5 text-gray-400" />
                </button>
              ))}
            </div>
          </aside>
        </section>
      </main>

     {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6 backdrop-blur-sm">
            <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <button
                onClick={() => setSelectedEvent(null)}
                className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-gray-600 shadow-sm transition hover:bg-blue-50 hover:text-[#2563eb]"
            >
                <FiX />
            </button>

            <img
                src={selectedEvent.imageURL || "/default.jpg"}
                alt={selectedEvent.title}
                className="h-36 w-full object-cover"
            />

            <div className="p-6">
                <span className="mb-3 inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold text-[#2563eb]">
                {selectedEvent.category || "Lakbay Lanao Event"}
                </span>

                <h2 className="text-2xl font-bold text-[#2563eb]">
                {selectedEvent.title}
                </h2>

                <p className="mt-3 line-clamp-5 text-sm leading-6 text-gray-500">
                {selectedEvent.summary || "No event summary available."}
                </p>

                {selectedEvent.location && (
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#2563eb]">
                    <FiMapPin />
                    {selectedEvent.location}
                </div>
                )}

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
    </div>
  );
}

export default EventsCalendar;