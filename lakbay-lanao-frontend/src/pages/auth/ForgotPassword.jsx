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

  const inputStyle =
    "w-full rounded-[14px] border border-blue-100 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-[#2563eb]/50 focus:border-[#2563eb] focus:ring-4 focus:ring-blue-100";

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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());

      setSuccessMsg(
        "Password reset link sent. Please check your inbox or spam folder."
      );
    } catch (error) {
      console.error("Reset password error:", error);

      if (error.code === "auth/invalid-email") {
        setErrorMsg("Please enter a valid email address.");
      } else if (error.code === "auth/user-not-found") {
        setErrorMsg("No account found with this email address.");
      } else if (error.code === "auth/too-many-requests") {
        setErrorMsg("Too many attempts. Please try again later.");
      } else {
        setErrorMsg("Could not send password reset link. Please try again.");
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

      <div className="relative z-10 w-full max-w-[420px] rounded-[30px] border border-blue-100 bg-white/95 p-8 text-center shadow-[0_18px_45px_rgba(37,99,235,0.12)] backdrop-blur-[4px] md:p-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-[#2563eb] shadow-sm">
          <FiMail className="text-2xl" />
        </div>

        <h2 className="mb-1 text-[30px] font-bold text-[#2563eb]">
          Forgot Password
        </h2>

        <p className="mb-6 text-sm leading-relaxed text-gray-500">
          Enter your email address and we’ll send you a link to reset your
          password.
        </p>

        <form
          onSubmit={handleResetPassword}
          className="flex flex-col gap-4 text-left"
        >
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
            className="flex w-full items-center justify-center rounded-[14px] bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] py-3 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_14px_30px_rgba(37,99,235,0.28)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-80"
          >
            {loading ? (
              <div className="h-[18px] w-[18px] animate-spin rounded-full border-[3px] border-white border-t-transparent" />
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Remember your password?{" "}
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

export default ForgotPassword;