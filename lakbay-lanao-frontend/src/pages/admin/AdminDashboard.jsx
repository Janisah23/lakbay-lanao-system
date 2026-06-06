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
  count,
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
          articlesCount,
        ] = await Promise.all([
          getCountFromServer(usersCol, where("status", "==", "active")),
          getCountFromServer(destinationsCol, where("status", "==", "active")),
          getCountFromServer(
            query(contentCol, where("contentType", "==", "Event"), where("status", "==", "published"))
          ),
          getCountFromServer(
            query(contentCol, where("contentType", "==", "Article"), where("status", "==", "published"))
          ),
        ]);

        const recentUsersQuery = query(
          usersCol,
          orderBy("createdAt", "desc"),
          limit(5)
        );

        const recentUsersSnap = await getDocs(recentUsersQuery);

        const usersData = recentUsersSnap.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        setRecentUsers(usersData);

        const reviewsCol = collectionGroup(db, "reviews");

        const reviewsAgg = await getAggregateFromServer(reviewsCol, {
          avgRating: average("rating"),
          totalReviews: count(),
        });

        const now = new Date();
        const sevenDaysAgo = new Date();

        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const logsQuery = query(
          collection(db, "logs"),
          where("timestamp", ">=", sevenDaysAgo)
        );

        const logsSnap = await getDocs(logsQuery);

        const last7DaysMap = {};
        const daysOrder = [];
        const todayStr = now.toDateString();
        let todayLogsCount = 0;

        for (let i = 6; i >= 0; i--) {
          const d = new Date();

          d.setDate(now.getDate() - i);

          const dayName = d.toLocaleDateString("en-US", {
            weekday: "short",
          });

          last7DaysMap[dayName] = 0;
          daysOrder.push(dayName);
        }

        logsSnap.forEach((docItem) => {
          const data = docItem.data();

          if (data.timestamp) {
            const logDate = data.timestamp.toDate();

            if (logDate.toDateString() === todayStr) {
              todayLogsCount++;
            }

            const dayName = logDate.toLocaleDateString("en-US", {
              weekday: "short",
            });

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

  const MetricCard = ({ label, value, icon }) => (
    <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(37,99,235,0.08)]">
      <div className="flex items-center gap-5">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xl text-[#2563eb]">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {label}
          </p>

          <h4 className="mt-1 text-3xl font-bold text-[#2563eb]">
            {value}
          </h4>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f3f9ff] font-['Poppins'] text-gray-500">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-[#2563eb]" />

        <p className="text-sm font-medium">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f8fbff] font-['Poppins']">
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10 lg:px-10">
        {/* HEADER */}
        <section className="mb-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
                Admin Dashboard
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
                Admin Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-base leading-relaxed text-gray-500">
                Monitor tourism data, user activity, reviews, and recent
                platform registrations.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin/logs")}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-[#2563eb]/20 bg-white px-5 py-3 text-sm font-medium text-[#2563eb] shadow-sm transition duration-300 hover:bg-blue-50"
            >
              <FiClipboard />
              View Audit Trail
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 xl:grid-cols-4">
          {/* MAIN CONTENT */}
          <div className="space-y-8 lg:col-span-2 xl:col-span-3">
            {/* METRICS */}
            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard
                label="Total Users"
                value={metrics.totalUsers}
                icon={<FiUsers />}
              />

              <MetricCard
                label="Destinations"
                value={metrics.totalDestinations}
                icon={<FiMapPin />}
              />

              <MetricCard
                label="Active Events"
                value={metrics.totalEvents}
                icon={<FiCalendar />}
              />

              <MetricCard
                label="Published Articles"
                value={metrics.totalArticles}
                icon={<FiFileText />}
              />

              <MetricCard
                label="Total Reviews"
                value={metrics.totalReviews}
                icon={<FiMessageSquare />}
              />

              <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(37,99,235,0.08)]">
                <div className="flex items-center gap-5">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xl text-[#2563eb]">
                    <FiStar />
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Average Rating
                    </p>

                    <div className="mt-1 flex items-baseline gap-1">
                      <h4 className="text-3xl font-bold text-[#2563eb]">
                        {metrics.avgRating.toFixed(1)}
                      </h4>

                      <span className="text-sm font-medium text-gray-400">
                        / 5.0
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ACTIVITY CHART */}
            <section className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_8px_24px_rgba(37,99,235,0.06)] md:p-8">
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold text-[#2563eb]">
                    <FiActivity />
                    7-Day Login Activity
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Actions recorded today:{" "}
                    <span className="font-bold text-[#2563eb]">
                      {logStats.today} logs
                    </span>
                  </p>
                </div>

                <span className="inline-flex w-fit rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
                  Last 7 Days
                </span>
              </div>

              <div className="h-[310px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={logStats.chartData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="colorLogs"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#2563eb"
                          stopOpacity={0.14}
                        />

                        <stop
                          offset="95%"
                          stopColor="#2563eb"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#dbeafe"
                    />

                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#6b7280",
                        fontSize: 12,
                      }}
                      dy={12}
                    />

                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#6b7280",
                        fontSize: 12,
                      }}
                    />

                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: "18px",
                        border: "1px solid #dbeafe",
                        boxShadow: "0 10px 28px rgba(37,99,235,0.08)",
                        fontSize: "12px",
                      }}
                      cursor={{
                        stroke: "#93c5fd",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="Logs"
                      stroke="#2563eb"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorLogs)"
                      activeDot={{
                        r: 5,
                        strokeWidth: 0,
                        fill: "#2563eb",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* RIGHT CONTENT */}
          <aside className="space-y-8 lg:col-span-1">
            {/* QUICK SUMMARY */}
            <section className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
              <h2 className="text-lg font-bold text-[#2563eb]">
                Activity Summary
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                Overview of recent staff and system activities recorded in the
                audit trail.
              </p>

              <div className="mt-6 space-y-3">
                <div className="rounded-[20px] border border-blue-100 bg-[#f8fbff] px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Logs Today
                  </p>

                  <h3 className="mt-1 text-2xl font-bold text-[#2563eb]">
                    {logStats.today}
                  </h3>
                </div>

                <div className="rounded-[20px] border border-blue-100 bg-[#f8fbff] px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Logs This Week
                  </p>

                  <h3 className="mt-1 text-2xl font-bold text-[#2563eb]">
                    {logStats.total}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin/logs")}
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#2563eb] px-5 py-3 text-sm font-medium text-white shadow-sm transition duration-300 hover:bg-blue-700"
              >
                View Logs
              </button>
            </section>

            {/* RECENT USERS */}
            <section className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#2563eb]">
                    New Users
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Latest registrations.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/admin/accounts")}
                  className="rounded-full border border-[#2563eb]/20 bg-white px-4 py-2 text-xs font-medium text-[#2563eb] transition duration-300 hover:bg-blue-50"
                >
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {recentUsers.length === 0 ? (
                  <div className="rounded-[20px] border border-blue-100 bg-[#f8fbff] px-4 py-8 text-center">
                    <p className="text-sm text-gray-500">
                      No recent users found.
                    </p>
                  </div>
                ) : (
                  recentUsers.map((user) => {
                    const displayName =
                      user.displayName || user.name || "Tourist";
                    const initial = displayName.charAt(0).toUpperCase();

                    return (
                      <div
                        key={user.id}
                        className="flex items-center gap-4 rounded-[20px] border border-blue-50 bg-white p-3 transition duration-300 hover:bg-blue-50/60"
                      >
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="user"
                            className="h-11 w-11 rounded-full border border-blue-100 object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-bold text-[#2563eb]">
                            {initial}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-gray-800">
                            {displayName}
                          </p>

                          <p className="mt-0.5 truncate text-xs capitalize text-gray-500">
                            {user.role || "Standard User"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;