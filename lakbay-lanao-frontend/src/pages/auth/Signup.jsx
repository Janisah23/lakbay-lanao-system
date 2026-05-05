import { useState } from "react";
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
import loginpage from "../../assets/loginpage.png";

function Signup() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const municipalities = [
    "Amai Manabilang",
    "Balabagan",
    "Balindong",
    "Bayang",
    "Bubong",
    "Calanogas",
    "Ganassi",
    "Kapai",
    "Lumbaca-Unayan",
    "Madalum",
    "Madamba",
    "Malabang",
    "Marantao",
    "Marogong",
    "Masiu",
    "Mulondo",
    "Pagayawan",
    "Piagapo",
    "Poona Bayabao",
    "Pualas",
    "Saguiaran",
    "Tamparan",
    "Taraka",
    "Tubaran",
    "Tugaya",
    "Wao",
  ];

  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const inputStyle =
    "w-full rounded-[14px] border border-blue-100 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-[#2563eb]/50 focus:border-[#2563eb] focus:ring-4 focus:ring-blue-100";

  const passwordInputStyle =
    "w-full rounded-[14px] border border-blue-100 bg-white px-4 py-3 pr-12 text-sm text-gray-700 outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-[#2563eb]/50 focus:border-[#2563eb] focus:ring-4 focus:ring-blue-100";

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

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      setLoading(false);
      return;
    }

    if (!username.trim()) {
      setErrorMsg("Please enter your username.");
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        fullName: fullName.trim(),
        username: username.trim(),
        email: user.email,
        phone: phone.trim() || "",
        municipality: municipality || "",
        role: "tourist",
        createdAt: serverTimestamp(),
      });

      setSuccessMsg("Account created successfully. Please sign in.");

      setTimeout(() => {
        navigate("/login");
      }, 900);
    } catch (error) {
      console.error("Signup error:", error);

      if (error.code === "auth/email-already-in-use") {
        setErrorMsg("Email is already registered.");
      } else if (error.code === "auth/invalid-email") {
        setErrorMsg("Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        setErrorMsg("Password must be at least 6 characters.");
      } else {
        setErrorMsg("Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f9ff] bg-cover bg-center bg-no-repeat px-5 py-10"
      style={{ backgroundImage: `url(${loginpage})` }}
    >
      <div className="absolute inset-0 bg-[#f3f9ff]/70" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/65 via-[#f3f9ff]/60 to-[#dbeafe]/70" />

      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#bfdbfe]/25 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#93c5fd]/20 blur-2xl" />

      <button
        type="button"
        onClick={() => navigate("/login")}
        className="absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium text-gray-500 shadow-sm backdrop-blur-[2px] transition hover:text-[#2563eb]"
      >
        <FiArrowLeft className="text-base" />
        Back to Sign In
      </button>

      <div className="relative z-10 w-full max-w-[720px] rounded-[30px] border border-blue-100 bg-white/92 p-7 text-center shadow-[0_18px_45px_rgba(37,99,235,0.12)] backdrop-blur-[4px] md:p-9">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#2563eb] shadow-sm">
          <FiUserPlus className="text-2xl" />
        </div>

        <h2 className="mb-1 text-[30px] font-bold text-[#2563eb]">
          Sign Up
        </h2>

        <p className="mb-6 text-sm text-gray-500">
          Create your Lakbay Lanao account
        </p>

        <form onSubmit={handleSignup} className="text-left">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearMessages();
              }}
              required
              className={inputStyle}
            />

            <input
              type="text"
              placeholder="Phone Number (optional)"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                clearMessages();
              }}
              className={inputStyle}
            />

            <select
              value={municipality}
              onChange={(e) => {
                setMunicipality(e.target.value);
                clearMessages();
              }}
              className={inputStyle}
            >
              <option value="">Select Municipality (optional)</option>
              {municipalities.map((mun, index) => (
                <option key={index} value={mun}>
                  {mun}
                </option>
              ))}
            </select>

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
                className={passwordInputStyle}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#2563eb]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <FiEyeOff className="text-lg" />
                ) : (
                  <FiEye className="text-lg" />
                )}
              </button>
            </div>

            <div className="relative md:col-span-2">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearMessages();
                }}
                required
                className={passwordInputStyle}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#2563eb]"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <FiEyeOff className="text-lg" />
                ) : (
                  <FiEye className="text-lg" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-4">
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

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center rounded-[14px] bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] py-3 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_14px_30px_rgba(37,99,235,0.28)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
          >
            {loading ? (
              <div className="h-[18px] w-[18px] animate-spin rounded-full border-[3px] border-white border-t-transparent" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <span
            className="cursor-pointer font-semibold text-[#2563eb] hover:underline"
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