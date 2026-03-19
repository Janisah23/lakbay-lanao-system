import { collection, addDoc, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const contentRef = collection(db, "tourismContent");

// Get all published tourism content
export const listenPublishedContent = (callback) => {
  return onSnapshot(contentRef, (snapshot) => {

    const list = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(item => item.status === "published");

    callback(list);

  });
};

// Get single article
export const getContentById = async (id) => {
  const ref = doc(db, "tourismContent", id);
  const snap = await getDoc(ref);

  if(snap.exists()){
    return snap.data();
  }

  return null;
};

// Add content (staff side)
export const addContent = async (data) => {
  return await addDoc(contentRef, data);
};