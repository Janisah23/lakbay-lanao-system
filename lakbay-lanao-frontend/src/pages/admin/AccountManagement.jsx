import { useEffect, useState } from "react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { sendPasswordResetEmail } from "firebase/auth";
import { FiSearch, FiPlus, FiEye, FiEyeOff, FiKey,
        FiEdit2, FiToggleLeft, FiToggleRight } from "react-icons/fi";

function AccountManagement() {
  const [staffCount, setStaffCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Edit Modal State
  const [editModal, setEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const [confirmModal, setConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [targetUser, setTargetUser] = useState(null);
  

  // ✅ REAL-TIME LISTENER
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      let staff = 0;
      let active = 0;
      let staffList = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        if (data.role === "staff") {
          staff++;
          staffList.push({ id: docSnap.id, ...data });
        }

        if (!data.status || data.status === "active") {
          active++;
        }
      });

      setStaffCount(staff);
      setActiveCount(active);
      setStaffAccounts(staffList);
    });

    return () => unsubscribe();
  }, []);

  // SEARCH FILTER
  const filteredStaff = staffAccounts.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // TOGGLE ACTIVE / INACTIVE
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
      setConfirmAction(action); // "reset" or "deactivate"
      setTargetUser(user);
      setConfirmModal(true);
    };

      const handleConfirmAction = async () => {
    try {
      if (confirmAction === "reset") {
        await sendPasswordResetEmail(auth, targetUser.email);
        alert("Password reset email sent.");
      }

      if (confirmAction === "deactivate") {
        await updateDoc(doc(db, "users", targetUser.id), {
          status: "inactive",
        });
      }

      setConfirmModal(false);
    } catch (error) {
      alert(error.message);
    }
  };

  // CREATE STAFF (Backend API)
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
    <>
      <h2 className="text-2xl font-semibold text-[#2563EB]">
        Account Management
      </h2>

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-sm text-gray-500">TOURISM STAFF</p>
          <h3 className="text-3xl font-semibold mt-2">{staffCount}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-sm text-gray-500">ACTIVE ACCOUNTS</p>
          <h3 className="text-3xl font-semibold mt-2">{activeCount}</h3>
        </div>
      </div>

      {/* Search + Create */}
      <div className="flex items-center gap-6 mt-8 flex-wrap">
        <div className="flex items-center bg-white px-5 py-3 rounded-full shadow-sm border w-[420px] max-w-full">
          <input
            type="text"
            placeholder="Search by name or email"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <div className="bg-[#2563EB] text-white p-2 rounded-full">
            <FiSearch />
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8]
          text-white px-6 py-3 rounded-full shadow-md text-sm font-medium"
        >
          <FiPlus />
          Create Account
        </button>
      </div>

      {/* Table */}
      <div className="mt-10 bg-white rounded-2xl shadow-sm border">
        <div className="grid grid-cols-5 px-6 py-4 text-sm font-medium border-b">
          <span>Full Name</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {filteredStaff.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            No staff accounts found
          </div>
        ) : (
          filteredStaff.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-5 px-6 py-4 text-sm border-b items-center"
            >
              <span>{user.name}</span>
              <span>{user.email}</span>
              <span className="capitalize">{user.role}</span>

              {/* Status Badge */}
              <span
                className={`capitalize px-2 py-1 rounded-full text-xs font-medium w-fit ${
                  user.status === "inactive"
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {user.status || "active"}
              </span>

        {/* Actions */}
              <span className="flex items-center gap-4 text-lg">

                {/* Activate / Deactivate */}
                <span
                  className="cursor-pointer"
                  onClick={() => {
                    if (user.status === "inactive") {
                      toggleStatus(user.id, user.status);
                    } else {
                      openConfirm("deactivate", user);
                    }
                  }}
                  title={user.status === "inactive" ? "Activate" : "Deactivate"}
                >
                  {user.status === "inactive" ? (
                    <FiEyeOff className="text-red-500 hover:scale-110 transition" />
                  ) : (
                    <FiEye className="text-green-500 hover:scale-110 transition" />
                  )}
                </span>

                {/* Edit */}
                <span
                  className="cursor-pointer"
                  onClick={() => openEditModal(user)}
                  title="Edit Account"
                >
                  <FiEdit2 className="text-blue-500 hover:scale-110 transition" />
                </span>

                {/* Reset Password */}
                <span
                  className="cursor-pointer"
                  onClick={() => openConfirm("reset", user)}
                  title="Reset Password"
                >
                  <FiKey className="text-yellow-500 hover:scale-110 transition" />
                </span>

              </span>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-[400px] shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              Create Staff Account
            </h3>

            <input
              type="text"
              placeholder="Full Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="email"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="password"
              placeholder="Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border p-2 rounded mb-4"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateStaff}
                className="bg-[#2563EB] text-white px-4 py-2 rounded text-sm"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                  <div className="bg-white p-8 rounded-2xl w-[400px] shadow-xl">
                    <h3 className="text-lg font-semibold mb-4">
                      Update Staff Account
                    </h3>

                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border p-2 rounded mb-3"
                    />

                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full border p-2 rounded mb-4"
                    />

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setEditModal(false)}
                        className="px-4 py-2 text-sm"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleUpdateStaff}
                        className="bg-[#2563EB] text-white px-4 py-2 rounded text-sm"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              )}
        {confirmModal && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-2xl w-[400px] shadow-xl">
                  <h3 className="text-lg font-semibold mb-4">
                    {confirmAction === "reset"
                      ? "Send Password Reset Email?"
                      : "Deactivate Staff Account?"}
                  </h3>

                  <p className="text-sm text-gray-500 mb-6">
                    {confirmAction === "reset"
                      ? "An email will be sent to the staff to reset their password."
                      : "This staff account will be marked as inactive."}
                  </p>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setConfirmModal(false)}
                      className="px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleConfirmAction}
                      className="bg-red-500 text-white px-4 py-2 rounded text-sm"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}
    </>
  );
}

export default AccountManagement;