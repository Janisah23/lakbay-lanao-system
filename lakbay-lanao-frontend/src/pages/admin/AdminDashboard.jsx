import React, { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { collection, getDocs, collectionGroup } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiMapPin,
  FiCalendar,
  FiFileText,
  FiStar,
  FiMessageSquare,
  FiChevronLeft,
  FiChevronRight,
  FiActivity,
  FiClipboard,
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

  const [calDate, setCalDate] = useState(new Date());

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersSnap, dataSnap, contentSnap, reviewsSnap, logsSnap] =
          await Promise.all([
            getDocs(collection(db, "users")),
            getDocs(collection(db, "tourismData")),
            getDocs(collection(db, "tourismContent")),
            getDocs(collectionGroup(db, "reviews")),
            getDocs(collection(db, "logs")),
          ]);

        const usersData = [];
        usersSnap.forEach((doc) => {
          usersData.push({ id: doc.id, ...doc.data() });
        });

        const totalUsers = usersData.length;

        const sortedUsers = usersData
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
          .slice(0, 5);

        setRecentUsers(sortedUsers);

        const totalDestinations = dataSnap.size;

        let totalEvents = 0;
        let totalArticles = 0;

        contentSnap.forEach((doc) => {
          const data = doc.data();
          const type = (data.contentType || "").toLowerCase();

          if (type === "event") totalEvents++;
          else if (type === "article") totalArticles++;
        });

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
        const avgRating = validRatings > 0 ? sumRating / validRatings : 0;

        let totalLogsCount = logsSnap.size;
        let todayLogsCount = 0;

        const now = new Date();
        const todayStr = now.toDateString();

        const last7DaysMap = {};
        const daysOrder = [];

        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
          last7DaysMap[dayName] = 0;
          daysOrder.push(dayName);
        }

        logsSnap.forEach((doc) => {
          const data = doc.data();
          if (data.timestamp) {
            const logDate = data.timestamp.toDate();

            if (logDate.toDateString() === todayStr) {
              todayLogsCount++;
            }

            const diffTime = Math.abs(now - logDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 7) {
              const dayName = logDate.toLocaleDateString("en-US", {
                weekday: "short",
              });
              if (last7DaysMap[dayName] !== undefined) {
                last7DaysMap[dayName]++;
              }
            }
          }
        });

        const chartData = daysOrder.map((day) => ({
          name: day,
          Logs: last7DaysMap[day],
        }));

        setMetrics({
          totalUsers,
          totalDestinations,
          totalEvents,
          totalArticles,
          avgRating,
          totalReviews,
        });

        setLogStats({
          total: totalLogsCount,
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

  const nextMonth = () =>
    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1));

  const prevMonth = () =>
    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1));

  const renderCalendar = () => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const today = new Date();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-800 text-lg">
            {monthNames[month]} <span className="text-gray-500 font-medium">{year}</span>
          </h3>

          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-full bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-[#2563eb] transition"
            >
              <FiChevronLeft />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-full bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-[#2563eb] transition"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 mb-3">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 text-center text-sm gap-y-2">
          {days.map((d, i) => {
            if (!d) return <div key={i}></div>;

            const isToday =
              d === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();

            return (
              <div key={i} className="flex justify-center items-center">
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-[13px] font-medium transition-all ${
                    isToday
                      ? "bg-[#2563eb] text-white shadow-sm"
                      : "text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] cursor-pointer"
                  }`}
                >
                  {d}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb] mb-4"></div>
        Loading Dashboard...
      </div>
    );
  }

  return (

  <div className="min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] font-sans text-gray-800 rounded-2xl">
    <div className="max-w-7xl mx-auto pt-6 pb-20 px-6">
      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#2563EB] tracking-tight">
          Dashboard Overview
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Live overview of your tourism platform, system activity, and recent users.
        </p>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-6">
            {/* METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Total Users */}
              <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-2xl flex-shrink-0">
                  <FiUsers />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 font-medium mb-1 truncate">Total Users</p>
                  <h4 className="text-3xl font-extrabold text-[#2563eb] truncate">
                    {metrics.totalUsers}
                  </h4>
                </div>
              </div>

              {/* Total Destinations */}
              <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-2xl flex-shrink-0">
                  <FiMapPin />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 font-medium mb-1 truncate">Total Destinations</p>
                  <h4 className="text-3xl font-extrabold text-[#2563eb] truncate">
                    {metrics.totalDestinations}
                  </h4>
                </div>
              </div>

              {/* Total Events */}
              <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-2xl flex-shrink-0">
                  <FiCalendar />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 font-medium mb-1 truncate">Total Events</p>
                  <h4 className="text-3xl font-extrabold text-[#2563eb] truncate">
                    {metrics.totalEvents}
                  </h4>
                </div>
              </div>

              {/* Total Articles */}
              <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-2xl flex-shrink-0">
                  <FiFileText />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 font-medium mb-1 truncate">Total Articles</p>
                  <h4 className="text-3xl font-extrabold text-[#2563eb] truncate">
                    {metrics.totalArticles}
                  </h4>
                </div>
              </div>

              {/* Average Rating */}
              <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-2xl flex-shrink-0">
                  <FiStar className="fill-[#2563eb]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 font-medium mb-1 truncate">Average Rating</p>
                  <div className="flex items-center gap-2">
                    <h4 className="text-3xl font-extrabold text-[#2563eb] truncate">
                      {metrics.avgRating.toFixed(1)}
                    </h4>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                      / 5.0
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Reviews */}
              <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition">
                <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-2xl flex-shrink-0">
                  <FiMessageSquare />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 font-medium mb-1 truncate">Total Reviews</p>
                  <h4 className="text-3xl font-extrabold text-[#2563eb] truncate">
                    {metrics.totalReviews}
                  </h4>
                </div>
              </div>
            </div>

            {/* SYSTEM ACTIVITY */}
            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FiActivity className="text-[#2563eb]" /> System Activity
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Total Logs: <span className="font-bold text-[#2563eb]">{logStats.total}</span>
                    <span className="mx-2 text-gray-300">|</span>
                    Activity Today: <span className="font-bold text-[#2563eb]">{logStats.today}</span>
                  </p>
                </div>

                <button
                  onClick={() => navigate("/admin/logs")}
                  className="rounded-full bg-[#2563eb] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md w-fit flex items-center gap-2"
                >
                  <FiClipboard />
                  View Full Logs
                </button>
              </div>

              <div className="h-[300px] min-h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={logStats.chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorLogs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "14px",
                        border: "1px solid #E5E7EB",
                        boxShadow: "0 10px 20px rgba(0,0,0,0.06)",
                      }}
                      cursor={{ stroke: "#2563eb", strokeWidth: 1, strokeDasharray: "5 5" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Logs"
                      stroke="#2563eb"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorLogs)"
                      activeDot={{ r: 6, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-1 space-y-6">
            {renderCalendar()}

            <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 text-lg">Recent Users</h3>
                <button
                  onClick={() => navigate("/admin/accounts")}
                  className="text-xs font-bold text-[#2563eb] hover:underline"
                >
                  See All
                </button>
              </div>

              <div className="space-y-5">
                {recentUsers.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No users found.</p>
                ) : (
                  recentUsers.map((user) => {
                    const initial = user.displayName
                      ? user.displayName.charAt(0).toUpperCase()
                      : user.name
                      ? user.name.charAt(0).toUpperCase()
                      : "U";

                    return (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 rounded-[16px] px-2 py-2 hover:bg-blue-50/40 transition"
                      >
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="user"
                            className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold text-lg border border-blue-100 flex-shrink-0">
                            {initial}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">
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
    </div>
  );
}

export default AdminDashboard;