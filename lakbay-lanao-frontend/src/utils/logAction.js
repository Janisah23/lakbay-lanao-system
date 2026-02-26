import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

export const logAction = async ({
  action,
  userName,
  performedBy,
  role,
  ipAddress,
}) => {
  try {
    await addDoc(collection(db, "logs"), {
      action,
      userName,
      performedBy,
      role,
      ipAddress: ipAddress || "N/A",
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging action:", error);
  }
};