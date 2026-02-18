import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./Auth.css";


function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "tourist"
      });

      navigate("/tourist");

    } catch (error) {
      alert(error.message);
    }
  };

  return (
  <div className="auth-page">
    <div className="login-card">
      <h2>Sign Up</h2>

      <form onSubmit={handleSignup} className="auth-form"> 
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

        <button type="submit">Register</button>
      </form>

      <p className="signup-text">
        Already have an account?
        <span
          className="signup-link"
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
