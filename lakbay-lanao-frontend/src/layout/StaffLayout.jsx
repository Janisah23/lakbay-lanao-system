import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";

function StaffLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Sidebar */}
      <Sidebar role="staff" collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main Content */}
      <div
        className={`flex-1 p-8 transition-all duration-300 ease-in-out
        ${collapsed ? "ml-[80px]" : "ml-[260px]"}`}
      >
        <Outlet />
      </div>

    </div>
  );
}

export default StaffLayout;
