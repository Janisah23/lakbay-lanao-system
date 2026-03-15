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

<section className="pt-28 h-screen flex bg-gray-50">

{/* SIDEBAR */}

<div className="w-[380px] bg-white border-r flex flex-col">

{/* SEARCH */}

<div className="p-6 border-b">

<div className="flex items-center gap-3 border rounded-full px-4 py-3 shadow-sm">

<FiSearch className="text-gray-400"/>

<input
type="text"
placeholder="Search destinations..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="flex-1 outline-none text-sm"
/>

</div>

{/* FILTERS */}

<div className="flex gap-2 mt-4 flex-wrap">

{["all","destination","landmark","cultural"].map((filter)=>(
<button
key={filter}
onClick={()=>setActiveFilter(filter)}
className={`px-3 py-1 text-xs rounded-full border transition
${activeFilter===filter
? "bg-blue-600 text-white"
: "bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white"
}`}
>
{filter}
</button>
))}

</div>

</div>


{/* DESTINATION LIST */}

<div className="flex-1 overflow-y-auto p-6 space-y-4">

{filteredPlaces.map((place,index)=>(

<div
key={index}
className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition border"
>

<img
src={place.image}
className="w-20 h-20 rounded-lg object-cover"
/>

<div>

<p className="text-xs text-blue-600 uppercase">
{place.type}
</p>

<h3 className="font-medium text-gray-800">
{place.name}
</h3>

<p className="text-xs text-gray-400">
{place.location}
</p>

</div>

</div>

))}

</div>

</div>


{/* MAP AREA */}

<div className="flex-1">

<LanaoMap/>

</div>

</section>

</>

);

}

export default Map;