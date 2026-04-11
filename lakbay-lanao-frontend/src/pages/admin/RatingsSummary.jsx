import React, { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";

function RatingsSummary({ placeId }) {
  const [stats, setStats] = useState({
    rating: 0,
    reviewsCount: 0,
    viewCount: 0,
    saveCount: 0,
    distribution: [0, 0, 0, 0, 0],
  });

  useEffect(() => {
    if (!placeId) return;

    // REAL-TIME reviews listener
    const unsub = onSnapshot(
      collection(db, "tourismContent", placeId, "reviews"),
      (snap) => {
        const ratings = snap.docs.map(doc => doc.data().rating);
        let distribution = [0, 0, 0, 0, 0];

        if (ratings.length > 0) {
          const total = ratings.length;

          const counts = [0, 0, 0, 0, 0];
          ratings.forEach(r => {
            counts[r - 1]++;
          });

          distribution = counts.map(c =>
            Math.round((c / total) * 100)
          );
        }

        setStats(prev => ({
          ...prev,
          distribution: [...distribution].reverse() // 5★ → 1★
        }));
      }
    );

    // 🔹 Fetch main document (rating, views, saves)
    const fetchMain = async () => {
      try {
        const docRef = doc(db, "tourismContent", placeId);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          const data = snap.data();

          setStats(prev => ({
            ...prev,
            rating: data.rating || 0,
            reviewsCount: data.reviewsCount || 0,
            viewCount: data.viewCount || 0,
            saveCount: data.saveCount || 0,
          }));
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchMain();

    return () => unsub();
  }, [placeId]);

  return (
    <>
      <h2 className="text-2xl font-semibold text-[#2563EB]">
        Ratings Summary
      </h2>

      <p className="text-gray-500 text-sm mt-2">
        Overview of tourist feedback and satisfaction metrics
      </p>

      {/* ✅ Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">

        {[
          {
            title: "TOTAL RATINGS",
            value: stats.reviewsCount,
            sub: "User reviews collected"
          },
          {
            title: "AVERAGE RATING",
            value: stats.rating.toFixed(1),
            sub: "Out of 5.0 stars"
          },
          {
            title: "SATISFACTION",
            value: `${Math.round((stats.rating / 5) * 100)}%`,
            sub: "Based on ratings"
          },
          {
            title: "TOTAL VIEWS",
            value: stats.viewCount,
            sub: "People viewed this"
          },
          {
            title: "SAVED",
            value: stats.saveCount,
            sub: "Users added to favorites"
          },
        ].map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{item.title}</p>
            <h3 className="text-3xl font-semibold mt-2">{item.value}</h3>
            <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
          </div>
        ))}

      </div>

      {/* Rating Distribution */}
      <div className="mt-10 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <p className="text-sm font-medium mb-4">Rating Distribution</p>

        {stats.distribution.map((percent, index) => (
          <div key={index} className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{5 - index} Stars</span>
              <span>{percent}%</span>
            </div>

            <div className="w-full bg-gray-200 h-2 rounded-full">
              <div
                className="bg-[#2563EB] h-2 rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default RatingsSummary;