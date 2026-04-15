import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { FiMessageSquare, FiUser } from "react-icons/fi";

const FeedbackSection = ({ placeId, sourceCollection }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!placeId || !sourceCollection) return;

    const fetchReviews = async () => {
      try {
        const reviewsRef = collection(db, sourceCollection, placeId, "reviews");
        const snap = await getDocs(reviewsRef);
        
        const reviewsData = [];

        // Loop through each review to fetch user details
        for (let docSnap of snap.docs) {
          const data = docSnap.data();
          let userName = "Tourist";
          let userPhoto = null;

          // Try to fetch the reviewer's name and photo from the "users" collection
          if (data.userId) {
            const userDoc = await getDoc(doc(db, "users", data.userId));
            if (userDoc.exists()) {
              userName = userDoc.data().displayName || userDoc.data().name || userName;
              userPhoto = userDoc.data().photoURL || null;
            }
          }

          reviewsData.push({
            id: docSnap.id,
            ...data,
            userName,
            userPhoto,
            date: data.createdAt ? data.createdAt.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : "Recently",
          });
        }

        // Sort by newest first
        reviewsData.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        
        setReviews(reviewsData);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [placeId, sourceCollection]);

  if (loading) {
    return <div className="py-10 text-center text-gray-500 animate-pulse">Loading feedback...</div>;
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
          <p className="text-gray-500 font-medium">No feedback yet. Be the first to rate this place!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="flex gap-4 items-start p-5 rounded-2xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100">
              {/* User Avatar */}
              {review.userPhoto ? (
                <img src={review.userPhoto} alt="user" className="w-12 h-12 rounded-full object-cover shadow-sm" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl shadow-sm">
                  <FiUser />
                </div>
              )}

              {/* Review Content */}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-gray-900">{review.userName}</h4>
                  <span className="text-xs text-gray-400 font-medium">{review.date}</span>
                </div>
                
                {/* Stars */}
                <div className="flex items-center gap-1 mb-2 text-sm">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= review.rating ? "text-yellow-400" : "text-gray-200"}>
                      ★
                    </span>
                  ))}
                </div>

                {/* Optional Comment */}
                {review.comment && (
                  <p className="text-sm text-gray-600 leading-relaxed mt-2 bg-white p-3 rounded-xl border border-gray-100">
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