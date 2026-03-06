import Navbar from "../../components/common/Navbar";
import { useState } from "react";
import LanaoMap from "../../components/map/LanaoMap";
import TourismChatbot from "../../components/chatbot/TourismChatbot";
import "./Home.css";

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

{/* HERO */}
<section className="hero">

  <div className="hero-content">

    <div className="hero-title">
      <img
        src="/lakbay-logo.png"
        alt="Lakbay Lanao Logo"
        className="hero-logo"
      />

      <h1>LAKBAY LANAO</h1>
    </div>

    <p>
      Lakbay Lanao is your comprehensive digital companion for exploring
      the rich cultural heritage and breathtaking destinations of
      Lanao del Sur.
    </p>

    <button className="explore-btn">
      Explore Now →
    </button>

  </div>

</section>


{/* MAP */}
<section className="map-section">

<h2>Explore Lanao del Sur</h2>

<p className="subtitle">
Discover tourist spots using our interactive map.
</p>

<div className="map-container">
<LanaoMap />
</div>

</section>


{/* DESTINATIONS */}
<section className="destinations">

<h2>Most visited tourist destinations</h2>

<p className="subtitle">
Explore the most popular destinations in Lanao del Sur
</p>

<div className="destination-grid">

<div className="destination-card">
<img src="/misty-cottage.jpg" alt="Misty Cottage" />
<div className="destination-overlay">
<h3>Misty Cottage</h3>
<span>Wato Balindong, Lanao del Sur</span>
</div>
</div>

<div className="destination-card">
<img src="/mt-matampor.jpg" alt="Mt. Matampor" />
<div className="destination-overlay">
<h3>Mt. Matampor</h3>
<span>Wato Balindong, Lanao del Sur</span>
</div>
</div>

<div className="destination-card">
<img src="/sumpitan-falls.jpg" alt="Sumpitan Falls" />
<div className="destination-overlay">
<h3>Sumpitan Falls</h3>
<span>Wato Balindong, Lanao del Sur</span>
</div>
</div>

<div className="destination-card">
<img src="/slangan-island.png" alt="Slangan Island" />
<div className="destination-overlay">
<h3>Slangan Island</h3>
<span>Wato Balindong, Lanao del Sur</span>
</div>
</div>

</div>

</section>


{/* UPCOMING EVENTS */}
<section className="py-20 px-6 bg-blue-600">

<div className="max-w-7xl mx-auto text-center">

<h2 className="text-3xl font-semibold text-white">
Upcoming Events
</h2>

<p className="text-blue-100 mt-2">
Discover festivals and celebrations in Lanao del Sur
</p>

<div className="grid md:grid-cols-4 gap-5 mt-12">

{events.map((event, index) => (

<div
key={index}
className="relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition"
>

<img
src={event.image}
alt={event.title}
className="w-full h-52 object-cover"
/>

<button
onClick={() => toggleFavorite(index)}
className="absolute top-4 right-4 bg-white p-2 rounded-full shadow hover:scale-110 transition"
>
{favorites.includes(index) ? "❤️" : "🤍"}
</button>

<div className="p-5 text-left">

<span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
{event.category}
</span>

<h3 className="font-semibold text-lg mt-2 text-blue-600">
{event.title}
</h3>

<p className="text-gray-400 text-sm mt-1">
{event.date}
</p>

</div>

</div>

))}

</div>

<div className="mt-14">

<button
className="inline-flex items-center gap-2 bg-white text-blue-600
px-8 py-3 rounded-full font-medium
shadow-md hover:bg-gray-100 transition"
>
See more events →
</button>

</div>

</div>

</section>

{/* CHATBOT */}
<TourismChatbot />

</>
);
}

export default Home;