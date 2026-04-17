import React, { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, collectionGroup } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { 
  FiUsers, FiMapPin, FiCalendar, FiFileText, 
  FiStar, FiMessageSquare, FiChevronLeft, FiChevronRight,
  FiActivity, FiClipboard
} from "react-icons/fi";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from "recharts";

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);
  
  // Dashboard Core Metrics
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalDestinations: 0,
    totalEvents: 0,
    totalArticles: 0,
    avgRating: 0,
    totalReviews: 0,
  });

  // Log Stats & Chart Data
  const [logStats, setLogStats] = useState({
    total: 0,
    today: 0,
    chartData: []
  });

  // Calendar State
  const [calDate, setCalDate] = useState(new Date());

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all required collections in parallel for performance
        const [usersSnap, dataSnap, contentSnap, reviewsSnap, logsSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "tourismData")),
          getDocs(collection(db, "tourismContent")),
          getDocs(collectionGroup(db, "reviews")),
          getDocs(collection(db, "logs")) // Make sure your Firestore rules allow read for /logs
        ]);

        // 1. Process Users & Recent Users
        const usersData = [];
        usersSnap.forEach(doc => {
          usersData.push({ id: doc.id, ...doc.data() });
        });
        const totalUsers = usersData.length;

        const sortedUsers = usersData
          .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
          .slice(0, 5);
        setRecentUsers(sortedUsers);

        // 2. Total Destinations
        const totalDestinations = dataSnap.size;

        // 3. Process tourismContent
        let totalEvents = 0;
        let totalArticles = 0;

        contentSnap.forEach((doc) => {
          const data = doc.data();
          const type = (data.contentType || "").toLowerCase();
          if (type === "event") totalEvents++;
          else if (type === "article") totalArticles++;
        });

        // 4. Reviews
        let sumRating = 0;
        let validRatings = 0;

        reviewsSnap.forEach((doc) => {
          const rating = doc.data().rating;
          if (typeof rating === "number" && rating >= 1 && rating <= 5) {
              sumRating += rating;
              validRatings++;
          }
        });

        const totalReviews = validRatings;
        const avgRating = validRatings > 0 ? (sumRating / validRatings) : 0;

        // 5. Process System Logs for Graph
        let totalLogsCount = logsSnap.size;
        let todayLogsCount = 0;
        
        const now = new Date();
        const todayStr = now.toDateString();

        // Initialize last 7 days array
        const last7DaysMap = {};
        const daysOrder = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
          last7DaysMap[dayName] = 0;
          daysOrder.push(dayName);
        }

        logsSnap.forEach(doc => {
          const data = doc.data();
          if (data.timestamp) {
            const logDate = data.timestamp.toDate();
            
            // Count today's logs
            if (logDate.toDateString() === todayStr) {
              todayLogsCount++;
            }
            
            // Map to chart data if within last 7 days
            const diffTime = Math.abs(now - logDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            if (diffDays <= 7) {
              const dayName = logDate.toLocaleDateString('en-US', { weekday: 'short' });
              if (last7DaysMap[dayName] !== undefined) {
                last7DaysMap[dayName]++;
              }
            }
          }
        });

        const chartData = daysOrder.map(day => ({
          name: day,
          Logs: last7DaysMap[day]
        }));

        // Set States
        setMetrics({
          totalUsers,
          totalDestinations,
          totalEvents,
          totalArticles,
          avgRating,
          totalReviews
        });

        setLogStats({
          total: totalLogsCount,
          today: todayLogsCount,
          chartData
        });
        
        setLoading(false);

      } catch (error) {
        console.error("Error loading dashboard metrics:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calendar Helpers
  const nextMonth = () => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1));
  const prevMonth = () => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1));
  
  const renderCalendar = () => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const today = new Date();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-900 text-lg">{monthNames[month]} <span className="text-gray-500 font-medium">{year}</span></h3>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-[#3B82F6] transition">
              <FiChevronLeft />
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-[#3B82F6] transition">
              <FiChevronRight />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 mb-3">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 text-center text-sm gap-y-2">
          {days.map((d, i) => {
            if (!d) return <div key={i}></div>;
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            return (
              <div key={i} className="flex justify-center items-center">
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] font-medium transition-all ${
                  isToday ? 'bg-[#3B82F6] text-white shadow-md shadow-blue-200 font-bold' : 'text-gray-700 hover:bg-blue-50 hover:text-[#3B82F6] cursor-pointer'
                }`}>
                  {d}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-gray-500">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mb-4"></div>
      Loading Dashboard...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7FB] p-4 md:p-6 lg:p-8 font-sans text-gray-800 rounded-2xl">
      
      {/* ── HEADER ── */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#2563EB] tracking-tight">Dashboard Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Live overview of your platform data and system activity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* ── LEFT COLUMN (Metrics & Graph) ── */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          
          {/* ── METRICS GRID ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* Metric 1: Total Users */}
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center text-2xl flex-shrink-0">
                <FiUsers />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 font-medium mb-1 truncate">Total Users</p>
                <h4 className="text-3xl font-extrabold text-gray-900 truncate">{metrics.totalUsers}</h4>
              </div>
            </div>

            {/* Metric 2: Total Destinations */}
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center text-2xl flex-shrink-0">
                <FiMapPin />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 font-medium mb-1 truncate">Total Destinations</p>
                <h4 className="text-3xl font-extrabold text-gray-900 truncate">{metrics.totalDestinations}</h4>
              </div>
            </div>

            {/* Metric 3: Total Events */}
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center text-2xl flex-shrink-0">
                <FiCalendar />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 font-medium mb-1 truncate">Total Events</p>
                <h4 className="text-3xl font-extrabold text-gray-900 truncate">{metrics.totalEvents}</h4>
              </div>
            </div>

            {/* Metric 4: Total Articles */}
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center text-2xl flex-shrink-0">
                <FiFileText />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 font-medium mb-1 truncate">Total Articles</p>
                <h4 className="text-3xl font-extrabold text-gray-900 truncate">{metrics.totalArticles}</h4>
              </div>
            </div>

            {/* Metric 5: Average Rating */}
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center text-2xl flex-shrink-0">
                <FiStar className="fill-[#3B82F6]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 font-medium mb-1 truncate">Average Rating</p>
                <div className="flex items-center gap-2">
                  <h4 className="text-3xl font-extrabold text-gray-900 truncate">{metrics.avgRating.toFixed(1)}</h4>
                  <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">/ 5.0</span>
                </div>
              </div>
            </div>

            {/* Metric 6: Total Reviews */}
            <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center text-2xl flex-shrink-0">
                <FiMessageSquare />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 font-medium mb-1 truncate">Total Reviews</p>
                <h4 className="text-3xl font-extrabold text-gray-900 truncate">{metrics.totalReviews}</h4>
              </div>
            </div>

          </div>

          {/* ── SYSTEM ACTIVITY CHART ── */}
          <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FiActivity className="text-[#3B82F6]" /> System Activity
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Total Logs: <span className="font-bold text-gray-900">{logStats.total}</span> <span className="mx-2 text-gray-300">|</span> Activity Today: <span className="font-bold text-[#3B82F6]">{logStats.today}</span>
                </p>
              </div>
              <button 
                onClick={() => navigate("/admin/logs")}
                className="flex items-center gap-2 text-xs font-bold text-[#3B82F6] hover:text-white border border-[#3B82F6] hover:bg-[#3B82F6] px-4 py-2 rounded-full transition w-fit"
              >
                <FiClipboard /> View Full Logs
              </button>
            </div>
            
            {/* FIX ADDED HERE: Added min-h-[300px] to prevent Recharts collapse warning */}
            <div className="h-[300px] min-h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={logStats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLogs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '5 5' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Logs" 
                    stroke="#3B82F6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorLogs)" 
                    activeDot={{r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2}} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Calendar & Users) ── */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Calendar Widget */}
          {renderCalendar()}

          {/* Recent Users Widget */}
          <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 text-lg">Recent Users</h3>
              <button 
                onClick={() => navigate("/admin/accounts")}
                className="text-xs font-bold text-[#3B82F6] hover:underline"
              >
                See All
              </button>
            </div>
            
            <div className="space-y-5">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No users found.</p>
              ) : (
                recentUsers.map(user => {
                  const initial = user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.name ? user.name.charAt(0).toUpperCase() : "U");
                  return (
                    <div key={user.id} className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="user" className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center font-bold text-lg border border-blue-100 flex-shrink-0">
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {user.displayName || user.name || "Tourist Traveler"}
                        </p>
                        <p className="text-xs text-gray-500 font-medium capitalize truncate">
                          {user.role || "User"}
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
  );
}

export default AdminDashboard;