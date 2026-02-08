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

        <div className="login-card">
          <h2>Sign in</h2>
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button>Log in</button>
        </div>
      </section>
    </>
  );
}

export default Home;




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
      <img src="/slangan-island.jpg" alt="Slangan Island" />
      <div className="card-info">
        <h3>Slangan Island</h3>
        <span>Wato Balindong, Lanao del Sur</span>
      </div>
    </div>
  </div>
  <div style={{ height: "500px", background: "red" }}></div>

</section>


