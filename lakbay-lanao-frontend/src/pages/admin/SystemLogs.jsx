import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase/config";
import { FiSearch, FiRefreshCw } from "react-icons/fi";

function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "logs"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLogs(logList);
    });

    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter((log) =>
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <h2 className="text-2xl font-semibold text-[#2563EB]">
        System Logs
      </h2>

      <p className="text-gray-500 text-sm mt-2">
        Activity monitoring and audit trail
      </p>

      {/* Search */}
      <div className="flex items-center gap-4 mt-8">
        <div className="flex items-center bg-white px-5 py-3 rounded-full shadow-sm border w-[420px]">
          <input
            type="text"
            placeholder="Search logs by action or user"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <div className="bg-[#2563EB] text-white p-2 rounded-full">
            <FiSearch />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="mt-10 bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="grid grid-cols-4 px-6 py-4 text-sm font-medium border-b">
          <span>Action</span>
          <span>User</span>
          <span>Timestamp</span>
          <span>IP Address</span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            No logs found
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="grid grid-cols-4 px-6 py-4 text-sm border-b"
            >
              <span>{log.action}</span>
              <span>{log.userName}</span>
              <span>
                {log.timestamp?.toDate().toLocaleString()}
              </span>
              <span>{log.ipAddress || "N/A"}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default SystemLogs;