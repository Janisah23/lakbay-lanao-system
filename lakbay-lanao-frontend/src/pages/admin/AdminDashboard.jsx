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
  FiUsers,
  FiMapPin,
  FiCalendar,
  FiFileText,
  FiStar,
  FiMessageSquare,
  FiActivity,
  FiClipboard,
  FiServer,
  FiShield,
  FiCheckCircle
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

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);

  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalDestinations: 0,
    totalEvents: 0,
    totalArticles: 0,
    avgRating: 0,
    totalReviews: 0,
  });

  const [logStats, setLogStats] = useState({
    total: 0,
    today: 0,
    chartData: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const usersCol = collection(db, "users");
        const destinationsCol = collection(db, "tourismData");
        const contentCol = collection(db, "tourismContent");
        
        const [
          usersCount, 
          destinationsCount, 
          eventsCount, 
          articlesCount
        ] = await Promise.all([
          getCountFromServer(usersCol),
          getCountFromServer(destinationsCol),
          getCountFromServer(query(contentCol, where("contentType", "==", "event"))),
          getCountFromServer(query(contentCol, where("contentType", "==", "article")))
        ]);

        const recentUsersQuery = query(usersCol, orderBy("createdAt", "desc"), limit(5));
        const recentUsersSnap = await getDocs(recentUsersQuery);
        const usersData = recentUsersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentUsers(usersData);

        const reviewsCol = collectionGroup(db, "reviews");
        const reviewsAgg = await getAggregateFromServer(reviewsCol, {
          avgRating: average("rating"),
          totalReviews: count()
        });

        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const logsQuery = query(collection(db, "logs"), where("timestamp", ">=", sevenDaysAgo));
        const logsSnap = await getDocs(logsQuery);

        const last7DaysMap = {};
        const daysOrder = [];
        const todayStr = now.toDateString();
        let todayLogsCount = 0;

        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
          last7DaysMap[dayName] = 0;
          daysOrder.push(dayName);
        }

        logsSnap.forEach((doc) => {
          const data = doc.data();
          if (data.timestamp) {
            const logDate = data.timestamp.toDate();
            if (logDate.toDateString() === todayStr) todayLogsCount++;
            
            const dayName = logDate.toLocaleDateString("en-US", { weekday: "short" });
            if (last7DaysMap[dayName] !== undefined) {
              last7DaysMap[dayName]++;
            }
          }
        });

        const chartData = daysOrder.map((day) => ({
          name: day,
          Logs: last7DaysMap[day],
        }));

        setMetrics({
          totalUsers: usersCount.data().count,
          totalDestinations: destinationsCount.data().count,
          totalEvents: eventsCount.data().count,
          totalArticles: articlesCount.data().count,
          avgRating: reviewsAgg.data().avgRating || 0,
          totalReviews: reviewsAgg.data().totalReviews || 0,
        });

        setLogStats({
          total: logsSnap.size,
          today: todayLogsCount,
          chartData,
        });

        setLoading(false);
      } catch (error) {
        console.error("Error loading dashboard metrics:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb] mb-4"></div>
        <p className="font-medium text-sm">Loading System Data...</p>
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
              Platform Overview
            </h2>
            <p className="text-gray-500 mt-2">
              Live tourism metrics, system health, and staff activities.
            </p>
          </div>
          <div className="rounded-full bg-[#2563eb] px-4 py-2 text-sm font-medium text-white flex items-center gap-2 shadow-sm w-fit">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            System Online
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          
          {/* LEFT CONTENT BLOCK */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-8">
            
            {/* METRICS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[
                { label: "Total Users", value: metrics.totalUsers, icon: <FiUsers />, color: "text-[#2563eb]", bg: "bg-blue-50" },
                { label: "Destinations", value: metrics.totalDestinations, icon: <FiMapPin />, color: "text-[#2563eb]", bg: "bg-blue-50" },
                { label: "Active Events", value: metrics.totalEvents, icon: <FiCalendar />, color: "text-[#2563eb]", bg: "bg-blue-50" },
                { label: "Published Articles", value: metrics.totalArticles, icon: <FiFileText />, color: "text-[#2563eb]", bg: "bg-blue-50" },
                { label: "Total Reviews", value: metrics.totalReviews, icon: <FiMessageSquare />, color: "text-[#2563eb]", bg: "bg-blue-50" },
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
              <div className="bg-[#2563eb] rounded-[28px] border border-blue-600 shadow-sm p-6 flex items-center gap-5 text-white hover:shadow-md transition">
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl flex-shrink-0 text-white">
                  <FiStar className="fill-white" />
                </div>
                <div>
                  <p className="text-sm text-blue-100 font-medium mb-1 truncate">Avg Rating</p>
                  <div className="flex items-baseline gap-1">
                    <h4 className="text-3xl font-bold">{metrics.avgRating.toFixed(1)}</h4>
                    <span className="text-sm text-blue-200">/ 5.0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTIVITY GRAPH PANEL */}
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FiActivity className="text-[#2563eb]" /> 7-Day Activity Trends
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Actions today: <span className="font-bold text-[#2563eb]">{logStats.today} logs</span>
                  </p>
                </div>
                <button
                  onClick={() => navigate("/admin/logs")}
                  className="rounded-full bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-blue-50 flex items-center gap-2"
                >
                  <FiClipboard /> View Audit Trail
                </button>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={logStats.chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLogs" x1="0" y1="0" x2="0" y2="1">
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
                    <Area type="monotone" dataKey="Logs" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorLogs)" activeDot={{ r: 6, strokeWidth: 0, fill: "#2563eb" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR CONTENT */}
          <div className="lg:col-span-1 space-y-8">
            
            {/* SYSTEM HEALTH PANEL */}
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-6">System Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[12px] border border-gray-100 transition hover:border-[#2563eb]">
                  <div className="flex items-center gap-3">
                    <FiServer className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Database Active</span>
                  </div>
                  <FiCheckCircle className="text-[#2563eb]" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[12px] border border-gray-100 transition hover:border-[#2563eb]">
                  <div className="flex items-center gap-3">
                    <FiShield className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Security Rules</span>
                  </div>
                  <FiCheckCircle className="text-[#2563eb]" />
                </div>
              </div>
            </div>

            {/* RECENT REGISTRATIONS PANEL */}
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 text-lg">New Users</h3>
                <button 
                  onClick={() => navigate("/admin/accounts")} 
                  className="text-sm font-medium text-[#2563eb] hover:text-blue-700 transition"
                >
                  View All
                </button>
              </div>

              <div className="space-y-5">
                {recentUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No recent users found.</p>
                ) : (
                  recentUsers.map((user) => {
                    const displayName = user.displayName || user.name || "Tourist";
                    const initial = displayName.charAt(0).toUpperCase();

                    return (
                      <div key={user.id} className="flex items-center gap-4 group cursor-default">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="user" className="w-12 h-12 rounded-full object-cover shadow-sm border border-gray-100" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold text-lg flex-shrink-0">
                            {initial}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate group-hover:text-[#2563eb] transition">
                            {displayName}
                          </p>
                          <p className="text-xs text-gray-500 capitalize truncate mt-0.5">
                            {user.role || "Standard User"}
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

export default AdminDashboard;