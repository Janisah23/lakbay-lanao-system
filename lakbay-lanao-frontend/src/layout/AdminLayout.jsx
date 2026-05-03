import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] font-sans text-gray-800">
      
      {/* 1. The Fixed Sidebar */}
      <Sidebar 
        role="admin" 
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