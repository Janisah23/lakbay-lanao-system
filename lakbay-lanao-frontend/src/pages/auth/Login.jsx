import { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { logAction } from "../../utils/logAction";
import {
  FiArrowLeft,
  FiAlertCircle,
  FiCheckCircle,
  FiUser,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import loginpage from "../../assets/loginpage.png";
import googleIcon from "../../assets/google-icon.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await user.getIdToken(true);

      setSuccessMsg("Login successful.");

      setTimeout(async () => {
        await redirectUser(user);
      }, 600);
    } catch (error) {
      console.error("Login error:", error);

      if (error.code === "auth/user-not-found") {
        setErrorMsg("Account is not registered.");
      } else if (error.code === "auth/wrong-password") {
        setErrorMsg("Incorrect password. Please try again.");
      } else if (error.code === "auth/invalid-email") {
        setErrorMsg("Please enter a valid email address.");
      } else if (error.code === "auth/invalid-credential") {
        setErrorMsg("Email is not registered or password is incorrect.");
      } else if (error.code === "auth/too-many-requests") {
        setErrorMsg("Too many attempts. Please try again later.");
      } else {
        setErrorMsg("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    clearMessages();
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          fullName: user.displayName || "",
          username: user.displayName || "",
          email: user.email,
          phone: "",
          municipality: "",
          role: "tourist",
        });
      }

      setSuccessMsg("Login successful.");

      setTimeout(async () => {
        await redirectUser(user);
      }, 600);
    } catch (error) {
      console.error("Google sign-in error:", error);
      setErrorMsg("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    clearMessages();

    if (!email.trim()) {
      setErrorMsg("Please enter your email first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);

      setSuccessMsg(
        "If this email is registered, a password reset link will be sent."
      );
    } catch (error) {
      console.error("Reset password error:", error);

      if (error.code === "auth/invalid-email") {
        setErrorMsg("Please enter a valid email address.");
      } else if (error.code === "auth/too-many-requests") {
        setErrorMsg("Too many attempts. Please try again later.");
      } else {
        setErrorMsg("Could not process password reset. Please try again.");
      }
    }
  };

  const redirectUser = async (user) => {
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setErrorMsg("User profile not found in database.");
        return;
      }

      const userData = docSnap.data();
      const role = String(userData.role || "").toLowerCase().trim();

      const name =
        userData.fullName ||
        userData.username ||
        userData.name ||
        user.email ||
        "User";

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      await logAction({
        action: "Login",
        userName: name,
        performedBy: name,
        role: role || "tourist",
      });

      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "staff") {
        navigate("/staff/manage");
      } else {
        navigate("/home");
      }
    } catch (error) {
      console.error("Redirect error:", error);
      setErrorMsg("Login succeeded, but role-based redirect failed.");
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
        onClick={() => navigate("/home")}
        className="absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium text-gray-500 shadow-sm backdrop-blur-[2px] transition hover:text-[#2563eb]"
      >
        <FiArrowLeft className="text-base" />
        Back to Home
      </button>

      <div className="relative z-10 w-full max-w-[400px] rounded-[30px] border border-blue-100 bg-white/95 p-8 text-center shadow-[0_18px_45px_rgba(37,99,235,0.12)] backdrop-blur-[4px] md:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#2563eb] shadow-sm">
          <FiUser className="text-2xl" />
        </div>

        <h2 className="mb-1 text-[30px] font-bold text-[#2563eb]">
          Sign In
        </h2>

        <p className="mb-6 text-sm text-gray-500">
          Welcome back to Lakbay Lanao
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearMessages();
            }}
            required
            className={inputStyle}
          />

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

          <div className="flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-gray-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]"
              />
              Remember me
            </label>

            <button
              type="button"
              onClick={handleForgotPassword}
              className="font-medium text-[#2563eb] transition hover:underline"
            >
              Forgot password?
            </button>
          </div>

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

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex w-full items-center justify-center rounded-[14px] bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] py-3 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_14px_30px_rgba(37,99,235,0.28)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
          >
            {loading ? (
              <div className="h-[18px] w-[18px] animate-spin rounded-full border-[3px] border-white border-t-transparent" />
            ) : (
              "Log in"
            )}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-center text-[13px] text-gray-400">
          <span className="h-px flex-1 bg-blue-100" />
          or
          <span className="h-px flex-1 bg-blue-100" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-[14px] border border-blue-100 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all duration-150 hover:bg-blue-50 hover:shadow-md disabled:opacity-70"
        >
          <img
            src={googleIcon}
            alt="Google logo"
            className="h-[18px] w-[18px] object-contain"
          />
          Continue with Google
        </button>

        <p className="mt-5 text-center text-sm text-gray-500">
          No account?{" "}
          <span
            className="cursor-pointer font-semibold text-[#2563eb] hover:underline"
            onClick={() => navigate("/signup")}
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;