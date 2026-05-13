import Navbar from "../../components/common/Navbar";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState, useEffect, useCallback, useRef } from "react";
import { useFavorites } from "../../components/context/FavoritesContext";
import {
  FiTrash2,
  FiClock,
  FiMapPin,
  FiPlus,
  FiMinus,
  FiSave,
  FiCheckCircle,
  FiInfo,
  FiRotateCcw,
  FiCloud,
  FiDownload,
  FiAlertCircle,
  FiEdit2,
  FiLayers,
} from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";
import { db, auth } from "../../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import lakbayLogo from "../../assets/lakbay-logos.png";
import itineraryHero from "../../assets/itinerary-hero.png";
import html2pdf from "html2pdf.js";

const ITINERARY_CATEGORIES = [
  "Destination",
  "Establishment",
  "Landmark",
  "Cultural Heritage Site",
];

const getLocalKey = (uid) => `lakbay_lanao_itinerary_trips_${uid || "guest"}`;
const getOldLocalKey = (uid) => `lakbay_lanao_itinerary_plan_${uid || "guest"}`;

const CAT_COLORS = {
  Destination: "text-red-600 bg-red-50 border-red-100",
  Landmark: "text-blue-600 bg-blue-50 border-blue-100",
  Establishment: "text-amber-600 bg-amber-50 border-amber-100",
  "Cultural Heritage Site": "text-green-600 bg-green-50 border-green-100",
};

const formatCategoryLabel = (category) => {
  if (category === "Cultural Heritage Site") return "Cultural";
  if (category === "Establishment") return "Stay / Food";
  return category || "Place";
};

const buildDays = (count, existing = {}) => {
  const d = {};

  for (let i = 1; i <= count; i++) {
    const key = `day${i}`;
    d[key] = existing[key] ?? [];
  }

  return d;
};

const reorder = (list, from, to) => {
  const result = [...list];
  const [removed] = result.splice(from, 1);
  result.splice(to, 0, removed);
  return result;
};

