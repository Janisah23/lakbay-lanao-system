import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiAlertCircle,
  FiCheckCircle,
  FiUserPlus,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

import "react-phone-input-2/lib/style.css";
import loginpage from "../../assets/loginpage.png";

const COUNTRIES = [
  { name: "Philippines", code: "ph" },
  { name: "United States", code: "us" },
  { name: "Japan", code: "jp" },
  { name: "South Korea", code: "kr" },
  { name: "China", code: "cn" },
  { name: "Singapore", code: "sg" },
  { name: "Malaysia", code: "my" },
  { name: "Indonesia", code: "id" },
  { name: "Thailand", code: "th" },
  { name: "Vietnam", code: "vn" },
  { name: "Brunei", code: "bn" },
  { name: "Australia", code: "au" },
  { name: "Canada", code: "ca" },
  { name: "United Kingdom", code: "gb" },
  { name: "Saudi Arabia", code: "sa" },
  { name: "United Arab Emirates", code: "ae" },
  { name: "Qatar", code: "qa" },
  { name: "Kuwait", code: "kw" },
  { name: "Germany", code: "de" },
  { name: "France", code: "fr" },
  { name: "Italy", code: "it" },
  { name: "Spain", code: "es" },
  { name: "India", code: "in" },
  { name: "Other", code: "" },
];

