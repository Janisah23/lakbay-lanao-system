import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { FiMessageSquare, FiUser } from "react-icons/fi";

const FeedbackSection = ({ placeId, sourceCollection }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchReviews = async () => {
      if (!placeId || !sourceCollection) {
        if (isMounted) {
          setReviews([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const reviewsRef = collection(db, sourceCollection, placeId, "reviews");
        const snap = await getDocs(reviewsRef);

        const reviewsData = await Promise.all(
          snap.docs.map(async (reviewDoc) => {
            const data = reviewDoc.data();

            let userName = "Tourist";
            let userPhoto = null;

            if (data.userId) {
              try {
                const userRef = doc(db, "users", data.userId);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  userName =
                    userData.displayName ||
                    userData.name ||
                    userData.fullName ||
                    "Tourist";
                  userPhoto = userData.photoURL || null;
                }
              } catch (userError) {
                console.error("Error fetching user info:", userError);
              }
            }

            return {
              id: reviewDoc.id,
              ...data,
              userName,
              userPhoto,
              rating: Number(data.rating) || 0,
              comment: data.comment || "",
              createdAt: data.createdAt || null,
              date: data.createdAt?.toDate
                ? data.createdAt.toDate().toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "Recently",
            };
          })
        );

        reviewsData.sort(
          (a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
        );

        if (isMounted) {
          setReviews(reviewsData);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
        if (isMounted) {
          setReviews([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      isMounted = false;
    };
  }, [placeId, sourceCollection]);

  if (loading) {
    return (
      <div className="py-10 text-center text-gray-500 animate-pulse">
        Loading feedback...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-8 md:p-10 mt-10">
      <h2 className="text-2xl font-bold text-[#2563eb] mb-2 flex items-center gap-3">
        <FiMessageSquare /> Tourist Feedback
      </h2>

      <p className="text-sm text-gray-500 mb-8 border-b border-gray-100 pb-6">
        See what others are saying about this destination.
      </p>

      {reviews.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">
            No feedback yet. Be the first to rate this place!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex gap-4 items-start p-5 rounded-2xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100"
            >
              {review.userPhoto ? (
                <img
                  src={review.userPhoto}
                  alt={review.userName}
                  className="w-12 h-12 rounded-full object-cover shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl shadow-sm">
                  <FiUser />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-3 mb-1">
                  <h4 className="font-bold text-gray-900 truncate">
                    {review.userName}
                  </h4>
                  <span className="text-xs text-gray-400 font-medium shrink-0">
                    {review.date}
                  </span>
                </div>

                <div className="flex items-center gap-1 mb-2 text-sm">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={
                        star <= review.rating ? "text-yellow-400" : "text-gray-200"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>

                {review.comment?.trim() && (
                  <p className="text-sm text-gray-600 leading-relaxed mt-2 bg-white p-3 rounded-xl border border-gray-100 break-words">
                    "{review.comment}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackSection;