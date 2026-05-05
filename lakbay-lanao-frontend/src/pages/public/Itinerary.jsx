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
  FiChevronRight,
  FiRotateCcw,
  FiCloud,
} from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";
import { db, auth } from "../../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

/* ── helpers ──────────────────────────────────────────────────────── */
const ITINERARY_CATEGORIES = [
  "Destination",
  "Establishment",
  "Landmark",
  "Cultural Heritage Site",
];

const LOCAL_STORAGE_KEY = "lakbay_lanao_itinerary_plan";

const CAT_COLORS = {
  Destination: "text-red-600 bg-red-50 border-red-100",
  Landmark: "text-blue-600 bg-blue-50 border-blue-100",
  Establishment: "text-amber-600 bg-amber-50 border-amber-100",
  "Cultural Heritage Site": "text-green-600 bg-green-50 border-green-100",
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

const getDefaultPlan = () => ({
  dayCount: 3,
  days: buildDays(3),
  notes: {},
  updatedAt: new Date().toISOString(),
});

const readLocalPlan = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    return {
      dayCount: parsed.dayCount ?? 3,
      days: buildDays(parsed.dayCount ?? 3, parsed.days ?? {}),
      notes: parsed.notes ?? {},
      updatedAt: parsed.updatedAt ?? null,
    };
  } catch (error) {
    console.error("Failed to read local itinerary:", error);
    return null;
  }
};

const writeLocalPlan = (plan) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(plan));
  } catch (error) {
    console.error("Failed to save itinerary locally:", error);
  }
};

const isLocalNewer = (localPlan, cloudPlan) => {
  const localTime = new Date(localPlan?.updatedAt || 0).getTime();
  const cloudTime = new Date(cloudPlan?.updatedAt || 0).getTime();

  return localTime > cloudTime;
};

/* ── SaveStatus badge ─────────────────────────────────────────────── */
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

