import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth,db } from "../../firebase/config";
import { FiSearch } from "react-icons/fi";
import "./Navbar.css";
import { collection, onSnapshot } from "firebase/firestore";
import { FiHeart, FiMap, FiLogOut } from "react-icons/fi";



function Navbar() {

const navigate = useNavigate();

const [user, setUser] = useState(null);
const [showFeatures, setShowFeatures] = useState(false);
const [showEvents, setShowEvents] = useState(false);

const [showSearch, setShowSearch] = useState(false);
const [searchTerm, setSearchTerm] = useState("");
const [activeFilter, setActiveFilter] = useState("all");
const [showExplore, setShowExplore] = useState(false);
const [eventsData, setEventsData] = useState([]);
const [openMenu, setOpenMenu] = useState(false);

const recentEvents = eventsData
  .filter(item => item.contentType === "Event") 
  .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)) 
  .slice(0, 4); 

const filteredResults = eventsData.filter((item) => {

  const matchSearch =
    item.title?.toLowerCase().includes(searchTerm.toLowerCase());

  const matchFilter =
    activeFilter === "all" ||
    item.contentType?.toLowerCase() === activeFilter.toLowerCase();

  return matchSearch && matchFilter;

});

useEffect(() => {
  const handleClickOutside = () => setOpenMenu(false);

  document.addEventListener("click", handleClickOutside);

  return () => document.removeEventListener("click", handleClickOutside);
}, []);

useEffect(() => {

  const unsubscribe = onSnapshot(
    collection(db, "tourismContent"),
    (snapshot) => {

      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setEventsData(data);
    }
  );

  return () => unsubscribe();

}, []);


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
className="fixed top-4 left-0 w-full z-[1000] flex justify-center">
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

{/* EXPLORE */}
<div
className="cursor-pointer hover:text-blue-800 transition"
onMouseEnter={()=>{
setShowExplore(true);
setShowFeatures(false);
setShowEvents(false);
}}
>
<span>Explore</span>
</div>

{/* FEATURES */}
<div
className="cursor-pointer hover:text-blue-800 transition"
onMouseEnter={()=>{
setShowFeatures(true);
setShowExplore(false);
setShowEvents(false);
}}
>
<span>Features</span>
</div>

{/* GALLERY */}
<span
onClick={()=>navigate("/gallery")}
className="cursor-pointer hover:text-blue-800 transition"
>
Gallery
</span>

{/* EVENTS */}
<div
className="cursor-pointer hover:text-blue-800 transition"
onMouseEnter={()=>{
setShowEvents(true);
setShowExplore(false);
setShowFeatures(false);
}}
>
<span>Events</span>
</div>

</div>



{/* RIGHT SIDE */}

