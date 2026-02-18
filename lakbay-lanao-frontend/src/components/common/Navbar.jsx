import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showFeatures, setShowFeatures] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

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
    <nav
      className="navbar"
      onMouseLeave={() => {
        setShowFeatures(false);
        setShowEvents(false);
      }}
    >
      <div className="nav-left" onClick={() => navigate("/")}>
      <img src="/pto.png" alt="Lakbay Lanao Logo" className="nav-logo" />
      <span>Provincial Tourism Office</span>
      </div>


      <div className="nav-center">

        {/* FEATURES MEGA MENU */}
        <div
          className="nav-item"
          onMouseEnter={() => {
            setShowFeatures(true);
            setShowEvents(false);
          }}
        >
          <span>Features</span>
        </div>
        

        {/* NORMAL ROUTE */}
        <span onClick={() => navigate("/itinerary")}>
          Itinerary Builder
        </span>

         {/* NORMAL ROUTE */}
        <span onClick={() => navigate("/favorites")}>
          Favorites
        </span>

         {/* NORMAL ROUTE */}
        <span onClick={() => navigate("/map")}>
          Map
        </span>

        {/* EVENTS MEGA MENU */}
        <div
          className="nav-item"
          onMouseEnter={() => {
            setShowEvents(true);
            setShowFeatures(false);
          }}
        >
          <span>Upcoming Events</span>
        </div>
          

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

      {/* FEATURES MEGA PANEL */}
      {showFeatures && (
        <div className="mega-menu">
          <div className="mega-left">
            <div className="mega-column">
              <h4>Interactive Map</h4>
              <p>Explore destinations visually</p>
            </div>

            <div className="mega-column">
              <h4>AI Chatbot</h4>
              <p>Instant travel assistance</p>
            </div>

            <div className="mega-column">
              <h4>Itinerary Builder</h4>
              <p>Plan your trip smartly</p>
            </div>

            <div className="mega-column">
              <h4>Events Calendar</h4>
              <p>Stay updated with festivals</p>
            </div>
          </div>

          <div className="mega-right">
            <img src="/feature-preview.png" alt="Feature Preview" />
            <span>Explore smarter with Lakbay Lanao</span>
          </div>
        </div>
      )}

      {/* EVENTS MEGA PANEL */}
      {showEvents && (
        <div className="mega-menu">
          <div className="mega-left">
            <div className="mega-column">
              <h4>Araw ng Marawi</h4>
              <p>Annual cultural celebration</p>
            </div>

            <div className="mega-column">
              <h4>Kambalato Fun Run</h4>
              <p>Community sports event</p>
            </div>

            <div className="mega-column">
              <h4>Freedom Run</h4>
              <p>Solidarity marathon</p>
            </div>

            <div className="mega-column">
              <h4>Seasonal Festivals</h4>
              <p>Celebrate Lanao traditions</p>
            </div>
          </div>

          <div className="mega-right">
            <img src="/event-preview.png" alt="Event Preview" />
            <span>Discover upcoming celebrations</span>
          </div>
        </div>
      )}

    </nav>
  );
}

export default Navbar;
