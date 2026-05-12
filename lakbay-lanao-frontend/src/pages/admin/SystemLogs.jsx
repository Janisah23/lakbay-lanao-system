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

  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterUser, setFilterUser] = useState("");

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

  const uniqueActions = [
    ...new Set(logs.map((log) => log.action).filter(Boolean)),
  ].sort();

  const uniqueUsers = [
    ...new Set(logs.map((log) => log.userName).filter(Boolean)),
  ].sort();

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

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));
  const startIndex = (currentPage - 1) * logsPerPage;

  const paginatedLogs = filteredLogs.slice(
    startIndex,
    startIndex + logsPerPage
  );

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const getActionBadge = (action = "") => {
    const lowerAction = action.toLowerCase();

    if (
      lowerAction.includes("login") ||
      lowerAction.includes("logout") ||
      lowerAction.includes("active") ||
      lowerAction.includes("publish")
    ) {
      return "bg-green-50 text-green-600 border-green-100";
    }

    if (
      lowerAction.includes("delete") ||
      lowerAction.includes("remove") ||
      lowerAction.includes("deactivate") ||
      lowerAction.includes("error")
    ) {
      return "bg-red-50 text-red-600 border-red-100";
    }

    if (
      lowerAction.includes("update") ||
      lowerAction.includes("edit") ||
      lowerAction.includes("reset")
    ) {
      return "bg-amber-50 text-amber-600 border-amber-100";
    }

    if (lowerAction.includes("add") || lowerAction.includes("create")) {
      return "bg-blue-50 text-[#2563eb] border-blue-100";
    }

    return "bg-gray-50 text-gray-600 border-gray-200";
  };

  const inputStyle =
    "w-full rounded-[18px] border border-blue-100 bg-white px-4 py-3 text-sm font-medium text-gray-600 outline-none shadow-sm transition duration-300 placeholder:text-gray-400 hover:border-[#2563eb]/40 hover:bg-blue-50/40 focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100";

  const StatCard = ({ icon, label, value }) => (
    <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(37,99,235,0.08)]">
      <div className="flex items-center gap-5">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-2xl text-[#2563eb]">
          {icon}
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {label}
          </p>

          <h3 className="mt-1 text-3xl font-bold text-[#2563eb]">{value}</h3>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#f8fbff] font-['Poppins']">
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10 lg:px-10">
        {/* HEADER */}
        <section className="mb-10">
          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
            Audit Trail
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
            System Logs
          </h1>

          <p className="mt-2 max-w-2xl text-base leading-relaxed text-gray-500">
            Monitor platform activity, account actions, and security events
            recorded across the system.
          </p>
        </section>

        {/* KPI CARDS */}
        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <StatCard
            icon={<FiActivity />}
            label="Total Logs"
            value={logs.length}
          />

          <StatCard
            icon={<FiClock />}
            label="Activity Today"
            value={todayCount}
          />
        </section>

        {/* FILTERS */}
        <section className="mb-6 rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#2563eb]">
                Filter Logs
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Search by user, action, or module to review specific activity.
              </p>
            </div>

            {(searchTerm || filterAction || filterUser) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setFilterAction("");
                  setFilterUser("");
                  setCurrentPage(1);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-red-100 bg-white px-4 py-2.5 text-sm font-medium text-red-500 shadow-sm transition hover:bg-red-50"
              >
                <FiX />
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative w-full">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />

              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className={`${inputStyle} pl-11 pr-11`}
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  <FiX className="text-base" />
                </button>
              )}
            </div>

            <div className="relative w-full">
              <FiFilter className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />

              <select
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value);
                  setCurrentPage(1);
                }}
                className={`${inputStyle} cursor-pointer appearance-none pl-11`}
              >
                <option value="">All Actions</option>
                {uniqueActions.map((action, idx) => (
                  <option key={idx} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full">
              <FiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />

              <select
                value={filterUser}
                onChange={(e) => {
                  setFilterUser(e.target.value);
                  setCurrentPage(1);
                }}
                className={`${inputStyle} cursor-pointer appearance-none pl-11`}
              >
                <option value="">All Users</option>
                {uniqueUsers.map((user, idx) => (
                  <option key={idx} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* TABLE PANEL */}
        <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
          <div className="flex flex-col justify-between gap-3 border-b border-blue-50 bg-[#f8fbff] px-6 py-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#2563eb]">
                Audit Records
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Showing real-time activity logs from the system.
              </p>
            </div>

            <span className="inline-flex w-fit rounded-full border border-blue-100 bg-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
              {filteredLogs.length} entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-12 gap-4 border-b border-blue-50 bg-white px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <span className="col-span-3">Timestamp</span>
                <span className="col-span-3">User</span>
                <span className="col-span-4">Action Performed</span>
                <span className="col-span-2 text-right">Target Module</span>
              </div>

              {paginatedLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#2563eb]">
                    <FiClipboard className="text-2xl" />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-700">
                    No logs found
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
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
                        className="grid grid-cols-12 items-center gap-4 border-b border-blue-50 px-8 py-5 text-sm transition duration-300 last:border-b-0 hover:bg-blue-50/50"
                      >
                        <div className="col-span-3 flex flex-col justify-center">
                          <span className="font-semibold text-gray-700">
                            {logDate}
                          </span>

                          <span className="mt-0.5 text-xs font-medium text-gray-500">
                            {logTime || "No time"}
                          </span>
                        </div>

                        <div className="col-span-3 flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#2563eb]">
                            <FiUser />
                          </div>

                          <div className="min-w-0">
                            <span className="block truncate font-semibold text-gray-700">
                              {log.userName || "System"}
                            </span>

                            <span className="mt-0.5 block truncate text-xs text-gray-500">
                              {log.userId || "N/A"}
                            </span>
                          </div>
                        </div>

                        <div className="col-span-4 flex items-center">
                          <span
                            className={`inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-bold capitalize shadow-sm ${getActionBadge(
                              log.action
                            )}`}
                          >
                            {log.action || "Unknown Action"}
                          </span>
                        </div>

                        <div className="col-span-2 flex justify-end">
                          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-[#f8fbff] px-3 py-1.5 text-xs font-semibold capitalize text-gray-600">
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

          {/* PAGINATION */}
          {filteredLogs.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-blue-50 bg-[#f8fbff] px-6 py-5 sm:flex-row">
              <span className="text-sm font-medium text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-700">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-gray-700">
                  {Math.min(startIndex + logsPerPage, filteredLogs.length)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-700">
                  {filteredLogs.length}
                </span>{" "}
                entries
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition ${
                    currentPage === 1
                      ? "cursor-not-allowed border-blue-50 bg-white text-gray-300"
                      : "border-blue-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
                  }`}
                >
                  <FiChevronLeft className="text-lg" />
                </button>

                <span className="rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition ${
                    currentPage === totalPages
                      ? "cursor-not-allowed border-blue-50 bg-white text-gray-300"
                      : "border-blue-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
                  }`}
                >
                  <FiChevronRight className="text-lg" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default SystemLogs;