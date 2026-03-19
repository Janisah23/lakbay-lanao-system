import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const tourismRef = collection(db, "tourismData");

// Listen to all tourism places
export const listenTourismPlaces = (callback) => {

  return onSnapshot(tourismRef, (snapshot)=>{

    const list = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    callback(list);

  });

};

// Get single place
export const getPlaceById = async (id) => {

  const ref = doc(db, "tourismData", id);
  const snap = await getDoc(ref);

  if(snap.exists()){
    return snap.data();
  }

  return null;

};