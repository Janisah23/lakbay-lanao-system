import Navbar from "../../components/common/Navbar";
import { useState } from "react";
import "./Home.css";
import LanaoMap from "../../components/map/LanaoMap";

function Home() {

   const [favorites, setFavorites] = useState([]);

  const events = [
    {
      title: "Araw ng Marawi",
      category: "Culture",
      date: "March 12 – 15",
      image: "/event1.jpg"
    },
    {
      title: "Freedom Run",
      category: "Sports",
      date: "April 5",
      image: "/event2.png"
    },
    {
      title: "Kambatalo Fun Run",
      category: "Live Show",
      date: "April 20",
      image: "/event3.jpg"
    },

    {
      title: "Tourism Festival",
      category: "Live Show",
      date: "February 29",
      image: "/event4.jpg"
    }
  ];

  const toggleFavorite = (index) => {
    if (favorites.includes(index)) {
      setFavorites(favorites.filter(i => i !== index));
    } else {
      setFavorites([...favorites, index]);
    }
  };

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

      
          
          <button className="explore-btn">Explore Now  →</button>
        </div>
      </section>
      

      {/* MAP*/}
      <section className="map-section">
        <h2>Explore Lanao del Sur</h2>
        <p className="subtitle">
          Discover tourist spots using our interactive map.
        </p>
        <div className="map-container">
          
          <LanaoMap />
        </div>
      </section>




      {/* DESTINATIONS*/}
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

              {/* UPCOMING EVENTS */}
        <section className="events-section">
          <h2>Upcoming Events</h2>
          <p className="subtitle">
            Discover festivals and celebrations in Lanao del Sur
          </p>

          <div className="events-grid">
            {events.map((event, index) => (
              <div key={index} className="event-card">
                <img src={event.image} alt={event.title} />

                <div className="event-info">
                  <span className="event-category">{event.category}</span>
                  <h3>{event.title}</h3>
                  <p>{event.date}</p>
                </div>

                <button
                  className="heart-btn"
                  onClick={() => toggleFavorite(index)}
                >
                  {favorites.includes(index) ? "❤️" : "🤍"}
                </button>
              </div>
            ))}
          </div>

  <button className="see-more-btn">
    See more events →
  </button>
</section>


      


      
    </>
  );
}





export default Home;
