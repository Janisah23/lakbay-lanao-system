import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../firebase/config";
import {
  collectionGroup,
  getDocs,
  collection,
  onSnapshot,
} from "firebase/firestore";
import {
  FiEye,
  FiBookmark,
  FiStar,
  FiAlertCircle,
  FiAward,
  FiFilter,
  FiCheckCircle,
  FiTrendingUp,
  FiMapPin,
  FiDownload,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = ["#2563eb", "#60A5FA", "#93C5FD", "#C4B5FD", "#FCA5A5"];

function RatingsSummary() {
  const [reviews, setReviews] = useState([]);
  const [places, setPlaces] = useState({});
  const [filters, setFilters] = useState({
    municipality: "",
    days: "all",
    category: "all",
  });

  const [filterOptions, setFilterOptions] = useState({
    municipalities: [],
    categories: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const [dataSnap, contentSnap] = await Promise.all([
          getDocs(collection(db, "tourismData")),
          getDocs(collection(db, "tourismContent")),
        ]);

        const placesMap = {};
        const uniqueMunis = new Set();
        const uniqueCats = new Set();

        dataSnap.forEach((d) => {
          const data = d.data();
          placesMap[d.id] = {
            id: d.id,
            collection: "tourismData",
            ...data,
          };

          const muni = data.location?.municipality || data.municipality;
          if (muni) uniqueMunis.add(muni);

          const cat = data.category;
          if (cat) uniqueCats.add(cat);
        });

        contentSnap.forEach((d) => {
          const data = d.data();
          placesMap[d.id] = {
            id: d.id,
            collection: "tourismContent",
            ...data,
          };

          const muni = data.location?.municipality || data.municipality;
          if (muni) uniqueMunis.add(muni);

          const cat = data.category || data.contentType || "Event";
          if (cat) uniqueCats.add(cat);
        });

        setFilterOptions({
          municipalities: Array.from(uniqueMunis).sort(),
          categories: Array.from(uniqueCats).sort(),
        });

        setPlaces(placesMap);
      } catch (error) {
        console.error("Error fetching places:", error);
      }
    };

    fetchPlaces();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collectionGroup(db, "reviews"), (snap) => {
      const revs = [];

      snap.forEach((docItem) => {
        revs.push({
          id: docItem.id,
          placeId: docItem.ref.parent?.parent?.id,
          parentPath: docItem.ref.parent?.parent?.path || "",
          ...docItem.data(),
          createdAt: docItem.data().createdAt?.toDate() || new Date(),
        });
      });

      setReviews(revs);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const analytics = useMemo(() => {
    const now = new Date();

    const filteredReviews = reviews.filter((rev) => {
      if (filters.days !== "all") {
        const diffDays = (now - rev.createdAt) / (1000 * 60 * 60 * 24);
        if (diffDays > parseInt(filters.days)) return false;
      }

      const place = places[rev.placeId];
      if (!place) return false;

      const placeMuni =
        place.location?.municipality || place.municipality || "";

      if (filters.municipality && placeMuni !== filters.municipality) {
        return false;
      }

      const placeCat =
        place.category ||
        place.contentType ||
        (place.collection === "tourismData" ? "Destination" : "Event");

      if (filters.category !== "all" && placeCat !== filters.category) {
        return false;
      }

      return true;
    });

    let totalViews = 0;
    let totalSaves = 0;

    Object.values(places).forEach((place) => {
      const placeMuni =
        place.location?.municipality || place.municipality || "";

      if (filters.municipality && placeMuni !== filters.municipality) return;

      const placeCat =
        place.category ||
        place.contentType ||
        (place.collection === "tourismData" ? "Destination" : "Event");

      if (filters.category !== "all" && placeCat !== filters.category) return;

      totalViews += place.viewCount || 0;
      totalSaves += place.saveCount || 0;
    });

    let sum = 0;
    let satisfied = 0;
    const counts = [0, 0, 0, 0, 0];

    filteredReviews.forEach((r) => {
      const rating = Math.floor(r.rating || 0);

      if (rating >= 1 && rating <= 5) {
        counts[rating - 1]++;
        sum += r.rating;

        if (rating >= 4) satisfied++;
      }
    });

    const avg = filteredReviews.length ? sum / filteredReviews.length : 0;

    const satisfaction = filteredReviews.length
      ? Math.round((satisfied / filteredReviews.length) * 100)
      : 0;

    const totalRatings = filteredReviews.length || 1;

    const distributionData = [
      {
        name: "5 Stars",
        value: counts[4],
        pct: Math.round((counts[4] / totalRatings) * 100),
      },
      {
        name: "4 Stars",
        value: counts[3],
        pct: Math.round((counts[3] / totalRatings) * 100),
      },
      {
        name: "3 Stars",
        value: counts[2],
        pct: Math.round((counts[2] / totalRatings) * 100),
      },
      {
        name: "2 Stars",
        value: counts[1],
        pct: Math.round((counts[1] / totalRatings) * 100),
      },
      {
        name: "1 Star",
        value: counts[0],
        pct: Math.round((counts[0] / totalRatings) * 100),
      },
    ];

    const trendMap = {};

    filteredReviews.forEach((r) => {
      const date = new Date(r.createdAt);
      const label = date.toLocaleString("default", {
        month: "short",
        day: "numeric",
      });

      if (!trendMap[label]) {
        trendMap[label] = {
          name: label,
          Reviews: 0,
          rawSum: 0,
        };
      }

      trendMap[label].Reviews += 1;
      trendMap[label].rawSum += r.rating;
    });

    const trendData = Object.values(trendMap).map((t) => ({
      name: t.name,
      Reviews: t.Reviews,
      "Avg Rating": parseFloat((t.rawSum / t.Reviews).toFixed(1)),
    }));

    const placePerformance = {};

    filteredReviews.forEach((r) => {
      if (!placePerformance[r.placeId]) {
        placePerformance[r.placeId] = {
          place: places[r.placeId],
          sum: 0,
          count: 0,
        };
      }

      placePerformance[r.placeId].sum += r.rating;
      placePerformance[r.placeId].count += 1;
    });

    const performArray = Object.values(placePerformance).map((p) => ({
      ...p.place,
      avgRating: p.sum / p.count,
      reviewCount: p.count,
    }));

    const topPlaces = [...performArray]
      .filter((p) => p.avgRating >= 4)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5);

    const lowPlaces = [...performArray]
      .filter((p) => p.avgRating < 3)
      .sort((a, b) => a.avgRating - b.avgRating);

    return {
      stats: {
        count: filteredReviews.length,
        avg,
        satisfaction,
      },
      totalViews,
      totalSaves,
      topPlaces,
      lowPlaces,
      distributionData,
      trendData,
      allPlacesPerformance: performArray.sort(
        (a, b) => b.avgRating - a.avgRating
      ),
    };
  }, [reviews, places, filters]);

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
    doc.text("Ratings & Analytics Report", 14, 28);
    doc.text(`Date: ${currentDate}`, pageWidth - 14, 28, {
      align: "right",
    });

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(14, 34, pageWidth - 14, 34);

    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text("Filters Applied:", 14, 44);

    doc.setFont("helvetica", "italic");

    const muniText = filters.municipality || "All";
    const catText = filters.category !== "all" ? filters.category : "All";
    const timeText =
      filters.days === "all" ? "All Time" : `Last ${filters.days} days`;

    doc.text(
      `Municipality: ${muniText}   |   Category: ${catText}   |   Timeframe: ${timeText}`,
      14,
      50
    );

    doc.setFont("helvetica", "normal");

    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.setFont("helvetica", "bold");
    doc.text("Platform Summary", 14, 65);

    autoTable(doc, {
      startY: 70,
      head: [["Metric", "Value"]],
      body: [
        ["Total Ratings Collected", analytics.stats.count.toString()],
        ["Average Platform Rating", `${analytics.stats.avg.toFixed(2)} / 5.0`],
        ["Overall Tourist Satisfaction", `${analytics.stats.satisfaction}%`],
        ["Total Page Views", analytics.totalViews.toString()],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: {
          cellWidth: 100,
          fontStyle: "bold",
          textColor: [55, 65, 81],
        },
        1: {
          halign: "right",
          textColor: [37, 99, 235],
          fontStyle: "bold",
        },
      },
      styles: {
        fontSize: 10,
        cellPadding: 6,
      },
    });

    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.text(
      "Detailed Destination Performance",
      14,
      doc.lastAutoTable.finalY + 20
    );

    const tableData = analytics.allPlacesPerformance.map((place) => [
      place.title || place.name || "Unknown",
      place.category || place.contentType || "Destination",
      place.reviewCount.toString(),
      place.avgRating.toFixed(2),
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      head: [
        ["Destination / Event Name", "Category", "Total Reviews", "Avg Rating"],
      ],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: {
          cellWidth: 80,
          textColor: [31, 41, 55],
        },
        1: {
          cellWidth: 40,
        },
        2: {
          halign: "center",
          cellWidth: 30,
        },
        3: {
          halign: "right",
          fontStyle: "bold",
          textColor: [37, 99, 235],
        },
      },
      styles: {
        fontSize: 9,
        cellPadding: 5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      didDrawPage: function (data) {
        const str = `Page ${doc.internal.getNumberOfPages()}`;
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(
          str,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
    });

    doc.save(
      `Lakbay_Lanao_Analytics_${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  const selectStyle =
    "w-full cursor-pointer appearance-none rounded-[18px] border border-blue-100 bg-white py-3 pl-10 pr-4 text-sm font-medium text-gray-700 outline-none shadow-sm transition duration-300 hover:border-[#2563eb]/40 hover:bg-blue-50/40 focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100";

  const activeChip =
    "rounded-full bg-[#2563eb] px-4 py-2 text-xs font-medium text-white shadow-sm transition duration-300";

  const inactiveChip =
    "rounded-full border border-[#2563eb]/20 bg-white px-4 py-2 text-xs font-medium text-[#2563eb] shadow-sm transition duration-300 hover:bg-blue-50";

  const StatCard = ({ icon, label, value, extra }) => (
    <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(37,99,235,0.08)]">
      <div className="flex items-center gap-5">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-2xl text-[#2563eb]">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {label}
          </p>

          <div className="mt-1 flex items-center gap-3">
            <h4 className="text-3xl font-bold text-[#2563eb]">{value}</h4>
            {extra}
          </div>
        </div>
      </div>
    </div>
  );

  const PlaceRow = ({ place, type }) => {
    const isAlert = type === "alert";

    return (
      <div
        key={place.id}
        className={`group flex items-center justify-between gap-4 rounded-[24px] border p-3 transition duration-300 ${
          isAlert
            ? "border-red-100 bg-white hover:bg-red-50/50"
            : "border-blue-50 bg-white hover:bg-blue-50/60"
        }`}
      >
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-[14px] border ${
              isAlert
                ? "border-red-100 bg-red-50 text-red-500"
                : "border-blue-100 bg-blue-50 text-[#2563eb]"
            }`}
          >
            {place.imageURL && !isAlert ? (
              <img
                src={place.imageURL}
                alt={place.title || place.name || "Place"}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
              />
            ) : isAlert ? (
              <FiAlertCircle className="text-2xl" />
            ) : (
              <FiAward className="text-2xl" />
            )}
          </div>

          <div className="min-w-0">
            <p
              className={`line-clamp-1 text-base font-bold transition ${
                isAlert
                  ? "text-gray-800 group-hover:text-red-600"
                  : "text-gray-800 group-hover:text-[#2563eb]"
              }`}
            >
              {place.title || place.name || "Untitled Place"}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <FiStar
                className={`text-sm ${
                  isAlert
                    ? "fill-red-400 text-red-400"
                    : "fill-yellow-400 text-yellow-400"
                }`}
              />

              <span
                className={`text-sm font-bold ${
                  isAlert ? "text-red-600" : "text-[#2563eb]"
                }`}
              >
                {place.avgRating.toFixed(1)}
              </span>

              <span className="text-xs font-medium text-gray-500">
                ({place.reviewCount} Reviews)
              </span>
            </div>
          </div>
        </div>

        <span
          className={`hidden rounded-full border px-4 py-1.5 text-xs font-bold capitalize shadow-sm sm:inline-flex ${
            isAlert
              ? "border-red-100 bg-red-50 text-red-600"
              : "border-blue-100 bg-blue-50 text-[#2563eb]"
          }`}
        >
          {isAlert
            ? "Alert"
            : place.category ||
              place.contentType ||
              (place.collection === "tourismData" ? "Destination" : "Event")}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f3f9ff] font-['Poppins']">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-[#2563eb]" />
        <p className="text-sm font-medium text-gray-500">
          Loading ratings analytics...
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
                Admin Analytics
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
                Ratings & Analytics
              </h1>

              <p className="mt-2 max-w-2xl text-base leading-relaxed text-gray-500">
                Monitor destination performance, tourist satisfaction, saves,
                views, and review trends.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-auto">
              <div className="grid w-full items-center gap-3 sm:grid-cols-2 xl:flex">
                <div className="relative w-full xl:min-w-[210px]">
                  <FiMapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                  <select
                    value={filters.municipality}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        municipality: e.target.value,
                      }))
                    }
                    className={selectStyle}
                  >
                    <option value="">All Municipalities</option>
                    {filterOptions.municipalities.map((muni) => (
                      <option key={muni} value={muni}>
                        {muni}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative w-full xl:min-w-[210px]">
                  <FiFilter className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                  <select
                    value={filters.category}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className={selectStyle}
                  >
                    <option value="all">All Categories</option>
                    {filterOptions.categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={generatePDF}
                  className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-300 hover:bg-blue-700 sm:col-span-2 xl:col-span-1 xl:min-w-[145px]"
                >
                  <FiDownload className="text-lg" />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* KPI CARDS */}
        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<FiStar />}
            label="Total Ratings"
            value={analytics.stats.count}
            extra={
              <span className="inline-flex items-center rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-green-600">
                <FiTrendingUp className="mr-1" />
                Active
              </span>
            }
          />

          <StatCard
            icon={<FiCheckCircle />}
            label="Avg Satisfaction"
            value={`${analytics.stats.satisfaction}%`}
          />

          <StatCard
            icon={<FiEye />}
            label="Total Page Views"
            value={`${(analytics.totalViews / 1000).toFixed(1)}k`}
          />

          <StatCard
            icon={<FiBookmark />}
            label="Total Saves"
            value={analytics.totalSaves}
          />
        </section>

        {/* CHARTS */}
        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_8px_24px_rgba(37,99,235,0.06)] md:p-8 lg:col-span-2">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-[#2563eb]">
                  Rating Trends
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Review count movement based on the selected timeframe.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, days: "all" })}
                  className={filters.days === "all" ? activeChip : inactiveChip}
                >
                  All Time
                </button>

                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, days: "30" })}
                  className={filters.days === "30" ? activeChip : inactiveChip}
                >
                  Monthly
                </button>

                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, days: "7" })}
                  className={filters.days === "7" ? activeChip : inactiveChip}
                >
                  Weekly
                </button>
              </div>
            </div>

            <div className="h-[310px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={analytics.trendData}
                  margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#dbeafe"
                  />

                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    dy={10}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                  />

                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "18px",
                      border: "1px solid #dbeafe",
                      boxShadow: "0 10px 28px rgba(37,99,235,0.08)",
                      padding: "12px 16px",
                      fontSize: "12px",
                    }}
                    cursor={{
                      stroke: "#93c5fd",
                      strokeWidth: 1,
                      strokeDasharray: "5 5",
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="Reviews"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#fff",
                      stroke: "#2563eb",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: "#2563eb",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_8px_24px_rgba(37,99,235,0.06)] md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#2563eb]">
                Rating Distribution
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Breakdown of review scores.
              </p>
            </div>

            <div className="relative h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={94}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {analytics.distributionData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid #dbeafe",
                      boxShadow: "0 10px 28px rgba(37,99,235,0.08)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-[#2563eb]">
                  {analytics.stats.avg.toFixed(1)}
                </span>

                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Avg Rating
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {analytics.distributionData.map((entry, index) => (
                <div
                  key={entry.name}
                  className="flex items-center gap-3 rounded-full border border-blue-50 bg-[#f8fbff] px-3 py-2"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  />

                  <span className="text-xs font-medium text-gray-600">
                    {entry.name}
                  </span>

                  <span className="ml-auto text-xs font-bold text-[#2563eb]">
                    {entry.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LISTS */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_8px_24px_rgba(37,99,235,0.06)] md:p-8">
            <div className="mb-7">
              <h2 className="text-xl font-bold text-[#2563eb]">
                Top Rated Places
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Places with strong visitor satisfaction.
              </p>
            </div>

            <div className="space-y-4">
              {analytics.topPlaces.length === 0 ? (
                <div className="rounded-[24px] border border-blue-100 bg-[#f8fbff] px-4 py-10 text-center">
                  <p className="text-sm text-gray-500">
                    No sufficient rating data available yet.
                  </p>
                </div>
              ) : (
                analytics.topPlaces.map((place) => (
                  <PlaceRow key={place.id} place={place} type="top" />
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_8px_24px_rgba(37,99,235,0.06)] md:p-8">
            <div className="mb-7">
              <h2 className="flex items-center gap-2 text-xl font-bold text-[#2563eb]">
                Needs Attention
                <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-500">
                  Below 3.0
                </span>
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Places that may need review or improvement.
              </p>
            </div>

            <div className="space-y-4">
              {analytics.lowPlaces.length === 0 ? (
                <div className="flex flex-col items-center rounded-[24px] border border-green-100 bg-green-50/60 px-4 py-10 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-green-500 shadow-sm">
                    <FiCheckCircle className="text-3xl" />
                  </div>

                  <p className="text-base font-bold text-gray-800">
                    Excellent work!
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    There are no places with low ratings.
                  </p>
                </div>
              ) : (
                analytics.lowPlaces.map((place) => (
                  <PlaceRow key={place.id} place={place} type="alert" />
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default RatingsSummary;