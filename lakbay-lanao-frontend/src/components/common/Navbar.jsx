import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebase/config";


function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        Provincial Tourism Office
      </div>

      <div className="nav-center">
        <span onClick={() => navigate("features")}>Features</span>
        <span onClick={() => navigate("/map")}>Map</span>
        <span onClick={() => navigate("/events")}>Upcoming Events</span>
      </div>

      <div className="nav-right">
        {!user ? (
          <button onClick={() => navigate("/login")}>
            Sign In
          </button>
        ) : (
          <div className="profile-section">
            <img
              src={user.photoURL || "/default-avatar.png"}
              alt="Profile"
              className="profile-avatar"
            />
            <button onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
