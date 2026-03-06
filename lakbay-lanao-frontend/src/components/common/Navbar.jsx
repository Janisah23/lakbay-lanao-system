import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import { FiSearch } from "react-icons/fi";
import "./Navbar.css";

function Navbar() {

const navigate = useNavigate();

const [user, setUser] = useState(null);
const [showFeatures, setShowFeatures] = useState(false);
const [showEvents, setShowEvents] = useState(false);

const [showSearch, setShowSearch] = useState(false);
const [searchTerm, setSearchTerm] = useState("");
const [activeFilter, setActiveFilter] = useState("all");

const searchData = [

{
title:"Misty Cottage",
type:"destination",
description:"Scenic mountain cottage in Balindong",
image:"/misty-cottage.jpg"
},

{
title:"Mt. Matampor",
type:"destination",
description:"Popular hiking destination",
image:"/mt-matampor.jpg"
},

{
title:"Freedom Run",
type:"event",
description:"Annual solidarity marathon",
image:"/event2.png"
},

{
title:"Slangan Island",
type:"destination",
description:"Beautiful island destination",
image:"/slangan-island.png"
}

];

const filteredResults = searchData.filter((item)=>{

const matchSearch =
item.title.toLowerCase().includes(searchTerm.toLowerCase());

const matchFilter =
activeFilter === "all" || item.type === activeFilter;

return matchSearch && matchFilter;

});

useEffect(()=>{

const unsubscribe = onAuthStateChanged(auth,(currentUser)=>{
setUser(currentUser);
});

return ()=>unsubscribe();

},[]);

useEffect(()=>{

if(showSearch){
document.body.style.overflow = "hidden";
}else{
document.body.style.overflow = "auto";
}

},[showSearch]);

const handleLogout = async ()=>{

await signOut(auth);
navigate("/");

};

return(

<>

{/* NAVBAR */}

<nav
className="navbar"
onMouseLeave={()=>{
setShowFeatures(false);
setShowEvents(false);
}}
>

<div
className="nav-left"
onClick={()=>navigate("/")}>
<img src="/pto.png" alt="logo" className="nav-logo"/>
<span>Provincial Tourism Office</span>
</div>

<div className="nav-center">

<span onClick={()=>navigate("/")}>Home</span>

<div
className="nav-item"
onMouseEnter={()=>{
setShowFeatures(true);
setShowEvents(false);
}}
>
<span>Features</span>
</div>

<span onClick={()=>navigate("/itinerary")}>
Itinerary Builder
</span>

<span onClick={()=>navigate("/map")}>
Map
</span>

<div
className="nav-item"
onMouseEnter={()=>{
setShowEvents(true);
setShowFeatures(false);
}}
>
<span>Upcoming Events</span>
</div>

<span onClick={()=>navigate("/establishment")}>
Establishments
</span>

</div>

<div className="nav-right flex items-center gap-4">

<button
onClick={()=>setShowSearch(!showSearch)}
className="text-blue-600 hover:text-blue-50 transition"
>
<FiSearch size={23}/>
</button>

{!user ? (

<button onClick={()=>navigate("/login")}>
Sign In
</button>

) : (

<div className="profile-section">

<img
src={user.photoURL || "/default-avatar.png"}
alt="profile"
className="profile-avatar"
/>

<button onClick={handleLogout}>
Logout
</button>

</div>

)}

</div>

</nav>

{/* SEARCH MODAL */}

{showSearch && (

<div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-start pt-32">

<div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl p-8 border">

{/* SEARCH INPUT */}

<div className="flex items-center gap-4 border rounded-full px-6 py-4 shadow-sm">

<FiSearch className="text-gray-400 text-xl"/>

<input
type="text"
placeholder="Search destinations, events, establishments..."
value={searchTerm}
onChange={(e)=>setSearchTerm(e.target.value)}
className="flex-1 outline-none text-base"
/>

<button
onClick={()=>setShowSearch(false)}
className="text-gray-400 hover:text-red-500 text-lg"
>
✕
</button>

</div>

{/* FILTERS */}

<div className="flex gap-3 mt-6 flex-wrap">

{["All","Destination","Event","Establishment"].map((filter)=>(

<button
key={filter}
onClick={()=>setActiveFilter(filter)}
className={`px-4 py-2 rounded-full text-sm border transition
${activeFilter===filter
? "bg-blue-600 text-white"
: "bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white"
}`}
>

{filter}

</button>

))}

</div>

{/* RESULTS */}

<div className="space-y-4 mt-8 max-h-[350px] overflow-y-auto pr-2">

{searchTerm === "" && (

<p className="text-gray-400 text-sm">
Start typing to search destinations
</p>

)}

{filteredResults.map((item,index)=>(

<div
key={index}
className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition cursor-pointer"
>

<img
src={item.image}
alt={item.title}
className="w-20 h-20 object-cover rounded-lg"
/>

<div>

<p className="text-xs text-blue-600 uppercase">
{item.type}
</p>

<h3 className="font-semibold text-gray-800">
{item.title}
</h3>

<p className="text-sm text-gray-400">
{item.description}
</p>

</div>

</div>

))}

</div>

</div>

</div>

)}

{/* FEATURES PANEL */}

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
<img src="/feature-preview.png" alt="preview"/>
<span>Explore smarter with Lakbay Lanao</span>
</div>

</div>

)}

{/* EVENTS PANEL */}

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
<img src="/event-preview.png" alt="event"/>
<span>Discover upcoming celebrations</span>
</div>

</div>

)}

</>

);

}

export default Navbar;