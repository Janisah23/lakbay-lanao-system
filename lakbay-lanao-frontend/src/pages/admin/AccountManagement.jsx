import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  FiSearch,
  FiPlus,
  FiEye,
  FiEyeOff,
  FiKey,
  FiEdit2,
  FiX,
  FiUsers,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";
import { logAction } from "../../utils/logAction";

function AccountManagement() {
  const [staffCount, setStaffCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [editModal, setEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const [confirmModal, setConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [targetUser, setTargetUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      let staff = 0;
      let active = 0;
      let inactive = 0;
      let staffList = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        if (data.role === "staff") {
          staff++;
          staffList.push({ id: docSnap.id, ...data });
        }

        if (!data.status || data.status === "active") {
          active++;
        } else if (data.status === "inactive") {
          inactive++;
        }
      });

      setStaffCount(staff);
      setActiveCount(active);
      setInactiveCount(inactive);
      setStaffAccounts(staffList);
    });

    return () => unsubscribe();
  }, []);

  const filteredStaff = staffAccounts.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await updateDoc(doc(db, "users", userId), {
        status: newStatus,
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditModal(true);
  };

  const handleUpdateStaff = async () => {
    try {
      await updateDoc(doc(db, "users", selectedUser.id), {
        name: editName,
        email: editEmail,
      });
      setEditModal(false);
    } catch (error) {
      console.error("Error updating staff:", error);
    }
  };

  const openConfirm = (action, user) => {
    setConfirmAction(action);
    setTargetUser(user);
    setConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        alert("No authenticated admin found.");
        return;
      }

      const adminSnap = await getDoc(doc(db, "users", currentUser.uid));
      const adminData = adminSnap.exists() ? adminSnap.data() : null;

      if (confirmAction === "reset") {
        await sendPasswordResetEmail(auth, targetUser.email);
        await logAction({
          action: "Password Reset",
          userName: targetUser.name,
          performedBy: adminData?.name || "Unknown",
          role: adminData?.role || "admin",
        });
        alert("Password reset email sent.");
      }

      if (confirmAction === "deactivate") {
        await updateDoc(doc(db, "users", targetUser.id), {
          status: "inactive",
        });
        await logAction({
          action: "Staff Deactivated",
          userName: targetUser.name,
          performedBy: adminData?.name || "Unknown",
          role: adminData?.role || "admin",
        });
      }

      setConfirmModal(false);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCreateStaff = async () => {
    try {
      const response = await fetch("http://localhost:5000/create-staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setShowModal(false);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] rounded-2xl">
      <div className="max-w-7xl mx-auto pt-6 pb-20 px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-[#2563EB] tracking-tight">
              Account Management
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage staff access, roles, and system permissions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-[300px]">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-[12px] border border-gray-200 bg-white px-4 py-3 pl-11 pr-10 text-sm outline-none transition hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 shadow-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition"
                >
                  <FiX />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="rounded-full bg-[#2563eb] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md w-full sm:w-auto flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <FiPlus className="text-lg" />
              Create Account
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-2xl flex-shrink-0">
              <FiUsers />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                Total Staff
              </p>
              <h3 className="text-3xl font-extrabold text-[#2563eb]">{staffCount}</h3>
            </div>
          </div>

          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-2xl flex-shrink-0">
              <FiUserCheck />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                Active Accounts
              </p>
              <h3 className="text-3xl font-extrabold text-[#2563eb]">{activeCount}</h3>
            </div>
          </div>

          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-2xl flex-shrink-0">
              <FiUserX />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                Deactivated
              </p>
              <h3 className="text-3xl font-extrabold text-[#2563eb]">{inactiveCount}</h3>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <span className="col-span-4">User Details</span>
                <span className="col-span-3">Role</span>
                <span className="col-span-2 text-center">Status</span>
                <span className="col-span-3 text-right">Actions</span>
              </div>

              {filteredStaff.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#2563eb] mb-4">
                    <FiUsers className="text-2xl" />
                  </div>
                  <h3 className="text-gray-800 font-bold text-lg mb-1">No staff found</h3>
                  <p className="text-gray-500 text-sm">Try adjusting your search query.</p>
                </div>
              ) : (
                filteredStaff.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 text-sm border-b border-gray-50 items-center hover:bg-blue-50/30 transition-colors last:border-b-0 group"
                  >
                    <div className="col-span-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-[#2563eb] flex items-center justify-center font-bold text-base flex-shrink-0 shadow-sm border border-blue-200">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-gray-800 truncate block">
                          {user.name}
                        </span>
                        <span className="text-xs text-gray-500 truncate block mt-0.5">
                          {user.email}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-3 flex items-center">
                      <span className="capitalize font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full text-xs">
                        {user.role}
                      </span>
                    </div>

                    <div className="col-span-2 flex justify-center items-center">
                      <span
                        className={`capitalize px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider flex items-center gap-1.5 ${
                          user.status === "inactive"
                            ? "bg-red-50 text-red-600"
                            : "bg-green-50 text-green-600"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === "inactive" ? "bg-red-500" : "bg-green-500"
                          }`}
                        ></div>
                        {user.status || "active"}
                      </span>
                    </div>

                    <div className="col-span-3 flex items-center justify-end">
                      <div className="flex items-center bg-gray-50 border border-gray-100 rounded-full p-1 gap-1 shadow-sm">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-[#2563eb] hover:bg-white hover:shadow-sm rounded-full transition"
                          title="Edit Account"
                        >
                          <FiEdit2 className="text-[15px]" />
                        </button>

                        <div className="w-px h-4 bg-gray-200"></div>

                        <button
                          onClick={() => openConfirm("reset", user)}
                          className="p-2 text-[#2563eb] hover:bg-white hover:shadow-sm rounded-full transition"
                          title="Reset Password"
                        >
                          <FiKey className="text-[15px]" />
                        </button>

                        <div className="w-px h-4 bg-gray-200"></div>

                        <button
                          onClick={() => {
                            if (user.status === "inactive") {
                              toggleStatus(user.id, user.status);
                            } else {
                              openConfirm("deactivate", user);
                            }
                          }}
                          className="p-2 text-[#2563eb] hover:bg-white hover:shadow-sm rounded-full transition"
                          title={user.status === "inactive" ? "Activate" : "Deactivate"}
                        >
                          {user.status === "inactive" ? (
                            <FiEyeOff className="text-[15px]" />
                          ) : (
                            <FiEye className="text-[15px]" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-[28px] w-full max-w-md shadow-xl relative animate-fadeIn">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition"
              >
                <FiX className="text-lg" />
              </button>

              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-sm">
                  <FiPlus />
                </div>
                Create Staff Account
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Temporary Password
                  </label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-full bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateStaff}
                  disabled={!newName || !newEmail || !newPassword}
                  className="rounded-full bg-[#2563eb] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-[28px] w-full max-w-md shadow-xl relative animate-fadeIn">
              <button
                onClick={() => setEditModal(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition"
              >
                <FiX className="text-lg" />
              </button>

              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-[#2563eb] flex items-center justify-center text-sm">
                  <FiEdit2 />
                </div>
                Update Staff Profile
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setEditModal(false)}
                  className="rounded-full bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStaff}
                  disabled={!editName || !editEmail}
                  className="rounded-full bg-[#2563eb] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md disabled:bg-blue-300"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Modal */}
        {confirmModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-[28px] w-full max-w-sm shadow-xl text-center relative animate-fadeIn">
              <div
                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-5 ${
                  confirmAction === "reset"
                    ? "bg-blue-50 text-[#2563eb]"
                    : "bg-red-50 text-red-500"
                }`}
              >
                {confirmAction === "reset" ? (
                  <FiKey className="text-2xl" />
                ) : (
                  <FiEyeOff className="text-2xl" />
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {confirmAction === "reset" ? "Reset Password?" : "Deactivate Account?"}
              </h3>

              <p className="text-sm text-gray-500 mb-8 leading-relaxed px-4">
                {confirmAction === "reset" ? (
                  <>
                    An email will be sent to{" "}
                    <strong className="text-gray-700">{targetUser?.name}</strong> to
                    securely reset their password.
                  </>
                ) : (
                  <>
                    Are you sure you want to mark{" "}
                    <strong className="text-gray-700">{targetUser?.name}</strong> as
                    inactive? They will immediately lose access to the system.
                  </>
                )}
              </p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setConfirmModal(false)}
                  className="rounded-full bg-gray-100 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 transition w-full"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`rounded-full px-6 py-2.5 text-sm font-medium text-white shadow-sm transition w-full ${
                    confirmAction === "reset"
                      ? "bg-[#2563eb] hover:bg-blue-700"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AccountManagement;