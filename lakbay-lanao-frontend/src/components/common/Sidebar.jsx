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
  FiHome,
} from "react-icons/fi";

import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import lakbayLogo from "../../assets/lakbay-logos.png";

function Sidebar({ role, name, collapsed, setCollapsed }) {
  const [openProfile, setOpenProfile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setCollapsed(true);
  }, [setCollapsed]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  const staffNav = [
    { name: "Dashboard", path: "/staff/dashboard", icon: <FiHome /> },
    { name: "Manage Tourism Data", path: "/staff/manage", icon: <FiFolder /> },
    {
      name: "Manage Tourism Content",
      path: "/staff/content",
      icon: <FiFileText />,
    },
    { name: "Manage Gallery", path: "/staff/gallery", icon: <FiFolder /> },
    { name: "Ratings & Reviews", path: "/staff/feedback", icon: <FiStar /> },
  ];

  const adminNav = [
    { name: "Dashboard", path: "/admin/dashboard", icon: <FiHome /> },
    { name: "Account Management", path: "/admin/accounts", icon: <FiUsers /> },
    {
      name: "Analytics & Ratings",
      path: "/admin/ratings",
      icon: <FiBarChart2 />,
    },
    { name: "System Logs", path: "/admin/logs", icon: <FiClipboard /> },
    { name: "AI Knowledge Base", path: "/admin/knowledge", icon: <FiCpu /> },
  ];

  const navItems = role?.toLowerCase() === "admin" ? adminNav : staffNav;

  const displayName = name || "Loading...";
  const displayRole = role || "User";
  const displayInitial = displayName?.charAt(0)?.toUpperCase() || "U";

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col justify-between border-r border-blue-100/80 bg-[#f4f9ff] font-['Poppins'] shadow-[6px_0_24px_rgba(37,99,235,0.06)] transition-all duration-300 ease-in-out ${
        collapsed ? "w-[92px]" : "w-[286px]"
      }`}
    >
      {/* TOP SECTION */}
      <div className="min-h-0 flex-1">
        {/* LOGO */}
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          } px-5 py-6`}
        >
          {!collapsed && (
            <div className="flex items-center gap-3.5">
              <img
                src={lakbayLogo}
                alt="Lakbay Lanao"
                className="h-14 w-14 object-contain"
              />

              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold leading-tight text-[#2563eb]">
                  Lakbay Lanao
                </h1>

                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Tourism System
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setCollapsed(!collapsed);
              setOpenProfile(false);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-white text-gray-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#2563eb]"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <FiMenu className="text-2xl" />
          </button>
        </div>

        {/* COLLAPSED LOGO */}
        {collapsed && (
          <div className="mb-5 flex justify-center">
            <img
              src={lakbayLogo}
              alt="Lakbay Lanao"
              className="h-14 w-14 object-contain"
            />
          </div>
        )}

        {/* NAVIGATION */}
        <nav className="mt-3 space-y-2 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setOpenProfile(false)}
              className={({ isActive }) =>
                `group relative flex items-center gap-4 rounded-[18px] px-4 py-3.5 text-sm transition-all duration-300 ${
                  collapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "border border-blue-100 bg-white font-bold text-[#2563eb] shadow-[0_8px_24px_rgba(37,99,235,0.07)]"
                    : "font-semibold text-gray-500 hover:border hover:border-blue-100 hover:bg-blue-50/70 hover:text-[#2563eb] hover:shadow-[0_8px_20px_rgba(37,99,235,0.04)]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !collapsed && (
                    <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-[#2563eb]" />
                  )}

                  <span
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[22px] transition ${
                      isActive
                        ? "bg-blue-50 text-[#2563eb]"
                        : "text-gray-400 group-hover:bg-white/80 group-hover:text-[#2563eb]"
                    }`}
                  >
                    {item.icon}
                  </span>

                  {!collapsed && (
                    <span className="truncate tracking-wide">{item.name}</span>
                  )}

                  {collapsed && (
                    <span className="pointer-events-none absolute left-[82px] z-50 whitespace-nowrap rounded-[14px] border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-gray-700 opacity-0 shadow-[0_14px_35px_rgba(37,99,235,0.10)] transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100">
                      {item.name}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* BOTTOM PROFILE / DROPDOWN */}
      <div className="relative p-4">
        {openProfile && !collapsed && (
          <div className="absolute bottom-[92px] left-4 right-4 z-50 overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_14px_35px_rgba(37,99,235,0.10)]">
            <div className="bg-blue-50/70 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-base font-bold text-[#2563eb] shadow-sm">
                  {displayInitial}
                </div>

                <div className="min-w-0">
                  <h4 className="truncate text-sm font-semibold text-gray-700">
                    {displayName}
                  </h4>

                  <span className="mt-1 inline-flex rounded-full border border-blue-100 bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#2563eb]">
                    {displayRole}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-1.5">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-[16px] px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50"
              >
                <FiLogOut className="text-lg text-red-500" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {collapsed ? (
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-[22px] border border-blue-100 bg-white py-4 text-gray-500 shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition hover:bg-red-50 hover:text-red-500"
            title="Logout"
          >
            <FiLogOut className="text-2xl" />
          </button>
        ) : (
          <div
            onClick={() => setOpenProfile((prev) => !prev)}
            className="flex cursor-pointer items-center justify-between rounded-[24px] border border-blue-100 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition hover:border-blue-200 hover:bg-blue-50/70"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-base font-bold text-[#2563eb] ring-1 ring-blue-100">
                {displayInitial}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-700">
                  {displayName}
                </p>

                <p className="text-xs font-medium capitalize text-gray-500">
                  {displayRole}
                </p>
              </div>
            </div>

            <FiChevronDown
              className={`flex-shrink-0 text-gray-400 transition-transform duration-300 ${
                openProfile ? "rotate-180 text-[#2563eb]" : ""
              }`}
            />
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;