<div className="flex items-center gap-4">

  {/* SEARCH */}
  <button
    onClick={()=>setShowSearch(!showSearch)}
    className="text-blue-600 hover:text-blue-800 transition"
  >
    <FiSearch size={24}/>
  </button>

  {!user ? (

    // NOT LOGGED IN
    <button
      onClick={()=>navigate("/login")}
      className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 transition shadow-sm"
    >
      Sign In
    </button>

  ) : (

    // LOGGED IN
    <div className="relative">

      <img
        src={user.photoURL || "/default-avatar.png"}
        alt="profile"
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenu(!openMenu);
          }}        
      className="w-9 h-9 rounded-full cursor-pointer"
      />
      {openMenu && (
          <div className="absolute right-0 mt-3 w-52 bg-white rounded-xl shadow-lg py-2 z-50 border animate-dropdown">
          <button
            onClick={() => {
              navigate("/favorites");
              setOpenMenu(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <FiHeart className="text-blue-600 text-lg" />
            Top Picks
          </button>

          <button
            onClick={() => {
              navigate("/itinerary");
              setOpenMenu(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <FiMap className="text-blue-600 text-lg" />
            Itineraries
          </button>

          <div className="border-t my-2"></div>

          <button
            onClick={() => {
              handleLogout();
              setOpenMenu(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
          >
            <FiLogOut className="text-red-500 text-lg" />
            Logout
          </button>

        </div>
      )}

    </div>

  )}

</div>
</div>

</nav>

{/* SEARCH MODAL */}

{showSearch && (

<div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-start pt-28 animate-fadeIn">
<div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6 border">
    
{/* SEARCH INPUT */}

<div className="flex items-center gap-3 border rounded-full px-4 py-2.5 shadow-sm">

<FiSearch className="text-gray-400 text-lg"/>

<input
type="text"
placeholder="Search destinations, events, establishments..."
value={searchTerm}
onChange={(e)=>setSearchTerm(e.target.value)}
className="flex-1 outline-none text-sm"/>

<button
onClick={()=>setShowSearch(false)}
className="text-gray-400 hover:text-red-500 text-base">
✕
</button>

</div>

{/* FILTERS */}

<div className="flex gap-2 mt-6 flex-wrap">

{[
  { label: "All", value: "all" },
  { label: "Destination", value: "destination" },
  { label: "Event", value: "event" },
  { label: "Establishment", value: "establishment" },
  { label: "Cultural & Heritage", value: "cultural" },
  { label: "Landmarks", value: "landmark" }
].map((filter)=>(

<button
key={filter.value}
onClick={()=>setActiveFilter(filter.value)}
className={`px-3 py-1.5 rounded-full text-xs border transition
${activeFilter===filter.value
? "bg-blue-600 text-white"
: "bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white"
}`}
>

{filter.label}

</button>

))}

</div>

<div className="space-y-3 mt-6 max-h-[280px] overflow-y-auto pr-1">

{searchTerm === "" && (

<p className="text-gray-400 text-xs">
Start typing to search destinations
</p>

)}

{filteredResults.map((item,index)=>(

<div
key={index}
className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition cursor-pointer"
>

<img
src={item.imageURL || "/default-image.png"}
alt={item.title}
className="w-16 h-16 object-cover rounded-lg"
/>

<div>

<p className="text-[10px] text-blue-600 uppercase">
{item.contentType}
</p>

<h3 className="font-semibold text-sm text-gray-800">
{item.title}
</h3>

<p className="text-xs text-gray-400">
{item.summary || "No description"}
</p>

</div>

</div>

))}

</div>

</div>

</div>

)}

{/* EXPLORE PANEL */}
{showExplore && (

<div
className="absolute top-[80px] left-0 w-full z-[999] flex justify-center"
onMouseLeave={()=>setShowExplore(false)}
>

<div className="w-[95%] max-w-7xl bg-white shadow-xl border rounded-2xl p-8 grid grid-cols-2 gap-8">

<div className="grid grid-cols-2 gap-6">

<div
onClick={()=>{
  navigate("/destinations");
  setShowExplore(false);
}}
className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
>
<h4 className="font-semibold text-blue-600">Destinations</h4>
<p className="text-sm text-gray-500">Tourist spots</p>
</div>

<div
onClick={()=>{
  navigate("/cultural");
  setShowExplore(false);
}}
className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
>
<h4 className="font-semibold text-blue-600">Cultural & Heritage</h4>
<p className="text-sm text-gray-500">Traditions & culture</p>
</div>

<div
onClick={()=>{
  navigate("/establishment");
  setShowExplore(false);
}}
className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
>
<h4 className="font-semibold text-blue-600">Establishments</h4>
<p className="text-sm text-gray-500">Hotels & restaurants</p>
</div>

<div
onClick={()=>{
  navigate("/landmarks");
  setShowExplore(false);
}}
className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
>
<h4 className="font-semibold text-blue-600">Landmarks</h4>
<p className="text-sm text-gray-500">Famous places</p>
</div>

</div>

<div className="flex flex-col items-center justify-center text-center">

<img src="/explore-preview.png"  className="w-60 h-24 object-cover rounded-xl shadow" />
<span className="text-sm text-gray-500 mt-4">
Explore Lanao
</span>

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

{/* INTERACTIVE MAP */}
<div
onClick={()=>{
  navigate("/map");
  setShowFeatures(false);
}}
className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
>
<h4 className="font-semibold text-blue-600">Interactive Map</h4>
<p className="text-sm text-gray-500">Explore destinations visually</p>
</div>

{/* AI CHATBOT */}
<div
onClick={()=>{
  if(!user){
    navigate("/login");
  } else {
    navigate("/chatbot");
  }
}}
className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
>
<h4 className="font-semibold text-blue-600">AI Chatbot</h4>
<p className="text-sm text-gray-500">Instant travel assistance</p>
</div>

{/* ITINERARY */}
<div
onClick={()=>{
  if(!user){
    navigate("/login");
  } else {
    navigate("/itinerary");
  }
}}
className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
>
<h4 className="font-semibold text-blue-600">Itinerary Builder</h4>
<p className="text-sm text-gray-500">Plan your trip smartly</p>
</div>

{/* EVENTS */}
<div
onClick={()=>{
  navigate("/events");
  setShowFeatures(false);
}}
className="cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition"
>
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

{/* LEFT SIDE (EVENT LIST) */}
<div className="grid grid-cols-2 gap-6">

{recentEvents.length === 0 ? (

<p className="text-gray-400 text-sm">
No events available
</p>

) : (

recentEvents.map((event) => (

<div key={event.id}>

<h4 className="font-semibold text-blue-600">
{event.title}
</h4>

<p className="text-sm text-gray-500">
{event.summary || "No description"}
</p>

</div>

))

)}

</div>

{/* RIGHT SIDE (IMAGE PREVIEW - SAME DESIGN) */}
<div className="flex flex-col items-center justify-center text-center">

<img
src="/event-preview.png"
className="w-64 rounded-xl shadow"
/>

<span className="text-sm text-gray-500 mt-4">
Discover recent events
</span>

</div>

</div>

</div>

)}

</>

);

}

export default Navbar;