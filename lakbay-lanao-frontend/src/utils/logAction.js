import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";

export const logAction = async (data, manualUser = null) => {
  try {
    // If we passed a user manually (like during logout), use that.
    // Otherwise, wait for the current auth state.
    let user = manualUser;

    if (!user) {
      user = await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
          unsubscribe();
          resolve(u);
        });
      });
    }

    if (!user) {
      console.log("No authenticated user for logging.");
      return;
    }

    await addDoc(collection(db, "logs"), {
      userId: user.uid,
      userName: user.displayName || user.email || "Unknown User",
      ...data,
      timestamp: serverTimestamp(),
    });

  } catch (error) {
    console.error("Error logging action:", error);
  }
};