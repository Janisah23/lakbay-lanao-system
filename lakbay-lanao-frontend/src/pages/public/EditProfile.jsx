import { useEffect, useState } from "react";
import "flag-icons/css/flag-icons.min.css";

import {
  onAuthStateChanged,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

import { auth, db } from "../../firebase/config";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiAlertCircle,
  FiCheckCircle,
  FiSave,
  FiUser,
  FiMapPin,
  FiLock,
  FiEye,
  FiEyeOff,
  FiGlobe,
  FiMail,
} from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

const COUNTRIES = [
  { value: "Philippines", label: "Philippines", code: "ph" },
  { value: "South Korea", label: "South Korea", code: "kr" },
  { value: "United States", label: "United States", code: "us" },
  { value: "Japan", label: "Japan", code: "jp" },
  { value: "China", label: "China", code: "cn" },
  { value: "Australia", label: "Australia", code: "au" },
  { value: "Canada", label: "Canada", code: "ca" },
  { value: "Taiwan", label: "Taiwan", code: "tw" },
  { value: "Singapore", label: "Singapore", code: "sg" },
  { value: "United Kingdom", label: "United Kingdom", code: "gb" },
  { value: "Malaysia", label: "Malaysia", code: "my" },
  { value: "Indonesia", label: "Indonesia", code: "id" },
  { value: "Thailand", label: "Thailand", code: "th" },
  { value: "Vietnam", label: "Vietnam", code: "vn" },
  { value: "Brunei", label: "Brunei", code: "bn" },
  { value: "India", label: "India", code: "in" },
  { value: "Saudi Arabia", label: "Saudi Arabia", code: "sa" },
  { value: "United Arab Emirates", label: "United Arab Emirates", code: "ae" },
  { value: "Qatar", label: "Qatar", code: "qa" },
  { value: "Kuwait", label: "Kuwait", code: "kw" },
  { value: "Germany", label: "Germany", code: "de" },
  { value: "France", label: "France", code: "fr" },
  { value: "Italy", label: "Italy", code: "it" },
  { value: "Spain", label: "Spain", code: "es" },
  { value: "Other", label: "Other", code: "" },
];

function EditProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [location, setLocation] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const inputStyle =
    "w-full rounded-[12px] border border-[#e2ebff] bg-white/60 px-3.5 py-2.5 text-sm text-gray-700 outline-none backdrop-blur transition hover:border-[#c3d4ff] focus:border-[#0D27F7] focus:ring-2 focus:ring-[#0D27F7]/15";

  const passwordInputStyle =
    "w-full rounded-[12px] border border-[#e2ebff] bg-white/60 px-3.5 py-2.5 pr-11 text-sm text-gray-700 outline-none backdrop-blur transition hover:border-[#c3d4ff] focus:border-[#0D27F7] focus:ring-2 focus:ring-[#0D27F7]/15";

  const compactCard =
    "rounded-[22px] border border-[#e2ebff] bg-white/60 p-4 shadow-[0_2px_10px_rgba(13,39,247,0.04)] ring-1 ring-white/70 backdrop-blur-xl";

  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const MessageAlert = ({ type, message }) => {
    const isError = type === "error";

    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        className={`flex items-start gap-3 rounded-[16px] border px-4 py-3 text-sm backdrop-blur ${
          isError
            ? "border-red-100 bg-red-50/80 text-red-700"
            : "border-green-100 bg-green-50/80 text-green-700"
        }`}
      >
        {isError ? (
          <FiAlertCircle className="mt-[2px] shrink-0 text-base" />
        ) : (
          <FiCheckCircle className="mt-[2px] shrink-0 text-base" />
        )}

        <span className="leading-relaxed">{message}</span>
      </motion.div>
    );
  };

  const isPasswordProvider = user?.providerData?.some(
    (provider) => provider.providerId === "password"
  );

  const displayName = fullName || user?.displayName || username || "Tourist";
  const displayInitial = displayName?.charAt(0)?.toUpperCase() || "U";
  const displayEmail = user?.email || "No email";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          setFullName(data.fullName || currentUser.displayName || "");
          setUsername(data.username || "");

          const locationValue =
            typeof data.location === "string"
              ? data.location
              : data.location?.addressText ||
                data.location?.municipality ||
                data.location?.province ||
                "";

          setLocation(locationValue);

          const matchedCountry =
            COUNTRIES.find((item) => item.value === data.country) ||
            COUNTRIES.find((item) => item.code === data.countryCode) ||
            COUNTRIES[0];

          setCountry(matchedCountry);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        setErrorMsg("Failed to load profile.");
      } finally {
        setProfileLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSaveProfile = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    setSaving(true);
    clearMessages();

    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      setSaving(false);
      return;
    }

    if (!username.trim()) {
      setErrorMsg("Please enter your username.");
      setSaving(false);
      return;
    }

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setErrorMsg("You need to sign in again.");
        setSaving(false);
        return;
      }

      await updateProfile(currentUser, {
        displayName: fullName.trim(),
      });

      await updateDoc(doc(db, "users", currentUser.uid), {
        fullName: fullName.trim(),
        username: username.trim(),
        country: country?.value || "",
        countryCode: country?.code || "",
        location: location.trim() || "",
        updatedAt: serverTimestamp(),
      });

      setSuccessMsg("Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMsg("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setChangingPassword(true);
    clearMessages();

    if (!isPasswordProvider) {
      setErrorMsg(
        "Password change is only available for email/password accounts. Google accounts should manage passwords through Google."
      );
      setChangingPassword(false);
      return;
    }

    if (!currentPassword.trim()) {
      setErrorMsg("Please enter your current password.");
      setChangingPassword(false);
      return;
    }

    if (!newPassword.trim()) {
      setErrorMsg("Please enter your new password.");
      setChangingPassword(false);
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters.");
      setChangingPassword(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg("New password and confirm password do not match.");
      setChangingPassword(false);
      return;
    }

    try {
      const currentUser = auth.currentUser;

      if (!currentUser?.email) {
        setErrorMsg("You need to sign in again.");
        setChangingPassword(false);
        return;
      }

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSuccessMsg("Password changed successfully.");
    } catch (error) {
      console.error("Change password error:", error);

      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        setErrorMsg("Current password is incorrect.");
      } else if (error.code === "auth/weak-password") {
        setErrorMsg("New password is too weak.");
      } else {
        setErrorMsg("Failed to change password. Please try again.");
      }
    } finally {
      setChangingPassword(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] font-inter">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#d6e2ff] border-t-[#0D27F7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] px-5 pb-14 pt-24 font-inter">
      <main className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e2ebff] bg-white/60 px-4 py-2 text-sm font-medium text-gray-600 shadow-[0_2px_10px_rgba(13,39,247,0.04)] ring-1 ring-white/70 backdrop-blur transition-all duration-200 hover:-translate-y-[2px] hover:border-[#c3d4ff] hover:bg-blue-50 hover:text-[#0D27F7] hover:shadow-[0_8px_30px_rgba(13,39,247,0.08)]"
        >
          <FiArrowLeft />
          Back to View Profile
        </button>

        <section className="overflow-hidden rounded-[24px] border border-[#d6e2ff] bg-white/70 shadow-[0_4px_20px_rgba(13,39,247,0.06)] ring-1 ring-white/80 backdrop-blur-xl">
          <div className="relative px-6 py-7 md:px-8">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/80 via-blue-50/60 to-white/60" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#0D27F7]/10 blur-3xl" />

            <div className="relative flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="h-20 w-20 rounded-full border border-white/80 object-cover shadow-[0_8px_30px_rgba(13,39,247,0.12)] ring-4 ring-white/70"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/80 bg-gradient-to-b from-[#0D27F7] to-[#0E1BEF] text-3xl font-semibold text-white shadow-[0_8px_30px_rgba(13,39,247,0.18)] ring-4 ring-white/70">
                  {displayInitial}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h1 className="bg-gradient-to-b from-[#0D27F7] to-[#0E1BEF] bg-clip-text text-2xl font-semibold tracking-tight text-transparent md:text-3xl">
                  Edit Profile
                </h1>

                <p className="mt-1.5 text-sm text-gray-500">
                  {displayName} • {displayEmail}
                </p>

                <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                  <span className="rounded-full border border-[#e2ebff] bg-white/60 px-3.5 py-1.5 text-xs font-medium text-gray-600 backdrop-blur">
                    Account Settings
                  </span>

                  <span className="rounded-full border border-green-100 bg-green-50/80 px-3.5 py-1.5 text-xs font-medium text-green-700 backdrop-blur">
                    Secure Profile
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#0D27F7] to-[#0E1BEF] px-5 py-2.5 text-sm font-medium text-white shadow-[0_2px_10px_rgba(13,39,247,0.2)] transition hover:opacity-95 hover:shadow-[0_6px_20px_rgba(13,39,247,0.25)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <FiSave />
                )}
                Save
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2 md:p-7">
            <div className={compactCard}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e2ebff] bg-white/70 text-[#0D27F7]">
                <FiUser className="text-lg" />
              </div>

              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Full Name
              </label>

              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearMessages();
                }}
                className={`${inputStyle} mt-2.5`}
              />
            </div>

            <div className={compactCard}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e2ebff] bg-white/70 text-[#0D27F7]">
                <FiUser className="text-lg" />
              </div>

              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Username
              </label>

              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearMessages();
                }}
                className={`${inputStyle} mt-2.5`}
              />
            </div>

            <div className={compactCard}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e2ebff] bg-white/70 text-[#0D27F7]">
                <FiGlobe className="text-lg" />
              </div>

              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Country
              </label>

              <div className="relative mt-2.5">
                <div className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2">
                  {country?.code ? (
                    <span className={`fi fi-${country.code} rounded-[3px]`} />
                  ) : (
                    <span>🌍</span>
                  )}
                </div>

                <select
                  value={country?.code || ""}
                  onChange={(e) => {
                    const selectedCountry =
                      COUNTRIES.find((item) => item.code === e.target.value) ||
                      COUNTRIES[0];

                    setCountry(selectedCountry);
                    clearMessages();
                  }}
                  className={`${inputStyle} cursor-pointer pl-11`}
                >
                  {COUNTRIES.map((item) => (
                    <option key={item.value} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={compactCard}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e2ebff] bg-white/70 text-[#0D27F7]">
                <FiMapPin className="text-lg" />
              </div>

              <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Location
              </label>

              <input
                type="text"
                placeholder="City / Province / State"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  clearMessages();
                }}
                className={`${inputStyle} mt-2.5`}
              />
            </div>

            <div className={`${compactCard} md:col-span-2`}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e2ebff] bg-white/70 text-[#0D27F7]">
                <FiMail className="text-lg" />
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Email Address
              </p>

              <h3 className="mt-1.5 break-all text-sm font-medium text-gray-800">
                {displayEmail}
              </h3>

              <p className="mt-1 text-xs text-gray-400">
                Email cannot be changed here.
              </p>
            </div>

            <div className="md:col-span-2">
              <AnimatePresence mode="wait">
                {errorMsg && (
                  <MessageAlert key="error" type="error" message={errorMsg} />
                )}

                {successMsg && (
                  <MessageAlert
                    key="success"
                    type="success"
                    message={successMsg}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[24px] border border-[#d6e2ff] bg-white/70 shadow-[0_4px_20px_rgba(13,39,247,0.06)] ring-1 ring-white/80 backdrop-blur-xl">
          <div className="px-5 py-5 md:px-7">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e2ebff] bg-white/70 text-[#0D27F7]">
                <FiLock className="text-lg" />
              </div>

              <div>
                <h2 className="text-lg font-semibold tracking-tight text-[#0D27F7]">
                  Change Password
                </h2>

                <p className="text-sm text-gray-500">
                  For email/password accounts only.
                </p>
              </div>
            </div>

            {!isPasswordProvider ? (
              <div className="rounded-[16px] border border-[#e2ebff] bg-white/60 px-4 py-3 text-sm text-gray-600 backdrop-blur">
                This account is signed in using Google. Manage password through
                Google.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      clearMessages();
                    }}
                    className={passwordInputStyle}
                  />

                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#0D27F7]"
                  >
                    {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      clearMessages();
                    }}
                    className={passwordInputStyle}
                  />

                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#0D27F7]"
                  >
                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      clearMessages();
                    }}
                    className={passwordInputStyle}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#0D27F7]"
                  >
                    {showConfirmNewPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>

                <div className="md:col-span-3">
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#e2ebff] bg-white/60 px-5 py-2.5 text-sm font-medium text-[#0D27F7] shadow-[0_2px_10px_rgba(13,39,247,0.04)] backdrop-blur transition-all duration-200 hover:-translate-y-[2px] hover:border-[#c3d4ff] hover:bg-blue-50 hover:shadow-[0_8px_30px_rgba(13,39,247,0.08)] disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
                  >
                    {changingPassword ? (
                      <span className="h-[18px] w-[18px] animate-spin rounded-full border-[3px] border-[#0D27F7] border-t-transparent" />
                    ) : (
                      <FiLock />
                    )}
                    Change Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default EditProfile;