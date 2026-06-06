import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
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
  FiAlertCircle,
} from "react-icons/fi";
import { logAction } from "../../utils/logAction";

function AccountManagement() {
  const [staffCount, setStaffCount] = useState(0);
  const [touristCount, setTouristCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Create Modal States
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Edit Modal States (Email omitted)
  const [editModal, setEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editName, setEditName] = useState("");

  // Confirm Modal States
  const [confirmModal, setConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [targetUser, setTargetUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      let staff = 0;
      let tourists = 0;
      let active = 0;
      let inactive = 0;
      const staffList = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        if (data.role === "staff") {
          staff++;
          staffList.push({ id: docSnap.id, ...data });
        } else if (data.role === "tourist" || !data.role) {
          // Count users explicitly marked as tourists, or fallback users with no assigned role
          tourists++;
        }

        if (!data.status || data.status === "active") {
          active++;
        } else if (data.status === "inactive") {
          inactive++;
        }
      });

      setStaffCount(staff);
      setTouristCount(tourists);
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

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditName(user.name || "");
    setEditModal(true);
  };

  const handleUpdateStaff = async () => {
    try {
      await updateDoc(doc(db, "users", selectedUser.id), {
        name: editName,
      });

      setEditModal(false);
    } catch (error) {
      console.error("Error updating staff:", error);
      alert("Failed to update staff. Check Firestore permissions.");
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

      if (confirmAction === "activate") {
        await updateDoc(doc(db, "users", targetUser.id), {
          status: "active",
        });

        await logAction({
          action: "Staff Activated",
          userName: targetUser.name,
          performedBy: adminData?.name || "Unknown",
          role: adminData?.role || "admin",
        });
      }

      setConfirmModal(false);
    } catch (error) {
      console.error("Action error:", error);
      alert(`Action failed: ${error.message}`);
    }
  };

  const handleCreateStaff = async () => {
    try {
      const response = await fetch("https://lakbay-lanao-backend.onrender.com/create-staff", {
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

  const inputStyle =
    "w-full rounded-[14px] border border-blue-100 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition duration-300 placeholder:text-gray-400 hover:border-[#2563eb]/40 focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100";

  const primaryBtnStyle =
    "inline-flex items-center justify-center gap-2 rounded-full bg-[#2563eb] px-6 py-3 text-sm font-medium text-white shadow-sm transition duration-300 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300";

  const secondaryBtnStyle =
    "inline-flex items-center justify-center gap-2 rounded-full border border-[#2563eb]/20 bg-white px-6 py-3 text-sm font-medium text-[#2563eb] shadow-sm transition duration-300 hover:bg-blue-50";

  const dangerBtnStyle =
    "inline-flex items-center justify-center gap-2 rounded-full bg-red-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition duration-300 hover:bg-red-600";

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
        {/* Header */}
        <section className="mb-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
                Admin Panel
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
                Account Management
              </h1>

              <p className="mt-2 max-w-2xl text-base leading-relaxed text-gray-500">
                Manage staff access, reset passwords, update account details,
                and control staff account status.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className={primaryBtnStyle}
            >
              <FiPlus className="text-lg" />
              Create Account
            </button>
          </div>
        </section>

        {/* KPI Cards */}
        <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<FiUsers />} label="Total Staff" value={staffCount} />
          <StatCard icon={<FiUsers />} label="Total Tourists" value={touristCount} />
          <StatCard
            icon={<FiUserCheck />}
            label="Active Accounts"
            value={activeCount}
          />
          <StatCard
            icon={<FiUserX />}
            label="Deactivated"
            value={inactiveCount}
          />
        </section>

        {/* Toolbar */}
        <section className="mb-6 rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#2563eb]">
                Staff Accounts
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Search, update, reset password, activate, or deactivate staff
                accounts.
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />

              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputStyle} pl-11 pr-11`}
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-red-500"
                >
                  <FiX />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-12 gap-4 border-b border-blue-50 bg-[#f8fbff] px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <span className="col-span-4">User Details</span>
                <span className="col-span-3">Role</span>
                <span className="col-span-2 text-center">Status</span>
                <span className="col-span-3 text-right">Actions</span>
              </div>

              {filteredStaff.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
                    <FiUsers className="text-2xl" />
                  </div>

                  <h3 className="text-lg font-bold text-gray-800">
                    No staff found
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search or create a new staff account.
                  </p>
                </div>
              ) : (
                filteredStaff.map((user) => {
                  const isInactive = user.status === "inactive";

                  return (
                    <div
                      key={user.id}
                      className="group grid grid-cols-12 items-center gap-4 border-b border-blue-50 px-8 py-5 text-sm transition duration-300 last:border-b-0 hover:bg-[#f8fbff]"
                    >
                      <div className="col-span-4 flex items-center gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-lg font-bold text-[#2563eb]">
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>

                        <div className="min-w-0">
                          <span className="block truncate text-base font-bold text-gray-800 transition group-hover:text-[#2563eb]">
                            {user.name || "Unnamed Staff"}
                          </span>

                          <span className="mt-0.5 block truncate text-xs text-gray-500">
                            {user.email || "No email"}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-3">
                        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#2563eb]">
                          {user.role || "staff"}
                        </span>
                      </div>

                      <div className="col-span-2 flex justify-center">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${
                            isInactive
                              ? "border-red-100 bg-red-50 text-red-600"
                              : "border-green-100 bg-green-50 text-green-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isInactive ? "bg-red-500" : "bg-green-500"
                            }`}
                          />
                          {user.status || "active"}
                        </span>
                      </div>

                      <div className="col-span-3 flex justify-end">
                        <div className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-white p-1 shadow-sm">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="rounded-full p-2.5 text-gray-500 transition hover:bg-blue-50 hover:text-[#2563eb]"
                            title="Edit Account"
                          >
                            <FiEdit2 className="text-[15px]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => openConfirm("reset", user)}
                            className="rounded-full p-2.5 text-gray-500 transition hover:bg-blue-50 hover:text-[#2563eb]"
                            title="Reset Password"
                          >
                            <FiKey className="text-[15px]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (isInactive) {
                                openConfirm("activate", user);
                              } else {
                                openConfirm("deactivate", user);
                              }
                            }}
                            className={`rounded-full p-2.5 transition ${
                              isInactive
                                ? "text-green-500 hover:bg-green-50"
                                : "text-red-500 hover:bg-red-50"
                            }`}
                            title={
                              isInactive
                                ? "Activate Account"
                                : "Deactivate Account"
                            }
                          >
                            {isInactive ? (
                              <FiEye className="text-[15px]" />
                            ) : (
                              <FiEyeOff className="text-[15px]" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Create Staff Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
            <div className="relative w-full max-w-md rounded-[28px] border border-blue-100 bg-white p-7 shadow-[0_14px_35px_rgba(37,99,235,0.10)]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-gray-400 transition hover:text-[#2563eb]"
              >
                <FiX className="text-lg" />
              </button>

              <div className="mb-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
                  <FiPlus className="text-xl" />
                </div>

                <h3 className="text-2xl font-bold text-[#2563eb]">
                  Create Staff Account
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Add a new staff member and provide a temporary password.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Full Name
                  </label>

                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className={inputStyle}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Email Address
                  </label>

                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className={inputStyle}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Temporary Password
                  </label>

                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-blue-50 pt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={secondaryBtnStyle}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCreateStaff}
                  disabled={!newName || !newEmail || !newPassword}
                  className={primaryBtnStyle}
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Staff Modal (Email omitted) */}
        {editModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
            <div className="relative w-full max-w-md rounded-[28px] border border-blue-100 bg-white p-7 shadow-[0_14px_35px_rgba(37,99,235,0.10)]">
              <button
                type="button"
                onClick={() => setEditModal(false)}
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-gray-400 transition hover:text-[#2563eb]"
              >
                <FiX className="text-lg" />
              </button>

              <div className="mb-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
                  <FiEdit2 className="text-xl" />
                </div>

                <h3 className="text-2xl font-bold text-[#2563eb]">
                  Update Staff Profile
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Update staff display name used inside the system.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-blue-50 pt-6">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className={secondaryBtnStyle}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUpdateStaff}
                  disabled={!editName}
                  className={primaryBtnStyle}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Action Modal */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
            <div className="relative w-full max-w-sm rounded-[28px] border border-blue-100 bg-white p-7 text-center shadow-[0_14px_35px_rgba(37,99,235,0.10)]">
              <div
                className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${
                  confirmAction === "reset"
                    ? "bg-blue-50 text-[#2563eb]"
                    : confirmAction === "activate"
                    ? "bg-green-50 text-green-500"
                    : "bg-red-50 text-red-500"
                }`}
              >
                {confirmAction === "reset" ? (
                  <FiKey className="text-2xl" />
                ) : confirmAction === "activate" ? (
                  <FiUserCheck className="text-2xl" />
                ) : (
                  <FiAlertCircle className="text-2xl" />
                )}
              </div>

              <h3 className="text-2xl font-bold text-gray-900">
                {confirmAction === "reset"
                  ? "Reset Password"
                  : confirmAction === "activate"
                  ? "Activate Account"
                  : "Deactivate Account"}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                {confirmAction === "reset" ? (
                  <>
                    A password reset email will be sent to{" "}
                    <strong className="text-gray-800">
                      {targetUser?.name}
                    </strong>
                    .
                  </>
                ) : confirmAction === "activate" ? (
                  <>
                    Are you sure you want to activate{" "}
                    <strong className="text-gray-800">
                      {targetUser?.name}
                    </strong>
                    ? They will regain access to the system.
                  </>
                ) : (
                  <>
                    Are you sure you want to deactivate{" "}
                    <strong className="text-gray-800">
                      {targetUser?.name}
                    </strong>
                    ? They will lose access to the system.
                  </>
                )}
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setConfirmModal(false)}
                  className={`${secondaryBtnStyle} w-full`}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className={`w-full ${
                    confirmAction === "reset" || confirmAction === "activate"
                      ? primaryBtnStyle
                      : dangerBtnStyle
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AccountManagement;