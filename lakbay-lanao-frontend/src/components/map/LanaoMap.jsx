import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { redIcon, blueIcon, goldIcon } from "./MapSetup";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useNavigate } from "react-router-dom";

const center = [7.8731, 124.2863];

function LanaoMap() {

const [spots,setSpots] = useState([]);
const navigate = useNavigate();

useEffect(()=>{

const fetchTourismData = async()=>{

try{

const snapshot = await getDocs(collection(db,"tourismData"));

const data = snapshot.docs
.map(doc=>({
id:doc.id,
...doc.data()
}))
.filter(item=>item.latitude && item.longitude);

setSpots(data);

}catch(error){

console.log("Map load error:",error);

}

};

fetchTourismData();

},[]);

return (

<MapContainer
center={center}
zoom={10}
minZoom={8}
maxZoom={17}
style={{ height: "600px", width: "100%" }}
>

<TileLayer
attribution="© OpenStreetMap contributors"
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>

{spots.map((spot)=>{

let icon;

if(spot.category === "Destination") icon = redIcon;
else if(spot.category === "Landmark") icon = blueIcon;
else if(spot.category === "Establishment") icon = goldIcon;
else icon = redIcon;

return(

<Marker
key={spot.id}
position={[spot.latitude,spot.longitude]}
icon={icon}
>

<Popup closeButton={false}>

<div className="w-[200px]">

<img
src={spot.imageURL}
alt={spot.name}
className="w-full h-28 object-cover rounded-md"
/>

<h4 className="font-semibold mt-2 text-blue-600">
{spot.name}
</h4>

<p className="text-xs text-gray-500">
{spot.location?.municipality}
</p>

<button
onClick={()=>navigate(`/place/${spot.id}`)}
className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded-full"
>
Explore
</button>

</div>

</Popup>

</Marker>

);

})}

</MapContainer>

);

}

export default LanaoMap;