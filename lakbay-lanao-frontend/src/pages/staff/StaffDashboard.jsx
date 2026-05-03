import React, { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { 
  collection, 
  getDocs, 
  collectionGroup, 
  query, 
  where, 
  orderBy, 
  limit, 
  getCountFromServer,
  getAggregateFromServer,
  average,
  count
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  FiMapPin,
  FiCalendar,
  FiFileText,
  FiStar,
  FiMessageSquare,
  FiTrendingUp,
  FiPlus,
  FiEdit3,
  FiChevronRight,
  FiImage
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

function StaffDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recentReviews, setRecentReviews] = useState([]);

  const [metrics, setMetrics] = useState({
    totalDestinations: 0,
    totalEvents: 0,
    totalArticles: 0,
    avgRating: 0,
    totalReviews: 0,
  });

  const [reviewStats, setReviewStats] = useState({
    total: 0,
    today: 0,
    chartData: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const destinationsCol = collection(db, "tourismData");
        const contentCol = collection(db, "tourismContent");
        const reviewsCol = collectionGroup(db, "reviews");
        
        // 1. Fetch KPI Counts
        const [
          destinationsCount, 
          eventsCount, 
          articlesCount,
          reviewsAgg
        ] = await Promise.all([
          getCountFromServer(destinationsCol),
          getCountFromServer(query(contentCol, where("contentType", "==", "Event"))),
          getCountFromServer(query(contentCol, where("contentType", "==", "Article"))),
          getAggregateFromServer(reviewsCol, {
            avgRating: average("rating"),
            totalReviews: count()
          })
        ]);

        // 2. Fetch Recent Reviews (Limit 5)
        const recentReviewsQuery = query(reviewsCol, orderBy("createdAt", "desc"), limit(5));
        const recentReviewsSnap = await getDocs(recentReviewsQuery);
        
        // FIX: Use doc.ref.path to guarantee uniqueness across collectionGroups
        const reviewsData = recentReviewsSnap.docs.map(doc => ({ 
          id: doc.ref.path, 
          ...doc.data() 
        }));
        setRecentReviews(reviewsData);

        // 3. Fetch 7-Day Review Trends
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const recentTrendsQuery = query(reviewsCol, where("createdAt", ">=", sevenDaysAgo));
        const trendsSnap = await getDocs(recentTrendsQuery);

        const last7DaysMap = {};
        const daysOrder = [];
        const todayStr = now.toDateString();
        let todayReviewsCount = 0;

        // Initialize 7 days array
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
          last7DaysMap[dayName] = 0;
          daysOrder.push(dayName);
        }

        // Populate Chart Data
        trendsSnap.forEach((doc) => {
          const data = doc.data();
          if (data.createdAt) {
            const reviewDate = data.createdAt.toDate();
            if (reviewDate.toDateString() === todayStr) todayReviewsCount++;
            
            const dayName = reviewDate.toLocaleDateString("en-US", { weekday: "short" });
            if (last7DaysMap[dayName] !== undefined) {
              last7DaysMap[dayName]++;
            }
          }
        });

        const chartData = daysOrder.map((day) => ({
          name: day,
          Reviews: last7DaysMap[day],
        }));

        // 4. Set State
        setMetrics({
          totalDestinations: destinationsCount.data().count,
          totalEvents: eventsCount.data().count,
          totalArticles: articlesCount.data().count,
          avgRating: reviewsAgg.data().avgRating || 0,
          totalReviews: reviewsAgg.data().totalReviews || 0,
        });

        setReviewStats({
          total: trendsSnap.size,
          today: todayReviewsCount,
          chartData,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error loading staff dashboard metrics:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb] mb-4"></div>
        <p className="font-medium text-sm">Loading Staff Workspace...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto pt-10 pb-20 px-6 lg:px-10">
        
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2563eb] tracking-tight">
              Staff Workspace
            </h2>
            <p className="text-gray-500 mt-2">
              Manage tourism data, publish content, and track tourist feedback.
            </p>
          </div>
          <div className="rounded-full bg-blue-50 px-5 py-2 text-sm font-bold text-[#2563eb] border border-blue-100 shadow-sm w-fit">
            Welcome back, Staff
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          
          {/* LEFT CONTENT BLOCK */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-8">
            
            {/* METRICS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[
                { label: "Managed Destinations", value: metrics.totalDestinations, icon: <FiMapPin />, color: "text-[#2563eb]", bg: "bg-blue-50" },
                { label: "Published Articles", value: metrics.totalArticles, icon: <FiFileText />, color: "text-[#2563eb]", bg: "bg-blue-50" },
                { label: "Active Events", value: metrics.totalEvents, icon: <FiCalendar />, color: "text-[#2563eb]", bg: "bg-blue-50" },
                { label: "Total Feedback", value: metrics.totalReviews, icon: <FiMessageSquare />, color: "text-[#2563eb]", bg: "bg-blue-50" },
              ].map((item, idx) => (
                <div key={idx} className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${item.bg} ${item.color}`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-1 truncate">{item.label}</p>
                    <h4 className="text-3xl font-bold text-gray-900">{item.value}</h4>
                  </div>
                </div>
              ))}

              {/* RATING HIGHLIGHT CARD */}
              <div className="bg-[#2563eb] rounded-[28px] border border-blue-600 shadow-sm p-6 flex items-center gap-5 text-white hover:shadow-md transition sm:col-span-2 xl:col-span-1">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl flex-shrink-0 text-white">
                  <FiStar className="fill-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-100 font-medium mb-1 truncate">Platform Avg Rating</p>
                  <div className="flex items-baseline gap-1">
                    <h4 className="text-3xl font-bold">{metrics.avgRating.toFixed(1)}</h4>
                    <span className="text-sm text-blue-200">/ 5.0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FEEDBACK GRAPH PANEL */}
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FiTrendingUp className="text-[#2563eb]" /> 7-Day Feedback Trends
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Reviews received today: <span className="font-bold text-[#2563eb]">{reviewStats.today}</span>
                  </p>
                </div>
                <button
                  onClick={() => navigate("/staff/feedback")}
                  className="rounded-full bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-blue-50 hover:text-[#2563eb] flex items-center gap-2"
                >
                  <FiStar /> View All Ratings
                </button>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reviewStats.chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 13 }} dy={12} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 13 }} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: "12px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}
                      cursor={{ stroke: "#93c5fd", strokeWidth: 1, strokeDasharray: "4 4" }}
                    />
                    <Area type="monotone" dataKey="Reviews" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorReviews)" activeDot={{ r: 6, strokeWidth: 0, fill: "#2563eb" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR CONTENT */}
          <div className="lg:col-span-1 space-y-8">
            
