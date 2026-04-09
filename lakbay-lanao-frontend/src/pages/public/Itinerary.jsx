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
const ITINERARY_CATEGORIES = ["Destination", "Establishment", "Landmark", "Cultural Heritage Site"];
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
      <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium animate-pulse">
        {mode === "cloud" ? <FiCloud /> : <FiSave />} Saving…
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
        <FiCheckCircle />
        {mode === "cloud" ? "Saved to cloud" : "Saved on this device"}
      </span>
    );
  }

  return null;
}

/* ── PlaceCard (sidebar) ──────────────────────────────────────────── */
function PlaceCard({ place, index }) {
  const catClass = CAT_COLORS[place.category] || "text-blue-600 bg-blue-50 border-blue-100";

  return (
    <Draggable draggableId={String(place.id)} index={index} key={place.id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`flex items-center gap-3 p-3 rounded-[14px] border bg-white cursor-grab active:cursor-grabbing transition-all duration-200
            ${
              snapshot.isDragging
                ? "shadow-xl border-blue-300 ring-2 ring-blue-200 scale-[1.02]"
                : "border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md"
            }`}
        >
          <MdDragIndicator className="text-gray-300 text-xl flex-shrink-0" />
          <img
            src={place.imageURL || "/default.jpg"}
            alt={place.name || place.title}
            className="w-11 h-11 rounded-[10px] object-cover border border-gray-100 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-blue-600 truncate leading-tight">
              {place.name || place.title}
            </p>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border mt-1 inline-block ${catClass}`}
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
function DayCard({ dayKey, dayIndex, items, notes, onRemove, onUpdateTime, onUpdateNote }) {
  return (
    <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-7 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/60 to-transparent">
        <div className="w-9 h-9 rounded-full bg-[#2563eb] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
          {dayIndex + 1}
        </div>
        <div>
          <h3 className="font-bold text-blue-600 text-base leading-tight">Day {dayIndex + 1}</h3>
          <p className="text-xs text-gray-600 mt-0.5">
            {items.length === 0 ? "No stops yet" : `${items.length} stop${items.length > 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <Droppable droppableId={dayKey}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`px-6 pt-5 pb-4 min-h-[120px] transition-colors duration-200 ${
              snapshot.isDraggingOver ? "bg-blue-50/40" : "bg-white"
            }`}
          >
            {items.length === 0 && (
              <div className="h-20 border-2 border-dashed border-gray-200 rounded-[16px] flex items-center justify-center text-gray-600 text-sm font-medium select-none">
                Drop destinations here
              </div>
            )}

            <div className="space-y-3">
              {items.map((place, idx) => {
                const catClass = CAT_COLORS[place.category] || "text-blue-600 bg-blue-50 border-blue-100";

                return (
                  <Draggable key={`${place.id}-${dayKey}`} draggableId={`${place.id}-${dayKey}`} index={idx}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-4 p-3.5 rounded-[16px] border bg-white group transition-all duration-200
                          ${
                            snapshot.isDragging
                              ? "shadow-xl border-blue-300 ring-2 ring-blue-200"
                              : "border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md"
                          }`}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500 flex-shrink-0"
                        >
                          <MdDragIndicator className="text-xl" />
                        </div>

                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[11px] font-bold flex-shrink-0">
                          {idx + 1}
                        </div>

                        <img
                          src={place.imageURL || "/default.jpg"}
                          alt={place.name || place.title}
                          className="w-14 h-14 rounded-[12px] object-cover border border-gray-100 flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-blue-600 text-sm leading-tight truncate">
                            {place.name || place.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${catClass}`}>
                              {place.category}
                            </span>
                            {place.location?.municipality && (
                              <span className="text-[11px] text-gray-600 flex items-center gap-0.5">
                                <FiMapPin className="text-[10px]" />
                                {place.location.municipality}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-[10px] px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-200 transition">
                            <FiClock className="text-gray-600 text-xs flex-shrink-0" />
                            <input
                              type="time"
                              value={place.time || ""}
                              onChange={(e) => onUpdateTime(dayKey, idx, e.target.value)}
                              className="bg-transparent border-none outline-none text-xs font-medium text-gray-600 w-20"
                            />
                          </div>
                          <button
                            onClick={() => onRemove(dayKey, idx)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-50 rounded-[8px] transition-colors"
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

            <div className="mt-4 pt-4 border-t border-gray-100">
              <textarea
                placeholder="Add notes, transport details, or reminders for this day…"
                value={notes[dayKey] || ""}
                onChange={(e) => onUpdateNote(dayKey, e.target.value)}
                rows={2}
                className="w-full rounded-[12px] border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600 outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#2563eb] transition resize-none placeholder-gray-400"
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

  const places = favorites.filter((item) => ITINERARY_CATEGORIES.includes(item.category));

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

            const chosenPlan = localPlan && isLocalNewer(localPlan, cloudPlan) ? localPlan : cloudPlan;

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
    const updatedDays = { ...days, [srcKey]: srcItems, [dstKey]: dstItems };
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
    <div className="font-sans text-gray-900 min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] pb-24">
      <Navbar />

      <section className="relative w-full h-[340px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop"
          alt="Itinerary"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
        <div className="relative z-10 h-full flex flex-col justify-end pb-14 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-white/60 mb-4 font-medium uppercase tracking-wider">
            <span>Visit Lanao</span>
            <FiChevronRight className="text-white/40" />
            <span className="text-white/80">My Itinerary</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow leading-tight">
                My Itinerary
              </h1>
              <p className="text-gray-100 text-base mt-2 max-w-lg font-light">
                Drag your saved destinations into your daily schedule. It saves instantly on your device and syncs to cloud when available.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl px-5 py-3 text-center">
                <p className="text-2xl font-bold text-white">{dayCount}</p>
                <p className="text-white/80 text-xs mt-0.5">Days</p>
              </div>
              <div className="bg-white/15 backdrop-blur-sm border border-white/30 rounded-2xl px-5 py-3 text-center">
                <p className="text-2xl font-bold text-white">{totalStops}</p>
                <p className="text-white/80 text-xs mt-0.5">Stops</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-5 relative z-10">
        <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm px-7 py-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-blue-600">Trip Planner</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              Set your trip duration and drag places into each day.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SaveBadge status={saveStatus} mode={saveMode} />

            <button
              onClick={() => persistPlan(days, notes, dayCount, true)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm hover:border-[#2563eb] hover:text-[#2563eb] transition"
            >
              <FiSave className="text-sm" />
              Save now
            </button>

            <button
              onClick={resetPlan}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm hover:border-red-300 hover:text-red-500 transition"
            >
              <FiRotateCcw className="text-sm" />
              Reset
            </button>

            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
              <button
                onClick={() => handleDayChange(-1)}
                disabled={dayCount <= 1}
                className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[#2563eb] hover:border-blue-300 transition disabled:opacity-30"
              >
                <FiMinus className="text-xs" />
              </button>

              <span className="text-sm font-bold text-gray-600 w-16 text-center">
                {dayCount} {dayCount === 1 ? "Day" : "Days"}
              </span>

              <button
                onClick={() => handleDayChange(1)}
                disabled={dayCount >= 14}
                className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[#2563eb] hover:border-blue-300 transition disabled:opacity-30"
              >
                <FiPlus className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 pt-8">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-7 items-start">
            <Droppable droppableId="places" isDropDisabled>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="lg:col-span-1 bg-white rounded-[28px] border border-gray-200 shadow-sm flex flex-col sticky top-6"
                  style={{ maxHeight: "calc(100vh - 120px)" }}
                >
                  <div className="px-5 pt-5 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <FiMapPin className="text-[#2563eb] text-base" />
                      <h2 className="font-bold text-blue-600 text-base">Saved Places</h2>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Drag any place into a day on the right.
                    </p>
                  </div>

                  {favorites.length > 0 && places.length === 0 && (
                    <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-100 rounded-[12px] flex gap-2 text-xs text-amber-700">
                      <FiInfo className="flex-shrink-0 mt-0.5" />
                      <span>Your saved items aren't destinations, landmarks, establishments, or cultural sites.</span>
                    </div>
                  )}

                  <div className="p-4 flex-1 overflow-y-auto space-y-2.5" style={{ scrollbarWidth: "thin" }}>
                    {places.length === 0 ? (
                      <div className="text-center py-10 px-4">
                        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                          <FiMapPin className="text-blue-300 text-xl" />
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          No saved places yet. Heart destinations on the map or explore page first.
                        </p>
                      </div>
                    ) : (
                      places.map((place, index) => <PlaceCard key={place.id} place={place} index={index} />)
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>

            <div className="lg:col-span-3 space-y-6">
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
                <div className="bg-white rounded-[28px] border border-dashed border-gray-200 py-20 text-center">
                  <p className="text-gray-600 text-sm">Use the + button above to add days.</p>
                </div>
              )}
            </div>
          </div>
        </DragDropContext>
      </section>

      {!uid && loaded && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-[16px] px-6 py-4 flex items-center gap-3 text-sm text-amber-700">
            <FiInfo className="flex-shrink-0 text-amber-500" />
            You are currently signed out. Your itinerary is still saved on this device. Sign in anytime to keep it in the cloud too.
          </div>
        </div>
      )}
    </div>
  );
}

export default Itinerary;