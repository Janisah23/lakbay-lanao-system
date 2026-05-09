import { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiAlertCircle, FiUserPlus, FiEye, FiEyeOff, FiMail, FiPhone } from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import loginpage from "../../assets/loginpage.png";

function Signup() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); 
  
  // Philippine Location States
  const [provincesList, setProvincesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Real-time Validation States
  const [passwordError, setPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");

  const [submitError, setSubmitError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // --- PHILIPPINE GEOGRAPHIC API (PSGC) ---
  
  // 1. Fetch Provinces on Mount
  useEffect(() => {
    fetch("https://psgc.gitlab.io/api/provinces")
      .then((res) => res.json())
      .then((data) => {
        // Manually add Metro Manila (NCR) since it's technically a Region, not a Province
        const combined = [...data, { code: "130000000", name: "Metro Manila (NCR)" }];
        const sorted = combined.sort((a, b) => a.name.localeCompare(b.name));
        setProvincesList(sorted);
      })
      .catch((err) => console.error("Failed to load provinces", err));
  }, []);

  // 2. Fetch Cities/Municipalities when Province changes
  useEffect(() => {
    if (!selectedProvince) {
      setCitiesList([]);
      return;
    }

    // If Metro Manila is selected, fetch the NCR region endpoint, otherwise fetch province endpoint
    const endpoint = selectedProvince === "130000000"
      ? `https://psgc.gitlab.io/api/regions/130000000/cities-municipalities`
      : `https://psgc.gitlab.io/api/provinces/${selectedProvince}/cities-municipalities`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => {
        const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
        setCitiesList(sorted);
      })
      .catch((err) => console.error("Failed to load cities", err));
  }, [selectedProvince]);


  // --- REAL-TIME VALIDATION LOGIC ---
  
  // Email Validation
  useEffect(() => {
    if (!email) setEmailError("");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setEmailError("Invalid email format.");
    else setEmailError("");
  }, [email]);

  // Phone Validation
  useEffect(() => {
    if (!phone) setPhoneError("");
    else if (phone.length < 10) setPhoneError("Phone number must be at least 10 digits.");
    else setPhoneError("");
  }, [phone]);

  // Password Validation
  useEffect(() => {
    if (!password) {
      setPasswordError("");
      return;
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
    
    if (password.length < 8) setPasswordError("Must be at least 8 characters.");
    else if (!hasUpper) setPasswordError("Must include an uppercase letter.");
    else if (!hasLower) setPasswordError("Must include a lowercase letter.");
    else if (!hasNum) setPasswordError("Must include a number.");
    else if (!hasSpecial) setPasswordError("Must include a special character (@$!%*?&).");
    else setPasswordError(""); // Valid
  }, [password]);


  const handleSignup = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSuccessMsg("");

    // Final checks before submission
    if (passwordError || phoneError || emailError) {
      setSubmitError("Please fix the errors in the form before submitting.");
      return;
    }
    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }
    if (!selectedProvince || !selectedCity) {
      setSubmitError("Please complete your location details.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      // Extract the actual text name of the province from the dropdown
      const provinceName = provincesList.find((p) => p.code === selectedProvince)?.name || "";

      await setDoc(doc(db, "users", user.uid), {
        fullName: fullName.trim(),
        username: username.trim(),
        email: user.email,
        phone: "+" + phone, 
        location: {
          country: "Philippines", // Hardcoded to PH
          province: provinceName,
          municipality: selectedCity
        },
        role: "tourist",
        emailVerified: false, 
        createdAt: serverTimestamp(),
      });

      setSuccessMsg("Your account has been created successfully. We have sent you an email with a verification link. Please check your inbox and click the link to continue.");
      setTimeout(() => navigate("/login"), 7000);
    } catch (error) {
      console.error(error);
      if (error.code === "auth/email-already-in-use") setSubmitError("Email is already registered.");
      else setSubmitError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full rounded-[14px] border border-blue-100 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition-all duration-200 hover:border-[#2563eb]/50 focus:border-[#2563eb] focus:ring-4 focus:ring-blue-100";
  const passwordInputStyle = "w-full rounded-[14px] border border-blue-100 bg-white px-4 py-3 pr-12 text-sm text-gray-700 outline-none transition-all duration-200 hover:border-[#2563eb]/50 focus:border-[#2563eb] focus:ring-4 focus:ring-blue-100";
  const errorTextStyle = "text-[10px] text-red-500 font-bold mt-1 ml-1 tracking-wide";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-y-auto bg-[#f3f9ff] bg-cover bg-center px-5 py-10" style={{ backgroundImage: `url(${loginpage})` }}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-[#f3f9ff]/60 to-[#dbeafe]/80" />

      <button onClick={() => navigate("/login")} className="absolute left-6 top-6 z-10 flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-bold text-gray-500 shadow-sm transition hover:text-[#2563eb]">
        <FiArrowLeft /> Back to Sign In
      </button>

      <div className="relative z-10 w-full max-w-[750px] rounded-[30px] border border-blue-100 bg-white/95 p-8 shadow-[0_20px_50px_rgba(37,99,235,0.1)] backdrop-blur-[6px] md:p-12 my-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb] border border-blue-100 shadow-sm">
          <FiUserPlus className="text-2xl" />
        </div>

        <h2 className="text-center text-[32px] font-extrabold text-[#2563eb] tracking-tight">Create Account</h2>
        <p className="mb-8 text-center text-sm text-gray-500 font-medium">Join Lakbay Lanao and explore the beauty of the south.</p>

        <form onSubmit={handleSignup} className="text-left">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            
            {/* ROW 1: Names */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Full Name</label>
              <input type="text" placeholder="Janisah Macarimbang" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputStyle} />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Username</label>
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required className={inputStyle} />
            </div>

            {/* ROW 2: Email & Phone */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Email Address</label>
              <input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={`${inputStyle} ${emailError ? 'border-red-300 bg-red-50/30' : ''}`} />
              {emailError && <p className={errorTextStyle}>{emailError}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Phone Number</label>
              <PhoneInput
                country={'ph'} 
                value={phone}
                onChange={phone => setPhone(phone)}
                containerClass="phone-container"
                inputClass={`!w-full !h-[48px] !rounded-[14px] !text-sm !font-sans ${phoneError ? '!border-red-300 !bg-red-50/30' : '!border-blue-100'}`}
                buttonClass={`!rounded-l-[14px] !bg-white ${phoneError ? '!border-red-300' : '!border-blue-100'}`}
                placeholder="Enter phone number"
              />
              {phoneError && <p className={errorTextStyle}>{phoneError}</p>}
            </div>

            {/* ROW 3: PH Provinces & Cities Side-by-Side */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Province</label>
              <select 
                value={selectedProvince} 
                onChange={(e) => { setSelectedProvince(e.target.value); setSelectedCity(""); }} 
                required 
                className={inputStyle}
              >
                <option value="">Select Province</option>
                {provincesList.map((prov) => (
                  <option key={prov.code} value={prov.code}>{prov.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">City / Municipality</label>
              <select 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)} 
                required 
                disabled={!selectedProvince} 
                className={`${inputStyle} disabled:bg-gray-100 disabled:cursor-not-allowed`}
              >
                <option value="">Select City/Municipality</option>
                {citiesList.map((city) => (
                  <option key={city.name} value={city.name}>{city.name}</option>
                ))}
              </select>
            </div>

            {/* ROW 4: Passwords */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className={`${passwordInputStyle} ${passwordError ? 'border-red-300 bg-red-50/30' : ''}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2563eb]">
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {passwordError && <p className={errorTextStyle}>{passwordError}</p>}
            </div>

            <div className="relative space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase ml-1">Confirm Password</label>
              <div className="relative">
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={`${passwordInputStyle} ${confirmPassword && password !== confirmPassword ? 'border-red-300 bg-red-50/30' : ''}`} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2563eb]">
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && <p className={errorTextStyle}>Passwords do not match.</p>}
            </div>
          </div>

          <AnimatePresence>
            {submitError && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 flex items-start gap-3 rounded-[16px] border border-red-100 bg-red-50 p-4 text-sm text-red-700 font-semibold shadow-sm">
                <FiAlertCircle className="mt-1 shrink-0 text-lg" /> {submitError}
              </motion.div>
            )}
            {successMsg && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex items-start gap-3 rounded-[16px] border border-blue-100 bg-blue-50 p-4 text-sm text-[#2563eb] font-semibold shadow-sm">
                <FiMail className="mt-1 shrink-0 text-lg" /> {successMsg}
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" disabled={loading} className="mt-8 flex w-full items-center justify-center rounded-[16px] bg-[#2563eb] py-4 text-[15px] font-bold text-white shadow-lg transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70">
            {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 font-medium">
          Already have an account? <span className="cursor-pointer font-bold text-[#2563eb] hover:underline" onClick={() => navigate("/login")}>Sign in</span>
        </p>
      </div>
    </div>
  );
}

export default Signup;