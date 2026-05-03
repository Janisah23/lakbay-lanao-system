import React, { useEffect, useState, useMemo } from "react";
import { db } from "../../firebase/config";
import { collectionGroup, getDocs, collection, onSnapshot } from "firebase/firestore";
import {
  FiStar,
  FiAlertCircle,
  FiFilter,
  FiSearch,
  FiMapPin,
  FiDownload,
  FiChevronRight,
  FiImage,
  FiList,
  FiCheckCircle
} from "react-icons/fi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function FeedbackRatings() {
  const [reviews, setReviews] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedPlace, setSelectedPlace] = useState(null);

  const [filterOptions, setFilterOptions] = useState({ categories: [] });

  // 1. Fetch Places and Reviews from Firebase
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const [dataSnap, contentSnap] = await Promise.all([
          getDocs(collection(db, "tourismData")),
          getDocs(collection(db, "tourismContent")),
        ]);

        const placesList = [];
        const uniqueCats = new Set();

        dataSnap.forEach((d) => {
          const data = d.data();
          placesList.push({ id: d.id, collection: "tourismData", ...data });
          if (data.category) uniqueCats.add(data.category);
        });

        contentSnap.forEach((d) => {
          const data = d.data();
          placesList.push({ id: d.id, collection: "tourismContent", ...data });
          if (data.category || data.contentType) uniqueCats.add(data.category || data.contentType);
        });

        setFilterOptions({ categories: Array.from(uniqueCats).sort() });
        setPlaces(placesList);
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
          rating: doc.data().rating || 0,
        });
      });
      setReviews(revs);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Process Data for Staff View
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

      const placeCat = place.category || place.contentType || (place.collection === "tourismData" ? "Destination" : "Event");

      return {
        ...place,
        displayCategory: placeCat,
        totalReviews,
        avgRating,
        counts
      };
    });

    // Apply Filters for the Table
    const filteredList = performanceList.filter((p) => {
      const matchesSearch = (p.title || p.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = categoryFilter === "all" || p.displayCategory === categoryFilter;
      return matchesSearch && matchesCat;
    }).sort((a, b) => b.totalReviews - a.totalReviews); // Sort by most rated first

    // Select first place automatically if none selected
    if (!selectedPlace && filteredList.length > 0) {
      // Defer state update slightly to avoid rendering warnings
      setTimeout(() => setSelectedPlace(filteredList[0]), 0);
    }

    return {
      kpis: {
        totalPlaces: places.length,
        totalRatings: totalRatingsCount,
        avgOverall: totalRatingsCount > 0 ? sumAllRatings / totalRatingsCount : 0,
        needsAttention: needsAttentionCount
      },
      filteredList
    };
  }, [places, reviews, searchTerm, categoryFilter, selectedPlace]);

  // 3. PDF Export Generation
  const generatePDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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

    const tableData = processedData.filteredList.map(place => [
      place.title || place.name || "Unknown",
      place.displayCategory,
      place.totalReviews.toString(),
      place.avgRating.toFixed(1),
      `${place.counts[5]} | ${place.counts[4]} | ${place.counts[3]} | ${place.counts[2]} | ${place.counts[1]}`
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["Destination / Event", "Category", "Total Ratings", "Avg", "Breakdown (5|4|3|2|1)"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 65, fontStyle: 'bold' },
        2: { halign: 'center' },
        3: { halign: 'center', fontStyle: 'bold', textColor: [37, 99, 235] },
        4: { halign: 'center', textColor: [100, 100, 100] }
      },
      styles: { fontSize: 9 }
    });

    doc.save(`Staff_Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb] mb-4"></div>
        <p className="text-gray-500 font-medium">Loading Rating Data...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] font-sans">
      <div className="max-w-7xl mx-auto pt-10 pb-20 px-6 lg:px-10">       
                
        {/* HEADER SECTION */}
        <div className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-6 mb-10">
          <div className="flex-shrink-0">
            <h1 className="text-3xl md:text-4xl font-bold text-[#2563eb] tracking-tight">
              Ratings & Analytics
            </h1>
            <p className="text-gray-500 mt-2">
              Track tourist ratings and analyze specific destination performance.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
             <button
              onClick={generatePDF}
              className="flex items-center justify-center gap-2 rounded-full bg-[#2563eb] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md w-full sm:w-auto flex-shrink-0"
            >
              <FiDownload className="text-lg" />
              Export Report
            </button>
          </div>
        </div>

        {/* STAFF KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-2xl">
              <FiMapPin />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Managed Places</p>
              <h4 className="text-2xl font-bold text-gray-900">{processedData.kpis.totalPlaces}</h4>
            </div>
          </div>

          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-2xl">
              <FiList />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Total Ratings</p>
              <h4 className="text-2xl font-bold text-gray-900">{processedData.kpis.totalRatings}</h4>
            </div>
          </div>

          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-2xl">
              <FiStar />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Portfolio Avg</p>
              <h4 className="text-2xl font-bold text-[#2563eb]">{processedData.kpis.avgOverall.toFixed(1)} <span className="text-sm text-gray-400">/5</span></h4>
            </div>
          </div>

          <div className={`rounded-[28px] border shadow-sm p-6 flex items-center gap-5 transition hover:shadow-md ${processedData.kpis.needsAttention > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${processedData.kpis.needsAttention > 0 ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-500'}`}>
              {processedData.kpis.needsAttention > 0 ? <FiAlertCircle /> : <FiCheckCircle />}
            </div>
            <div>
              <p className={`text-sm font-medium mb-1 ${processedData.kpis.needsAttention > 0 ? 'text-red-600' : 'text-gray-500'}`}>Needs Attention</p>
              <h4 className={`text-2xl font-bold ${processedData.kpis.needsAttention > 0 ? 'text-red-700' : 'text-gray-900'}`}>{processedData.kpis.needsAttention}</h4>
            </div>
          </div>
        </div>

        {/* MAIN WORKSPACE: List (Left) + Breakdown Panel (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT: Destination List */}
          <div className="lg:col-span-2 bg-white rounded-[28px] border border-gray-200 shadow-sm flex flex-col h-[700px]">
            {/* Header & Filters */}
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Destination Performance</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative w-full">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type="text"
                    placeholder="Search destinations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-[12px] border border-gray-200 bg-gray-50 px-4 py-2.5 pl-11 text-sm outline-none transition focus:bg-white focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="relative w-full sm:w-1/3">
                  <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full rounded-[12px] border border-gray-200 bg-gray-50 pl-11 pr-4 py-2.5 text-sm outline-none transition focus:bg-white focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer capitalize"
                  >
                    <option value="all">All Categories</option>
                    {filterOptions.categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 p-3">
              {processedData.filteredList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <FiSearch className="text-4xl mb-3" />
                  <p>No destinations found.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {processedData.filteredList.map((place) => {
                    const isSelected = selectedPlace?.id === place.id;
                    return (
                      <div 
                        key={place.id}
                        onClick={() => setSelectedPlace(place)}
                        className={`flex items-center justify-between p-4 rounded-[20px] cursor-pointer transition-all border ${
                          isSelected 
                            ? "bg-blue-50 border-[#2563eb] shadow-sm" 
                            : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-[14px] bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {place.imageURL ? (
                              <img src={place.imageURL} alt={place.title} className="w-full h-full object-cover" />
                            ) : (
                              <FiImage className="text-gray-400 text-xl" />
                            )}
                          </div>
                          <div>
                            <p className={`font-bold text-base line-clamp-1 ${isSelected ? 'text-[#2563eb]' : 'text-gray-900'}`}>
                              {place.title || place.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-gray-500 font-medium capitalize bg-gray-100 px-2 py-0.5 rounded-md">
                                {place.displayCategory}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500 font-medium">{place.totalReviews} Ratings</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <FiStar className={`text-sm ${place.avgRating >= 4 ? 'text-yellow-400 fill-yellow-400' : place.avgRating > 0 ? 'text-gray-400 fill-gray-400' : 'text-gray-300'}`} />
                              <span className="font-bold text-gray-900 text-base">{place.avgRating > 0 ? place.avgRating.toFixed(1) : "0.0"}</span>
                            </div>
                          </div>
                          <FiChevronRight className={`text-xl transition-transform ${isSelected ? 'text-[#2563eb] translate-x-1' : 'text-gray-300'}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Detailed Rating Breakdown Panel */}
          <div className="lg:col-span-1">
            {selectedPlace ? (
              <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-8 sticky top-10 flex flex-col">
                {/* Panel Header */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto rounded-[20px] bg-gray-100 overflow-hidden flex items-center justify-center shadow-sm mb-4">
                    {selectedPlace.imageURL ? (
                      <img src={selectedPlace.imageURL} alt={selectedPlace.title} className="w-full h-full object-cover" />
                    ) : (
                      <FiImage className="text-gray-400 text-3xl" />
                    )}
                  </div>
                  <h3 className="font-bold text-xl text-gray-900">{selectedPlace.title || selectedPlace.name}</h3>
                  <p className="text-sm text-gray-500 capitalize mt-1">{selectedPlace.displayCategory}</p>
                </div>

                {/* Big Score Box */}
                <div className="bg-[#2563eb] rounded-[24px] p-6 text-center text-white mb-8 shadow-md">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <FiStar className="text-yellow-300 fill-yellow-300 text-3xl" />
                    <span className="text-5xl font-extrabold">{selectedPlace.avgRating > 0 ? selectedPlace.avgRating.toFixed(1) : "0.0"}</span>
                  </div>
                  <p className="text-blue-100 font-medium mt-2">Based on {selectedPlace.totalReviews} ratings</p>
                </div>

                {/* Granular Breakdown Progress Bars */}
                <div className="space-y-4">
                  <h4 className="font-bold text-gray-900 mb-2">Rating Breakdown</h4>
                  
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = selectedPlace.counts[star] || 0;
                    const percentage = selectedPlace.totalReviews > 0 ? Math.round((count / selectedPlace.totalReviews) * 100) : 0;
                    
                    // Determine color based on star level
                    let barColor = "bg-blue-500";
                    if (star === 5) barColor = "bg-green-500";
                    if (star <= 2) barColor = "bg-red-500";
                    if (star === 3) barColor = "bg-yellow-400";

                    return (
                      <div key={star} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-12 flex-shrink-0 text-gray-600 font-bold text-sm">
                          {star} <FiStar className="text-gray-400 text-xs fill-gray-400" />
                        </div>
                        
                        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        
                        <div className="w-10 text-right text-sm font-bold text-gray-700">
                          {count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-8 h-[700px] flex flex-col items-center justify-center text-center text-gray-400">
                <FiStar className="text-5xl mb-4 text-gray-200" />
                <h3 className="text-lg font-bold text-gray-800 mb-2">No Destination Selected</h3>
                <p className="text-sm">Click on a destination from the list to view its detailed rating breakdown.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default FeedbackRatings;