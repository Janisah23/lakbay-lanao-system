import { useEffect, useMemo, useState } from "react";
import { collection, collectionGroup, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function RatingsSummary() {
  const [reviews, setReviews] = useState([]);
  const [tourismData, setTourismData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let reviewsLoaded = false;
    let tourismLoaded = false;

    const finishLoading = () => {
      if (reviewsLoaded && tourismLoaded) {
        setLoading(false);
      }
    };

    const unsubscribeTourism = onSnapshot(
      collection(db, "tourismData"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTourismData(data);
        tourismLoaded = true;
        finishLoading();
      },
      (error) => {
        console.error("Error fetching tourism data:", error);
        tourismLoaded = true;
        finishLoading();
      }
    );

    const unsubscribeReviews = onSnapshot(
      collectionGroup(db, "reviews"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const raw = doc.data();

          return {
            id: doc.id,
            ...raw,
            rating: Number(raw.rating ?? raw.stars ?? raw.score ?? 0),
            createdAt: raw.createdAt?.toDate?.() || null,
            tourismId: doc.ref.parent.parent?.id || null,
          };
        });

        setReviews(data);
        reviewsLoaded = true;
        finishLoading();
      },
      (error) => {
        console.error("Error fetching reviews:", error);
        reviewsLoaded = true;
        finishLoading();
      }
    );

    return () => {
      unsubscribeTourism();
      unsubscribeReviews();
    };
  }, []);

  const analytics = useMemo(() => {
    const validReviews = reviews.filter(
      (item) => !isNaN(item.rating) && item.rating >= 1 && item.rating <= 5
    );

    const totalRatings = validReviews.length;

    const averageRating =
      totalRatings > 0
        ? (
            validReviews.reduce((sum, item) => sum + item.rating, 0) /
            totalRatings
          ).toFixed(1)
        : "0.0";

    const fiveStarCount = validReviews.filter((item) => item.rating === 5).length;

    const satisfaction =
      totalRatings > 0
        ? Math.round((fiveStarCount / totalRatings) * 100)
        : 0;

    const distribution = [5, 4, 3, 2, 1].map((star) => {
      const count = validReviews.filter((item) => item.rating === star).length;
      const percent = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

      return {
        stars: star,
        count,
        percent,
      };
    });

    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const monthlyMap = {};

    validReviews.forEach((item) => {
      if (!item.createdAt) return;

      const monthIndex = item.createdAt.getMonth();
      const monthName = monthLabels[monthIndex];

      if (!monthlyMap[monthName]) {
        monthlyMap[monthName] = [];
      }

      monthlyMap[monthName].push(item.rating);
    });

    const monthlyTrend = monthLabels.map((month) => {
      const ratings = monthlyMap[month] || [];
      const average =
        ratings.length > 0
          ? Number(
              (
                ratings.reduce((sum, value) => sum + value, 0) / ratings.length
              ).toFixed(1)
            )
          : 0;

      return {
        month,
        rating: average,
      };
    });

    const tourismMap = {};
    tourismData.forEach((item) => {
      tourismMap[item.id] = item;
    });

    const groupedRatings = {};

    validReviews.forEach((review) => {
      if (!review.tourismId) return;

      if (!groupedRatings[review.tourismId]) {
        groupedRatings[review.tourismId] = [];
      }

      groupedRatings[review.tourismId].push(review.rating);
    });

    const rankedDestinations = Object.entries(groupedRatings)
      .map(([tourismId, ratings]) => {
        const tourism = tourismMap[tourismId];
        const avg =
          ratings.reduce((sum, value) => sum + value, 0) / ratings.length;

        return {
          id: tourismId,
          name: tourism?.name || "Unknown Destination",
          category: tourism?.category || "Destination",
          imageURL: tourism?.imageURL || "",
          municipality: tourism?.location?.municipality || "Lanao del Sur",
          average: Number(avg.toFixed(1)),
          totalReviews: ratings.length,
        };
      })
      .sort((a, b) => {
        if (b.average === a.average) {
          return b.totalReviews - a.totalReviews;
        }
        return b.average - a.average;
      });

    const topRated = rankedDestinations.slice(0, 3);

    return {
      totalRatings,
      averageRating,
      satisfaction,
      distribution,
      monthlyTrend,
      topRated,
    };
  }, [reviews, tourismData]);

  const renderStars = (value) => {
    const rounded = Math.round(Number(value));

    return (
      <div className="flex text-xl">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rounded ? "text-yellow-400" : "text-gray-200"}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      <h2 className="text-2xl font-semibold text-[#2563EB]">
        Ratings Summary
      </h2>

      <p className="text-gray-500 text-sm mt-2">
        Overview of tourist feedback and satisfaction metrics
      </p>

      {loading ? (
        <div className="mt-10 bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center text-gray-400">
          Loading ratings summary...
        </div>
      ) : (
        <>
          {/* STATS */}
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            {[
              {
                title: "TOTAL RATINGS",
                value: analytics.totalRatings,
                sub: "User reviews collected",
              },
              {
                title: "AVERAGE RATING",
                value: analytics.averageRating,
                sub: "Out of 5.0 stars",
              },
              {
                title: "SATISFACTION",
                value: `${analytics.satisfaction}%`,
                sub: "Rated 5 stars",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200"
              >
                <p className="text-sm text-gray-500">{item.title}</p>
                <h3 className="text-3xl font-semibold mt-2 text-gray-800">
                  {item.value}
                </h3>
                <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* AVERAGE OVERVIEW + CHART */}
          <div className="grid lg:grid-cols-2 gap-6 mt-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-5">
                Average Rating Overview
              </p>

              <div className="flex items-center justify-between flex-wrap gap-6">
                <div>
                  <h3 className="text-5xl font-semibold text-[#2563EB]">
                    {analytics.averageRating}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">
                    Average user score
                  </p>
                </div>

                <div className="flex flex-col items-start">
                  {renderStars(analytics.averageRating)}
                  <p className="text-xs text-gray-400 mt-2">
                    Based on {analytics.totalRatings} verified ratings
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-5">
                Monthly Rating Trend
              </p>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analytics.monthlyTrend}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} />
                    <YAxis
                      domain={[0, 5]}
                      tick={{ fontSize: 12, fill: "#6B7280" }}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="rating"
                      stroke="#2563EB"
                      strokeWidth={3}
                      fill="url(#ratingFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* TOP RATED DESTINATIONS */}
          <div className="mt-10 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Top Rated Destinations
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Best performing places based on tourist ratings
                </p>
              </div>
            </div>

            {analytics.topRated.length === 0 ? (
              <div className="text-sm text-gray-400 py-8 text-center">
                No top rated destinations yet.
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-5">
                {analytics.topRated.map((item, index) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        src={item.imageURL || "/default.jpg"}
                        alt={item.name}
                        className="w-20 h-20 rounded-xl object-cover"
                      />

                      <div className="flex-1">
                        <p className="text-xs text-gray-400">
                          Top #{index + 1}
                        </p>

                        <h3 className="font-semibold text-gray-800 mt-1">
                          {item.name}
                        </h3>

                        <p className="text-xs text-gray-500 mt-1">
                          {item.category} • {item.municipality}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <p className="text-lg font-semibold text-[#2563EB]">
                              {item.average}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {item.totalReviews} reviews
                            </p>
                          </div>

                          <div>{renderStars(item.average)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RATING DISTRIBUTION */}
          <div className="mt-10 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <p className="text-sm font-medium mb-5 text-gray-700">
              Rating Distribution
            </p>

            <div className="space-y-4">
              {analytics.distribution.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{item.stars} Stars</span>
                    <span>{item.count} ratings</span>
                  </div>

                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#2563EB] h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default RatingsSummary;