import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase/config";
import { 
  FiSearch, FiX, FiClipboard, FiActivity, 
  FiClock, FiUser, FiMonitor
} from "react-icons/fi";

function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Derived Stats
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    // Note: For a production app with thousands of logs, you might want to add limit(100) to this query
    const q = query(
      collection(db, "logs"), // Or "systemLogs" depending on your actual DB naming
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLogs(logList);

      // Calculate today's logs
      const today = new Date().toDateString();
      const todayLogs = logList.filter(log => {
        if (!log.timestamp) return false;
        return log.timestamp.toDate().toDateString() === today;
      });
      setTodayCount(todayLogs.length);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter((log) =>
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.ipAddress?.includes(searchTerm)
  );

  // Helper function to color-code log actions
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
      return "bg-blue-50 text-[#3B82F6] border-blue-100";
    }
    
    return "bg-gray-50 text-gray-600 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] p-4 md:p-8 font-sans text-gray-800 rounded-2xl">
      
      {/* ── HEADER ── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#2563EB] tracking-tight flex items-center gap-2">
             <span className="text-[#2563EB]">System Logs</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">Platform activity monitoring and security audit trail.</p>
        </div>
      </div>

      {/* ── KPI STATS (All Blue Icons) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center text-2xl flex-shrink-0">
            <FiActivity />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Logs</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{logs.length}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center text-2xl flex-shrink-0">
            <FiClock />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Activity Today</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{todayCount}</h3>
          </div>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="mb-6 flex">
        <div className="relative w-full max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search by action, user, or IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-full pl-11 pr-10 py-3 text-sm outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-blue-100 shadow-sm transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition p-1"
            >
              <FiX className="text-base" />
            </button>
          )}
        </div>
      </div>

      {/* ── LOGS TABLE ── */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span className="col-span-4">Action</span>
              <span className="col-span-3">User</span>
              <span className="col-span-3">Timestamp</span>
              <span className="col-span-2 text-right">IP Address</span>
            </div>

            {/* Empty State */}
            {filteredLogs.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#3B82F6] mb-4">
                  <FiClipboard className="text-2xl" />
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-1">No logs found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your search criteria.</p>
              </div>
            ) : (
              /* Table Body */
              <div className="max-h-[600px] overflow-y-auto">
                {filteredLogs.map((log) => {
                  // Format Timestamp safely
                  let logDate = "Unknown Date";
                  let logTime = "";
                  if (log.timestamp) {
                    const d = log.timestamp.toDate();
                    logDate = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
                    logTime = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  }

                  return (
                    <div
                      key={log.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 text-sm border-b border-gray-50 items-center hover:bg-blue-50/30 transition-colors last:border-b-0"
                    >
                      {/* Action Column with Smart Badges */}
                      <div className="col-span-4">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${getActionBadge(log.action)}`}>
                          {log.action || "Unknown Action"}
                        </span>
                      </div>

                      {/* User Column with Blue Avatar */}
                      <div className="col-span-3 flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#3B82F6] flex items-center justify-center flex-shrink-0">
                          <FiUser />
                        </div>
                        <span className="font-semibold text-gray-900 truncate">
                          {log.userName || "System"}
                        </span>
                      </div>

                      {/* Timestamp Column */}
                      <div className="col-span-3 flex flex-col justify-center">
                        <span className="font-medium text-gray-900">{logDate}</span>
                        <span className="text-xs text-gray-500 font-medium">{logTime}</span>
                      </div>

                      {/* IP Address Column with Blue Icon */}
                      <div className="col-span-2 flex justify-end items-center">
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50/50 border border-blue-100 rounded-md font-mono text-[11px] text-gray-600">
                          <FiMonitor className="text-[#3B82F6]" />
                          {log.ipAddress || "N/A"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default SystemLogs;