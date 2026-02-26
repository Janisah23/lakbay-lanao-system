import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import Sidebar from "../components/common/Sidebar";

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;

      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">

      <Sidebar
        role={userData?.role}
        name={userData?.name}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div
        className={`flex-1 p-8 transition-all duration-300 ease-in-out
        ${collapsed ? "ml-[80px]" : "ml-[260px]"}`}
      >
        <Outlet />
      </div>

    </div>
  );
}

export default AdminLayout;