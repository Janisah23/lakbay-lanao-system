import Navbar from "../../components/common/Navbar";
import LanaoMap from "../../components/map/LanaoMap";
import { useState } from "react";
import { FiSearch } from "react-icons/fi";

function Map() {

const [search,setSearch] = useState("");
const [activeFilter,setActiveFilter] = useState("all");

const places = [

{
name:"Misty Cottage",
location:"Balindong",
type:"destination",
image:"/misty-cottage.jpg"
},

{
name:"Mt. Matampor",
location:"Balindong",
type:"destination",
image:"/mt-matampor.jpg"
},

{
name:"Sumpitan Falls",
location:"Lanao del Sur",
type:"landmark",
image:"/sumpitan-falls.jpg"
},

{
name:"Torogan House",
location:"Marawi",
type:"cultural",
image:"/torogan.jpg"
},

];

const filteredPlaces = places.filter((place)=>{

const matchSearch =
place.name.toLowerCase().includes(search.toLowerCase());

const matchFilter =
activeFilter === "all" || place.type === activeFilter;

return matchSearch && matchFilter;

});

return(

<>
<Navbar/>

<section className="pt-28 px-6 pb-10 bg-gray-50 min-h-screen"> <div className="max-w-7xl mx-auto"> <h1 className="text-3xl font-semibold text-blue-600"> Explore Lanao del Sur </h1> <p className="text-gray-500 mt-2"> Discover tourist spots using our interactive map. </p> <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8"> {/* SIDEBAR */} <div className="lg:col-span-1 bg-white rounded-2xl shadow-md border p-5 h-[620px] overflow-y-auto"> {/* SEARCH */} <div className="relative mb-4"> <input type="text" placeholder="Search destinations..." className="w-full border rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /> </div> {/* FILTERS */} <div className="flex gap-2 flex-wrap mb-5"> <button className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs"> All </button> <button className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs hover:bg-blue-600 hover:text-white"> Destination </button> <button className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs hover:bg-blue-600 hover:text-white"> Landmark </button> <button className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs hover:bg-blue-600 hover:text-white"> Cultural </button> </div> {/* DESTINATION LIST */} <div className="space-y-4"> {/* CARD */} <div className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-md transition cursor-pointer bg-gray-50"> <img src="/misty-cottage.jpg" className="w-16 h-16 rounded-lg object-cover" /> <div> <p className="text-xs text-blue-600 uppercase"> Destination </p> <h3 className="font-semibold text-gray-800 text-sm"> Misty Cottage </h3> <p className="text-xs text-gray-400"> Balindong </p> </div> </div> <div className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-md transition cursor-pointer bg-gray-50"> <img src="/mt-matampor.jpg" className="w-16 h-16 rounded-lg object-cover" /> <div> <p className="text-xs text-blue-600 uppercase"> Destination </p> <h3 className="font-semibold text-gray-800 text-sm"> Mt. Matampor </h3> <p className="text-xs text-gray-400"> Balindong </p> </div> </div> <div className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-md transition cursor-pointer bg-gray-50"> <img src="/sumpitan-falls.jpg" className="w-16 h-16 rounded-lg object-cover" /> <div> <p className="text-xs text-blue-600 uppercase"> Landmark </p> <h3 className="font-semibold text-gray-800 text-sm"> Sumpitan Falls </h3> <p className="text-xs text-gray-400"> Lanao del Sur </p> </div> </div> </div> </div> {/* MAP */} <div className="lg:col-span-3 relative"> <div className="rounded-2xl overflow-hidden shadow-lg border h-[620px]"> <LanaoMap /> </div> </div> </div> </div> </section>

</>

);

}

export default Map;