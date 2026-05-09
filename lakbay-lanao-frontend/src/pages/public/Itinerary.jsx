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
} from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";
import { db, auth } from "../../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import lakbayLogo from "../../assets/lakbay-logos.png";
import html2pdf from "html2pdf.js";

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

/* ── PlaceCard ────────────────────────────────────────────────────── */
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
          className={`flex cursor-grab items-center gap-3 rounded-[18px] border bg-white p-3 active:cursor-grabbing transition-all duration-200 ${
            snapshot.isDragging
              ? "scale-[1.01] border-blue-200 shadow-[0_12px_28px_rgba(37,99,235,0.12)]"
              : "border-blue-100 shadow-sm hover:border-blue-200 hover:shadow-[0_8px_20px_rgba(37,99,235,0.07)]"
          }`}
        >
          <MdDragIndicator className="flex-shrink-0 text-xl text-gray-300" />

          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-[14px] border border-blue-100 bg-[#f8fbff] shadow-sm">
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
    <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
      <div className="flex items-center gap-3 border-b border-blue-50 bg-[#f8fbff] px-7 py-5">
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
                        className={`group flex items-center gap-4 rounded-[18px] border bg-white p-3.5 transition-all duration-200 ${
                          snapshot.isDragging
                            ? "border-blue-200 shadow-[0_12px_28px_rgba(37,99,235,0.12)]"
                            : "border-blue-100 shadow-sm hover:border-blue-200 hover:shadow-[0_8px_20px_rgba(37,99,235,0.07)]"
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

                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-[14px] border border-blue-100 bg-[#f8fbff] shadow-sm">
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
                className="w-full resize-none rounded-[14px] border border-blue-100 bg-[#f8fbff] px-4 py-3 text-xs text-gray-600 outline-none transition placeholder:text-gray-400 focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        )}
      </Droppable>
    </div>
  );
}

/* ── Hidden Tailwind PDF Template ─────────────────────────────────── */
function ItineraryPDFTemplate({ days, notes, dayCount, totalStops }) {
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
              My Itinerary
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
  const [ruleNotice, setRuleNotice] = useState("");

  const syncTimeoutRef = useRef(null);
  const pdfRef = useRef(null);

  const places = favorites.filter((item) =>
    ITINERARY_CATEGORIES.includes(item.category)
  );

  const totalStops = Object.values(days).reduce((a, b) => a + b.length, 0);

  const showRuleNotice = (message) => {
    setRuleNotice(message);
    setTimeout(() => setRuleNotice(""), 2600);
  };

  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;

    const options = {
      margin: 0,
      filename: `Lakbay-Lanao-Itinerary-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`,
      image: {
        type: "jpeg",
        quality: 0.98,
      },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f3f9ff",
      },
      jsPDF: {
        unit: "px",
        format: [794, 1123],
        orientation: "portrait",
      },
      pagebreak: {
        mode: ["avoid-all", "css", "legacy"],
      },
    };

    await html2pdf().set(options).from(pdfRef.current).save();
  };

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
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
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

  return (
    <div className="font-sans min-h-screen bg-[#f3f9ff] pb-24 text-gray-900">
      <Navbar />

      {/* Hidden PDF template */}
      <div className="fixed left-[-9999px] top-0">
        <div ref={pdfRef}>
          <ItineraryPDFTemplate
            days={days}
            notes={notes}
            dayCount={dayCount}
            totalStops={totalStops}
          />
        </div>
      </div>

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
              <div className="rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-center shadow-sm backdrop-blur-[2px]">
                <p className="text-2xl font-bold text-white">{dayCount}</p>
                <p className="mt-0.5 text-xs text-white/80">Days</p>
              </div>

              <div className="rounded-2xl border border-white/30 bg-white/15 px-5 py-3 text-center shadow-sm backdrop-blur-[2px]">
                <p className="text-2xl font-bold text-white">{totalStops}</p>
                <p className="mt-0.5 text-xs text-white/80">Stops</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-5 max-w-7xl px-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-[26px] border border-blue-100 bg-white px-7 py-5 shadow-[0_8px_24px_rgba(37,99,235,0.06)] lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold text-[#2563eb]">Trip Planner</h2>

            <p className="mt-0.5 text-sm text-gray-500">
              Set your trip duration and drag places into each day.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SaveBadge status={saveStatus} mode={saveMode} />

            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition hover:border-[#2563eb] hover:text-[#2563eb]"
            >
              <FiDownload className="text-sm" />
              Download PDF
            </button>

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

        {ruleNotice && (
          <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-red-600 shadow-sm">
            <FiAlertCircle className="flex-shrink-0" />
            {ruleNotice}
          </div>
        )}
      </div>

      <section className="mx-auto max-w-7xl px-6 pb-24 pt-8">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-4">
            <Droppable droppableId="places" isDropDisabled>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="sticky top-6 flex flex-col rounded-[28px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)] lg:col-span-1"
                  style={{ maxHeight: "calc(100vh - 120px)" }}
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
                          No saved places yet. Heart destinations on the map or
                          explore page first.
                        </p>
                      </div>
                    ) : (
                      places.map((place, index) => (
                        <PlaceCard key={place.id} place={place} index={index} />
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