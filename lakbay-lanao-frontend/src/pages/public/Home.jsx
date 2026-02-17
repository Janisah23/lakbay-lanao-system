import Navbar from "../../components/common/Navbar";
import "./Home.css";

function Home() {
  return (
    <>
      <Navbar />

      <section className="hero">
        <div className="hero-content">
          <h1>LAKBAY LANAO</h1>
          <p>
            Lakbay Lanao is your comprehensive digital companion for exploring
            the rich cultural heritage and breathtaking destinations of Lanao del Sur.
          </p>

          <button className="explore-btn">Explore Now →</button>
        </div>

        {/* LOGIN CARD */}
        <div className="login-card">
          <h2>Sign in</h2>

          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />

          <button className="login-btn">Log in</button>

          <div className="divider">
            <span>or continue with</span>
          </div>

          <button className="google-btn">
            <img src="/google-icon.png" alt="Google" />
            Continue with Google
          </button>
        </div>
      </section>
      





      {/* DESTINATIONS SECTION */}
      <section className="destinations">
        <h2>Most visited tourist destinations</h2>
        <p className="subtitle">
          Explore the most popular destinations in Lanao del Sur
        </p>

        <div className="destination-grid">
          <div className="destination-card">
            <img src="/misty-cottage.jpg" alt="Misty Cottage" />
            <div className="card-info">
              <h3>Misty Cottage</h3>
              <span>Wato Balindong, Lanao del Sur</span>
            </div>
          </div>

          <div className="destination-card">
            <img src="/mt-matampor.jpg" alt="Mt. Matampor" />
            <div className="card-info">
              <h3>Mt. Matampor</h3>
              <span>Wato Balindong, Lanao del Sur</span>
            </div>
          </div>

          <div className="destination-card">
            <img src="/sumpitan-falls.jpg" alt="Sumpitan Falls" />
            <div className="card-info">
              <h3>Sumpitan Falls</h3>
              <span>Wato Balindong, Lanao del Sur</span>
            </div>
          </div>

          <div className="destination-card">
            <img src="/slangan-island.png" alt="Slangan Island" />
            <div className="card-info">
              <h3>Slangan Island</h3>
              <span>Wato Balindong, Lanao del Sur</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
<section className="features">
  <h2>Features</h2>
  <p className="subtitle">
    Everything you need for the perfect journey
  </p>

  <div className="features-grid">
    <div className="feature-card">
      <img src="/feature-map.png" alt="Interactive Map" />
      <h3>Interactive Map</h3>
      <p>
        Navigate tourist spots with our detailed interactive mapping system.
      </p>
    </div>

    <div className="feature-card">
      <img src="/feature-chatbot.png" alt="AI Chatbot" />
      <h3>AI Chatbot</h3>
      <p>
        Get instant answers and personalized recommendations.
      </p>
    </div>

    <div className="feature-card">
      <img src="/feature-itinerary.png" alt="Itinerary Builder" />
      <h3>Itinerary Builder</h3>
      <p>
        Plan your perfect trip with our smart itinerary tools.
      </p>
    </div>

    <div className="feature-card">
      <img src="/feature-events.png" alt="Events Calendar" />
      <h3>Events Calendar</h3>
      <p>
        Stay updated with festivals and cultural events.
      </p>
    </div>
  </div>
</section>


      
    </>
  );
}





export default Home;
