import {
  FiFolder,
  FiFileText,
  FiStar,
  FiUsers,
  FiClipboard,
  FiMenu,
  FiChevronDown,
  FiLogOut
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
    { name: "Manage Tourism Data", path: "/staff/manage", icon: <FiFolder /> },
    { name: "Tourism Content", path: "/staff/content", icon: <FiFileText /> },
    { name: "Feedback & Ratings", path: "/staff/feedback", icon: <FiStar /> }
  ];

  const adminNav = [
    { name: "Account Management", path: "/admin/accounts", icon: <FiUsers /> },
    { name: "Ratings Summary", path: "/admin/ratings", icon: <FiStar /> },
    { name: "System Logs", path: "/admin/logs", icon: <FiClipboard /> }
  ];

  const navItems = role === "admin" ? adminNav : staffNav;

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200
      transition-all duration-300 ease-in-out flex flex-col justify-between
      ${collapsed ? "w-[80px]" : "w-[260px]"}`}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between px-5 py-6">
          {!collapsed && (
            <img
              src={lakbayLogo}
              alt=""
              className="h-9 object-contain"
            />
          )}

          <FiMenu
            className="text-xl text-[#2563EB] cursor-pointer"
            onClick={() => setCollapsed(!collapsed)}
          />
        </div>

        {/* Navigation */}
        <nav className="mt-6 space-y-6 px-4 text-sm">
          {navItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `relative group flex items-center gap-3 px-3 py-2 rounded-lg transition-all
                ${
                  isActive
                    ? "text-[#2563EB] font-medium bg-blue-50"
                    : "text-gray-500 hover:text-[#2563EB] hover:bg-gray-100"
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>

              {!collapsed && <span>{item.name}</span>}

              {collapsed && (
                <span
                  className="absolute left-[70px] whitespace-nowrap
                  bg-gray-900 text-white text-xs px-3 py-1 rounded-md
                  opacity-0 group-hover:opacity-100
                  translate-x-2 group-hover:translate-x-0
                  transition-all duration-200 pointer-events-none shadow-lg"
                >
                  {item.name}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Profile Section */}
      {!collapsed && (
        <div className="p-4 relative">
          <div
            onClick={() => setOpenProfile(!openProfile)}
            className="flex items-center justify-between border border-blue-200 rounded-xl px-4 py-3 shadow-sm cursor-pointer hover:bg-blue-50 transition"
          >
            <div className="flex items-center gap-3">
              {/* Avatar Circle */}
              <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-semibold">
                {name ? name.charAt(0).toUpperCase() : "U"}
              </div>

              <div>
                <p className="text-sm font-semibold">
                  {name || "Loading..."}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {role}
                </p>
              </div>
            </div>

            {/* Arrow */}
            <FiChevronDown
              className={`transition-transform duration-300 ${
                openProfile ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Dropdown */}
          {openProfile && (
            <div className="absolute bottom-20 left-0 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-2 overflow-hidden animate-fadeIn">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <FiLogOut />
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

export default Sidebar;