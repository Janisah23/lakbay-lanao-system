import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";

export const logAction = async (data) => {
  try {
    // Wait until auth is fully ready
    const user = await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        unsubscribe();
        resolve(u);
      });
    });

    if (!user) {
      console.log("No authenticated user for logging.");
      return;
    }

    await addDoc(collection(db, "logs"), {
      ...data,
      timestamp: serverTimestamp(),
    });

  } catch (error) {
    console.error("Error logging action:", error);
  }
};