{/* QUICK ACTIONS PANEL */}
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-5">Quick Actions</h3>
              
              <div className="space-y-3">
                {/* Action 1 */}
                <button 
                  onClick={() => navigate("/staff/manage")}
                  className="w-full flex items-center justify-between p-3 bg-gray-50/50 rounded-[16px] border border-gray-100 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm group text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center text-gray-400 group-hover:bg-[#2563eb] group-hover:text-white shadow-sm border border-gray-100 transition-colors duration-300 flex-shrink-0">
                      <FiPlus className="text-lg" />
                    </div>
                    <div className="min-w-0 pr-2">
                      <span className="block text-sm font-bold text-gray-800 group-hover:text-[#2563eb] transition-colors truncate">Add Destination</span>
                      <span className="block text-[11px] font-medium text-gray-500 mt-0.5 truncate">List new tourist spots</span>
                    </div>
                  </div>
                  <FiChevronRight className="text-gray-300 group-hover:text-[#2563eb] group-hover:translate-x-1 transition-all text-lg flex-shrink-0" />
                </button>

                {/* Action 2 */}
                <button 
                  onClick={() => navigate("/staff/content")}
                  className="w-full flex items-center justify-between p-3 bg-gray-50/50 rounded-[16px] border border-gray-100 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm group text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center text-gray-400 group-hover:bg-[#2563eb] group-hover:text-white shadow-sm border border-gray-100 transition-colors duration-300 flex-shrink-0">
                      <FiEdit3 className="text-lg" />
                    </div>
                    <div className="min-w-0 pr-2">
                      <span className="block text-sm font-bold text-gray-800 group-hover:text-[#2563eb] transition-colors truncate">Write Article/Event</span>
                      <span className="block text-[11px] font-medium text-gray-500 mt-0.5 truncate">Publish guides & updates</span>
                    </div>
                  </div>
                  <FiChevronRight className="text-gray-300 group-hover:text-[#2563eb] group-hover:translate-x-1 transition-all text-lg flex-shrink-0" />
                </button>

                {/* Action 3 */}
                <button 
                  onClick={() => navigate("/staff/gallery")}
                  className="w-full flex items-center justify-between p-3 bg-gray-50/50 rounded-[16px] border border-gray-100 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-sm group text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center text-gray-400 group-hover:bg-[#2563eb] group-hover:text-white shadow-sm border border-gray-100 transition-colors duration-300 flex-shrink-0">
                      <FiImage className="text-lg" />
                    </div>
                    <div className="min-w-0 pr-2">
                      <span className="block text-sm font-bold text-gray-800 group-hover:text-[#2563eb] transition-colors truncate">Manage Gallery</span>
                      <span className="block text-[11px] font-medium text-gray-500 mt-0.5 truncate">Upload images & videos</span>
                    </div>
                  </div>
                  <FiChevronRight className="text-gray-300 group-hover:text-[#2563eb] group-hover:translate-x-1 transition-all text-lg flex-shrink-0" />
                </button>
              </div>
            </div>
            
            {/* RECENT FEEDBACK PANEL */}
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 text-lg">Recent Feedback</h3>
                <button 
                  onClick={() => navigate("/staff/feedback")} 
                  className="text-sm font-medium text-[#2563eb] hover:text-blue-700 transition"
                >
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {recentReviews.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No recent feedback found.</p>
                ) : (
                  recentReviews.map((review) => {
                    const authorName = review.authorName || review.userName || "Tourist";
                    const initial = authorName.charAt(0).toUpperCase();

                    return (
                      <div key={review.id} className="flex items-start gap-4 p-3 rounded-[16px] hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold flex-shrink-0 mt-1">
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-bold text-gray-900 truncate pr-2">
                              {authorName}
                            </p>
                            <div className="flex items-center gap-1 text-yellow-400 text-xs bg-yellow-50 px-2 py-0.5 rounded-full flex-shrink-0">
                              <FiStar className="fill-yellow-400" />
                              <span className="font-bold text-yellow-600">{review.rating}</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {review.comment || "Rated the destination."}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;