function Signup() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [foreignLocation, setForeignLocation] = useState("");

  const [provincesList, setProvincesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");

  const [submitError, setSubmitError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const isPhilippines = selectedCountry.code === "ph";

  useEffect(() => {
    fetch("https://psgc.gitlab.io/api/provinces")
      .then((res) => res.json())
      .then((data) => {
        const combined = [
          ...data,
          { code: "130000000", name: "Metro Manila (NCR)" },
        ];

        const sorted = combined.sort((a, b) => a.name.localeCompare(b.name));
        setProvincesList(sorted);
      })
      .catch((err) => console.error("Failed to load provinces:", err));
  }, []);

  useEffect(() => {
    if (!selectedProvince) {
      setCitiesList([]);
      return;
    }

    const endpoint =
      selectedProvince === "130000000"
        ? "https://psgc.gitlab.io/api/regions/130000000/cities-municipalities"
        : `https://psgc.gitlab.io/api/provinces/${selectedProvince}/cities-municipalities`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        setCitiesList(sorted);
      })
      .catch((err) => console.error("Failed to load cities:", err));
  }, [selectedProvince]);

  useEffect(() => {
    if (!email) {
      setEmailError("");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Invalid email format.");
    } else {
      setEmailError("");
    }
  }, [email]);

  useEffect(() => {
    if (!password) {
      setPasswordError("");
      return;
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);

    if (password.length < 8) {
      setPasswordError("Must be at least 8 characters.");
    } else if (!hasUpper) {
      setPasswordError("Must include an uppercase letter.");
    } else if (!hasLower) {
      setPasswordError("Must include a lowercase letter.");
    } else if (!hasNum) {
      setPasswordError("Must include a number.");
    } else if (!hasSpecial) {
      setPasswordError("Must include a special character (@$!%*?&).");
    } else {
      setPasswordError("");
    }
  }, [password]);

  const clearMessages = () => {
    setSubmitError("");
    setSuccessMsg("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!fullName.trim()) {
      setSubmitError("Please enter your full name.");
      return;
    }

    if (!username.trim()) {
      setSubmitError("Please enter your username.");
      return;
    }

    if (!email.trim()) {
      setSubmitError("Please enter your email address.");
      return;
    }

    if (emailError || passwordError) {
      setSubmitError("Please fix the errors in the form before submitting.");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    if (isPhilippines && (!selectedProvince || !selectedCity)) {
      setSubmitError("Please complete your province and city/municipality.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      const provinceName =
        provincesList.find((p) => p.code === selectedProvince)?.name || "";

      const locationData = isPhilippines
        ? {
            country: "Philippines",
            province: provinceName,
            municipality: selectedCity,
            addressText: `${selectedCity}, ${provinceName}, Philippines`,
          }
        : {
            country: selectedCountry.name,
            province: "",
            municipality: "",
            addressText: foreignLocation.trim(),
          };

      await setDoc(doc(db, "users", user.uid), {
        fullName: fullName.trim(),
        username: username.trim(),
        email: user.email,
        location: locationData,
        country: selectedCountry.name,
        countryCode: selectedCountry.code,
        role: "tourist",
        emailVerified: true,
        createdAt: serverTimestamp(),
      });

      setSuccessMsg("Account created successfully. Redirecting...");

      setTimeout(() => {
        navigate("/home");
      }, 1200);
    } catch (error) {
      console.error("Signup error:", error);

      if (error.code === "auth/email-already-in-use") {
        setSubmitError("Email is already registered.");
      } else if (error.code === "auth/invalid-email") {
        setSubmitError("Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        setSubmitError("Password is too weak.");
      } else if (error.code === "auth/too-many-requests") {
        setSubmitError("Too many attempts. Please try again later.");
      } else {
        setSubmitError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full rounded-[14px] border border-blue-100 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-[#2563eb]/50 focus:border-[#2563eb] focus:ring-4 focus:ring-blue-100";

  const passwordInputStyle =
    "w-full rounded-[14px] border border-blue-100 bg-white px-4 py-3 pr-12 text-sm text-gray-700 outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-[#2563eb]/50 focus:border-[#2563eb] focus:ring-4 focus:ring-blue-100";

  const errorTextStyle =
    "ml-1 mt-1 text-[10px] font-bold tracking-wide text-red-500";

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-y-auto bg-[#f3f9ff] bg-cover bg-center px-5 py-10"
      style={{ backgroundImage: `url(${loginpage})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-[#f3f9ff]/60 to-[#dbeafe]/80" />

      <button
        type="button"
        onClick={() => navigate("/login")}
        className="absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-bold text-gray-500 shadow-sm transition hover:text-[#2563eb]"
      >
        <FiArrowLeft />
        Back to Sign In
      </button>

      <div className="relative z-10 my-8 w-full max-w-[750px] rounded-[30px] border border-blue-100 bg-white/95 p-8 shadow-[0_20px_50px_rgba(37,99,235,0.1)] backdrop-blur-[6px] md:p-12">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#2563eb] shadow-sm">
          <FiUserPlus className="text-2xl" />
        </div>

        <h2 className="text-center text-[32px] font-extrabold tracking-tight text-[#2563eb]">
          Create Account
        </h2>

        <p className="mb-8 text-center text-sm font-medium text-gray-500">
          Join Lakbay Lanao and explore the beauty of the south.
        </p>

        <form onSubmit={handleSignup} className="text-left">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-1">
              <label className="ml-1 text-[11px] font-bold uppercase text-gray-400">
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
                required
                className={inputStyle}
              />
            </div>

            <div className="space-y-1">
              <label className="ml-1 text-[11px] font-bold uppercase text-gray-400">
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
                required
                className={inputStyle}
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="ml-1 text-[11px] font-bold uppercase text-gray-400">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearMessages();
                }}
                required
                className={`${inputStyle} ${
                  emailError ? "border-red-300 bg-red-50/30" : ""
                }`}
              />
              {emailError && <p className={errorTextStyle}>{emailError}</p>}
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="ml-1 text-[11px] font-bold uppercase text-gray-400">
                Country
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2">
                  {selectedCountry.code ? (
                    <span
                      className={`fi fi-${selectedCountry.code} rounded-[3px] shadow-sm`}
                    />
                  ) : (
                    <span className="text-base">🌍</span>
                  )}
                </div>

                <select
                  value={selectedCountry.code}
                  onChange={(e) => {
                    const country = COUNTRIES.find(
                      (item) => item.code === e.target.value
                    );

                    setSelectedCountry(country || COUNTRIES[0]);
                    setSelectedProvince("");
                    setSelectedCity("");
                    setForeignLocation("");
                    clearMessages();
                  }}
                  required
                  className={`${inputStyle} cursor-pointer pl-12`}
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.name} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isPhilippines ? (
              <>
                <div className="space-y-1">
                  <label className="ml-1 text-[11px] font-bold uppercase text-gray-400">
                    Province
                  </label>
                  <select
                    value={selectedProvince}
                    onChange={(e) => {
                      setSelectedProvince(e.target.value);
                      setSelectedCity("");
                      clearMessages();
                    }}
                    required
                    className={inputStyle}
                  >
                    <option value="">Select Province</option>
                    {provincesList.map((prov) => (
                      <option key={prov.code} value={prov.code}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="ml-1 text-[11px] font-bold uppercase text-gray-400">
                    City / Municipality
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      clearMessages();
                    }}
                    required
                    disabled={!selectedProvince}
                    className={`${inputStyle} disabled:cursor-not-allowed disabled:bg-gray-100`}
                  >
                    <option value="">Select City/Municipality</option>
                    {citiesList.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="space-y-1 md:col-span-2">
                <label className="ml-1 text-[11px] font-bold uppercase text-gray-400">
                  City / State / Address{" "}
                  <span className="normal-case text-gray-300">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Example: Seoul, South Korea"
                  value={foreignLocation}
                  onChange={(e) => {
                    setForeignLocation(e.target.value);
                    clearMessages();
                  }}
                  className={inputStyle}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="ml-1 text-[11px] font-bold uppercase text-gray-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearMessages();
                  }}
                  required
                  className={`${passwordInputStyle} ${
                    passwordError ? "border-red-300 bg-red-50/30" : ""
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2563eb]"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {passwordError && (
                <p className={errorTextStyle}>{passwordError}</p>
              )}
            </div>

            <div className="relative space-y-1">
              <label className="ml-1 text-[11px] font-bold uppercase text-gray-400">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearMessages();
                  }}
                  required
                  className={`${passwordInputStyle} ${
                    confirmPassword && password !== confirmPassword
                      ? "border-red-300 bg-red-50/30"
                      : ""
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2563eb]"
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {confirmPassword && password !== confirmPassword && (
                <p className={errorTextStyle}>Passwords do not match.</p>
              )}
            </div>
          </div>

          <AnimatePresence>
            {submitError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 flex items-start gap-3 rounded-[16px] border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700 shadow-sm"
              >
                <FiAlertCircle className="mt-1 shrink-0 text-lg" />
                {submitError}
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 flex items-start gap-3 rounded-[16px] border border-green-100 bg-green-50 p-4 text-sm font-semibold text-green-700 shadow-sm"
              >
                <FiCheckCircle className="mt-1 shrink-0 text-lg" />
                {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center rounded-[16px] bg-[#2563eb] py-4 text-[15px] font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm font-medium text-gray-500">
          Already have an account?{" "}
          <span
            className="cursor-pointer font-bold text-[#2563eb] hover:underline"
            onClick={() => navigate("/login")}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}

export default Signup;