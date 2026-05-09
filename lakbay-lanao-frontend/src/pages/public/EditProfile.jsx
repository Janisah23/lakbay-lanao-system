import { useEffect, useState } from "react";
import Select from "react-select";
import "flag-icons/css/flag-icons.min.css";

import {
  onAuthStateChanged,
  updateProfile,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";

import { auth, db } from "../../firebase/config";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiAlertCircle,
  FiCheckCircle,
  FiSave,
  FiTrash2,
  FiX,
  FiUser,
  FiMapPin,
} from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

function EditProfile() {
  const navigate = useNavigate();

  const countries = [
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
    { value: "Cambodia", label: "Cambodia", code: "kh" },
    { value: "Laos", label: "Laos", code: "la" },
    { value: "Myanmar", label: "Myanmar", code: "mm" },
    { value: "Hong Kong", label: "Hong Kong", code: "hk" },
    { value: "Macau", label: "Macau", code: "mo" },
    { value: "India", label: "India", code: "in" },
    { value: "Pakistan", label: "Pakistan", code: "pk" },
    { value: "Bangladesh", label: "Bangladesh", code: "bd" },
    { value: "Sri Lanka", label: "Sri Lanka", code: "lk" },
    { value: "Nepal", label: "Nepal", code: "np" },
    { value: "Saudi Arabia", label: "Saudi Arabia", code: "sa" },
    { value: "United Arab Emirates", label: "United Arab Emirates", code: "ae" },
    { value: "Qatar", label: "Qatar", code: "qa" },
    { value: "Kuwait", label: "Kuwait", code: "kw" },
    { value: "Bahrain", label: "Bahrain", code: "bh" },
    { value: "Oman", label: "Oman", code: "om" },
    { value: "Turkey", label: "Turkey", code: "tr" },
    { value: "Germany", label: "Germany", code: "de" },
    { value: "France", label: "France", code: "fr" },
    { value: "Italy", label: "Italy", code: "it" },
    { value: "Spain", label: "Spain", code: "es" },
    { value: "Netherlands", label: "Netherlands", code: "nl" },
    { value: "Switzerland", label: "Switzerland", code: "ch" },
    { value: "Sweden", label: "Sweden", code: "se" },
    { value: "Norway", label: "Norway", code: "no" },
    { value: "Denmark", label: "Denmark", code: "dk" },
    { value: "Ireland", label: "Ireland", code: "ie" },
    { value: "Belgium", label: "Belgium", code: "be" },
    { value: "Austria", label: "Austria", code: "at" },
    { value: "Poland", label: "Poland", code: "pl" },
    { value: "Russia", label: "Russia", code: "ru" },
    { value: "New Zealand", label: "New Zealand", code: "nz" },
    { value: "Guam", label: "Guam", code: "gu" },
    { value: "Palau", label: "Palau", code: "pw" },
    { value: "Mexico", label: "Mexico", code: "mx" },
    { value: "Brazil", label: "Brazil", code: "br" },
    { value: "Argentina", label: "Argentina", code: "ar" },
    { value: "Chile", label: "Chile", code: "cl" },
    { value: "South Africa", label: "South Africa", code: "za" },
    { value: "Egypt", label: "Egypt", code: "eg" },
    { value: "Morocco", label: "Morocco", code: "ma" },
    { value: "Nigeria", label: "Nigeria", code: "ng" },
    { value: "Other", label: "Other", code: "" },
  ];

  const [user, setUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState(countries[0]);
  const [location, setLocation] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [reauthPassword, setReauthPassword] = useState("");

  const inputStyle =
    "w-full rounded-[14px] border border-blue-100 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-[#2563eb]/50 focus:border-[#2563eb] focus:ring-4 focus:ring-blue-100";

  const countrySelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "46px",
      borderRadius: "14px",
      borderColor: state.isFocused ? "#2563eb" : "#dbeafe",
      boxShadow: state.isFocused ? "0 0 0 4px #dbeafe" : "none",
      fontSize: "14px",
      transition: "all 0.2s ease",
      "&:hover": {
        borderColor: "rgba(37, 99, 235, 0.5)",
      },
    }),
    valueContainer: (base) => ({
      ...base,
      paddingLeft: "14px",
      paddingRight: "8px",
    }),
    indicatorSeparator: () => ({ display: "none" }),
    menu: (base) => ({
      ...base,
      borderRadius: "16px",
      overflow: "hidden",
      border: "1px solid #dbeafe",
      boxShadow: "0 18px 45px rgba(37, 99, 235, 0.14)",
      zIndex: 9999,
    }),
    menuList: (base) => ({
      ...base,
      padding: "6px",
      maxHeight: "230px",
    }),
    option: (base, state) => ({
      ...base,
      borderRadius: "10px",
      fontSize: "14px",
      cursor: "pointer",
      backgroundColor: state.isSelected
        ? "#2563eb"
        : state.isFocused
        ? "#eff6ff"
        : "white",
      color: state.isSelected ? "white" : "#374151",
    }),
  };

  const formatCountryOption = (option) => (
    <div className="flex items-center gap-2">
      {option.code ? (
        <span className={`fi fi-${option.code} rounded-[3px]`} />
      ) : (
        <span className="flex h-[14px] w-[20px] items-center justify-center text-xs">
          🌍
        </span>
      )}

      <span>{option.label}</span>
    </div>
  );

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
        className={`flex items-start gap-3 rounded-[16px] border px-4 py-3 text-sm ${
          isError
            ? "border-red-100 bg-red-50 text-red-700"
            : "border-green-100 bg-green-50 text-green-700"
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

  const isGoogleProvider = user?.providerData?.some(
    (provider) => provider.providerId === "google.com"
  );

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
          setLocation(data.location || "");

          const matchedCountry =
            countries.find((item) => item.value === data.country) ||
            countries[0];

          setCountry(matchedCountry);
        } else {
          setFullName(currentUser.displayName || "");
          setUsername("");
          setCountry(countries[0]);
          setLocation("");
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
    e.preventDefault();
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

  const reauthenticateUser = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("No authenticated user.");
    }

    if (isPasswordProvider) {
      if (!reauthPassword.trim()) {
        throw new Error("Please enter your password to continue.");
      }

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        reauthPassword
      );

      await reauthenticateWithCredential(currentUser, credential);
      return;
    }

    if (isGoogleProvider) {
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(currentUser, provider);
      return;
    }

    throw new Error("Please log in again before deleting your account.");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    clearMessages();

    if (confirmText !== "DELETE") {
      setErrorMsg("Please type DELETE to confirm account deletion.");
      setDeleting(false);
      return;
    }

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setErrorMsg("You need to sign in again.");
        setDeleting(false);
        return;
      }

      await reauthenticateUser();

      await deleteDoc(doc(db, "users", currentUser.uid));
      await deleteUser(currentUser);

      setShowDeleteModal(false);
      navigate("/");
    } catch (error) {
      console.error("Delete account error:", error);

      if (error.code === "auth/requires-recent-login") {
        setErrorMsg(
          "For security, please log in again before deleting your account."
        );
      } else if (error.code === "auth/wrong-password") {
        setErrorMsg("Incorrect password. Please try again.");
      } else if (error.message) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg("Failed to delete account. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#2563eb]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff]">
      <main className="mx-auto max-w-5xl px-6 pb-20 pt-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-gray-500 shadow-sm transition hover:text-[#2563eb]"
        >
          <FiArrowLeft />
          Back
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2563eb] md:text-4xl">
            Account Settings
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Update your profile details and manage your Lakbay Lanao account.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="rounded-[30px] border border-blue-100 bg-white p-7 shadow-[0_18px_45px_rgba(37,99,235,0.10)] md:p-9">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]">
                <FiUser className="text-xl" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Edit Profile
                </h2>

                <p className="text-sm text-gray-500">
                  Keep your information updated.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearMessages();
                }}
                className={inputStyle}
              />

              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearMessages();
                }}
                className={inputStyle}
              />

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">
                  Country
                </label>

                <Select
                  value={country}
                  onChange={(selected) => {
                    setCountry(selected);
                    clearMessages();
                  }}
                  options={countries}
                  isSearchable
                  formatOptionLabel={formatCountryOption}
                  styles={countrySelectStyles}
                  className="text-sm"
                  classNamePrefix="country-select"
                  placeholder="Select Country"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">
                  Location
                </label>

                <input
                  type="text"
                  placeholder="City / Province / State (optional)"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    clearMessages();
                  }}
                  className={inputStyle}
                />
              </div>

              <AnimatePresence mode="wait">
                {errorMsg && !showDeleteModal && (
                  <MessageAlert key="error" type="error" message={errorMsg} />
                )}

                {successMsg && !showDeleteModal && (
                  <MessageAlert
                    key="success"
                    type="success"
                    message={successMsg}
                  />
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#2563eb] py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.20)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? (
                  <div className="h-[18px] w-[18px] animate-spin rounded-full border-[3px] border-white border-t-transparent" />
                ) : (
                  <>
                    <FiSave />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[30px] border border-blue-100 bg-white p-6 shadow-[0_18px_45px_rgba(37,99,235,0.08)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]">
                  <FiMapPin className="text-xl" />
                </div>

                <div>
                  <h3 className="font-bold text-gray-800">Profile Tips</h3>

                  <p className="text-sm text-gray-500">
                    Location helps improve tourist analytics.
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-gray-500">
                Your country and location help the tourism office understand
                where visitors are coming from. Exact address is not required.
              </p>
            </section>

            <section className="rounded-[30px] border border-red-100 bg-white p-6 shadow-[0_18px_45px_rgba(239,68,68,0.08)]">
              <h3 className="font-bold text-red-600">Danger Zone</h3>

              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Deleting your account is permanent. Your profile data will be
                removed and you will lose access to your saved account.
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(true);
                  setConfirmText("");
                  setReauthPassword("");
                  clearMessages();
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-[14px] border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                <FiTrash2 />
                Delete Account
              </button>
            </section>
          </aside>
        </div>
      </main>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-red-100 bg-white p-6 shadow-[0_18px_45px_rgba(239,68,68,0.16)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-red-600">
                  Delete Account
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-gray-500">
                  This action cannot be undone. Type DELETE to confirm.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-full bg-gray-100 p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-500"
              >
                <FiX />
              </button>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Type DELETE"
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  clearMessages();
                }}
                className="w-full rounded-[14px] border border-red-100 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
              />

              {isPasswordProvider && (
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={reauthPassword}
                  onChange={(e) => {
                    setReauthPassword(e.target.value);
                    clearMessages();
                  }}
                  className="w-full rounded-[14px] border border-red-100 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                />
              )}

              {isGoogleProvider && !isPasswordProvider && (
                <p className="rounded-[16px] border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-gray-600">
                  You will be asked to confirm using your Google account.
                </p>
              )}

              <AnimatePresence mode="wait">
                {errorMsg && showDeleteModal && (
                  <MessageAlert
                    key="delete-error"
                    type="error"
                    message={errorMsg}
                  />
                )}
              </AnimatePresence>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full rounded-[14px] border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-500 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-red-500 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {deleting ? (
                    <div className="h-[18px] w-[18px] animate-spin rounded-full border-[3px] border-white border-t-transparent" />
                  ) : (
                    <>
                      <FiTrash2 />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditProfile;