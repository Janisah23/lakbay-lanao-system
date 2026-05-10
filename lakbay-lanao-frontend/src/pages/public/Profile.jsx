import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiMapPin,
  FiEdit3,
  FiCheckCircle,
  FiArrowLeft,
  FiGlobe,
  FiShield,
} from "react-icons/fi";
import "flag-icons/css/flag-icons.min.css";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const getLocationText = (data) => {
    if (!data) return "Not set";

    if (typeof data.location === "string" && data.location.trim()) {
      return data.location;
    }

    if (data.location?.addressText) return data.location.addressText;

    if (data.location?.municipality && data.location?.province) {
      return `${data.location.municipality}, ${data.location.province}`;
    }

    if (data.location?.province) return data.location.province;

    return "Not set";
  };

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
          setProfile(userSnap.data());
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] font-inter">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#d6e2ff] border-t-[#0D27F7]" />
      </div>
    );
  }

  const displayName =
    profile?.fullName || profile?.username || user?.displayName || "Tourist";

  const displayInitial = displayName?.charAt(0)?.toUpperCase() || "U";

  const displayRole = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : "Tourist";

  const displayEmail = profile?.email || user?.email || "Not provided";

  const displayUsername =
    profile?.username || user?.email?.split("@")[0] || "Not set";

  const displayCountry =
    profile?.country || profile?.location?.country || "Not set";

  const displayCountryCode = profile?.countryCode || "";
  const displayLocation = getLocationText(profile);

  const glassCard =
    "rounded-[22px] border border-[#e2ebff] bg-white/60 p-4 shadow-[0_2px_10px_rgba(13,39,247,0.04)] ring-1 ring-white/70 backdrop-blur-xl transition-all duration-200 hover:-translate-y-[2px] hover:border-[#c3d4ff] hover:shadow-[0_8px_30px_rgba(13,39,247,0.08)]";

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] px-5 pb-14 pt-24 font-inter">
      <main className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/home")}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e2ebff] bg-white/60 px-4 py-2 text-sm font-medium text-gray-600 shadow-[0_2px_10px_rgba(13,39,247,0.04)] ring-1 ring-white/70 backdrop-blur transition-all duration-200 hover:-translate-y-[2px] hover:border-[#c3d4ff] hover:bg-blue-50 hover:text-[#0D27F7] hover:shadow-[0_8px_30px_rgba(13,39,247,0.08)]"
        >
          <FiArrowLeft />
          Back to Home
        </button>

        <section className="overflow-hidden rounded-[24px] border border-[#d6e2ff] bg-white/70 shadow-[0_4px_20px_rgba(13,39,247,0.06)] ring-1 ring-white/80 backdrop-blur-xl">
          <div className="relative px-6 py-7 md:px-8">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/80 via-blue-50/60 to-white/60" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#0D27F7]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-[#0E1BEF]/10 blur-3xl" />

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
                  {displayName}
                </h1>

                <p className="mt-1.5 text-sm text-gray-500">
                  {displayEmail}
                </p>

                <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                  <span className="rounded-full border border-[#e2ebff] bg-white/60 px-3.5 py-1.5 text-xs font-medium text-gray-600 backdrop-blur">
                    {displayRole}
                  </span>

                  <span className="flex items-center gap-1 rounded-full border border-green-100 bg-green-50/80 px-3.5 py-1.5 text-xs font-medium text-green-700 backdrop-blur">
                    <FiCheckCircle />
                    Verified
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/profile/edit")}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#0D27F7] to-[#0E1BEF] px-5 py-2.5 text-sm font-medium text-white shadow-[0_2px_10px_rgba(13,39,247,0.2)] transition hover:opacity-95 hover:shadow-[0_6px_20px_rgba(13,39,247,0.25)] active:scale-[0.98]"
              >
                <FiEdit3 />
                Edit Profile
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-5 md:grid-cols-2 md:p-7">
            <div className={glassCard}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e2ebff] bg-white/70 text-[#0D27F7]">
                <FiUser className="text-lg" />
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Username
              </p>

              <h3 className="mt-1.5 text-sm font-medium text-gray-800">
                {displayUsername}
              </h3>
            </div>

            <div className={glassCard}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e2ebff] bg-white/70 text-[#0D27F7]">
                <FiMail className="text-lg" />
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Email
              </p>

              <h3 className="mt-1.5 break-all text-sm font-medium text-gray-800">
                {displayEmail}
              </h3>
            </div>

            <div className={glassCard}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e2ebff] bg-white/70 text-[#0D27F7]">
                <FiGlobe className="text-lg" />
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Country
              </p>

              <h3 className="mt-1.5 flex items-center gap-2 text-sm font-medium text-gray-800">
                {displayCountryCode ? (
                  <span
                    className={`fi fi-${displayCountryCode} rounded-[3px]`}
                  />
                ) : (
                  <span>🌍</span>
                )}
                {displayCountry}
              </h3>
            </div>

            <div className={glassCard}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e2ebff] bg-white/70 text-[#0D27F7]">
                <FiMapPin className="text-lg" />
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Location
              </p>

              <h3 className="mt-1.5 text-sm font-medium text-gray-800">
                {displayLocation}
              </h3>
            </div>

            <div className={`${glassCard} md:col-span-2`}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#e2ebff] bg-white/70 text-[#0D27F7]">
                <FiShield className="text-lg" />
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Account Role
              </p>

              <h3 className="mt-1.5 text-sm font-medium capitalize text-gray-800">
                {displayRole}
              </h3>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Profile;