import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase/config";
import {
  collectionGroup,
  collection,
  onSnapshot,
} from "firebase/firestore";
import {
  FiStar,
  FiAlertCircle,
  FiFilter,
  FiSearch,
  FiMapPin,
  FiDownload,
  FiChevronRight,
  FiChevronLeft,
  FiImage,
  FiList,
  FiCheckCircle,
  FiX,
} from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function FeedbackRatings() {
  const [reviews, setReviews] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [filterOptions, setFilterOptions] = useState({ categories: [] });

  // FIX: Switched from getDocs to onSnapshot for real-time updates and added archive filter
  useEffect(() => {
    let dataList = [];
    let contentList = [];

    const updatePlaces = () => {
      // Combine both lists and explicitly filter out archived items
      const combined = [...dataList, ...contentList].filter(
        (item) => item.status !== "archived"
      );

      const uniqueCats = new Set();
      combined.forEach((data) => {
        if (data.category || data.contentType) {
          uniqueCats.add(data.category || data.contentType);
        }
      });

      setFilterOptions({ categories: Array.from(uniqueCats).sort() });
      setPlaces(combined);
    };

    const unsubData = onSnapshot(collection(db, "tourismData"), (snap) => {
      dataList = snap.docs.map((d) => ({
        id: d.id,
        collection: "tourismData",
        ...d.data(),
      }));
      updatePlaces();
    });

    const unsubContent = onSnapshot(collection(db, "tourismContent"), (snap) => {
      contentList = snap.docs.map((d) => ({
        id: d.id,
        collection: "tourismContent",
        ...d.data(),
      }));
      updatePlaces();
    });

    return () => {
      unsubData();
      unsubContent();
    };
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collectionGroup(db, "reviews"), (snap) => {
      const revs = [];

      snap.forEach((doc) => {
        revs.push({
          id: doc.id,
          placeId: doc.ref.parent?.parent?.id,
          rating: doc.data().rating || 0,
        });
      });

      setReviews(revs);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const processedData = useMemo(() => {
    let totalRatingsCount = 0;
    let sumAllRatings = 0;
    let needsAttentionCount = 0;

    const performanceList = places.map((place) => {
      const placeReviews = reviews.filter((r) => r.placeId === place.id);

      let sum = 0;
      const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

      placeReviews.forEach((r) => {
        const rating = Math.floor(r.rating);

        if (rating >= 1 && rating <= 5) {
          counts[rating]++;
          sum += r.rating;
          totalRatingsCount++;
          sumAllRatings += r.rating;
        }
      });

      const totalReviews = placeReviews.length;
      const avgRating = totalReviews > 0 ? sum / totalReviews : 0;

      if (totalReviews > 0 && avgRating < 3.0) {
        needsAttentionCount++;
      }

      const placeCat =
        place.category ||
        place.contentType ||
        (place.collection === "tourismData" ? "Destination" : "Event");

      return {
        ...place,
        displayCategory: placeCat,
        totalReviews,
        avgRating,
        counts,
      };
    });

    const filteredList = performanceList
      .filter((p) => {
        const title = p.title || p.name || "";

        const matchesSearch = title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        const matchesCat =
          categoryFilter === "all" || p.displayCategory === categoryFilter;

        return matchesSearch && matchesCat;
      })
      .sort((a, b) => b.totalReviews - a.totalReviews);

    // Auto-select the first item if nothing is selected
    if (!selectedPlace && filteredList.length > 0) {
      setTimeout(() => setSelectedPlace(filteredList[0]), 0);
    }

    return {
      kpis: {
        totalPlaces: places.length,
        totalRatings: totalRatingsCount,
        avgOverall:
          totalRatingsCount > 0 ? sumAllRatings / totalRatingsCount : 0,
        needsAttention: needsAttentionCount,
      },
      filteredList,
    };
  }, [places, reviews, searchTerm, categoryFilter, selectedPlace]);

  // FIX: Auto-deselect the place if it gets archived while the user is viewing it
  useEffect(() => {
    if (selectedPlace) {
      const isStillVisible = processedData.filteredList.some((p) => p.id === selectedPlace.id);
      if (!isStillVisible) {
        setSelectedPlace(null);
      }
    }
  }, [processedData.filteredList, selectedPlace]);

  const totalPages = Math.max(
    1,
    Math.ceil(processedData.filteredList.length / itemsPerPage)
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedPlaces = processedData.filteredList.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  const generatePDF = () => {
    const doc = new jsPDF();

    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const pageWidth = doc.internal.pageSize.width;

    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235);
    doc.setFont("helvetica", "bold");
    doc.text("LAKBAY LANAO", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("Staff Destination Performance Report", 14, 28);
    doc.text(`Date: ${currentDate}`, pageWidth - 14, 28, { align: "right" });

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(14, 34, pageWidth - 14, 34);

    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.text("Managed Destinations Rating Breakdown", 14, 45);

    const tableData = processedData.filteredList.map((place) => [
      place.title || place.name || "Unknown",
      place.displayCategory,
      place.totalReviews.toString(),
      place.avgRating.toFixed(1),
      `${place.counts[5]} | ${place.counts[4]} | ${place.counts[3]} | ${place.counts[2]} | ${place.counts[1]}`,
    ]);

    autoTable(doc, {
      startY: 50,
      head: [
        [
          "Destination / Event",
          "Category",
          "Total Ratings",
          "Avg",
          "Breakdown (5|4|3|2|1)",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 65, fontStyle: "bold" },
        2: { halign: "center" },
        3: {
          halign: "center",
          fontStyle: "bold",
          textColor: [37, 99, 235],
        },
        4: { halign: "center", textColor: [100, 100, 100] },
      },
      styles: { fontSize: 9 },
    });

    doc.save(
      `Staff_Performance_Report_${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setCurrentPage(1);
  };

  const inputStyle =
    "w-full rounded-[18px] border border-blue-100 bg-white px-4 py-3 text-sm font-medium text-gray-600 outline-none shadow-sm transition duration-300 placeholder:text-gray-400 hover:border-[#2563eb]/40 hover:bg-blue-50/40 focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100";

  const StatCard = ({ icon, label, value, valueExtra, tone = "blue" }) => {
    const isDanger = tone === "danger";
    const isSuccess = tone === "success";

    return (
      <div
        className={`rounded-[28px] border bg-white p-6 shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(37,99,235,0.08)] ${
          isDanger
            ? "border-red-100"
            : isSuccess
            ? "border-green-100"
            : "border-blue-100"
        }`}
      >
        <div className="flex items-center gap-5">
          <div
            className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border text-2xl ${
              isDanger
                ? "border-red-100 bg-red-50 text-red-500"
                : isSuccess
                ? "border-green-100 bg-green-50 text-green-500"
                : "border-blue-100 bg-blue-50 text-[#2563eb]"
            }`}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {label}
            </p>

            <h4
              className={`mt-1 text-3xl font-bold ${
                isDanger
                  ? "text-red-500"
                  : isSuccess
                  ? "text-green-500"
                  : "text-[#2563eb]"
              }`}
            >
              {value}
              {valueExtra}
            </h4>
          </div>
        </div>
      </div>
    );
  };

  const RatingBars = ({ selectedPlace }) => (
    <div className="space-y-4">
      <h4 className="text-base font-bold text-[#2563eb]">Rating Breakdown</h4>

      {[5, 4, 3, 2, 1].map((star) => {
        const count = selectedPlace.counts[star] || 0;
        const percentage =
          selectedPlace.totalReviews > 0
            ? Math.round((count / selectedPlace.totalReviews) * 100)
            : 0;

        let barColor = "bg-[#2563eb]";
        if (star === 5) barColor = "bg-green-500";
        if (star <= 2) barColor = "bg-red-500";
        if (star === 3) barColor = "bg-amber-400";

        return (
          <div key={star} className="flex items-center gap-3">
            <div className="flex w-12 flex-shrink-0 items-center gap-1 text-sm font-semibold text-gray-600">
              {star}
              <FiStar className="text-xs fill-gray-300 text-gray-300" />
            </div>

            <div className="h-3 flex-1 overflow-hidden rounded-full bg-blue-50">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="w-10 text-right text-sm font-semibold text-gray-600">
              {count}
            </div>
          </div>
        );
      })}
    </div>
  );

  const Pagination = () => {
    if (processedData.filteredList.length <= itemsPerPage) return null;

    return (
      <div className="border-t border-blue-50 bg-[#f8fbff] px-5 py-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm font-medium text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {startIndex + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-gray-700">
              {Math.min(
                startIndex + itemsPerPage,
                processedData.filteredList.length
              )}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-700">
              {processedData.filteredList.length}
            </span>{" "}
            destinations
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition ${
                currentPage === 1
                  ? "cursor-not-allowed border-blue-50 bg-white text-gray-300"
                  : "border-blue-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
              }`}
            >
              <FiChevronLeft className="text-lg" />
            </button>

            <span className="rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition ${
                currentPage === totalPages
                  ? "cursor-not-allowed border-blue-50 bg-white text-gray-300"
                  : "border-blue-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
              }`}
            >
              <FiChevronRight className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f3f9ff] font-['Poppins']">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-[#2563eb]" />

        <p className="text-sm font-medium text-gray-500">
          Loading rating data...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f8fbff] font-['Poppins']">
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10 lg:px-10">
        {/* HEADER */}
        <section className="mb-10">
          <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div>
              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
                Staff Analytics
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
                Ratings & Analytics
              </h1>

              <p className="mt-2 max-w-2xl text-base leading-relaxed text-gray-500">
                Track tourist ratings and review destination performance across
                managed tourism entries.
              </p>
            </div>

            <button
              type="button"
              onClick={generatePDF}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-300 hover:bg-blue-700 sm:w-auto"
            >
              <FiDownload className="text-lg" />
              Export Report
            </button>
          </div>
        </section>

        {/* KPI CARDS */}
        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<FiMapPin />}
            label="Managed Places"
            value={processedData.kpis.totalPlaces}
          />

          <StatCard
            icon={<FiList />}
            label="Total Ratings"
            value={processedData.kpis.totalRatings}
          />

          <StatCard
            icon={<FiStar />}
            label="Portfolio Avg"
            value={processedData.kpis.avgOverall.toFixed(1)}
            valueExtra={
              <span className="ml-1 text-sm font-medium text-gray-400">
                /5
              </span>
            }
          />

          <StatCard
            icon={
              processedData.kpis.needsAttention > 0 ? (
                <FiAlertCircle />
              ) : (
                <FiCheckCircle />
              )
            }
            label="Needs Attention"
            value={processedData.kpis.needsAttention}
            tone={processedData.kpis.needsAttention > 0 ? "danger" : "success"}
          />
        </section>

        {/* WORKSPACE */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT PANEL */}
          <div className="flex h-[760px] flex-col overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)] lg:col-span-2">
            <div className="border-b border-blue-50 bg-[#f8fbff] px-6 py-5">
              <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h2 className="text-lg font-bold text-[#2563eb]">
                    Destination Performance
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Select an entry to view detailed rating breakdown.
                  </p>
                </div>

                {(searchTerm || categoryFilter !== "all") && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-red-100 bg-white px-4 py-2.5 text-sm font-medium text-red-500 shadow-sm transition hover:bg-red-50"
                  >
                    <FiX />
                    Clear
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_230px]">
                <div className="relative w-full">
                  <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />

                  <input
                    type="text"
                    placeholder="Search destinations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${inputStyle} pl-11 pr-11`}
                  />

                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <FiX className="text-base" />
                    </button>
                  )}
                </div>

                <div className="relative w-full">
                  <FiFilter className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`${inputStyle} cursor-pointer appearance-none pl-11 capitalize`}
                  >
                    <option value="all">All Categories</option>
                    {filterOptions.categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {processedData.filteredList.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#2563eb]">
                    <FiSearch className="text-2xl" />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-700">
                    No destinations found
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search or category filter.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedPlaces.map((place) => {
                    const isSelected = selectedPlace?.id === place.id;

                    return (
                      <div
                        key={place.id}
                        onClick={() => setSelectedPlace(place)}
                        className={`group flex cursor-pointer items-center justify-between gap-4 rounded-[22px] border p-4 transition duration-300 ${
                          isSelected
                            ? "border-[#2563eb]/40 bg-blue-50 shadow-sm"
                            : "border-blue-50 bg-white hover:border-blue-100 hover:bg-blue-50/50"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-blue-100 bg-[#f8fbff] text-gray-400">
                            {place.imageURL ? (
                              <img
                                src={place.imageURL}
                                alt={place.title || place.name || "Place"}
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                              />
                            ) : (
                              <FiImage className="text-xl" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p
                              className={`line-clamp-1 text-base font-semibold transition ${
                                isSelected
                                  ? "text-[#2563eb]"
                                  : "text-gray-700 group-hover:text-[#2563eb]"
                              }`}
                            >
                              {place.title || place.name || "Untitled Place"}
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2563eb]">
                                {place.displayCategory}
                              </span>

                              <span className="text-xs font-medium text-gray-500">
                                {place.totalReviews} rating
                                {place.totalReviews !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <FiStar
                                className={`text-sm ${
                                  place.avgRating >= 4
                                    ? "fill-yellow-400 text-yellow-400"
                                    : place.avgRating > 0
                                    ? "fill-gray-300 text-gray-300"
                                    : "text-gray-300"
                                }`}
                              />

                              <span className="text-base font-bold text-[#2563eb]">
                                {place.avgRating > 0
                                  ? place.avgRating.toFixed(1)
                                  : "0.0"}
                              </span>
                            </div>
                          </div>

                          <FiChevronRight
                            className={`text-xl transition-transform ${
                              isSelected
                                ? "translate-x-1 text-[#2563eb]"
                                : "text-gray-300 group-hover:text-[#2563eb]"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Pagination />
          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-1">
            {selectedPlace ? (
              <div className="sticky top-10 flex flex-col rounded-[28px] border border-blue-100 bg-white p-7 shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
                <div className="mb-7 text-center">
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[18px] border border-blue-100 bg-[#f8fbff] text-gray-400 shadow-sm">
                    {selectedPlace.imageURL ? (
                      <img
                        src={selectedPlace.imageURL}
                        alt={selectedPlace.title || selectedPlace.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FiImage className="text-3xl" />
                    )}
                  </div>

                  <h3 className="line-clamp-2 text-xl font-bold text-[#2563eb]">
                    {selectedPlace.title || selectedPlace.name}
                  </h3>

                  <p className="mt-1 text-sm capitalize text-gray-500">
                    {selectedPlace.displayCategory}
                  </p>
                </div>

                <div className="mb-7 rounded-[24px] border border-blue-100 bg-blue-50 px-6 py-6 text-center">
                  <div className="mb-1 flex items-center justify-center gap-2">
                    <FiStar className="fill-yellow-400 text-3xl text-yellow-400" />

                    <span className="text-5xl font-bold text-[#2563eb]">
                      {selectedPlace.avgRating > 0
                        ? selectedPlace.avgRating.toFixed(1)
                        : "0.0"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-medium text-gray-500">
                    Based on {selectedPlace.totalReviews} rating
                    {selectedPlace.totalReviews !== 1 ? "s" : ""}
                  </p>
                </div>

                <RatingBars selectedPlace={selectedPlace} />
              </div>
            ) : (
              <div className="flex h-[700px] flex-col items-center justify-center rounded-[28px] border border-blue-100 bg-white p-8 text-center shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#2563eb]">
                  <FiStar className="text-3xl" />
                </div>

                <h3 className="text-lg font-semibold text-gray-700">
                  No Destination Selected
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  Click a destination from the list to view its rating
                  breakdown.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default FeedbackRatings;