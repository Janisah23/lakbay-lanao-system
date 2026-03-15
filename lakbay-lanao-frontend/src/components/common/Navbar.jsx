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
className="fixed top-4 left-0 w-full z-[1000] flex justify-center"

>

<div className="w-[95%] max-w-7xl bg-white border border-gray-200 rounded-full shadow-md px-6 py-3 flex items-center justify-between">


{/* LEFT LOGO */}

<div
onClick={()=>navigate("/")}
className="flex items-center gap-3 cursor-pointer"
>

<img
src="/pto.png"
alt="logo"
className="w-9 h-9 object-contain"
/>

<span className="font-semibold text-blue-600 text-sm whitespace-nowrap">
Provincial Tourism Office
</span>

</div>


{/* CENTER NAVIGATION */}

<div className="hidden lg:flex items-center gap-6 text-blue-600 text-sm font-medium">

<span
onClick={()=>navigate("/")}
className="cursor-pointer hover:text-blue-800 transition"
>
Home
</span>

<span
onClick={()=>navigate("/gallery")}
className="cursor-pointer hover:text-blue-800 transition"
>
Gallery
</span>

<span
onClick={()=>navigate("/itinerary")}
className="cursor-pointer hover:text-blue-800 transition"
>
Itinerary Builder
</span>

{/* FEATURES */}

<div
className="cursor-pointer hover:text-blue-800 transition"
onMouseEnter={()=>{
setShowFeatures(true);
setShowEvents(false);
}}
>
<span>Features</span>
</div>

<span
onClick={()=>navigate("/map")}
className="cursor-pointer hover:text-blue-800 transition"
>
Map
</span>



{/* EVENTS */}

<div
className="cursor-pointer hover:text-blue-800 transition"
onMouseEnter={()=>{
setShowEvents(true);
setShowFeatures(false);
}}
>
<span>Upcoming Events</span>
</div>



<span
onClick={()=>navigate("/establishment")}
className="cursor-pointer hover:text-blue-800 transition"

>
Establishments
</span>

</div>


{/* RIGHT SIDE */}

<div className="flex items-center gap-4">

<button
onClick={()=>setShowSearch(!showSearch)}
className="text-blue-600 hover:text-blue-800 transition"
>
<FiSearch size={24}/>
</button>


{!user ? (

<button
onClick={()=>navigate("/login")}
className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 transition shadow-sm"
>
Sign In
</button>

) : (

<div className="flex items-center gap-3">

<img
src={user.photoURL || "/default-avatar.png"}
alt="profile"
className="w-9 h-9 rounded-full object-cover"
/>

<button
onClick={handleLogout}
className="text-sm text-red-500 hover:text-red-700"
>
Logout
</button>

</div>

)}

</div>

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

<div
className="absolute top-[80px] left-0 w-full z-[999] flex justify-center"
onMouseLeave={()=>setShowFeatures(false)}
>

<div className="w-[95%] max-w-7xl bg-white shadow-xl border rounded-2xl p-8 grid grid-cols-2 gap-8">

<div className="grid grid-cols-2 gap-6">

<div>
<h4 className="font-semibold text-blue-600">Interactive Map</h4>
<p className="text-sm text-gray-500">Explore destinations visually</p>
</div>

<div>
<h4 className="font-semibold text-blue-600">AI Chatbot</h4>
<p className="text-sm text-gray-500">Instant travel assistance</p>
</div>

<div>
<h4 className="font-semibold text-blue-600">Itinerary Builder</h4>
<p className="text-sm text-gray-500">Plan your trip smartly</p>
</div>

<div>
<h4 className="font-semibold text-blue-600">Events Calendar</h4>
<p className="text-sm text-gray-500">Stay updated with festivals</p>
</div>

</div>

<div className="flex flex-col items-center justify-center text-center">

<img
src="/feature-preview.png"
className="w-64 rounded-xl shadow"
/>

<span className="text-sm text-gray-500 mt-4">
Explore smarter with Lakbay Lanao
</span>

</div>

</div>

</div>

)}

{/* EVENTS PANEL */}
{showEvents && (

<div
className="absolute top-[80px] left-0 w-full z-[999] flex justify-center"
onMouseLeave={()=>setShowEvents(false)}
>

<div className="w-[95%] max-w-7xl bg-white shadow-xl border rounded-2xl p-8 grid grid-cols-2 gap-8">

<div className="grid grid-cols-2 gap-6">

<div>
<h4 className="font-semibold text-blue-600">Araw ng Marawi</h4>
<p className="text-sm text-gray-500">Annual cultural celebration</p>
</div>

<div>
<h4 className="font-semibold text-blue-600">Kambalato Fun Run</h4>
<p className="text-sm text-gray-500">Community sports event</p>
</div>

<div>
<h4 className="font-semibold text-blue-600">Freedom Run</h4>
<p className="text-sm text-gray-500">Solidarity marathon</p>
</div>

<div>
<h4 className="font-semibold text-blue-600">Seasonal Festivals</h4>
<p className="text-sm text-gray-500">Celebrate Lanao traditions</p>
</div>

</div>

<div className="flex flex-col items-center justify-center text-center">

<img
src="/event-preview.png"
className="w-64 rounded-xl shadow"
/>

<span className="text-sm text-gray-500 mt-4">
Discover upcoming celebrations
</span>

</div>

</div>

</div>

)}


</>

);

}

export default Navbar;