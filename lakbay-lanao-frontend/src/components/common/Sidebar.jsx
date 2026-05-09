import {
  FiFolder,
  FiFileText,
  FiStar,
  FiUsers,
  FiClipboard,
  FiMenu,
  FiChevronDown,
  FiLogOut,
  FiCpu,
  FiBarChart2,
  FiHome
} from "react-icons/fi";

import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import lakbayLogo from "../../assets/lakbay.png";

function Sidebar({ role, name, collapsed, setCollapsed }) {
  const [openProfile, setOpenProfile] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const staffNav = [
    { name: "Dashboard", path: "/staff/dashboard", icon: <FiHome /> },
    { name: "Manage Tourism Data", path: "/staff/manage", icon: <FiFolder /> },
    { name: "Manage Tourism Content", path: "/staff/content", icon: <FiFileText /> },
    { name: "Manage Gallery", path: "/staff/gallery", icon: <FiFolder /> },
    { name: "Ratings & Reviews", path: "/staff/feedback", icon: <FiStar /> },
  ];

  const adminNav = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <FiHome /> },
    { name: "Account Management", path: "/admin/accounts", icon: <FiUsers /> },
    { name: "Analytics & Ratings", path: "/admin/ratings", icon: <FiBarChart2 /> },
    { name: "System Logs", path: "/admin/logs", icon: <FiClipboard /> },
    { name: "AI Knowledge Base", path: "/admin/knowledge", icon: <FiCpu /> },
  ];

  // FIXED: Added .toLowerCase() to ensure "Admin" and "admin" both work
  const navItems = role?.toLowerCase() === "admin" ? adminNav : staffNav;

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-100 shadow-[4px_0_24px_rgba(0,0,0,0.02)]
      transition-all duration-300 ease-in-out flex flex-col justify-between z-50
      ${collapsed ? "w-[88px]" : "w-[280px]"}`}
    >
      {/* Top Section: Logo & Nav */}
      <div>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-6 py-8`}>
          {!collapsed && (
            <img
              src={lakbayLogo}
              alt="Lakbay Lanao"
              className="h-9 object-contain"
            />
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-full hover:bg-blue-50 text-gray-400 hover:text-[#2563eb] transition-colors"
          >
            <FiMenu className="text-xl" />
          </button>
        </div>

        <nav className="mt-2 space-y-2 px-4">
          {navItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `relative group flex items-center gap-4 px-4 py-3.5 rounded-[16px] transition-all duration-200
                ${
                  isActive
                    ? "bg-blue-50 text-[#2563EB] font-bold shadow-sm"
                    : "text-gray-500 font-medium hover:text-[#2563EB] hover:bg-gray-50"
                }`
              }
            >
              <span className={`text-xl ${collapsed ? "mx-auto" : ""}`}>
                {item.icon}
              </span>

              {!collapsed && (
                <span className="text-sm tracking-wide">{item.name}</span>
              )}

              {collapsed && (
                <span
                  className="absolute left-[80px] whitespace-nowrap
                  bg-gray-800 text-white text-xs font-semibold px-3 py-2 rounded-lg
                  opacity-0 group-hover:opacity-100
                  translate-x-2 group-hover:translate-x-0
                  transition-all duration-200 pointer-events-none shadow-md z-50"
                >
                  {item.name}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Section: Profile */}
      <div className="p-4 relative">
        {/* Dropdown Menu */}
        {openProfile && !collapsed && (
          <div className="absolute bottom-[84px] left-4 right-4 bg-white border border-gray-100 rounded-[16px] shadow-[0_-4px_24px_rgba(0,0,0,0.06)] overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-5 py-4 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              <FiLogOut className="text-lg" />
              Sign Out
            </button>
          </div>
        )}

        <div
          onClick={() => !collapsed && setOpenProfile(!openProfile)}
          className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}
          rounded-[20px] bg-white border border-gray-100 shadow-sm
          ${!collapsed ? 'px-4 py-3 cursor-pointer hover:border-blue-200 hover:shadow-md' : 'py-4'}
          transition-all duration-300`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold text-lg flex-shrink-0 border border-blue-100">
              {name ? name.charAt(0).toUpperCase() : "U"}
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {name || "Loading..."}
                </p>
                <p className="text-xs text-gray-500 capitalize font-medium">
                  {role}
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <FiChevronDown
              className={`text-gray-400 transition-transform duration-300 ${
                openProfile ? "rotate-180 text-[#2563eb]" : ""
              }`}
            />
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;