import Navbar from "../../components/common/Navbar";
import { useState, useEffect } from "react";
import LanaoMap from "../../components/map/LanaoMap";
import TourismChatbot from "../../components/chatbot/TourismChatbot";
import Footer from "../../components/common/Footer";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination,Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "./Home.css";

function Home() {

const [favorites, setFavorites] = useState([]);

/* STATIC CONTENT TEMPORARILY */
const featured = [
{
title: "Ramadan Night Market",
summary: "Experience the vibrant night market during Ramadan.",
image: "/event1.jpg"
},
{
title: "Lake Lanao Sunset",
summary: "Witness the breathtaking sunset by the lake.",
image: "/event2.png"
}

];

const highlights = [
{
title: "Maranao Cultural Dance",
image: "/event3.jpg"
},
{
title: "Traditional Cuisine",
image: "/event4.jpg"
}
];

const articles = [
{
title: "Top 10 Places to Visit in Lanao del Sur",
summary: "Discover waterfalls, mountains, and cultural heritage.",
image: "/mt-matampor.jpg"
},
{
title: "Exploring Maranao Culture",
summary: "Learn about traditions, music, and crafts.",
image: "/sumpitan-falls.jpg"
},
{
title: "Hidden Waterfalls of Lanao",
summary: "Adventure through nature and scenic landscapes.",
image: "/slangan-island.png"
}
];

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
Lakbay Lanao is your digital companion for exploring the rich
culture and breathtaking destinations of Lanao del Sur.
</p>

<button className="explore-btn">
Explore Now →
</button>

</div>

</section>


{/* FEATURED HIGHLIGHTS */}

<section className="py-24 bg-gray-50">

<div className="max-w-7xl mx-auto px-6 text-center">

<h2 className="text-3xl font-semibold text-blue-600">
Featured Tourism Highlights
</h2>

<p className="text-gray-500 mt-2">
Content managed by Tourism Office CMS
</p>

<Swiper
modules={[Autoplay, Pagination, Navigation]}
autoplay={{ delay: 5000 }}
pagination={{ clickable: true }}
navigation={true}
loop={true}
slidesPerView={1}
className="mt-12"
>

{featured.map((item, index) => (

<SwiperSlide key={index}>

<div className="relative rounded-2xl overflow-hidden shadow-xl">

<img
src={item.image}
alt={item.title}
className="w-full h-[620px] object-cover"
/>

{/* TYPE LABEL */}

<span className="absolute top-6 left-6 bg-blue-600 text-white
px-4 py-1 rounded-full text-xs font-semibold shadow">
FEATURED
</span>

<div className="absolute bottom-0 left-0 right-0
flex flex-col items-center text-center
bg-gradient-to-t from-black/70 via-black/40 to-transparent
text-white pb-14 pt-24 px-6">

<h3 className="text-4xl font-bold">
{item.title}
</h3>

<p className="text-lg mt-3 max-w-2xl">
{item.summary}
</p>

</div>

</div>

</SwiperSlide>

))}

</Swiper>

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

{/* TOURISM CONTENT */}

<section className="py-24 px-6 bg-white">

<div className="max-w-7xl mx-auto">

<h2 className="text-3xl font-semibold text-blue-600 text-center">
Tourism Content
</h2>

<p className="text-gray-500 mt-2 text-center">
Stories, highlights, and announcements from Lanao del Sur
</p>


<div className="grid md:grid-cols-3 gap-6 mt-14">

{articles.map((article, index) => (

<div
key={index}
className="relative rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition cursor-pointer group"
>

{/* IMAGE */}
<img
src={article.image}
alt={article.title}
className="w-full h-[370px] object-cover group-hover:scale-105 transition duration-500"
/>


{/* LABEL */}
<span className={`absolute top-5 left-5 bg-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-md

${article.type === "Article" ? "bg-blue-600" : ""}
${article.type === "Highlight" ? "bg-green-600" : ""}
${article.type === "Featured" ? "bg-purple-600" : ""}
${article.type === "Announcement" ? "bg-red-600" : ""}

`}>
{article.type || "ARTICLE"}
</span>


{/* GRADIENT */}
<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>


{/* TEXT */}
<div className="absolute bottom-0 left-0 right-0 p-6 text-white text-left">

<h3 className="text-xl font-semibold">
{article.title}
</h3>

<p className="text-sm opacity-90 mt-1">
{article.summary}
</p>

<button className="mt-3 text-sm font-medium underline hover:text-gray-200">
Read More →
</button>

</div>

</div>

))}

</div>

</div>

</section>

{/* UPCOMING EVENTS */}

<section className="py-20 px-6 bg-white-600">

<div className="max-w-7xl mx-auto text-center">

<h2 className="text-3xl font-semibold text-blue-600">
Upcoming Events
</h2>

<p className="text-blue-600 mt-2">
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
className="absolute top-4 right-4 bg-white p-2 rounded-full shadow"
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

</div>

</section>


<TourismChatbot />
<Footer />

</>
);
}

export default Home;