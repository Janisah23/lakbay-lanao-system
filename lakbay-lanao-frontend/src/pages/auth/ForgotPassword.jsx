import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiAlertCircle,
  FiCheckCircle,
  FiMail,
} from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";

import loginpage from "../../assets/loginpage.png";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const clearMessages = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      const actionCodeSettings = {
        // Change this to your live domain when deployed
        // Example: https://lakbaylanao.com/login
        url: "http://localhost:5173/login",
        handleCodeInApp: false,
      };

      await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);

      setSuccessMsg(
        "If this email is registered, a password reset link has been sent. Please check your inbox or spam folder."
      );
    } catch (error) {
      console.error("Password reset error:", error);

      if (error.code === "auth/invalid-email") {
        setErrorMsg("Please enter a valid email address.");
      } else if (error.code === "auth/too-many-requests") {
        setErrorMsg("Too many attempts. Please try again later.");
      } else {
        setErrorMsg("Could not process password reset. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle =
    "w-full rounded-[20px] border border-blue-100 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 outline-none shadow-[inset_0_2px_5px_rgba(15,23,42,0.035)] transition-all duration-200 placeholder:text-gray-400 hover:border-blue-200 focus:border-[#2563eb]/70 focus:ring-4 focus:ring-blue-100/70";

  return (
    <div
      /* Pinalitan ang bg-center ng bg-bottom */
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f9ff] bg-cover bg-bottom bg-no-repeat px-5 py-15"
      style={{ backgroundImage: `url(${loginpage})` }}
    >
      <div className="absolute inset-0 bg-[#f3f9ff]/82" />
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-[#f8fbff]/70 to-[#dbeafe]/72" />

      <button
        type="button"
        onClick={() => navigate("/login")}
        className="absolute left-5 top-5 z-10 flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold text-gray-500 shadow-sm transition hover:text-[#2563eb] sm:left-6 sm:top-6 sm:text-sm"
      >
        <FiArrowLeft />
        Back to Sign In
      </button>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[430px] rounded-[38px] border border-blue-100 bg-white p-2 shadow-[0_22px_55px_rgba(37,99,235,0.12)]"
      >
        <div className="rounded-[32px] border border-blue-50 bg-white px-6 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-10px_24px_rgba(37,99,235,0.035)] sm:px-8 sm:py-9">
          <div className="mx-auto mb-5 flex h-[58px] w-[58px] items-center justify-center rounded-[22px] border border-blue-100 bg-blue-50 text-[#2563eb] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_18px_rgba(37,99,235,0.10)]">
            <FiMail className="text-[25px]" />
          </div>

          <h2 className="mb-2 text-[31px] font-extrabold tracking-tight text-[#2563eb]">
            Forgot Password
          </h2>

          <p className="mx-auto mb-7 max-w-[320px] text-sm font-medium leading-relaxed text-gray-500">
            Enter your email address and we’ll send you a password reset link.
          </p>

          <form
            onSubmit={handleForgotPassword}
            className="flex flex-col gap-4 text-left"
          >
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearMessages();
              }}
              required
              className={inputStyle}
            />

            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-start gap-3 rounded-[20px] border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-700"
                >
                  <FiAlertCircle className="mt-0.5 shrink-0 text-base" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-start gap-3 rounded-[20px] border border-green-100 bg-green-50 px-4 py-3 text-xs font-bold text-green-700"
                >
                  <FiCheckCircle className="mt-0.5 shrink-0 text-base" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex w-full items-center justify-center rounded-[20px] bg-gradient-to-b from-[#3b82f6] to-[#2563eb] py-3.5 text-[15px] font-extrabold text-white shadow-[inset_0_1px_0px_rgba(255,255,255,0.4),inset_0_-3px_4px_rgba(0,0,0,0.2),0_6px_12px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0px_rgba(255,255,255,0.5),inset_0_-3px_4px_rgba(0,0,0,0.2),0_8px_16px_rgba(37,99,235,0.4)] active:translate-y-[2px] active:scale-[0.98] active:shadow-[inset_0_1px_0px_rgba(255,255,255,0.3),0_2px_4px_rgba(37,99,235,0.3)] disabled:cursor-not-allowed disabled:opacity-80"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              "Send Reset Link"
            )}
          </button>
          </form>

          <p className="mt-6 text-center text-sm font-medium text-gray-500">
            Remember your password?{" "}
            <span
              className="cursor-pointer font-bold text-[#2563eb] hover:underline"
              onClick={() => navigate("/login")}
            >
              Sign in
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;