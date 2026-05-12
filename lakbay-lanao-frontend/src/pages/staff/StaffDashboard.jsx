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
  doc,
  getDoc,
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
  FiImage,
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

        const [
          destinationsCount,
          eventsCount,
          articlesCount,
          reviewsAgg,
        ] = await Promise.all([
          getCountFromServer(destinationsCol),
          getCountFromServer(
            query(contentCol, where("contentType", "==", "Event"))
          ),
          getCountFromServer(
            query(contentCol, where("contentType", "==", "Article"))
          ),
          getAggregateFromServer(reviewsCol, {
            avgRating: average("rating"),
            totalReviews: count(),
          }),
        ]);

        const recentReviewsQuery = query(
          reviewsCol,
          orderBy("createdAt", "desc"),
          limit(5)
        );

        const recentReviewsSnap = await getDocs(recentReviewsQuery);

        const reviewsWithNames = await Promise.all(
          recentReviewsSnap.docs.map(async (reviewDoc) => {
            const reviewData = reviewDoc.data();
            const parentRef = reviewDoc.ref.parent.parent;
            let targetName = "Tourism Spot";

            if (parentRef) {
              const parentSnap = await getDoc(
                doc(db, "tourismData", parentRef.id)
              );

              if (parentSnap.exists()) {
                targetName = parentSnap.data().name || parentSnap.data().title;
              }
            }

            return {
              id: reviewDoc.ref.path,
              targetName,
              ...reviewData,
            };
          })
        );

        setRecentReviews(reviewsWithNames);

        const now = new Date();
        const sevenDaysAgo = new Date();

        sevenDaysAgo.setDate(now.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const recentTrendsQuery = query(
          reviewsCol,
          where("createdAt", ">=", sevenDaysAgo)
        );

        const trendsSnap = await getDocs(recentTrendsQuery);

        const last7DaysMap = {};
        const daysOrder = [];
        const todayStr = now.toDateString();
        let todayReviewsCount = 0;

        for (let i = 6; i >= 0; i--) {
          const d = new Date();

          d.setDate(now.getDate() - i);

          const dayName = d.toLocaleDateString("en-US", {
            weekday: "short",
          });

          last7DaysMap[dayName] = 0;
          daysOrder.push(dayName);
        }

        trendsSnap.forEach((docItem) => {
          const data = docItem.data();

          if (data.createdAt) {
            const reviewDate = data.createdAt.toDate();

            if (reviewDate.toDateString() === todayStr) {
              todayReviewsCount++;
            }

            const dayName = reviewDate.toLocaleDateString("en-US", {
              weekday: "short",
            });

            if (last7DaysMap[dayName] !== undefined) {
              last7DaysMap[dayName]++;
            }
          }
        });

        const chartData = daysOrder.map((day) => ({
          name: day,
          Reviews: last7DaysMap[day],
        }));

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

  const QuickActionButton = ({ icon, title, desc, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-[22px] border border-blue-50 bg-white p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-50/60 hover:shadow-[0_8px_20px_rgba(37,99,235,0.05)]"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#2563eb] transition group-hover:bg-[#2563eb] group-hover:text-white">
          {icon}
        </div>

        <div className="min-w-0">
          <span className="block truncate text-sm font-semibold text-gray-700 transition group-hover:text-[#2563eb]">
            {title}
          </span>

          <span className="mt-0.5 block truncate text-xs font-medium text-gray-500">
            {desc}
          </span>
        </div>
      </div>

      <FiChevronRight className="flex-shrink-0 text-lg text-gray-300 transition group-hover:translate-x-1 group-hover:text-[#2563eb]" />
    </button>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f3f9ff] font-['Poppins']">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-[#2563eb]" />

        <p className="text-sm font-medium text-gray-500">
          Loading staff workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#f8fbff]font-['Poppins']">
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10 lg:px-10">
        {/* HEADER */}
        <section className="mb-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
                Staff Workspace
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
                Staff Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-base leading-relaxed text-gray-500">
                Manage tourism data, publish content, monitor ratings, and
                review recent tourist feedback.
              </p>
            </div>

            
          </div>
        </section>

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-3 xl:grid-cols-4">
  {/* LEFT CONTENT */}
  <div className="space-y-8 lg:col-span-2 xl:col-span-3">
    {/* METRICS */}
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <MetricCard
          label="Managed Destinations"
          value={metrics.totalDestinations}
          icon={<FiMapPin />}
        />

        <MetricCard
          label="Published Articles"
          value={metrics.totalArticles}
          icon={<FiFileText />}
        />

        <MetricCard
          label="Active Events"
          value={metrics.totalEvents}
          icon={<FiCalendar />}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <MetricCard
          label="Total Feedback"
          value={metrics.totalReviews}
          icon={<FiMessageSquare />}
        />

       <div className="rounded-[28px] border border-[#2563eb]/20 bg-[#2563eb] p-6 shadow-[0_10px_28px_rgba(37,99,235,0.12)] shadow-inner transition duration-300 hover:-translate-y-0.5">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/15 text-xl text-white shadow-[inset_0_1px_6px_rgba(255,255,255,0.16)]">
              <FiStar className="fill-white" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase tracking-widest text-blue-100">
                Platform Avg Rating
              </p>

              <div className="mt-1 flex items-end gap-1.5">
                <h4 className="text-3xl font-bold text-white">
                  {metrics.avgRating.toFixed(1)}
                </h4>

                <span className="text-sm font-medium text-blue-100">
                  / 5.0
                </span>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>

    {/* CHART starts here below */}

            {/* CHART */}
            <section className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_8px_24px_rgba(37,99,235,0.06)] md:p-8">
              <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-bold text-[#2563eb]">
                    <FiTrendingUp />
                    7-Day Feedback Trends
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Reviews received today:{" "}
                    <span className="font-bold text-[#2563eb]">
                      {reviewStats.today}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/staff/feedback")}
                  className="inline-flex w-fit items-center justify-center gap-2 rounded-full border border-[#2563eb]/20 bg-white px-5 py-3 text-sm font-medium text-[#2563eb] shadow-sm transition duration-300 hover:bg-blue-50"
                >
                  <FiStar />
                  View All Ratings
                </button>
              </div>

              <div className="h-[330px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={reviewStats.chartData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >
                    <defs>
                      <linearGradient
                        id="colorReviews"
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
                      dataKey="Reviews"
                      stroke="#2563eb"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorReviews)"
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
            {/* QUICK ACTIONS */}
            <section className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
              <h2 className="text-lg font-bold text-[#2563eb]">
                Quick Actions
              </h2>

              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                Jump directly to common staff tasks.
              </p>

              <div className="mt-6 space-y-3">
                <QuickActionButton
                  icon={<FiPlus />}
                  title="Add Destination"
                  desc="List new tourist spots"
                  onClick={() => navigate("/staff/manage")}
                />

                <QuickActionButton
                  icon={<FiEdit3 />}
                  title="Write Article"
                  desc="Publish guides & updates"
                  onClick={() => navigate("/staff/content")}
                />

                <QuickActionButton
                  icon={<FiImage />}
                  title="Manage Gallery"
                  desc="Upload images & videos"
                  onClick={() => navigate("/staff/gallery")}
                />
              </div>
            </section>

            {/* RECENT REVIEWS */}
            <section className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[#2563eb]">
                    Recent Ratings
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Latest tourist feedback.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/staff/feedback")}
                  className="rounded-full border border-[#2563eb]/20 bg-white px-4 py-2 text-xs font-medium text-[#2563eb] transition duration-300 hover:bg-blue-50"
                >
                  View All
                </button>
              </div>

              <div className="space-y-3">
                {recentReviews.length === 0 ? (
                  <div className="rounded-[20px] border border-blue-100 bg-[#f8fbff] px-4 py-8 text-center">
                    <p className="text-sm text-gray-500">
                      No recent feedback.
                    </p>
                  </div>
                ) : (
                  recentReviews.map((review) => {
                    const authorName =
                      review.authorName || review.userName || "Tourist";

                    const initial = authorName.charAt(0).toUpperCase();

                    return (
                      <div
                        key={review.id}
                        className="group flex items-start gap-3 rounded-[20px] border border-blue-50 bg-white p-3 transition duration-300 hover:bg-blue-50/60"
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-bold text-[#2563eb]">
                          {initial}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-gray-700 transition group-hover:text-[#2563eb]">
                              {authorName}
                            </p>

                            <div className="flex flex-shrink-0 items-center gap-1 rounded-full border border-yellow-100 bg-yellow-50 px-2 py-0.5 text-[10px] text-yellow-500">
                              <FiStar className="fill-yellow-500" />
                              <span className="font-bold">
                                {review.rating}
                              </span>
                            </div>
                          </div>

                          <p className="line-clamp-1 text-xs font-semibold text-[#2563eb]">
                            {review.targetName}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default StaffDashboard;