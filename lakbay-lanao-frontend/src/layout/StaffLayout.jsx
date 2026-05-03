import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";

function StaffLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] font-sans text-gray-800">
      
      {/* Sidebar */}
      <Sidebar 
        role="staff" 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
      />

      {/* Main Content Wrapper */}
      <main
        className={`flex-1 transition-all duration-300 ease-in-out relative ${
          collapsed ? "ml-[80px]" : "ml-[260px]"
        }`}
      >
        <Outlet />
      </main>

    </div>
  );
}

export default StaffLayout;