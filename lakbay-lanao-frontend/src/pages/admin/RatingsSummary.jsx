import React, { useEffect, useState, useMemo } from "react";
import { db } from "../../firebase/config";
import { collectionGroup, getDocs, collection, onSnapshot } from "firebase/firestore";
import { 
  FiEye, FiBookmark, FiStar, FiAlertCircle, 
  FiAward, FiFilter, FiCheckCircle, FiMoreHorizontal,
  FiTrendingUp, FiTrendingDown
} from "react-icons/fi";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";


// Modern dashboard color palette inspired by the screenshot
const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#C4B5FD', '#FCA5A5'];

function RatingsSummary() {
  const [reviews, setReviews] = useState([]);
  const [places, setPlaces] = useState({});
  const [filters, setFilters] = useState({ municipality: "", days: "all", category: "all" });
  const [loading, setLoading] = useState(true);

  // 1. Fetch all parent documents (to get Names, Views, and Saves)
  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const [dataSnap, contentSnap] = await Promise.all([
          getDocs(collection(db, "tourismData")),
          getDocs(collection(db, "tourismContent"))
        ]);
        
        const placesMap = {};
        dataSnap.forEach(d => placesMap[d.id] = { id: d.id, collection: 'tourismData', ...d.data() });
        contentSnap.forEach(d => placesMap[d.id] = { id: d.id, collection: 'tourismContent', ...d.data() });
        
        setPlaces(placesMap);
      } catch (error) {
        console.error("Error fetching places:", error);
      }
    };
    fetchPlaces();
  }, []);

  // 2. Real-time listener for all Reviews
  useEffect(() => {
    const unsub = onSnapshot(collectionGroup(db, "reviews"), (snap) => {
      const revs = [];
      snap.forEach(doc => {
        revs.push({
          id: doc.id,
          placeId: doc.ref.parent?.parent?.id, 
          parentPath: doc.ref.parent?.parent?.path || "",
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        });
      });
      setReviews(revs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 3. Compute Analytics
  const analytics = useMemo(() => {
    const now = new Date();

    const filteredReviews = reviews.filter(rev => {
      if (filters.days !== "all") {
        const diffDays = (now - rev.createdAt) / (1000 * 60 * 60 * 24);
        if (diffDays > parseInt(filters.days)) return false;
      }
      
      const place = places[rev.placeId];
      if (!place) return false;

      const placeMuni = place.location?.municipality || place.municipality || "";
      if (filters.municipality && placeMuni !== filters.municipality) return false;
      if (filters.category === "destination" && place.collection !== "tourismData") return false;
      if (filters.category === "event" && place.collection !== "tourismContent") return false;

      return true;
    });

    let totalViews = 0;
    let totalSaves = 0;
    Object.values(places).forEach(place => {
      const placeMuni = place.location?.municipality || place.municipality || "";
      if (filters.municipality && placeMuni !== filters.municipality) return;
      if (filters.category === "destination" && place.collection !== "tourismData") return;
      if (filters.category === "event" && place.collection !== "tourismContent") return;

      totalViews += (place.viewCount || 0);
      totalSaves += (place.saveCount || 0);
    });

    let sum = 0;
    let counts = [0, 0, 0, 0, 0];
    let satisfied = 0;

    filteredReviews.forEach(r => {
      const rating = Math.floor(r.rating || 0);
      if(rating >= 1 && rating <= 5) {
        counts[rating - 1]++;
        sum += r.rating;
        if(rating >= 4) satisfied++;
      }
    });

    const avg = filteredReviews.length ? (sum / filteredReviews.length) : 0;
    const satisfaction = filteredReviews.length ? Math.round((satisfied / filteredReviews.length) * 100) : 0;

    // Format for Recharts PieChart (requires 'value')
    const totalRatings = filteredReviews.length || 1; // prevent div by zero
    const distributionData = [
      { name: '5 Stars', value: counts[4], pct: Math.round((counts[4]/totalRatings)*100) },
      { name: '4 Stars', value: counts[3], pct: Math.round((counts[3]/totalRatings)*100) },
      { name: '3 Stars', value: counts[2], pct: Math.round((counts[2]/totalRatings)*100) },
      { name: '2 Stars', value: counts[1], pct: Math.round((counts[1]/totalRatings)*100) },
      { name: '1 Star',  value: counts[0], pct: Math.round((counts[0]/totalRatings)*100) },
    ];

    // Trend Line Data
    const trendMap = {};
    filteredReviews.forEach(r => {
      const date = new Date(r.createdAt);
      const label = date.toLocaleString('default', { month: 'short', day: 'numeric' });
      if(!trendMap[label]) {
        trendMap[label] = { name: label, Reviews: 0, rawSum: 0 };
      }
      trendMap[label].Reviews += 1;
      trendMap[label].rawSum += r.rating;
    });

    const trendData = Object.values(trendMap).map(t => ({
      name: t.name,
      Reviews: t.Reviews,
      "Avg Rating": parseFloat((t.rawSum / t.Reviews).toFixed(1))
    }));

    // Top & Low Places
    const placePerformance = {};
    filteredReviews.forEach(r => {
      if(!placePerformance[r.placeId]) {
        placePerformance[r.placeId] = { place: places[r.placeId], sum: 0, count: 0 };
      }
      placePerformance[r.placeId].sum += r.rating;
      placePerformance[r.placeId].count += 1;
    });

    const performArray = Object.values(placePerformance).map(p => ({
      ...p.place,
      avgRating: p.sum / p.count,
      reviewCount: p.count
    }));

    const topPlaces = [...performArray].filter(p => p.avgRating >= 4).sort((a,b) => b.avgRating - a.avgRating).slice(0, 5);
    const lowPlaces = [...performArray].filter(p => p.avgRating < 3).sort((a,b) => a.avgRating - b.avgRating);

    return {
      stats: { count: filteredReviews.length, avg, satisfaction },
      totalViews, totalSaves, topPlaces, lowPlaces,
      distributionData, trendData
    };

  }, [reviews, places, filters]);


  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3B82F6] mb-4"></div>
      Loading Dashboard...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7FB] p-4 md:p-8 font-sans text-gray-800 rounded-2xl">
      
      {/* ── HEADER & SEARCH / FILTER BAR ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-[#2563EB] tracking-tight">Analytics & Ratings</h2>
          <p className="text-sm text-gray-500 mt-1">Welcome back. Here is your tourism performance data.</p>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <FiFilter className="text-gray-400" />
          <select 
            onChange={(e) => setFilters(prev => ({ ...prev, municipality: e.target.value }))}
            className="bg-transparent border-none text-sm text-gray-600 focus:ring-0 cursor-pointer outline-none font-medium"
          >
            <option value="">All Municipalities</option>
            <option value="Marawi">Marawi</option>
            <option value="Balindong">Balindong</option>
          </select>
          <div className="w-px h-5 bg-gray-200 mx-1"></div>
          <select 
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="bg-transparent border-none text-sm text-gray-600 focus:ring-0 cursor-pointer outline-none font-medium"
          >
            <option value="all">All Categories</option>
            <option value="destination">Destinations Only</option>
            <option value="event">Events Only</option>
          </select>
        </div>
      </div>

      {/* ── 1. KPI CARDS (Matching "Total Booking" style) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center text-2xl">
            <FiStar />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Total Ratings</p>
            <div className="flex items-center gap-3">
              <h4 className="text-2xl font-bold text-gray-900">{analytics.stats.count}</h4>
              <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full flex items-center">
                <FiTrendingUp className="mr-1" /> Active
              </span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center text-2xl">
            <FiCheckCircle />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Avg Satisfaction</p>
            <div className="flex items-center gap-3">
              <h4 className="text-2xl font-bold text-gray-900">{analytics.stats.satisfaction}%</h4>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center text-2xl">
            <FiEye />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Total Page Views</p>
            <div className="flex items-center gap-3">
              <h4 className="text-2xl font-bold text-gray-900">{(analytics.totalViews / 1000).toFixed(1)}k</h4>
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center text-2xl">
            <FiBookmark />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Total Saves</p>
            <div className="flex items-center gap-3">
              <h4 className="text-2xl font-bold text-gray-900">{analytics.totalSaves}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. CHARTS ROW (Line Chart + Donut Chart) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Trend Line Chart (Like "Revenue Overview") */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Rating Trends</h3>
            <select 
              onChange={(e) => setFilters(prev => ({ ...prev, days: e.target.value }))}
              className="bg-blue-50 text-[#3B82F6] border-none text-xs font-bold px-3 py-1.5 rounded-full outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="7">Weekly</option>
              <option value="30">Monthly</option>
            </select>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.trendData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '5 5' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Reviews" 
                  stroke="#3B82F6" 
                  strokeWidth={3} 
                  dot={{r: 4, fill: '#fff', stroke: '#3B82F6', strokeWidth: 2}} 
                  activeDot={{r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2}} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rating Distribution Donut (Like "Top Destinations") */}
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-gray-900">Rating Distribution</h3>
            <FiMoreHorizontal className="text-gray-400 text-xl cursor-pointer" />
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {analytics.distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text in Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                <span className="text-2xl font-bold text-gray-900">{analytics.stats.avg.toFixed(1)}</span>
                <span className="text-[10px] font-semibold text-gray-400 uppercase">Avg Rating</span>
              </div>
            </div>

            {/* Custom Legend to match screenshot */}
            <div className="w-full mt-4 grid grid-cols-2 gap-y-3 px-2">
              {analytics.distributionData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                  <span className="text-xs text-gray-600 font-medium">{entry.name}</span>
                  <span className="text-xs font-bold text-gray-900 ml-auto">{entry.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── 3. LISTS ROW (Top Performers & Low Rated) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Rated Destinations (Like "Travel Packages") */}
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Top Rated Places</h3>
            <span className="text-xs font-bold text-gray-500 cursor-pointer hover:text-[#3B82F6]">View All</span>
          </div>

          <div className="space-y-4">
            {analytics.topPlaces.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No data available.</p>
            ) : (
              analytics.topPlaces.map((place) => (
                <div key={place.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    {/* Placeholder for image, using a colored block or icon */}
                    <div className="w-12 h-12 rounded-xl bg-blue-50 overflow-hidden flex items-center justify-center">
                      {place.imageURL ? (
                        <img src={place.imageURL} alt={place.title} className="w-full h-full object-cover" />
                      ) : (
                        <FiAward className="text-[#3B82F6] text-xl" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-[#3B82F6] transition-colors">{place.title || place.name}</p>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                        <FiStar className="text-yellow-400 fill-yellow-400" /> {place.avgRating.toFixed(1)} ({place.reviewCount} Reviews)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold bg-gray-50 text-gray-600 px-3 py-1.5 rounded-full capitalize">
                      {place.collection === 'tourismData' ? 'Destination' : 'Event'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Needs Improvement (Like "Messages") */}
        <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Needs Improvement <span className="text-red-500 text-sm ml-1">(&lt; 3.0)</span></h3>
            <FiMoreHorizontal className="text-gray-400 text-xl cursor-pointer" />
          </div>

          <div className="space-y-4">
            {analytics.lowPlaces.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiCheckCircle className="text-xl" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Great job! No low-rated places.</p>
              </div>
            ) : (
              analytics.lowPlaces.map((place) => (
                <div key={place.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 overflow-hidden flex items-center justify-center text-red-500">
                      <FiAlertCircle className="text-xl" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm line-clamp-1">{place.title || place.name}</p>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                        <FiStar className="text-red-400 fill-red-400" /> {place.avgRating.toFixed(1)} ({place.reviewCount} Reviews)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold bg-red-50 text-red-600 px-3 py-1.5 rounded-full">
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
  );
}

export default RatingsSummary;