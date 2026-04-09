import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
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

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (!username.trim()) {
      setErrorMsg("Please enter your username.");
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
        username: username,
        email: user.email,
        phone: phone || "",
        municipality: municipality || "",
        role: "tourist",
        createdAt: serverTimestamp(),
      });

      navigate("/home");
    } catch (error) {
      console.error(error);

      if (error.code === "auth/email-already-in-use") {
        setErrorMsg("This email is already in use.");
      } else if (error.code === "auth/invalid-email") {
        setErrorMsg("Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        setErrorMsg("Password is too weak.");
      } else {
        setErrorMsg("Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#f9fbff] to-[#eef4ff] px-5 py-10">
      <button
        type="button"
        onClick={() => navigate("/login")}
        className="absolute left-6 top-6 flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#2563eb]"
      >
        <FiArrowLeft className="text-base" />
        Back to Sign In
      </button>

      <div
        className="
          w-full max-w-[420px]
          rounded-[28px]
          border border-white/60
          bg-white/75
          p-8 md:p-10
          text-center
          backdrop-blur-[18px]
          shadow-[0_6px_20px_rgba(0,0,0,0.06)]
          transition-all duration-200
          hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]
        "
      >
        <h2 className="mb-1 text-[30px] font-bold text-[#2563eb]">Sign Up</h2>
        <p className="mb-5 text-sm text-gray-500">
          Create your Lakbay Lanao account
        </p>

        <form onSubmit={handleSignup} className="flex flex-col gap-4 text-left">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrorMsg("");
            }}
            required
            className="
              w-full rounded-[12px] border border-gray-200
              bg-white/90 px-4 py-3 text-sm outline-none
              transition-all duration-200
              hover:border-[#2563eb]
              focus:border-[#2563eb]
              focus:ring-2 focus:ring-blue-100
            "
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMsg("");
            }}
            required
            className="
              w-full rounded-[12px] border border-gray-200
              bg-white/90 px-4 py-3 text-sm outline-none
              transition-all duration-200
              hover:border-[#2563eb]
              focus:border-[#2563eb]
              focus:ring-2 focus:ring-blue-100
            "
          />

          <input
            type="text"
            placeholder="Phone Number (optional)"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setErrorMsg("");
            }}
            className="
              w-full rounded-[12px] border border-gray-200
              bg-white/90 px-4 py-3 text-sm outline-none
              transition-all duration-200
              hover:border-[#2563eb]
              focus:border-[#2563eb]
              focus:ring-2 focus:ring-blue-100
            "
          />

          <select
            value={municipality}
            onChange={(e) => {
              setMunicipality(e.target.value);
              setErrorMsg("");
            }}
            className="
              w-full rounded-[12px] border border-gray-200 bg-white/90
              px-4 py-3 text-sm outline-none
              transition-all duration-200
              hover:border-[#2563eb]
              focus:border-[#2563eb]
              focus:ring-2 focus:ring-blue-100
            "
          >
            <option value="">Select Municipality (optional)</option>
            {municipalities.map((mun, index) => (
              <option key={index} value={mun}>
                {mun}
              </option>
            ))}
          </select>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMsg("");
            }}
            required
            className="
              w-full rounded-[12px] border border-gray-200
              bg-white/90 px-4 py-3 text-sm outline-none
              transition-all duration-200
              hover:border-[#2563eb]
              focus:border-[#2563eb]
              focus:ring-2 focus:ring-blue-100
            "
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrorMsg("");
            }}
            required
            className="
              w-full rounded-[12px] border border-gray-200
              bg-white/90 px-4 py-3 text-sm outline-none
              transition-all duration-200
              hover:border-[#2563eb]
              focus:border-[#2563eb]
              focus:ring-2 focus:ring-blue-100
            "
          />

          {errorMsg && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="
              flex w-full items-center justify-center
              rounded-[12px]
              bg-gradient-to-br from-[#2563eb] to-[#1d4ed8]
              py-3 text-[15px] font-semibold text-white
              transition-all duration-200
              hover:shadow-md
              active:scale-[0.98]
              disabled:cursor-not-allowed disabled:opacity-80
            "
          >
            {loading ? (
              <div className="h-[18px] w-[18px] animate-spin rounded-full border-[3px] border-white border-t-transparent" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-5 text-sm text-gray-500 text-center">
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