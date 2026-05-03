import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase/config";
import Sidebar from "../components/common/Sidebar";

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Listen for the current logged-in user
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch the user's document from the "users" collection
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            // Try to use 'name', fallback to 'displayName', or auth display name
            setUserName(userData.name || userData.displayName || user.displayName || "Admin User");
          } else {
            // Fallback if the user document doesn't exist yet
            setUserName(user.displayName || "Admin User");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserName(user.displayName || "Admin User");
        }
      } else {
        setUserName("");
      }
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] font-sans text-gray-800">
      
      {/* 1. The Fixed Sidebar with dynamic name */}
      <Sidebar 
        role="Admin" 
        name={userName}
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
      />

      <main 
        className={`transition-all duration-300 ease-in-out ${
          collapsed ? "ml-[88px]" : "ml-[280px]"
        }`}
      >
        <div className="w-full h-full min-h-screen">
            <Outlet /> 
        </div>
      </main>

    </div>
  );
}

export default AdminLayout;