import { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth, db } from "../../firebase/config";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
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

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email.trim());
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "staff") {
        navigate("/staff/dashboard");
      } else {
        navigate("/home");
      }
    } catch (error) {
      console.error("Redirect error:", error);
      setErrorMsg("Login succeeded, but redirection failed.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      await logAction(
        {
          action: "Login",
          module: "Authentication",
          targetModule: "Dashboard",
          details: "User successfully authenticated.",
        },
        user
      );

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          lastLoginAt: serverTimestamp(),
        });
      }

      setSuccessMsg("Login successful.");

      setTimeout(async () => {
        await redirectUser(user);
      }, 600);
    } catch (error) {
      console.error("Login error:", error);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password"
      ) {
        setErrorMsg("Email is not registered or password is incorrect.");
      } else if (error.code === "auth/too-many-requests") {
        setErrorMsg("Too many attempts. Please try again later.");
      } else {
        setErrorMsg("Login failed. Please check your credentials.");
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
          role: "tourist",
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        });
      } else {
        await updateDoc(docRef, {
          lastLoginAt: serverTimestamp(),
        });
      }

      await logAction(
        {
          action: "Login",
          module: "Authentication",
          targetModule: "Dashboard",
          details: "Google Sign-In successful.",
        },
        user
      );

      setSuccessMsg("Login successful.");

      setTimeout(async () => {
        await redirectUser(user);
      }, 600);
    } catch (error) {
      console.error("Google sign-in error:", error);
      setErrorMsg("Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full rounded-[20px] border border-blue-100 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 outline-none shadow-[inset_0_2px_5px_rgba(15,23,42,0.035)] transition-all duration-200 placeholder:text-gray-400 hover:border-blue-200 focus:border-[#2563eb]/70 focus:ring-4 focus:ring-blue-100/70";

  const passwordInputStyle =
    "w-full rounded-[20px] border border-blue-100 bg-white px-5 py-3.5 pr-12 text-sm font-medium text-gray-700 outline-none shadow-[inset_0_2px_5px_rgba(15,23,42,0.035)] transition-all duration-200 placeholder:text-gray-400 hover:border-blue-200 focus:border-[#2563eb]/70 focus:ring-4 focus:ring-blue-100/70";

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f9ff] bg-cover bg-center bg-no-repeat px-5 py-10"
      style={{ backgroundImage: `url(${loginpage})` }}
    >
      <div className="absolute inset-0 bg-[#f3f9ff]/82" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-[#f8fbff]/70 to-[#dbeafe]/72" />

      <button
        type="button"
        onClick={() => navigate("/home")}
        className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold text-gray-500 shadow-sm transition hover:text-[#2563eb] sm:left-6 sm:top-6 sm:text-sm"
      >
        <FiArrowLeft />
        Back to Home
      </button>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[410px] rounded-[38px] border border-blue-100 bg-white p-2 shadow-[0_22px_55px_rgba(37,99,235,0.12)]"
      >
        <div className="rounded-[32px] border border-blue-50 bg-white px-6 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-10px_24px_rgba(37,99,235,0.035)] sm:px-8 sm:py-9">
          <div className="mx-auto mb-5 flex h-[58px] w-[58px] items-center justify-center rounded-[22px] border border-blue-100 bg-blue-50 text-[#2563eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_18px_rgba(37,99,235,0.10)]">
            <FiUser className="text-[25px]" />
          </div>

          <h2 className="mb-1 text-[31px] font-extrabold tracking-tight text-[#2563eb]">
            Sign In
          </h2>

          <p className="mb-7 text-sm font-medium text-gray-500">
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
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-blue-50 hover:text-[#2563eb]"
              >
                {showPassword ? (
                  <FiEyeOff className="text-lg" />
                ) : (
                  <FiEye className="text-lg" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs">
              <label className="flex cursor-pointer items-center gap-2 font-semibold text-gray-600">
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
                onClick={() => navigate("/forgot-password")}
                className="font-bold text-[#2563eb] transition hover:text-blue-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-start gap-3 rounded-[20px] border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-700"
                >
                  <FiAlertCircle className="mt-0.5 shrink-0" />
                  {errorMsg}
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-start gap-3 rounded-[20px] border border-green-100 bg-green-50 px-4 py-3 text-xs font-bold text-green-700"
                >
                  <FiCheckCircle className="mt-0.5 shrink-0" />
                  {successMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center rounded-[20px] bg-[#2563eb] py-3.5 text-[15px] font-extrabold text-white shadow-[0_12px_25px_rgba(37,99,235,0.24)] transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-[0_16px_30px_rgba(37,99,235,0.28)] active:scale-[0.98] disabled:opacity-80"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Log in"
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-center text-[13px] font-medium text-gray-400">
            <span className="h-px flex-1 bg-blue-50" />
            or
            <span className="h-px flex-1 bg-blue-50" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-[20px] border border-blue-100 bg-white px-4 py-3.5 text-sm font-extrabold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-50 disabled:opacity-70"
          >
            <img src={googleIcon} alt="Google" className="h-4 w-4" />
            Continue with Google
          </button>

          <div className="mt-7 border-t border-blue-50 pt-6 text-[13px] font-semibold text-gray-500">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="font-extrabold text-[#2563eb] transition-all hover:text-blue-700 hover:underline"
            >
              Sign up now
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;