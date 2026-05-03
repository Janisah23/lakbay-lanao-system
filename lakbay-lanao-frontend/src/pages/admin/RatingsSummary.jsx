import React, { useEffect, useState, useMemo } from "react";
import { db } from "../../firebase/config";
import { collectionGroup, getDocs, collection, onSnapshot } from "firebase/firestore";
import {
  FiEye,
  FiBookmark,
  FiStar,
  FiAlertCircle,
  FiAward,
  FiFilter,
  FiCheckCircle,
  FiMoreHorizontal,
  FiTrendingUp,
  FiMapPin,
  FiDownload
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
          placesMap[d.id] = { id: d.id, collection: "tourismData", ...data };

          const muni = data.location?.municipality || data.municipality;
          if (muni) uniqueMunis.add(muni);

          const cat = data.category;
          if (cat) uniqueCats.add(cat);
        });

        contentSnap.forEach((d) => {
          const data = d.data();
          placesMap[d.id] = { id: d.id, collection: "tourismContent", ...data };

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
      snap.forEach((doc) => {
        revs.push({
          id: doc.id,
          placeId: doc.ref.parent?.parent?.id,
          parentPath: doc.ref.parent?.parent?.path || "",
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
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

      const placeMuni = place.location?.municipality || place.municipality || "";
      if (filters.municipality && placeMuni !== filters.municipality) return false;

      const placeCat =
        place.category ||
        place.contentType ||
        (place.collection === "tourismData" ? "Destination" : "Event");

      if (filters.category !== "all" && placeCat !== filters.category) return false;

      return true;
    });

    let totalViews = 0;
    let totalSaves = 0;

    Object.values(places).forEach((place) => {
      const placeMuni = place.location?.municipality || place.municipality || "";
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
    let counts = [0, 0, 0, 0, 0];
    let satisfied = 0;

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
      { name: "5 Stars", value: counts[4], pct: Math.round((counts[4] / totalRatings) * 100) },
      { name: "4 Stars", value: counts[3], pct: Math.round((counts[3] / totalRatings) * 100) },
      { name: "3 Stars", value: counts[2], pct: Math.round((counts[2] / totalRatings) * 100) },
      { name: "2 Stars", value: counts[1], pct: Math.round((counts[1] / totalRatings) * 100) },
      { name: "1 Star", value: counts[0], pct: Math.round((counts[0] / totalRatings) * 100) },
    ];

    const trendMap = {};
    filteredReviews.forEach((r) => {
      const date = new Date(r.createdAt);
      const label = date.toLocaleString("default", { month: "short", day: "numeric" });

      if (!trendMap[label]) {
        trendMap[label] = { name: label, Reviews: 0, rawSum: 0 };
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
        placePerformance[r.placeId] = { place: places[r.placeId], sum: 0, count: 0 };
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
      stats: { count: filteredReviews.length, avg, satisfaction },
      totalViews,
      totalSaves,
      topPlaces,
      lowPlaces,
      distributionData,
      trendData,
      allPlacesPerformance: performArray.sort((a, b) => b.avgRating - a.avgRating) // Needed for PDF
    };
  }, [reviews, places, filters]);

  // Generate Properly Aligned Professional PDF
  const generatePDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const pageWidth = doc.internal.pageSize.width;

    // 1. Brand Header
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // #2563eb
    doc.setFont("helvetica", "bold");
    doc.text("LAKBAY LANAO", 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("Ratings & Analytics Report", 14, 28);

    // 2. Right-Aligned Date
    doc.text(`Date: ${currentDate}`, pageWidth - 14, 28, { align: "right" });

    // 3. Divider Line
    doc.setDrawColor(229, 231, 235); // border-gray-200
    doc.setLineWidth(0.5);
    doc.line(14, 34, pageWidth - 14, 34);

    // 4. Applied Filters (Italicized)
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99); // gray-600
    doc.text(`Filters Applied:`, 14, 44);
    
    doc.setFont("helvetica", "italic");
    const muniText = filters.municipality || "All";
    const catText = filters.category !== "all" ? filters.category : "All";
    const timeText = filters.days === "all" ? "All Time" : `Last ${filters.days} days`;
    doc.text(`Municipality: ${muniText}   |   Category: ${catText}   |   Timeframe: ${timeText}`, 14, 50);
    doc.setFont("helvetica", "normal");

    // 5. Platform Summary Table
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55); // gray-800
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
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 100, fontStyle: 'bold', textColor: [55, 65, 81] },
        1: { halign: 'right', textColor: [37, 99, 235], fontStyle: 'bold' } // Align numbers to right
      },
      styles: { fontSize: 10, cellPadding: 6 }
    });

    // 6. Detailed Performance Table
    doc.setFontSize(14);
    doc.setTextColor(31, 41, 55);
    doc.text("Detailed Destination Performance", 14, doc.lastAutoTable.finalY + 20);

    const tableData = analytics.allPlacesPerformance.map(place => [
      place.title || place.name || "Unknown",
      place.category || place.contentType || "Destination",
      place.reviewCount.toString(),
      place.avgRating.toFixed(2)
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      head: [["Destination / Event Name", "Category", "Total Reviews", "Avg Rating"]],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 80, textColor: [31, 41, 55] },
        1: { cellWidth: 40 },
        2: { halign: 'center', cellWidth: 30 }, // Center aligned reviews
        3: { halign: 'right', fontStyle: 'bold', textColor: [37, 99, 235] } // Right aligned rating
      },
      styles: { fontSize: 9, cellPadding: 5 },
      alternateRowStyles: { fillColor: [248, 250, 252] }, // Soft blue-gray alternating rows
      
      // Page Number Footer
      didDrawPage: function (data) {
        let str = "Page " + doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175); // gray-400
        doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    doc.save(`Lakbay_Lanao_Analytics_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Reusable Lakbay Lanao Styles
  const activeChip = "rounded-full bg-[#2563eb] px-5 py-2 text-sm font-medium text-white transition-all shadow-sm";
  const inactiveChip = "rounded-full bg-gray-100 px-5 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-all";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb] mb-4"></div>
        <p className="text-gray-500 font-medium">Loading Dashboard Data...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto pt-10 pb-20 px-6 lg:px-10">       
                
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-6 mb-12">
          
          {/* Title Area */}
          <div className="flex-shrink-0">
            <h1 className="text-3xl md:text-4xl font-bold text-[#2563eb] tracking-tight">
              Ratings & Analytics
            </h1>
            <p className="text-gray-500 mt-2">
              Monitor performance and tourist satisfaction.
            </p>
          </div>

          {/* Filters & Export Row */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
            
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
              {/* Municipality Filter */}
              <div className="relative w-full sm:min-w-[180px]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMapPin className="text-gray-400" />
                </div>
                <select
                  value={filters.municipality}
                  onChange={(e) => setFilters((prev) => ({ ...prev, municipality: e.target.value }))}
                  className="w-full rounded-[12px] border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm outline-none transition hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 cursor-pointer appearance-none"
                >
                  <option value="">All Municipalities</option>
                  {filterOptions.municipalities.map((muni) => (
                    <option key={muni} value={muni}>{muni}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="relative w-full sm:min-w-[180px]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiFilter className="text-gray-400" />
                </div>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full rounded-[12px] border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm outline-none transition hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 cursor-pointer appearance-none"
                >
                  <option value="all">All Categories</option>
                  {filterOptions.categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Separator (Desktop Only) */}
            <div className="hidden sm:block w-px h-10 bg-gray-200 mx-2 flex-shrink-0"></div>

            {/* PDF Export Button (Always far right on desktop) */}
            <button
              onClick={generatePDF}
              className="flex items-center justify-center gap-0 rounded-full bg-[#2563eb] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md w-full sm:w-auto whitespace-nowrap flex-shrink-0"
            >
              <FiDownload className="text-lg" />
              Export Report
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition duration-300">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-2xl">
              <FiStar />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Total Ratings</p>
              <div className="flex items-center gap-3">
                <h4 className="text-2xl font-bold text-[#2563eb]">{analytics.stats.count}</h4>
                <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2.5 py-1 rounded-full flex items-center">
                  <FiTrendingUp className="mr-1" /> Active
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition duration-300">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-2xl">
              <FiCheckCircle />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Avg Satisfaction</p>
              <h4 className="text-2xl font-bold text-[#2563eb]">{analytics.stats.satisfaction}%</h4>
            </div>
          </div>

          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition duration-300">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-2xl">
              <FiEye />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Total Page Views</p>
              <h4 className="text-2xl font-bold text-[#2563eb]">{(analytics.totalViews / 1000).toFixed(1)}k</h4>
            </div>
          </div>

          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition duration-300">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-2xl">
              <FiBookmark />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Total Saves</p>
              <h4 className="text-2xl font-bold text-[#2563eb]">{analytics.totalSaves}</h4>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Trend Line Chart */}
          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-8 lg:col-span-2 hover:shadow-md transition duration-300">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
              <h3 className="text-xl font-bold text-gray-800">Rating Trends</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setFilters({ ...filters, days: "all" })}
                  className={filters.days === "all" ? activeChip : inactiveChip}
                >
                  All Time
                </button>
                <button 
                  onClick={() => setFilters({ ...filters, days: "30" })}
                  className={filters.days === "30" ? activeChip : inactiveChip}
                >
                  Monthly
                </button>
                <button 
                  onClick={() => setFilters({ ...filters, days: "7" })}
                  className={filters.days === "7" ? activeChip : inactiveChip}
                >
                  Weekly
                </button>
              </div>
            </div>

            <div className="h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.trendData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: "16px", border: "1px solid #E5E7EB", boxShadow: "0 10px 25px rgba(0,0,0,0.08)", padding: "12px 16px" }}
                    cursor={{ stroke: "#2563eb", strokeWidth: 1, strokeDasharray: "5 5" }}
                  />
                  <Line type="monotone" dataKey="Reviews" stroke="#2563eb" strokeWidth={4} dot={{ r: 5, fill: "#fff", stroke: "#2563eb", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-8 flex flex-col hover:shadow-md transition duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">Distribution</h3>
              <button className="p-2 text-gray-400 hover:text-[#2563eb] hover:bg-blue-50 rounded-full transition">
                <FiMoreHorizontal className="text-xl" />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full relative">
              <div className="h-[220px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.distributionData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={3} dataKey="value" stroke="none">
                      {analytics.distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.08)" }} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-extrabold text-[#2563eb]">{analytics.stats.avg.toFixed(1)}</span>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">Avg Rating</span>
                </div>
              </div>

              <div className="w-full mt-6 grid grid-cols-2 gap-y-4 px-2">
                {analytics.distributionData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-sm text-gray-600 font-medium">{entry.name}</span>
                    <span className="text-sm font-bold text-[#2563eb] ml-auto">{entry.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Lists Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Rated */}
          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-8 hover:shadow-md transition duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-gray-800">Top Rated Places</h3>
              <button className="rounded-full bg-blue-50 px-5 py-2 text-sm font-bold text-[#2563eb] hover:bg-[#2563eb] hover:text-white transition-all">
                View All
              </button>
            </div>

            <div className="space-y-5">
              {analytics.topPlaces.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No sufficient rating data available yet.</p>
              ) : (
                analytics.topPlaces.map((place) => (
                  <div key={place.id} className="flex items-center justify-between group p-3 rounded-[20px] hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                        {place.imageURL ? (
                          <img src={place.imageURL} alt={place.title} className="w-full h-full object-cover" />
                        ) : (
                          <FiAward className="text-[#2563eb] text-2xl" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-[#2563eb] transition-colors">
                          {place.title || place.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <FiStar className="text-yellow-400 fill-yellow-400 text-sm" />
                          <span className="text-[#2563eb] font-bold text-sm">{place.avgRating.toFixed(1)}</span>
                          <span className="text-xs text-gray-500 font-medium">({place.reviewCount} Reviews)</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right pl-4">
                      <span className="inline-block rounded-full bg-white border border-gray-200 text-gray-600 px-4 py-1.5 text-xs font-bold capitalize shadow-sm">
                        {place.category || place.contentType || (place.collection === "tourismData" ? "Destination" : "Event")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Needs Improvement */}
          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-8 hover:shadow-md transition duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                Needs Attention <span className="flex items-center text-red-500 bg-red-50 px-2 py-0.5 rounded-full text-xs font-bold ml-2">&lt; 3.0</span>
              </h3>
            </div>

            <div className="space-y-5">
              {analytics.lowPlaces.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <FiCheckCircle className="text-3xl" />
                  </div>
                  <p className="text-base text-gray-800 font-bold">Excellent work!</p>
                  <p className="text-sm text-gray-500 mt-1">There are no places with low ratings.</p>
                </div>
              ) : (
                analytics.lowPlaces.map((place) => (
                  <div key={place.id} className="flex items-center justify-between group p-3 rounded-[20px] hover:bg-red-50/50 transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-red-100 overflow-hidden flex items-center justify-center text-red-500 flex-shrink-0 shadow-sm">
                        <FiAlertCircle className="text-2xl" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-red-600 transition-colors">
                          {place.title || place.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <FiStar className="text-red-400 fill-red-400 text-sm" />
                          <span className="text-red-600 font-bold text-sm">{place.avgRating.toFixed(1)}</span>
                          <span className="text-xs text-gray-500 font-medium">({place.reviewCount} Reviews)</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right pl-4">
                      <span className="inline-block rounded-full bg-white border border-red-200 text-red-600 px-4 py-1.5 text-xs font-bold shadow-sm">
                        Alert
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default RatingsSummary;