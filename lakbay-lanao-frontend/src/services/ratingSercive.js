import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";

const ratingRef = collection(db, "ratings");

// Add rating
export const addRating = async (data) => {
  return await addDoc(ratingRef, data);
};

// Listen to ratings of a place
export const listenRatings = (placeId, callback) => {

  return onSnapshot(ratingRef, (snapshot)=>{

    const list = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(item => item.placeId === placeId);

    callback(list);

  });

};