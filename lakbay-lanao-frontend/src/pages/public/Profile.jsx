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
} from "react-icons/fi";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const displayName =
    profile?.fullName || profile?.username || user?.displayName || "Tourist";

  const displayInitial = displayName?.charAt(0)?.toUpperCase() || "U";

  const displayRole = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : "Tourist";

  const displayCountry = profile?.country || "";
  const displayCountryCode = profile?.countryCode
    ? profile.countryCode.toUpperCase()
    : "";
  const displayLocation = profile?.location || "";

  const fullLocation =
    displayCountry || displayLocation
      ? `${displayCountryCode ? displayCountryCode + " • " : ""}${displayCountry}${
          displayLocation ? `, ${displayLocation}` : ""
        }`
      : "Not set";

  if (loading) {
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

        <section className="overflow-hidden rounded-[32px] border border-blue-100 bg-white shadow-[0_18px_45px_rgba(37,99,235,0.10)]">
          <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 px-7 py-8 md:px-10">
            <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-[0_0_0_5px_rgba(37,99,235,0.12)]"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-blue-700 text-3xl font-bold text-white shadow-[0_0_0_5px_rgba(37,99,235,0.12)]">
                  {displayInitial}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold text-[#2563eb]">
                  {displayName}
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  {profile?.email || user?.email}
                </p>

                <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                    {displayRole}
                  </span>

                  {user?.emailVerified && (
                    <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-700">
                      <FiCheckCircle />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => navigate("/profile/edit")}
                className="flex items-center gap-2 rounded-full bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.20)] transition hover:bg-blue-700"
              >
                <FiEdit3 />
                Edit Profile
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-7 md:grid-cols-2 md:p-10">
            <div className="rounded-[24px] border border-blue-100 bg-blue-50/40 p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#2563eb] shadow-sm">
                <FiUser className="text-xl" />
              </div>

              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Username
              </p>

              <h3 className="mt-1 text-base font-semibold text-gray-800">
                {profile?.username || "Not set"}
              </h3>
            </div>

            <div className="rounded-[24px] border border-blue-100 bg-blue-50/40 p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#2563eb] shadow-sm">
                <FiMail className="text-xl" />
              </div>

              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Email
              </p>

              <h3 className="mt-1 break-all text-base font-semibold text-gray-800">
                {profile?.email || user?.email}
              </h3>
            </div>

            <div className="rounded-[24px] border border-blue-100 bg-blue-50/40 p-5 md:col-span-2">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#2563eb] shadow-sm">
                <FiMapPin className="text-xl" />
              </div>

              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Location
              </p>

              <h3 className="mt-1 text-base font-semibold text-gray-800">
                {fullLocation}
              </h3>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Profile;