const createTripId = () =>
  `trip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const createDefaultTrip = (name = "Trip to Lanao del Sur") => ({
  id: createTripId(),
  name,
  dayCount: 3,
  days: buildDays(3),
  notes: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const getDefaultPlanner = () => {
  const firstTrip = createDefaultTrip("Trip to Lanao del Sur");

  return {
    currentTripId: firstTrip.id,
    trips: [firstTrip],
    updatedAt: new Date().toISOString(),
  };
};

const normalizeTrip = (trip, index = 0) => {
  const count = trip?.dayCount ?? 3;

  return {
    id: trip?.id || createTripId(),
    name: trip?.name || `Trip ${index + 1}`,
    dayCount: count,
    days: buildDays(count, trip?.days ?? {}),
    notes: trip?.notes ?? {},
    createdAt: trip?.createdAt || new Date().toISOString(),
    updatedAt: trip?.updatedAt || new Date().toISOString(),
  };
};

const normalizePlanner = (data) => {
  if (!data) return null;

  if (Array.isArray(data.trips)) {
    const trips = data.trips.length
      ? data.trips.map((trip, index) => normalizeTrip(trip, index))
      : [createDefaultTrip("Trip to Lanao del Sur")];

    const currentTripId =
      data.currentTripId && trips.some((trip) => trip.id === data.currentTripId)
        ? data.currentTripId
        : trips[0].id;

    return {
      currentTripId,
      trips,
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  }

  const migratedTrip = normalizeTrip(
    {
      id: createTripId(),
      name: data.name || "My Itinerary",
      dayCount: data.dayCount ?? 3,
      days: data.days ?? {},
      notes: data.notes ?? {},
      updatedAt: data.updatedAt || new Date().toISOString(),
    },
    0
  );

  return {
    currentTripId: migratedTrip.id,
    trips: [migratedTrip],
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
};

const readLocalPlanner = (uid) => {
  try {
    const raw = localStorage.getItem(getLocalKey(uid));

    if (raw) {
      const parsed = JSON.parse(raw);
      return normalizePlanner(parsed);
    }

    const oldRaw = localStorage.getItem(getOldLocalKey(uid));

    if (oldRaw) {
      const oldParsed = JSON.parse(oldRaw);
      return normalizePlanner(oldParsed);
    }

    return null;
  } catch (error) {
    console.error("Failed to read local itinerary:", error);
    return null;
  }
};

const writeLocalPlanner = (planner, uid) => {
  try {
    localStorage.setItem(getLocalKey(uid), JSON.stringify(planner));
  } catch (error) {
    console.error("Failed to save itinerary locally:", error);
  }
};

const isLocalNewer = (localPlanner, cloudPlanner) => {
  const localTime = new Date(localPlanner?.updatedAt || 0).getTime();
  const cloudTime = new Date(cloudPlanner?.updatedAt || 0).getTime();

  return localTime > cloudTime;
};

const sanitizeFileName = (name) =>
  String(name || "Itinerary")
    .replace(/[^a-z0-9]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

function SaveBadge({ status, mode }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-blue-500 animate-pulse">
        {mode === "cloud" ? <FiCloud /> : <FiSave />} Saving…
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-green-500">
        <FiCheckCircle />
        {mode === "cloud" ? "Saved to cloud" : "Saved on this device"}
      </span>
    );
  }

  return null;
}

function PlaceCard({ place, index }) {
  const catClass =
    CAT_COLORS[place.category] || "text-blue-600 bg-blue-50 border-blue-100";

  return (
    <Draggable draggableId={String(place.id)} index={index} key={place.id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`flex cursor-grab items-center gap-2 rounded-[16px] border bg-white p-2.5 active:cursor-grabbing transition-all duration-200 sm:gap-3 sm:rounded-[18px] sm:p-3 ${
            snapshot.isDragging
              ? "scale-[1.01] border-blue-200 shadow-[0_12px_28px_rgba(37,99,235,0.12)]"
              : "border-blue-100 shadow-sm hover:border-blue-200 hover:shadow-[0_8px_20px_rgba(37,99,235,0.07)]"
          }`}
        >
          <MdDragIndicator className="flex-shrink-0 text-xl text-gray-300" />

          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-[12px] border border-blue-100 bg-[#f8fbff] shadow-sm sm:h-12 sm:w-12 sm:rounded-[14px]">
            <img
              src={place.imageURL || "/default.jpg"}
              alt={place.name || place.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold leading-tight text-[#2563eb] sm:text-sm">
              {place.name || place.title}
            </p>

            <span
              className={`mt-1 inline-flex max-w-[92px] rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide ${catClass}`}
            >
              <span className="truncate">
                {formatCategoryLabel(place.category)}
              </span>
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function DayCard({
  dayKey,
  dayIndex,
  items,
  notes,
  onRemove,
  onUpdateTime,
  onUpdateNote,
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)] sm:rounded-[28px]">
      <div className="flex items-center gap-3 border-b border-blue-50 bg-[#f8fbff] px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-sm font-bold text-white shadow-sm">
          {dayIndex + 1}
        </div>

        <div>
          <h3 className="text-base font-bold leading-tight text-[#2563eb]">
            Day {dayIndex + 1}
          </h3>

          <p className="mt-0.5 text-xs text-gray-500">
            {items.length === 0
              ? "No stops yet"
              : `${items.length} stop${items.length > 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <Droppable droppableId={dayKey}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[120px] px-3 pb-4 pt-4 transition-colors duration-200 sm:px-5 sm:pt-5 ${
              snapshot.isDraggingOver ? "bg-blue-50/60" : "bg-white"
            }`}
          >
            {items.length === 0 && (
              <div className="flex h-20 select-none items-center justify-center rounded-[18px] border-2 border-dashed border-blue-100 bg-[#f8fbff] text-sm font-medium text-gray-400">
                Drop destinations here
              </div>
            )}

            <div className="space-y-3">
              {items.map((place, idx) => {
                const catClass =
                  CAT_COLORS[place.category] ||
                  "text-blue-600 bg-blue-50 border-blue-100";

                return (
                  <Draggable
                    key={`${place.id}-${dayKey}`}
                    draggableId={`${place.id}-${dayKey}`}
                    index={idx}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`group flex flex-col gap-3 rounded-[16px] border bg-white p-3 transition-all duration-200 sm:rounded-[18px] sm:p-3.5 md:flex-row md:items-center ${
                          snapshot.isDragging
                            ? "border-blue-200 shadow-[0_12px_28px_rgba(37,99,235,0.12)]"
                            : "border-blue-100 shadow-sm hover:border-blue-200 hover:shadow-[0_8px_20px_rgba(37,99,235,0.07)]"
                        }`}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                          <div
                            {...provided.dragHandleProps}
                            className="flex-shrink-0 cursor-grab p-1 text-gray-300 hover:text-gray-500 active:cursor-grabbing"
                          >
                            <MdDragIndicator className="text-xl" />
                          </div>

                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-600">
                            {idx + 1}
                          </div>

                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-[12px] border border-blue-100 bg-[#f8fbff] shadow-sm sm:h-14 sm:w-14 sm:rounded-[14px]">
                            <img
                              src={place.imageURL || "/default.jpg"}
                              alt={place.name || place.title}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold leading-tight text-[#2563eb] sm:text-sm">
                              {place.name || place.title}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex max-w-[92px] rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide ${catClass}`}
                              >
                                <span className="truncate">
                                  {formatCategoryLabel(place.category)}
                                </span>
                              </span>

                              {place.location?.municipality && (
                                <span className="flex items-center gap-0.5 text-[11px] text-gray-500">
                                  <FiMapPin className="text-[10px]" />
                                  {place.location.municipality}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2 pl-8 sm:pl-10 md:pl-0">
                          <div className="flex items-center gap-1.5 rounded-[12px] border border-blue-100 bg-[#f8fbff] px-2.5 py-1.5 transition focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-100">
                            <FiClock className="flex-shrink-0 text-xs text-gray-500" />

                            <input
                              type="time"
                              value={place.time || ""}
                              onChange={(e) =>
                                onUpdateTime(dayKey, idx, e.target.value)
                              }
                              className="w-20 border-none bg-transparent text-xs font-medium text-gray-600 outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemove(dayKey, idx)}
                            className="rounded-[10px] p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-400"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
            </div>

            {provided.placeholder}

            <div className="mt-4 border-t border-gray-100 pt-4">
              <textarea
                placeholder="Add notes, transport details, or reminders for this day…"
                value={notes[dayKey] || ""}
                onChange={(e) => onUpdateNote(dayKey, e.target.value)}
                rows={2}
                className="w-full resize-none rounded-[14px] border border-blue-100 bg-[#f8fbff] px-4 py-3 text-xs text-gray-600 outline-none transition placeholder:text-gray-400 focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
}

function SavedTripsPanel({
  trips,
  currentTripId,
  editingTripId,
  editingTripName,
  onSelectTrip,
  onCreateTrip,
  onDeleteTrip,
  onStartRenameTrip,
  onChangeRenameTrip,
  onSaveRenameTrip,
}) {
  return (
    <div className="rounded-[24px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)] sm:rounded-[28px]">
      <div className="flex items-start justify-between gap-4 border-b border-blue-50 px-5 py-5">
        <div>
          <div className="flex items-center gap-2">
            <FiLayers className="text-base text-[#2563eb]" />
            <h2 className="text-base font-bold text-[#2563eb]">Saved Trips</h2>
          </div>

          <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
            Manage, rename, or switch between your trip plans.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateTrip}
          className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white shadow-sm transition hover:bg-blue-700"
          title="Add itinerary"
        >
          <FiPlus className="text-sm" />
        </button>
      </div>

      <div className="max-h-[360px] space-y-3 overflow-y-auto p-4">
        {trips.map((trip) => {
          const isActive = trip.id === currentTripId;
          const isEditing = editingTripId === trip.id;

          const stopCount = Object.values(trip.days || {}).reduce(
            (total, dayItems) => total + dayItems.length,
            0
          );

          return (
            <div
              key={trip.id}
              className={`rounded-[20px] border p-4 transition ${
                isActive
                  ? "border-[#2563eb] bg-blue-50/80 shadow-sm"
                  : "border-blue-100 bg-white hover:border-blue-200 hover:bg-[#f8fbff]"
              }`}
            >
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editingTripName}
                    onChange={(e) => onChangeRenameTrip(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSaveRenameTrip(trip.id);
                    }}
                    autoFocus
                    className="w-full rounded-[14px] border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-gray-700 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
                    placeholder="Trip name"
                  />

                  <button
                    type="button"
                    onClick={() => onSaveRenameTrip(trip.id)}
                    className="w-full rounded-full bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                  >
                    Save Name
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectTrip(trip.id)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-bold ${
                          isActive ? "text-[#2563eb]" : "text-gray-800"
                        }`}
                      >
                        {trip.name || "Untitled Trip"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {trip.dayCount} day{trip.dayCount !== 1 ? "s" : ""} •{" "}
                        {stopCount} stop{stopCount !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {isActive && (
                      <span className="rounded-full bg-[#2563eb] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white">
                        Active
                      </span>
                    )}
                  </div>
                </button>
              )}

              <div className="mt-3 flex items-center justify-between border-t border-blue-100/80 pt-3">
                <span className="text-[10px] text-gray-400">
                  Updated{" "}
                  {trip.updatedAt
                    ? new Date(trip.updatedAt).toLocaleDateString()
                    : "recently"}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onStartRenameTrip(trip)}
                    className="rounded-full p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-[#2563eb]"
                    title="Rename trip"
                  >
                    <FiEdit2 className="text-sm" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteTrip(trip.id)}
                    disabled={trips.length <= 1}
                    className="rounded-full p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30"
                    title={
                      trips.length <= 1
                        ? "At least one trip is required"
                        : "Delete trip"
                    }
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ItineraryPDFTemplate({ tripName, days, notes, dayCount, totalStops }) {
  const date = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="w-[794px] min-h-[1123px] bg-[#f3f9ff] p-7 font-sans text-slate-900">
      <section className="rounded-[24px] border border-blue-100 bg-white p-8">
        <header className="flex items-center justify-between gap-6 border-b border-blue-100 pb-6">
          <div className="flex items-center gap-4">
            <img
              src={lakbayLogo}
              alt="Lakbay Lanao Logo"
              className="h-[58px] w-[58px] rounded-[16px] object-contain"
            />

            <div>
              <p className="m-0 text-[23px] font-extrabold tracking-tight text-[#2563eb]">
                Lakbay Lanao
              </p>

              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Provincial Tourism Office
                <br />
                Lanao del Sur, Philippines
              </p>
            </div>
          </div>

          <div className="text-right">
            <h1 className="m-0 text-2xl font-extrabold tracking-tight text-slate-900">
              {tripName || "My Itinerary"}
            </h1>

            <p className="mt-1.5 text-xs text-slate-500">Generated {date}</p>
          </div>
        </header>

        <section className="my-6 grid grid-cols-3 gap-3">
          <div className="rounded-[18px] border border-blue-100 bg-[#f8fbff] px-4 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Trip Length
            </p>

            <p className="mt-1 text-lg font-extrabold text-[#2563eb]">
              {dayCount} Day{dayCount !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="rounded-[18px] border border-blue-100 bg-[#f8fbff] px-4 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Total Stops
            </p>

            <p className="mt-1 text-lg font-extrabold text-[#2563eb]">
              {totalStops}
            </p>
          </div>

          <div className="rounded-[18px] border border-blue-100 bg-[#f8fbff] px-4 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Prepared For
            </p>

            <p className="mt-1 text-lg font-extrabold text-[#2563eb]">
              Traveler
            </p>
          </div>
        </section>

        <section className="space-y-[18px]">
          {Object.keys(days).map((dayKey, dayIndex) => {
            const items = days[dayKey] || [];
            const dayNote = notes[dayKey] || "";

            return (
              <div
                key={dayKey}
                className="overflow-hidden rounded-[20px] border border-blue-100 bg-white"
              >
                <div className="flex items-center gap-3 border-b border-blue-100 bg-[#f8fbff] px-5 py-4">
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#2563eb] text-[13px] font-extrabold text-white">
                    {dayIndex + 1}
                  </div>

                  <div>
                    <h2 className="m-0 text-base font-extrabold text-[#2563eb]">
                      Day {dayIndex + 1}
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {items.length} stop{items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3">
                  {items.length === 0 ? (
                    <div className="my-2 rounded-[14px] border border-dashed border-blue-100 bg-[#f8fbff] p-4 text-center text-[13px] text-slate-400">
                      No stops added yet.
                    </div>
                  ) : (
                    <div>
                      {items.map((place, i) => (
                        <div
                          key={`${dayKey}-${place.id}-${i}`}
                          className="flex gap-3 border-b border-[#eef2ff] py-3 last:border-b-0"
                        >
                          <div className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-extrabold text-[#2563eb]">
                            {i + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between gap-4">
                              <p className="m-0 text-sm font-extrabold text-slate-900">
                                {place.name || place.title || "Untitled stop"}
                              </p>

                              <span className="flex-shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-[#2563eb]">
                                {place.time || "Time not set"}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatCategoryLabel(place.category)} ·{" "}
                              {place.location?.municipality || "Lanao del Sur"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {dayNote && (
                    <div className="mt-3 rounded-[16px] border border-blue-100 bg-[#f8fbff] px-3.5 py-3 text-xs leading-relaxed text-slate-600">
                      <strong>Notes:</strong> {dayNote}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <footer className="mt-7 border-t border-blue-100 pt-5 text-center text-[11px] leading-relaxed text-slate-400">
          Lakbay Lanao · Explore Lanao del Sur with confidence
          <br />
          This itinerary was generated from your saved trip plan.
        </footer>
      </section>
    </div>
  );
}

function Itinerary() {
  const { favorites } = useFavorites();

  const [uid, setUid] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [trips, setTrips] = useState([]);
  const [currentTripId, setCurrentTripId] = useState(null);

  const [tripName, setTripName] = useState("Trip to Lanao del Sur");
  const [dayCount, setDayCount] = useState(3);
  const [days, setDays] = useState(buildDays(3));
  const [notes, setNotes] = useState({});

  const [editingTripId, setEditingTripId] = useState(null);
  const [editingTripName, setEditingTripName] = useState("");

  const [saveStatus, setSaveStatus] = useState(null);
  const [saveMode, setSaveMode] = useState("device");
  const [loaded, setLoaded] = useState(false);
  const [ruleNotice, setRuleNotice] = useState("");

  const syncTimeoutRef = useRef(null);
  const pdfRef = useRef(null);

  const places = favorites.filter((item) =>
    ITINERARY_CATEGORIES.includes(item.category)
  );

  const totalStops = Object.values(days).reduce(
    (total, dayItems) => total + dayItems.length,
    0
  );

  const showRuleNotice = (message) => {
    setRuleNotice(message);
    setTimeout(() => setRuleNotice(""), 2600);
  };

  const applyTripToEditor = useCallback((trip) => {
    if (!trip) return;

    setCurrentTripId(trip.id);
    setTripName(trip.name || "Untitled Trip");
    setDayCount(trip.dayCount ?? 3);
    setDays(buildDays(trip.dayCount ?? 3, trip.days ?? {}));
    setNotes(trip.notes ?? {});
  }, []);

  const buildPlannerPayload = useCallback((tripsData, activeId) => {
    return {
      currentTripId: activeId,
      trips: tripsData,
      updatedAt: new Date().toISOString(),
    };
  }, []);

  const saveLocalImmediately = useCallback(
    (tripsData, activeId) => {
      const payload = buildPlannerPayload(tripsData, activeId);

      writeLocalPlanner(payload, uid);
      setSaveMode("device");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 1800);

      return payload;
    },
    [buildPlannerPayload, uid]
  );

  const syncToCloud = useCallback(
    async (payload, manual = false) => {
      if (!uid) return;

      setSaveMode("cloud");
      setSaveStatus("saving");

      try {
        await setDoc(doc(db, "users", uid, "itinerary", "plan"), payload);
        setSaveStatus("saved");
      } catch (err) {
        console.error("Failed to sync itinerary to cloud:", err);
        setSaveMode("device");
        setSaveStatus("saved");
      }

      setTimeout(() => setSaveStatus(null), manual ? 3000 : 2200);
    },
    [uid]
  );

  const persistPlanner = useCallback(
    (tripsData, activeId, immediateCloud = false) => {
      const payload = saveLocalImmediately(tripsData, activeId);

      if (!uid) return;

      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

      if (immediateCloud) {
        syncToCloud(payload, true);
      } else {
        syncTimeoutRef.current = setTimeout(() => {
          syncToCloud(payload, false);
        }, 800);
      }
    },
    [uid, saveLocalImmediately, syncToCloud]
  );

  const persistActiveTrip = useCallback(
    (nextValues, immediateCloud = false) => {
      const activeId = currentTripId || trips[0]?.id || createTripId();

      const existingTrip =
        trips.find((trip) => trip.id === activeId) ||
        createDefaultTrip("Trip to Lanao del Sur");

      const updatedTrip = normalizeTrip({
        ...existingTrip,
        id: activeId,
        name: nextValues.name ?? tripName,
        dayCount: nextValues.dayCount ?? dayCount,
        days: nextValues.days ?? days,
        notes: nextValues.notes ?? notes,
        updatedAt: new Date().toISOString(),
      });

      const hasTrip = trips.some((trip) => trip.id === activeId);

      const updatedTrips = hasTrip
        ? trips.map((trip) => (trip.id === activeId ? updatedTrip : trip))
        : [updatedTrip, ...trips];

      setTrips(updatedTrips);
      setCurrentTripId(activeId);
      persistPlanner(updatedTrips, activeId, immediateCloud);
    },
    [
      currentTripId,
      trips,
      tripName,
      dayCount,
      days,
      notes,
      persistPlanner,
    ]
  );

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;

    const options = {
      margin: 0,
      filename: `Lakbay-Lanao-${sanitizeFileName(tripName)}-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#f3f9ff" },
      jsPDF: { unit: "px", format: [794, 1123], orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    await html2pdf().set(options).from(pdfRef.current).save();
  };

  const resetPlan = async () => {
    const freshDays = buildDays(3);
    const freshNotes = {};

    setDayCount(3);
    setDays(freshDays);
    setNotes(freshNotes);

    persistActiveTrip(
      {
        dayCount: 3,
        days: freshDays,
        notes: freshNotes,
      },
      true
    );
  };

  const handleCreateTrip = () => {
    const newTripNumber = trips.length + 1;
    const newTrip = createDefaultTrip(`Trip ${newTripNumber}`);

    const updatedTrips = [newTrip, ...trips];

    setTrips(updatedTrips);
    applyTripToEditor(newTrip);
    persistPlanner(updatedTrips, newTrip.id, true);
  };

  const handleSelectTrip = (tripId) => {
    const selectedTrip = trips.find((trip) => trip.id === tripId);
    if (!selectedTrip) return;

    setEditingTripId(null);
    setEditingTripName("");

    applyTripToEditor(selectedTrip);

    const updatedPlanner = buildPlannerPayload(trips, tripId);
    writeLocalPlanner(updatedPlanner, uid);

    if (uid) {
      syncToCloud(updatedPlanner, false);
    }
  };

  const handleDeleteTrip = (tripId) => {
    if (trips.length <= 1) {
      showRuleNotice("At least one trip is required.");
      return;
    }

    const tripToDelete = trips.find((trip) => trip.id === tripId);
    const confirmDelete = window.confirm(
      `Delete "${tripToDelete?.name || "this trip"}"? This cannot be undone.`
    );

    if (!confirmDelete) return;

    const updatedTrips = trips.filter((trip) => trip.id !== tripId);
    const nextActiveTrip =
      tripId === currentTripId
        ? updatedTrips[0]
        : updatedTrips.find((trip) => trip.id === currentTripId) ||
          updatedTrips[0];

    setEditingTripId(null);
    setEditingTripName("");

    setTrips(updatedTrips);
    applyTripToEditor(nextActiveTrip);
    persistPlanner(updatedTrips, nextActiveTrip.id, true);
  };

  const handleStartRenameTrip = (trip) => {
    setEditingTripId(trip.id);
    setEditingTripName(trip.name || "");
  };

  const handleSaveRenameTrip = (tripId) => {
    const finalName = editingTripName.trim() || "Untitled Trip";

    const updatedTrips = trips.map((trip) =>
      trip.id === tripId
        ? {
            ...trip,
            name: finalName,
            updatedAt: new Date().toISOString(),
          }
        : trip
    );

    setTrips(updatedTrips);

    if (tripId === currentTripId) {
      setTripName(finalName);
    }

    setEditingTripId(null);
    setEditingTripName("");

    persistPlanner(updatedTrips, currentTripId, true);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid || null);
      setIsAuthReady(true);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isAuthReady) return;

    const load = async () => {
      try {
        const localPlanner = readLocalPlanner(uid);

        if (uid) {
          const snap = await getDoc(doc(db, "users", uid, "itinerary", "plan"));

          if (snap.exists()) {
            const cloudPlanner = normalizePlanner(snap.data());

            const chosenPlanner =
              localPlanner && isLocalNewer(localPlanner, cloudPlanner)
                ? localPlanner
                : cloudPlanner;

            const normalized =
              normalizePlanner(chosenPlanner) || getDefaultPlanner();

            setTrips(normalized.trips);
            applyTripToEditor(
              normalized.trips.find(
                (trip) => trip.id === normalized.currentTripId
              ) || normalized.trips[0]
            );

            writeLocalPlanner(
              {
                ...normalized,
                updatedAt: new Date().toISOString(),
              },
              uid
            );

            if (localPlanner && isLocalNewer(localPlanner, cloudPlanner)) {
              await setDoc(doc(db, "users", uid, "itinerary", "plan"), {
                ...localPlanner,
                updatedAt: new Date().toISOString(),
              });
            }
          } else if (localPlanner) {
            const normalized =
              normalizePlanner(localPlanner) || getDefaultPlanner();

            setTrips(normalized.trips);
            applyTripToEditor(
              normalized.trips.find(
                (trip) => trip.id === normalized.currentTripId
              ) || normalized.trips[0]
            );

            await setDoc(doc(db, "users", uid, "itinerary", "plan"), {
              ...normalized,
              updatedAt: new Date().toISOString(),
            });
          } else {
            const freshPlanner = getDefaultPlanner();

            setTrips(freshPlanner.trips);
            applyTripToEditor(freshPlanner.trips[0]);
            writeLocalPlanner(freshPlanner, uid);
          }
        } else {
          if (localPlanner) {
            const normalized =
              normalizePlanner(localPlanner) || getDefaultPlanner();

            setTrips(normalized.trips);
            applyTripToEditor(
              normalized.trips.find(
                (trip) => trip.id === normalized.currentTripId
              ) || normalized.trips[0]
            );
          } else {
            const freshPlanner = getDefaultPlanner();

            setTrips(freshPlanner.trips);
            applyTripToEditor(freshPlanner.trips[0]);
            writeLocalPlanner(freshPlanner, null);
          }
        }
      } catch (err) {
        console.error("Failed to load itinerary:", err);

        const freshPlanner = getDefaultPlanner();
        setTrips(freshPlanner.trips);
        applyTripToEditor(freshPlanner.trips[0]);
      } finally {
        setLoaded(true);
      }
    };

    load();
  }, [uid, isAuthReady, applyTripToEditor]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const activeId = currentTripId || trips[0]?.id;
      if (!activeId) return;

      const updatedTrips = trips.map((trip) =>
        trip.id === activeId
          ? {
              ...trip,
              name: tripName.trim() || "Untitled Trip",
              dayCount,
              days,
              notes,
              updatedAt: new Date().toISOString(),
            }
          : trip
      );

      const payload = buildPlannerPayload(updatedTrips, activeId);
      writeLocalPlanner(payload, auth.currentUser?.uid || null);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [
    currentTripId,
    trips,
    tripName,
    dayCount,
    days,
    notes,
    buildPlannerPayload,
  ]);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, []);

  const handleDayChange = (delta) => {
    const next = Math.min(14, Math.max(1, dayCount + delta));
    const updatedDays = buildDays(next, days);

    setDayCount(next);
    setDays(updatedDays);

    persistActiveTrip(
      {
        dayCount: next,
        days: updatedDays,
      },
      true
    );
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === "places") {
      const place = places.find((p) => String(p.id) === draggableId);
      if (!place) return;

      const destDay = destination.droppableId;
      if (!days[destDay]) return;

      const alreadyExists = days[destDay].some(
        (item) => String(item.id) === String(place.id)
      );

      if (alreadyExists) {
        showRuleNotice("This destination is already added to this day.");
        return;
      }

      const newItem = { ...place, time: "" };
      const updated = [...days[destDay]];
      updated.splice(destination.index, 0, newItem);

      const updatedDays = { ...days, [destDay]: updated };

      setDays(updatedDays);

      persistActiveTrip(
        {
          days: updatedDays,
        },
        true
      );

      return;
    }

    if (source.droppableId === destination.droppableId) {
      const dayKey = source.droppableId;

      const updatedDays = {
        ...days,
        [dayKey]: reorder(days[dayKey], source.index, destination.index),
      };

      setDays(updatedDays);

      persistActiveTrip(
        {
          days: updatedDays,
        },
        true
      );

      return;
    }

    const srcKey = source.droppableId;
    const dstKey = destination.droppableId;

    if (!days[srcKey] || !days[dstKey]) return;

    const srcItems = [...days[srcKey]];
    const dstItems = [...days[dstKey]];
    const [moved] = srcItems.splice(source.index, 1);

    const alreadyExistsInTargetDay = dstItems.some(
      (item) => String(item.id) === String(moved.id)
    );

    if (alreadyExistsInTargetDay) {
      showRuleNotice("This destination already exists in the target day.");
      return;
    }

    dstItems.splice(destination.index, 0, moved);

    const updatedDays = {
      ...days,
      [srcKey]: srcItems,
      [dstKey]: dstItems,
    };

    setDays(updatedDays);

    persistActiveTrip(
      {
        days: updatedDays,
      },
      true
    );
  };

  const removePlace = (dayKey, idx) => {
    const updated = [...days[dayKey]];
    updated.splice(idx, 1);

    const updatedDays = { ...days, [dayKey]: updated };

    setDays(updatedDays);

    persistActiveTrip(
      {
        days: updatedDays,
      },
      true
    );
  };

  const updateTime = (dayKey, idx, value) => {
    const updated = [...days[dayKey]];
    updated[idx] = { ...updated[idx], time: value };

    const updatedDays = { ...days, [dayKey]: updated };

    setDays(updatedDays);

    persistActiveTrip(
      {
        days: updatedDays,
      },
      false
    );
  };

  const updateNote = (dayKey, value) => {
    const updatedNotes = { ...notes, [dayKey]: value };

    setNotes(updatedNotes);

    persistActiveTrip(
      {
        notes: updatedNotes,
      },
      false
    );
  };

  if (!isAuthReady || !loaded) {
    return <div className="min-h-screen bg-[#f3f9ff]"></div>;
  }

  return (
    <div className="font-sans min-h-screen bg-[#f3f9ff] pb-24 text-gray-900">
      <Navbar />

      <div className="fixed left-[-9999px] top-0">
        <div ref={pdfRef}>
          <ItineraryPDFTemplate
            tripName={tripName}
            days={days}
            notes={notes}
            dayCount={dayCount}
            totalStops={totalStops}
          />
        </div>
      </div>

      {/* HERO */}
      <section className="relative mx-4 mt-0 h-[300px] overflow-hidden rounded-b-[32px] sm:h-[340px] sm:rounded-b-[48px] md:mx-8">
        <img
          src={itineraryHero}
          alt="Itinerary"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-black/70" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-10 sm:px-6 sm:pb-14">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold leading-tight text-white drop-shadow sm:text-4xl md:text-5xl">
                My Itinerary
              </h1>

              <p className="mt-2 max-w-lg text-sm font-light leading-relaxed text-gray-100 sm:text-base">
                Create multiple trips, organize saved destinations by day, and
                download each itinerary as a PDF.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
              <div className="rounded-[18px] border border-white/30 bg-white/15 px-4 py-2.5 text-center shadow-sm backdrop-blur-[2px] sm:rounded-2xl sm:px-5 sm:py-3">
                <p className="text-xl font-bold text-white sm:text-2xl">
                  {trips.length}
                </p>
                <p className="mt-0.5 text-[11px] text-white/80 sm:text-xs">
                  Trips
                </p>
              </div>

              <div className="rounded-[18px] border border-white/30 bg-white/15 px-4 py-2.5 text-center shadow-sm backdrop-blur-[2px] sm:rounded-2xl sm:px-5 sm:py-3">
                <p className="text-xl font-bold text-white sm:text-2xl">
                  {totalStops}
                </p>
                <p className="mt-0.5 text-[11px] text-white/80 sm:text-xs">
                  Stops
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CURRENT TRIP BAR */}
      <div className="relative z-10 mx-auto -mt-5 max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[24px] border border-white/80 bg-white/95 px-4 py-5 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-[6px] sm:rounded-[26px] sm:px-7 lg:flex-row lg:items-center">
          <h2 className="text-base font-bold text-[#2563eb] sm:pl-3 sm:text-lg">
            {tripName || "Untitled Trip"}
          </h2>

          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto lg:flex lg:flex-wrap lg:items-center lg:gap-3">
            <div className="sm:col-span-2 lg:col-span-1">
              <SaveBadge status={saveStatus} mode={saveMode} />
            </div>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-blue-100 bg-[#f8fbff] px-4 py-2 text-xs font-medium text-gray-600 shadow-sm transition hover:border-[#2563eb] hover:bg-blue-50 hover:text-[#2563eb] sm:text-sm lg:w-auto"
            >
              <FiDownload className="text-sm" />
              Download PDF
            </button>

            <button
              type="button"
              onClick={resetPlan}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-xs font-medium text-red-500 shadow-sm transition hover:bg-red-50 sm:text-sm lg:w-auto"
            >
              <FiRotateCcw className="text-sm" />
              Reset
            </button>

            <div className="flex w-full items-center justify-center gap-3 rounded-full border border-blue-100 bg-[#f8fbff] px-4 py-2 sm:col-span-2 lg:w-auto">
              <button
                type="button"
                onClick={() => handleDayChange(-1)}
                disabled={dayCount <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-100 bg-white text-gray-600 transition hover:border-blue-300 hover:text-[#2563eb] disabled:opacity-30"
              >
                <FiMinus className="text-xs" />
              </button>

              <span className="w-16 text-center text-sm font-bold text-gray-600">
                {dayCount} {dayCount === 1 ? "Day" : "Days"}
              </span>

              <button
                type="button"
                onClick={() => handleDayChange(1)}
                disabled={dayCount >= 14}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-100 bg-white text-gray-600 transition hover:border-blue-300 hover:text-[#2563eb] disabled:opacity-30"
              >
                <FiPlus className="text-xs" />
              </button>
            </div>
          </div>
        </div>

        {ruleNotice && (
          <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-red-600 shadow-sm">
            <FiAlertCircle className="flex-shrink-0" />
            {ruleNotice}
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-10">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_1fr] lg:gap-7">
            {/* LEFT SIDEBAR */}
            <aside className="space-y-6 lg:sticky lg:top-28">
              <SavedTripsPanel
                trips={trips}
                currentTripId={currentTripId}
                editingTripId={editingTripId}
                editingTripName={editingTripName}
                onSelectTrip={handleSelectTrip}
                onCreateTrip={handleCreateTrip}
                onDeleteTrip={handleDeleteTrip}
                onStartRenameTrip={handleStartRenameTrip}
                onChangeRenameTrip={setEditingTripName}
                onSaveRenameTrip={handleSaveRenameTrip}
              />

              <Droppable droppableId="places" isDropDisabled>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex max-h-[520px] flex-col rounded-[24px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)] sm:rounded-[28px]"
                  >
                    <div className="border-b border-blue-50 px-5 pb-4 pt-5">
                      <div className="mb-1 flex items-center gap-2">
                        <FiMapPin className="text-base text-[#2563eb]" />

                        <h2 className="text-base font-bold text-[#2563eb]">
                          Saved Places
                        </h2>
                      </div>

                      <p className="text-xs leading-relaxed text-gray-500">
                        Drag any place into a day on the right.
                      </p>
                    </div>

                    {favorites.length > 0 && places.length === 0 && (
                      <div className="mx-4 mt-4 flex gap-2 rounded-[14px] border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
                        <FiInfo className="mt-0.5 flex-shrink-0" />

                        <span>
                          Your saved items aren't destinations, landmarks,
                          establishments, or cultural sites.
                        </span>
                      </div>
                    )}

                    <div
                      className="flex-1 space-y-2.5 overflow-y-auto p-4"
                      style={{ scrollbarWidth: "thin" }}
                    >
                      {places.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
                            <FiMapPin className="text-xl text-blue-300" />
                          </div>

                          <p className="text-sm leading-relaxed text-gray-500">
                            No saved places yet. Heart destinations on the map
                            or explore page first.
                          </p>
                        </div>
                      ) : (
                        places.map((place, index) => (
                          <PlaceCard
                            key={place.id}
                            place={place}
                            index={index}
                          />
                        ))
                      )}

                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            </aside>

            {/* DAYS */}
            <div className="space-y-6">
              {Object.keys(days).map((dayKey, index) => (
                <DayCard
                  key={dayKey}
                  dayKey={dayKey}
                  dayIndex={index}
                  items={days[dayKey]}
                  notes={notes}
                  onRemove={removePlace}
                  onUpdateTime={updateTime}
                  onUpdateNote={updateNote}
                />
              ))}

              {Object.keys(days).length === 0 && (
                <div className="rounded-[28px] border border-dashed border-blue-100 bg-white py-20 text-center shadow-sm">
                  <p className="text-sm text-gray-500">
                    Use the + button above to add days.
                  </p>
                </div>
              )}
            </div>
          </div>
        </DragDropContext>
      </section>

      {!uid && loaded && (
        <div className="mx-auto -mt-14 max-w-7xl px-4 pb-20 sm:px-6 lg:px-10">
          <div className="flex items-start gap-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-4 text-xs leading-relaxed text-amber-700 shadow-sm sm:px-6 sm:text-sm">
            <FiInfo className="mt-0.5 flex-shrink-0 text-amber-500" />
            You are currently signed out. Your itineraries are still saved on
            this device. Sign in anytime to keep them in the cloud too.
          </div>
        </div>
      )}
    </div>
  );
}

export default Itinerary;