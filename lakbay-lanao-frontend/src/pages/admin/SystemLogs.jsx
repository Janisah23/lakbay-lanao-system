import React, { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase/config";
import {
  FiSearch,
  FiX,
  FiClipboard,
  FiActivity,
  FiClock,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
  FiLayers,
} from "react-icons/fi";

function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [todayCount, setTodayCount] = useState(0);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterUser, setFilterUser] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  useEffect(() => {
    const q = query(collection(db, "logs"), orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLogs(logList);

      const today = new Date().toDateString();
      const todayLogs = logList.filter((log) => {
        if (!log.timestamp) return false;
        return log.timestamp.toDate().toDateString() === today;
      });
      setTodayCount(todayLogs.length);
    });

    return () => unsubscribe();
  }, []);

  // Extract unique values for dropdowns
  const uniqueActions = [...new Set(logs.map((log) => log.action).filter(Boolean))].sort();
  const uniqueUsers = [...new Set(logs.map((log) => log.userName).filter(Boolean))].sort();

  // Apply Filters
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetModule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction ? log.action === filterAction : true;
    const matchesUser = filterUser ? log.userName === filterUser : true;

    return matchesSearch && matchesAction && matchesUser;
  });

  // Calculate Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));
  const startIndex = (currentPage - 1) * logsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + logsPerPage);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const getActionBadge = (action = "") => {
    const lowerAction = action.toLowerCase();

    if (lowerAction.includes("login") || lowerAction.includes("active") || lowerAction.includes("publish")) {
      return "bg-green-50 text-green-600 border-green-100";
    }
    if (lowerAction.includes("delete") || lowerAction.includes("remove") || lowerAction.includes("deactivate") || lowerAction.includes("error")) {
      return "bg-red-50 text-red-600 border-red-100";
    }
    if (lowerAction.includes("update") || lowerAction.includes("edit") || lowerAction.includes("reset")) {
      return "bg-yellow-50 text-yellow-600 border-yellow-100";
    }
    if (lowerAction.includes("add") || lowerAction.includes("create")) {
      return "bg-blue-50 text-[#2563EB] border-blue-100";
    }
    return "bg-gray-50 text-gray-600 border-gray-200";
  };

  return (
        <div className="w-full">
          <div className="max-w-7xl mx-auto pt-10 pb-20 px-6 lg:px-10">       
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[#2563eb] tracking-tight">
            System Logs
          </h1>
          <p className="text-gray-500 mt-2">
            Platform activity monitoring and security audit trail.
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition duration-300">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center text-2xl flex-shrink-0">
              <FiActivity />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                Total Logs
              </p>
              <h3 className="text-3xl font-extrabold text-[#2563EB]">
                {logs.length}
              </h3>
            </div>
          </div>

          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition duration-300">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center text-2xl flex-shrink-0">
              <FiClock />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                Activity Today
              </p>
              <h3 className="text-3xl font-extrabold text-[#2563EB]">
                {todayCount}
              </h3>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Search Bar */}
          <div className="relative w-full">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Fix: Reset page directly in handler
              }}
              className="w-full rounded-[12px] border border-gray-200 bg-white px-4 py-3 pl-11 pr-10 text-sm outline-none transition hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1); // Fix: Reset page directly in handler
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition p-1"
              >
                <FiX className="text-base" />
              </button>
            )}
          </div>

          {/* Action Filter */}
          <div className="relative w-full">
            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
            <select
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setCurrentPage(1); // Fix: Reset page directly in handler
              }}
              className="w-full rounded-[12px] border border-gray-200 bg-white pl-11 pr-4 py-3 text-sm outline-none transition hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer"
            >
              <option value="">All Actions</option>
              {uniqueActions.map((action, idx) => (
                <option key={idx} value={action}>{action}</option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div className="relative w-full">
            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
            <select
              value={filterUser}
              onChange={(e) => {
                setFilterUser(e.target.value);
                setCurrentPage(1); // Fix: Reset page directly in handler
              }}
              className="w-full rounded-[12px] border border-gray-200 bg-white pl-11 pr-4 py-3 text-sm outline-none transition hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 appearance-none cursor-pointer"
            >
              <option value="">All Users</option>
              {uniqueUsers.map((user, idx) => (
                <option key={idx} value={user}>{user}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Audit Table Panel */}
        <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm overflow-hidden flex flex-col transition duration-300 hover:shadow-md">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-8 py-5 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span className="col-span-3">Timestamp</span>
                <span className="col-span-3">User ID/Name</span>
                <span className="col-span-4">Action Performed</span>
                <span className="col-span-2 text-right">Target Module</span>
              </div>

              {/* Table Body */}
              {paginatedLogs.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#2563EB] mb-4 shadow-sm">
                    <FiClipboard className="text-2xl" />
                  </div>
                  <h3 className="text-gray-800 font-bold text-lg mb-1">No logs found</h3>
                  <p className="text-gray-500 text-sm">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {paginatedLogs.map((log) => {
                    let logDate = "Unknown Date";
                    let logTime = "";

                    if (log.timestamp) {
                      const d = log.timestamp.toDate();
                      logDate = d.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });
                      logTime = d.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      });
                    }

                    return (
                      <div
                        key={log.id}
                        className="grid grid-cols-12 gap-4 px-8 py-5 text-sm border-b border-gray-50 items-center hover:bg-blue-50/40 transition-colors last:border-b-0"
                      >
                        {/* Timestamp */}
                        <div className="col-span-3 flex flex-col justify-center">
                          <span className="font-semibold text-gray-800">{logDate}</span>
                          <span className="text-xs text-gray-500 font-medium mt-0.5">
                            {logTime}
                          </span>
                        </div>

                        {/* User */}
                        <div className="col-span-3 flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-100">
                            <FiUser />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-gray-900 truncate">
                              {log.userName || "System"}
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                              {log.userId || "N/A"}
                            </span>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="col-span-4 flex items-center">
                          <span
                            className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${getActionBadge(
                              log.action
                            )}`}
                          >
                            {log.action || "Unknown Action"}
                          </span>
                        </div>

                        {/* Target Module */}
                        <div className="col-span-2 flex justify-end items-center">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-xs font-bold text-gray-600 shadow-sm capitalize">
                            <FiLayers className="text-gray-400" />
                            {log.targetModule || log.module || "System"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Pagination Controls */}
          {filteredLogs.length > 0 && (
            <div className="px-8 py-5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
              <span className="text-sm font-medium text-gray-500">
                Showing <span className="font-bold text-gray-800">{startIndex + 1}</span> to <span className="font-bold text-gray-800">{Math.min(startIndex + logsPerPage, filteredLogs.length)}</span> of <span className="font-bold text-gray-800">{filteredLogs.length}</span> entries
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all shadow-sm ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] hover:border-[#2563eb]"
                  }`}
                >
                  <FiChevronLeft className="text-lg" />
                </button>
                <span className="text-sm font-bold text-gray-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`flex items-center justify-center w-10 h-10 rounded-full transition-all shadow-sm ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:text-[#2563eb] hover:border-[#2563eb]"
                  }`}
                >
                  <FiChevronRight className="text-lg" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default SystemLogs;