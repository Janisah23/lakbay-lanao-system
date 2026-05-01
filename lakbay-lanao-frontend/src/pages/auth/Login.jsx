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
import { FiArrowLeft } from "react-icons/fi";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await user.getIdToken(true);
      await redirectUser(user);
    } catch (error) {
      console.error("Login error:", error);

      if (error.code === "auth/user-not-found") {
        setErrorMsg("No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        setErrorMsg("Incorrect password.");
      } else if (error.code === "auth/invalid-credential") {
        setErrorMsg("Invalid email or password.");
      } else {
        setErrorMsg("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setInfoMsg("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          email: user.email,
          username: user.displayName || "",
          role: "tourist",
        });
      }

      await redirectUser(user);
    } catch (error) {
      console.error("Google sign-in error:", error);
      setErrorMsg("Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg("");
    setInfoMsg("");

    if (!email.trim()) {
      setErrorMsg("Please enter your email first.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setInfoMsg("Password reset email sent. Please check your inbox.");
    } catch (error) {
      console.error("Reset password error:", error);
      setErrorMsg("Could not send reset email.");
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
      const name = userData.username || userData.name || user.email || "User";

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "staff") {
        navigate("/staff/manage");
      } else {
        navigate("/home");
      }

      await logAction({
        action: "Login",
        userName: name,
        performedBy: name,
        role: role || "tourist",
      });
    } catch (error) {
      console.error("Redirect error:", error);
      setErrorMsg("Login succeeded, but role-based redirect failed.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#f9fbff] to-[#eef4ff] px-5">
      <button
        type="button"
        onClick={() => navigate("/home")}
        className="absolute left-6 top-6 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#2563eb]"
      >
        <FiArrowLeft className="text-base" />
        Back to Home
      </button>

      <div className="w-full max-w-[390px] rounded-[28px] border border-white/60 bg-white/75 p-10 text-center backdrop-blur-[18px] shadow-[0_6px_20px_rgba(0,0,0,0.06)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        <h2 className="mb-1 text-[30px] font-bold text-[#2563eb]">Sign In</h2>
        <p className="mb-5 text-sm text-gray-500">Welcome back to Lakbay Lanao</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMsg("");
              setInfoMsg("");
            }}
            required
            className="w-full rounded-[12px] border border-gray-200 bg-white/90 px-4 py-3 text-sm outline-none transition-all duration-200 hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMsg("");
              setInfoMsg("");
            }}
            required
            className="w-full rounded-[12px] border border-gray-200 bg-white/90 px-4 py-3 text-sm outline-none transition-all duration-200 hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
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

          {errorMsg && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">
              {errorMsg}
            </p>
          )}

          {infoMsg && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-600">
              {infoMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-[12px] bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] py-3 text-[15px] font-semibold text-white transition-all duration-200 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
          >
            {loading ? (
              <div className="h-[18px] w-[18px] animate-spin rounded-full border-[3px] border-white border-t-transparent" />
            ) : (
              "Log in"
            )}
          </button>
        </form>

        <div className="my-3 text-center text-[13px] text-gray-400">or</div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-150 hover:bg-gray-50 hover:shadow-sm disabled:opacity-70"
        >
          <img
            src="src/assets/google-icon.png"
            alt="Google logo"
            className="h-[18px] w-[18px] object-contain"
          />
          Continue with Google
        </button>

        <p className="mt-5 text-sm text-gray-500">
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