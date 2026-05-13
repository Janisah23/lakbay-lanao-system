import React, { useEffect, useState, useMemo } from "react";
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

  // --- DYNAMIC SESSION PAIRING ENGINE ---
  const processedLogs = useMemo(() => {
    // Process logs from oldest to newest to build correct login/logout sessions
    const ascendingLogs = [...logs].reverse();
    const activeSessions = {};
    const pairedRecords = [];

    ascendingLogs.forEach((log) => {
      const actionLower = log.action?.toLowerCase() || "";
      const accountId = log.userId || log.userName || "system_generation";

      if (actionLower.includes("login")) {
        // If an account had a previous unmatched login record, push it out first
        if (activeSessions[accountId]) {
          pairedRecords.push(activeSessions[accountId]);
        }
        activeSessions[accountId] = log;
      } else if (actionLower.includes("logout")) {
        if (activeSessions[accountId]) {
          // Perfect match found: Merge login and logout onto one single line
          const loginEvent = activeSessions[accountId];
          pairedRecords.push({
            ...loginEvent,
            isSessionPair: true,
            logoutTimestamp: log.timestamp,
            logoutId: log.id,
            logoutAction: log.action,
          });
          delete activeSessions[accountId];
        } else {
          // Standalone logout found without a matching session history
          pairedRecords.push(log);
        }
      } else {
        // Normal CRUD or system event activity
        pairedRecords.push(log);
      }
    });

    // Flush out remaining active logins (Users currently online)
    Object.values(activeSessions).forEach((remainingLogin) => {
      pairedRecords.push(remainingLogin);
    });

    // Return records sorted back to descending order (newest activity at the top)
    return pairedRecords.sort((a, b) => {
      const timeA = a.logoutTimestamp ? a.logoutTimestamp.toDate().getTime() : (a.timestamp?.toDate().getTime() || 0);
      const timeB = b.logoutTimestamp ? b.logoutTimestamp.toDate().getTime() : (b.timestamp?.toDate().getTime() || 0);
      return timeB - timeA;
    });
  }, [logs]);

  const uniqueActions = [
    ...new Set(logs.map((log) => log.action).filter(Boolean)),
  ].sort();

  const uniqueUsers = [
    ...new Set(logs.map((log) => log.userName).filter(Boolean)),
  ].sort();

  const filteredLogs = processedLogs.filter((log) => {
    const actionText = log.isSessionPair ? "login logout authentication session" : (log.action || "");
    const matchesSearch =
      actionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetModule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesAction = true;
    if (filterAction) {
      if (log.isSessionPair) {
        matchesAction = filterAction.toLowerCase().includes("login") || filterAction.toLowerCase().includes("logout");
      } else {
        matchesAction = log.action === filterAction;
      }
    }

    const matchesUser = filterUser ? log.userName === filterUser : true;

    return matchesSearch && matchesAction && matchesUser;
  });

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
    // FIXED: Logout events are now categorized under red warnings along with destructive operations
    if (lowerAction.includes("logout") || lowerAction.includes("delete") || lowerAction.includes("remove") || lowerAction.includes("deactivate") || lowerAction.includes("error")) {
      return "bg-red-50 text-red-600 border-red-100";
    }
    if (lowerAction.includes("update") || lowerAction.includes("edit") || lowerAction.includes("reset")) {
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
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
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">System Logs</h1>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-gray-500">Monitor platform activity, account actions, and security events recorded across the system.</p>
        </section>

        {/* STATS */}
        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          <StatCard icon={<FiActivity />} label="Total Records" value={processedLogs.length} />
          <StatCard icon={<FiClock />} label="Activity Today" value={todayCount} />
        </section>

        {/* FILTERS */}
        <section className="mb-6 rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#2563eb]">Filter Logs</h2>
              <p className="mt-1 text-sm text-gray-500">Search by user, action, or module to review specific activity.</p>
            </div>
            {(searchTerm || filterAction || filterUser) && (
              <button onClick={() => { setSearchTerm(""); setFilterAction(""); setFilterUser(""); setCurrentPage(1); }} className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-red-100 bg-white px-4 py-2.5 text-sm font-medium text-red-500 shadow-sm transition hover:bg-red-50">
                <FiX /> Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative w-full">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
              <input type="text" placeholder="Search logs..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className={`${inputStyle} pl-11 pr-11`} />
            </div>
            <div className="relative w-full">
              <FiFilter className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
              <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }} className={`${inputStyle} cursor-pointer appearance-none pl-11`}>
                <option value="">All Actions</option>
                {uniqueActions.map((action, idx) => <option key={idx} value={action}>{action}</option>)}
              </select>
            </div>
            <div className="relative w-full">
              <FiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
              <select value={filterUser} onChange={(e) => { setFilterUser(e.target.value); setCurrentPage(1); }} className={`${inputStyle} cursor-pointer appearance-none pl-11`}>
                <option value="">All Users</option>
                {uniqueUsers.map((user, idx) => <option key={idx} value={user}>{user}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* DATA TABLE */}
        <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
          <div className="flex flex-col justify-between gap-3 border-b border-blue-50 bg-[#f8fbff] px-6 py-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#2563eb]">Audit Records</h2>
              <p className="mt-1 text-sm text-gray-500">Showing consolidated timeline and structural system logs.</p>
            </div>
            <span className="inline-flex w-fit rounded-full border border-blue-100 bg-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
              {filteredLogs.length} entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-12 gap-4 border-b border-blue-50 bg-white px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <span className="col-span-3">Timestamp / Duration</span>
                <span className="col-span-3">User</span>
                <span className="col-span-4">Action Performed</span>
                <span className="col-span-2 text-right">Target Module</span>
              </div>

              {paginatedLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#2563eb]">
                    <FiClipboard className="text-2xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700">No logs found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {paginatedLogs.map((log) => {
                    let logDate = "Unknown Date";
                    let logTime = "";
                    if (log.timestamp) {
                      const d = log.timestamp.toDate();
                      logDate = d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
                      logTime = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
                    }

                    let logoutTimeText = "";
                    if (log.isSessionPair && log.logoutTimestamp) {
                      logoutTimeText = log.logoutTimestamp.toDate().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
                    }

                    return (
                      <div key={log.id} className="grid grid-cols-12 items-center gap-4 border-b border-blue-50 px-8 py-5 text-sm transition duration-300 last:border-b-0 hover:bg-blue-50/50">
                        
                        {/* TIMESTAMP COLUMN */}
                        <div className="col-span-3 flex flex-col justify-center">
                          <span className="font-semibold text-gray-700">{logDate}</span>
                          <span className="mt-0.5 text-xs font-medium text-gray-500 flex items-center gap-1.5">
                            {logTime}
                            {log.isSessionPair && (
                              <span className="text-red-500 font-bold bg-red-50/60 px-1.5 py-0.5 rounded border border-red-100 text-[10px]">
                                Out: {logoutTimeText}
                              </span>
                            )}
                          </span>
                        </div>

                        {/* USER AVATAR COLUMN */}
                        <div className="col-span-3 flex min-w-0 items-center gap-3">
                          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
                            log.isSessionPair || log.action?.toLowerCase().includes("login")
                              ? "bg-amber-50 border-amber-100 text-amber-600 shadow-sm" 
                              : "bg-blue-50 border-blue-100 text-[#2563eb]"
                          }`}>
                            {log.isSessionPair || log.action?.toLowerCase().includes("login") ? (
                              <FiActivity className="text-lg" />
                            ) : (
                              <FiUser className="text-lg" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block truncate font-bold text-gray-800">{log.userName || "System"}</span>
                            <span className="mt-0.5 block truncate text-[11px] font-medium text-gray-400">{log.userId || "N/A"}</span>
                          </div>
                        </div>

                        {/* CONSOLIDATED BADGE COLUMN */}
                        <div className="col-span-4 flex items-center gap-2">
                          {log.isSessionPair ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold bg-green-50 text-green-600 border-green-100 shadow-sm">
                                Login
                              </span>
                              <span className="text-gray-300 font-light text-xs">→</span>
                              <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold bg-red-50 text-red-600 border-red-100 shadow-sm">
                                Logout
                              </span>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-bold capitalize shadow-sm ${getActionBadge(log.action)}`}>
                              {log.action || "Unknown Action"}
                            </span>
                          )}
                        </div>

                        {/* TARGET MODULE COLUMN */}
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

          {/* PAGINATION PANEL */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-blue-50 bg-[#f8fbff] px-6 py-5 sm:flex-row">
            <span className="text-sm font-medium text-gray-500">
              Showing <span className="font-semibold text-gray-700">{startIndex + 1}</span> to <span className="font-semibold text-gray-700">{Math.min(startIndex + logsPerPage, filteredLogs.length)}</span> of <span className="font-semibold text-gray-700">{filteredLogs.length}</span> entries
            </span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={handlePrevPage} disabled={currentPage === 1} className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition ${currentPage === 1 ? "cursor-not-allowed border-blue-50 bg-white text-gray-300" : "border-blue-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"}`}><FiChevronLeft className="text-lg" /></button>
              <span className="rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm">Page {currentPage} of {totalPages}</span>
              <button type="button" onClick={handleNextPage} disabled={currentPage === totalPages} className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition ${currentPage === totalPages ? "cursor-not-allowed border-blue-50 bg-white text-gray-300" : "border-blue-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"}`}><FiChevronRight className="text-lg" /></button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default SystemLogs;