/* ── PlaceCard (sidebar) ──────────────────────────────────────────── */
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
          className={`flex cursor-grab items-center gap-3 rounded-[18px] border bg-white/90 p-3 active:cursor-grabbing backdrop-blur-[2px] ring-1 ring-white/60 transition-all duration-200
            ${
              snapshot.isDragging
                ? "scale-[1.01] border-blue-200 shadow-[0_12px_28px_rgba(37,99,235,0.12)] ring-2 ring-blue-100"
                : "border-white/80 shadow-sm hover:border-blue-100 hover:bg-white hover:shadow-[0_8px_20px_rgba(37,99,235,0.07)]"
            }`}
        >
          <MdDragIndicator className="flex-shrink-0 text-xl text-gray-300" />

          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-[14px] border border-white/80 bg-blue-50 shadow-sm">
            <img
              src={place.imageURL || "/default.jpg"}
              alt={place.name || place.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight text-[#2563eb]">
              {place.name || place.title}
            </p>

            <span
              className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${catClass}`}
            >
              {place.category}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}

/* ── DayCard ──────────────────────────────────────────────────────── */
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
    <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-[2px]">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-[#f8fbff] px-7 py-5">
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
            className={`min-h-[120px] px-6 pb-4 pt-5 transition-colors duration-200 ${
              snapshot.isDraggingOver ? "bg-blue-50/60" : "bg-white/70"
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
                        className={`group flex items-center gap-4 rounded-[18px] border bg-white/95 p-3.5 backdrop-blur-[2px] ring-1 ring-white/60 transition-all duration-200
                          ${
                            snapshot.isDragging
                              ? "border-blue-200 shadow-[0_12px_28px_rgba(37,99,235,0.12)] ring-2 ring-blue-100"
                              : "border-white/80 shadow-sm hover:border-blue-100 hover:bg-white hover:shadow-[0_8px_20px_rgba(37,99,235,0.07)]"
                          }`}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="flex-shrink-0 cursor-grab p-1 text-gray-300 hover:text-gray-500 active:cursor-grabbing"
                        >
                          <MdDragIndicator className="text-xl" />
                        </div>

                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-600">
                          {idx + 1}
                        </div>

                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-[14px] border border-white/80 bg-blue-50 shadow-sm">
                          <img
                            src={place.imageURL || "/default.jpg"}
                            alt={place.name || place.title}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold leading-tight text-[#2563eb]">
                            {place.name || place.title}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${catClass}`}
                            >
                              {place.category}
                            </span>

                            {place.location?.municipality && (
                              <span className="flex items-center gap-0.5 text-[11px] text-gray-500">
                                <FiMapPin className="text-[10px]" />
                                {place.location.municipality}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2">
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
                className="w-full resize-none rounded-[14px] border border-blue-50 bg-[#f8fbff] px-4 py-3 text-xs text-gray-600 outline-none transition placeholder:text-gray-400 focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
}

/* ── Main Itinerary ───────────────────────────────────────────────── */
function Itinerary() {
  const { favorites } = useFavorites();

  const [uid, setUid] = useState(null);
  const [dayCount, setDayCount] = useState(3);
  const [days, setDays] = useState(buildDays(3));
  const [notes, setNotes] = useState({});
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveMode, setSaveMode] = useState("device");
  const [loaded, setLoaded] = useState(false);

  const syncTimeoutRef = useRef(null);

  const places = favorites.filter((item) =>
    ITINERARY_CATEGORIES.includes(item.category)
  );

  const buildPayload = useCallback(
    (daysData, notesData, count) => ({
      dayCount: count,
      days: daysData,
      notes: notesData,
      updatedAt: new Date().toISOString(),
    }),
    []
  );

  const saveLocalImmediately = useCallback(
    (daysData, notesData, count) => {
      const payload = buildPayload(daysData, notesData, count);
      writeLocalPlan(payload);
      setSaveMode("device");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 1800);
      return payload;
    },
    [buildPayload]
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

  const persistPlan = useCallback(
    (daysData, notesData, count, immediateCloud = false) => {
      const payload = saveLocalImmediately(daysData, notesData, count);

      if (!uid) return;

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

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

  const resetPlan = async () => {
    const fresh = getDefaultPlan();
    setDayCount(fresh.dayCount);
    setDays(fresh.days);
    setNotes(fresh.notes);
    persistPlan(fresh.days, fresh.notes, fresh.dayCount, true);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid || null);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const localPlan = readLocalPlan();

        if (uid) {
          const snap = await getDoc(doc(db, "users", uid, "itinerary", "plan"));

          if (snap.exists()) {
            const cloudPlan = snap.data();

            const chosenPlan =
              localPlan && isLocalNewer(localPlan, cloudPlan)
                ? localPlan
                : cloudPlan;

            const count = chosenPlan.dayCount ?? 3;

            setDayCount(count);
            setDays(buildDays(count, chosenPlan.days ?? {}));
            setNotes(chosenPlan.notes ?? {});

            if (localPlan && isLocalNewer(localPlan, cloudPlan)) {
              await setDoc(doc(db, "users", uid, "itinerary", "plan"), {
                ...localPlan,
                updatedAt: new Date().toISOString(),
              });
            }
          } else if (localPlan) {
            setDayCount(localPlan.dayCount);
            setDays(localPlan.days);
            setNotes(localPlan.notes);

            await setDoc(doc(db, "users", uid, "itinerary", "plan"), {
              ...localPlan,
              updatedAt: new Date().toISOString(),
            });
          } else {
            const fresh = getDefaultPlan();
            setDayCount(fresh.dayCount);
            setDays(fresh.days);
            setNotes(fresh.notes);
            writeLocalPlan(fresh);
          }
        } else if (localPlan) {
          setDayCount(localPlan.dayCount);
          setDays(localPlan.days);
          setNotes(localPlan.notes);
        } else {
          const fresh = getDefaultPlan();
          setDayCount(fresh.dayCount);
          setDays(fresh.days);
          setNotes(fresh.notes);
          writeLocalPlan(fresh);
        }
      } catch (err) {
        console.error("Failed to load itinerary:", err);
      } finally {
        setLoaded(true);
      }
    };

    load();
  }, [uid]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const payload = buildPayload(days, notes, dayCount);
      writeLocalPlan(payload);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dayCount, days, notes, buildPayload]);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const handleDayChange = (delta) => {
    const next = Math.min(14, Math.max(1, dayCount + delta));
    const updatedDays = buildDays(next, days);

    setDayCount(next);
    setDays(updatedDays);
    persistPlan(updatedDays, notes, next, true);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === "places") {
      const place = places.find((p) => String(p.id) === draggableId);
      if (!place) return;

      const destDay = destination.droppableId;

      if (!days[destDay]) return;
      if (days[destDay].some((i) => String(i.id) === String(place.id))) return;

      const newItem = { ...place, time: "" };
      const updated = [...days[destDay]];
      updated.splice(destination.index, 0, newItem);

      const updatedDays = { ...days, [destDay]: updated };
      setDays(updatedDays);
      persistPlan(updatedDays, notes, dayCount, true);
      return;
    }

    if (source.droppableId === destination.droppableId) {
      const dayKey = source.droppableId;

      const updatedDays = {
        ...days,
        [dayKey]: reorder(days[dayKey], source.index, destination.index),
      };

      setDays(updatedDays);
      persistPlan(updatedDays, notes, dayCount, true);
      return;
    }

    const srcKey = source.droppableId;
    const dstKey = destination.droppableId;

    if (!days[srcKey] || !days[dstKey]) return;

    const srcItems = [...days[srcKey]];
    const dstItems = [...days[dstKey]];

    const [moved] = srcItems.splice(source.index, 1);

    if (dstItems.some((i) => String(i.id) === String(moved.id))) return;

    dstItems.splice(destination.index, 0, moved);

    const updatedDays = {
      ...days,
      [srcKey]: srcItems,
      [dstKey]: dstItems,
    };

    setDays(updatedDays);
    persistPlan(updatedDays, notes, dayCount, true);
  };

  const removePlace = (dayKey, idx) => {
    const updated = [...days[dayKey]];
    updated.splice(idx, 1);

    const updatedDays = { ...days, [dayKey]: updated };

    setDays(updatedDays);
    persistPlan(updatedDays, notes, dayCount, true);
  };

  const updateTime = (dayKey, idx, value) => {
    const updated = [...days[dayKey]];
    updated[idx] = { ...updated[idx], time: value };

    const updatedDays = { ...days, [dayKey]: updated };

    setDays(updatedDays);
    persistPlan(updatedDays, notes, dayCount, false);
  };

  const updateNote = (dayKey, value) => {
    const updatedNotes = { ...notes, [dayKey]: value };

    setNotes(updatedNotes);
    persistPlan(days, updatedNotes, dayCount, false);
  };

  const totalStops = Object.values(days).reduce((a, b) => a + b.length, 0);

  return (
    <div className="font-sans min-h-screen bg-[#f3f9ff] pb-24 text-gray-900">
      <Navbar />

      <section className="relative mx-4 mt-0 h-[340px] overflow-hidden rounded-b-[48px] md:mx-8">
        <img
          src="/src/assets/itinerary-hero.png"
          alt="Itinerary"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-black/70" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-14">
          

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-4xl font-bold leading-tight text-white drop-shadow md:text-5xl">
                My Itinerary
              </h1>

              <p className="mt-2 max-w-lg text-base font-light text-gray-100">
                Drag your saved destinations into your daily schedule. It saves
                instantly on your device and syncs to cloud when available.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-center shadow-sm backdrop-blur-md">
                <p className="text-2xl font-bold text-white">{dayCount}</p>
                <p className="mt-0.5 text-xs text-white/80">Days</p>
              </div>

              <div className="rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-center shadow-sm backdrop-blur-md">
                <p className="text-2xl font-bold text-white">{totalStops}</p>
                <p className="mt-0.5 text-xs text-white/80">Stops</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-5 max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-[26px] border border-white/80 bg-white/95 px-7 py-5 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-[2px] lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-[#2563eb]">Trip Planner</h2>

            <p className="mt-0.5 text-sm text-gray-500">
              Set your trip duration and drag places into each day.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SaveBadge status={saveStatus} mode={saveMode} />

          

            <button
              onClick={resetPlan}
              className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition hover:border-red-300 hover:text-red-500"
            >
              <FiRotateCcw className="text-sm" />
              Reset
            </button>

            <div className="flex items-center gap-3 rounded-full border border-blue-100 bg-[#f8fbff] px-4 py-2">
              <button
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
                onClick={() => handleDayChange(1)}
                disabled={dayCount >= 14}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-blue-100 bg-white text-gray-600 transition hover:border-blue-300 hover:text-[#2563eb] disabled:opacity-30"
              >
                <FiPlus className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-8">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-4">
            <Droppable droppableId="places" isDropDisabled>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="sticky top-6 flex flex-col rounded-[28px] border border-white/80 bg-white/90 shadow-[0_8px_24px_rgba(37,99,235,0.06)] ring-1 ring-white/60 backdrop-blur-[2px] lg:col-span-1"
                  style={{ maxHeight: "calc(100vh - 120px)" }}
                >
                  <div className="border-b border-gray-100 px-5 pb-4 pt-5">
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
                          No saved places yet. Heart destinations on the map or
                          explore page first.
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

            <div className="space-y-6 lg:col-span-3">
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
                <div className="rounded-[28px] border border-dashed border-blue-100 bg-white/90 py-20 text-center shadow-sm ring-1 ring-white/60">
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
        <div className="mx-auto -mt-14 max-w-7xl px-6 pb-20">
          <div className="flex items-center gap-3 rounded-[18px] border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-700 shadow-sm">
            <FiInfo className="flex-shrink-0 text-amber-500" />
            You are currently signed out. Your itinerary is still saved on this
            device. Sign in anytime to keep it in the cloud too.
          </div>
        </div>
      )}
    </div>
  );
}

export default Itinerary;