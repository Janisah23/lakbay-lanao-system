import { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Auth.css";


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const provider = new GoogleAuthProvider();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      redirectUser(userCredential.user);

    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: "tourist"
        });
      }

      redirectUser(user);

    } catch (error) {
      alert(error.message);
    }
  };

  const redirectUser = async (user) => {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const role = docSnap.data().role;

      if (role === "admin") navigate("/admin");
      else if (role === "staff") navigate("/staff");
      else navigate("/tourist");
    }
  };

  return (
  <div className="auth-page">
    <div className="login-card">
      <h2>Sign In</h2>

    <form onSubmit={handleLogin} className="auth-form">
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit" className="login-btn">
        Log in
      </button>
    </form>


      <div className="divider">or</div>

      <button className="google-btn" onClick={handleGoogleLogin}>
         <img src="Public/google-icon.png" alt="Continue with Google" />

        Continue with Google
      </button>

      <p className="signup-text">
        No account?
        <span
          className="signup-link"
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
