import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import Navbar from "../../components/common/Navbar";

function PlaceDetails() {

const { id } = useParams();
const navigate = useNavigate();

const [place,setPlace] = useState(null);
const [nearby,setNearby] = useState([]);
const [rating,setRating] = useState(0);
const [loading,setLoading] = useState(true);

useEffect(()=>{

const fetchPlace = async ()=>{

try{

const docRef = doc(db,"tourismData",id);
const docSnap = await getDoc(docRef);

if(docSnap.exists()){
setPlace(docSnap.data());
}

}catch(error){
console.log(error);
}

};

const fetchNearby = async ()=>{

try{

const snapshot = await getDocs(collection(db,"tourismData"));

const data = snapshot.docs
.map(doc=>({id:doc.id,...doc.data()}))
.filter(item=>item.id !== id)
.slice(0,4);

setNearby(data);

}catch(error){

console.log(error);

}

};

Promise.all([fetchPlace(),fetchNearby()])
.then(()=>setLoading(false));

},[id]);

if(loading){

return(

<>
<Navbar/>

<div className="pt-40 text-center text-gray-500 text-lg">
Loading destination...
</div>

</>

);

}

if(!place){

return(

<>
<Navbar/>

<div className="pt-40 text-center text-gray-500 text-lg">
Place not found
</div>

</>

);

}

return(

<>
<Navbar/>

<section className="pt-28 pb-20 bg-gray-50 min-h-screen">

<div className="max-w-6xl mx-auto px-6">

{/* HERO IMAGE */}

<div className="rounded-2xl overflow-hidden shadow-lg">

<img
src={place.imageURL}
alt={place.name}
className="w-full h-[420px] object-cover"
/>

</div>

{/* TITLE */}

<div className="mt-8">

<h1 className="text-3xl font-semibold text-blue-600">
{place.name}
</h1>

<p className="text-gray-400 mt-1">
{place.location?.municipality}, {place.location?.province}
</p>

<div className="flex gap-3 mt-3">

<span className="bg-blue-100 text-blue-600 text-xs px-3 py-1 rounded-full">
{place.category}
</span>

<span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
{place.type}
</span>

</div>

</div>

{/* TOURIST RATING */}

<div className="mt-6">

<h3 className="font-semibold mb-2">
Tourist Rating
</h3>

<div className="flex items-center gap-3">

<div className="flex gap-1 text-2xl cursor-pointer">

{[1,2,3,4,5].map((star)=>(
<span
key={star}
onClick={()=>setRating(star)}
className={`transition ${
star <= rating
? "text-yellow-500 scale-110"
: "text-gray-300"
}`}
>
★
</span>
))}

</div>

<span className="text-gray-500 text-sm">
{rating > 0 ? `${rating} / 5` : "No rating yet"}
</span>

</div>

<p className="text-xs text-gray-400 mt-2">
Click a star to rate this place
</p>

</div>

{/* DESCRIPTION */}

<div className="mt-10">

<h3 className="text-lg font-semibold text-gray-800">
About this place
</h3>

<p className="text-gray-600 mt-3 leading-relaxed max-w-3xl">
{place.description}
</p>

</div>

{/* MAP PREVIEW */}

<div className="mt-12">

<h3 className="text-lg font-semibold text-gray-800 mb-6">
Location
</h3>

<div className="w-full h-[350px] rounded-xl overflow-hidden shadow-md">

{place.latitude && place.longitude ? (

<iframe
title="map"
width="100%"
height="100%"
loading="lazy"
style={{border:0}}
src={`https://www.google.com/maps?q=${place.latitude},${place.longitude}&z=14&output=embed`}
></iframe>

) : (

<div className="h-full flex items-center justify-center bg-gray-200">
<p className="text-gray-500">
Location coordinates not available
</p>
</div>

)}

</div>

</div>

{/* NEARBY ATTRACTIONS */}

<div className="mt-16">

<h3 className="text-xl font-semibold text-gray-800 mb-6">
Nearby Attractions
</h3>

<div className="grid md:grid-cols-4 gap-6">

{nearby.map(item=>(
<div
key={item.id}
onClick={()=>navigate(`/place/${item.id}`)}
className="bg-white rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer"
>

<img
src={item.imageURL}
className="h-36 w-full object-cover rounded-t-xl"
/>

<div className="p-4">

<p className="text-sm text-blue-600 uppercase">
{item.category}
</p>

<h4 className="font-semibold">
{item.name}
</h4>

<p className="text-xs text-gray-400">
{item.location?.municipality}
</p>

</div>

</div>
))}

</div>

</div>

</div>

</section>

</>

);

}

export default PlaceDetails;