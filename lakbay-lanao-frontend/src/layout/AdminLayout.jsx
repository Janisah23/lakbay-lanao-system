import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth"; // <-- Added this
import Sidebar from "../components/common/Sidebar";

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // FIX 1: Safely wait for Firebase to confirm who the user is
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching user data in layout:", error);
        }
      } else {
        setUserData(null);
      }
    });

    // Cleanup the listener
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-hidden">
      
      <Sidebar
        role={userData?.role}
        name={userData?.name}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* FIX 2: Added `min-w-0` and `w-full`
      */}
      <div
        className={`flex-1 min-w-0 w-full p-4 md:p-8 transition-all duration-300 ease-in-out
        ${collapsed ? "ml-[80px]" : "ml-[260px]"}`}
      >
        <Outlet />
      </div>

    </div>
  );
}

export default AdminLayout;