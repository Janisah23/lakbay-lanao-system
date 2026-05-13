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

      // Role-based navigation
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "staff") {
        navigate("/staff/manage");
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

      // 1. Log the successful login with specific details
      await logAction({
        action: "Login",
        module: "Authentication",
        targetModule: "Dashboard",
        details: "User successfully authenticated."
      }, user);

      // 2. Update Firestore user record
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
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
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

      await logAction({
        action: "Login",
        module: "Authentication",
        targetModule: "Dashboard",
        details: "Google Sign-In successful."
      }, user);

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

  const inputStyle = "w-full rounded-[14px] border border-blue-100 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-[#2563eb]/50 focus:border-[#2563eb] focus:ring-4 focus:ring-blue-100";
  const passwordInputStyle = "w-full rounded-[14px] border border-blue-100 bg-white px-4 py-3 pr-12 text-sm text-gray-700 outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-[#2563eb]/50 focus:border-[#2563eb] focus:ring-4 focus:ring-blue-100";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f9ff] bg-cover bg-center bg-no-repeat px-5 py-10" style={{ backgroundImage: `url(${loginpage})` }}>
      <div className="absolute inset-0 bg-[#f3f9ff]/70" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/65 via-[#f3f9ff]/60 to-[#dbeafe]/70" />

      <button type="button" onClick={() => navigate("/home")} className="absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-bold text-gray-500 shadow-sm backdrop-blur-[2px] transition hover:text-[#2563eb]">
        <FiArrowLeft /> Back to Home
      </button>

      <div className="relative z-10 w-full max-w-[400px] rounded-[30px] border border-blue-100 bg-white/95 p-8 text-center shadow-[0_18px_45px_rgba(37,99,235,0.12)] backdrop-blur-[4px] md:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#2563eb] shadow-sm">
          <FiUser className="text-2xl" />
        </div>

        <h2 className="mb-1 text-[30px] font-bold text-[#2563eb]">Sign In</h2>
        <p className="mb-6 text-sm text-gray-500 font-medium">Welcome back to Lakbay Lanao</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          <input type="email" placeholder="Email" value={email} onChange={(e) => { setEmail(e.target.value); clearMessages(); }} required className={inputStyle} />

          <div className="relative">
            <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => { setPassword(e.target.value); clearMessages(); }} required className={passwordInputStyle} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#2563eb]">
              {showPassword ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex cursor-pointer items-center gap-2 text-gray-600 font-medium">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]" />
              Remember me
            </label>
            <button type="button" onClick={() => navigate("/forgot-password")} className="font-bold text-[#2563eb] hover:underline">Forgot password?</button>
          </div>

          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-start gap-3 rounded-[16px] border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
                <FiAlertCircle className="mt-0.5 shrink-0" /> {errorMsg}
              </motion.div>
            )}
            {successMsg && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-start gap-3 rounded-[16px] border border-green-100 bg-green-50 px-4 py-3 text-xs font-bold text-green-700">
                <FiCheckCircle className="mt-0.5 shrink-0" /> {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" disabled={loading} className="mt-1 flex w-full items-center justify-center rounded-[14px] bg-[#2563eb] py-3 text-[15px] font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-80">
            {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Log in"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-center text-[13px] text-gray-400">
          <span className="h-px flex-1 bg-blue-50" /> or <span className="h-px flex-1 bg-blue-50" />
        </div>

        <button type="button" onClick={handleGoogleLogin} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-[14px] border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-blue-50 disabled:opacity-70">
          <img src={googleIcon} alt="Google" className="h-4 w-4" /> Continue with Google
        </button>
      </div>
    </div>
  );
}

export default Login;