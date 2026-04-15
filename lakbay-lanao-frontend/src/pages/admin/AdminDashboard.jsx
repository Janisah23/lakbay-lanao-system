import React, { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, collectionGroup, query, orderBy, limit } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { 
  FiUsers, FiMapPin, FiCalendar, FiFileText, 
  FiStar, FiMessageSquare, FiClock, FiChevronLeft, FiChevronRight
} from "react-icons/fi";


function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState([]);
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

  // Calendar State
  const [calDate, setCalDate] = useState(new Date());

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all required collections in parallel for performance
        const [usersSnap, dataSnap, contentSnap, reviewsSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "tourismData")),
          getDocs(collection(db, "tourismContent")),
          getDocs(collectionGroup(db, "reviews"))
        ]);
        

        // 1. Process Users & Recent Users
        const usersData = [];
        usersSnap.forEach(doc => {
          usersData.push({ id: doc.id, ...doc.data() });
        });
        const totalUsers = usersData.length;

        // Sort by createdAt if available, else just take the last 5
        const sortedUsers = usersData
          .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
          .slice(0, 5);
        setRecentUsers(sortedUsers);

        // 2. Total Destinations (from tourismData)
        const totalDestinations = dataSnap.size;
        

        let totalEvents = 0;
        let totalArticles = 0;

        contentSnap.forEach((doc) => {
        const data = doc.data();

        const type = (data.contentType || "").toLowerCase();
          console.log("DOC ID:", doc.id);
  console.log("TYPE:", data.contentType);
  console.log("CATEGORY:", data.category);


        if (type === "event") {
            totalEvents++;
        } 
        else if (type === "article") {
            totalArticles++;
        }
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
        // 5. Fetch Recent System Logs
        let logs = [];
        try {
          const logsQuery = query(collection(db, "systemLogs"), orderBy("timestamp", "desc"), limit(5));
          const logsSnap = await getDocs(logsQuery);
          logs = logsSnap.docs.map(d => ({ id: d.id, ...d.data(), time: d.data().timestamp?.toDate() }));
        } catch (e) {
          console.log("systemLogs collection might not exist yet.", e);
        }

        // Set State
        setMetrics({
          totalUsers,
          totalDestinations,
          totalEvents,
          totalArticles,
          avgRating,
          totalReviews
        });
        
        setRecentLogs(logs);
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
            <button onClick={prevMonth} className="p-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition">
              <FiChevronLeft />
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition">
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
      Loading Command Center...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F7FB] p-4 md:p-6 lg:p-8 font-sans text-gray-800 rounded-2xl">
      
      {/* ── HEADER ── */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#2563EB] tracking-tight">Dashboard Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Live overview of your platform data and user engagement.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* ── LEFT COLUMN (Metrics & Logs) ── */}
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

          {/* ── LIVE ACTIVITY FEED ── */}
          <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <FiClock className="text-[#3B82F6]" /> Recent Activity
              </h3>
              <button 
                onClick={() => navigate("/admin/logs")}
                className="text-xs font-bold text-[#3B82F6] hover:text-blue-800 transition px-3 py-1 rounded-full hover:bg-blue-50"
              >
                View All Logs
              </button>
            </div>
            
            <div className="divide-y divide-gray-50">
              {recentLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400 font-medium">
                  No recent activity recorded yet.
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="px-6 py-4 hover:bg-blue-50/30 transition flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6] mt-2.5 flex-shrink-0 shadow-sm shadow-blue-200"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 leading-relaxed">
                        <span className="font-bold text-[#3B82F6]">{log.user || "System"}</span> {log.action}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 font-medium">
                        {log.time?.toLocaleString() || "Recently"}
                      </p>
                    </div>
                  </div>
                ))
              )}
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