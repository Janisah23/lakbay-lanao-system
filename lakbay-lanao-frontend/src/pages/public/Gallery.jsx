import Navbar from "../../components/common/Navbar";
import { useState } from "react";

function Gallery() {

const [selected, setSelected] = useState(null);
const [currentIndex, setCurrentIndex] = useState(0);
const [filter, setFilter] = useState("all");

const media = [

{
type: "image",
src: "/misty-cottage.jpg",
title: "Misty Cottage",
category: "destination"
},

{
type: "image",
src: "/mt-matampor.jpg",
title: "Mt. Matampor",
category: "destination"
},

{
type: "image",
src: "/sumpitan-falls.jpg",
title: "Sumpitan Falls",
category: "waterfall"
},

{
type: "image",
src: "/torogan.jpg",
title: "Torogan House",
category: "cultural"
},

{
type: "video",
src: "/tourism-video.mp4",
title: "Explore Lanao del Sur",
category: "tourism"
}

];

const categories = ["all","destination","waterfall","cultural","tourism"];

const filteredMedia =
filter === "all"
? media
: media.filter(item => item.category === filter);

const openMedia = (item, index) => {
setSelected(item);
setCurrentIndex(index);
};

const nextMedia = () => {
const next = (currentIndex + 1) % filteredMedia.length;
setSelected(filteredMedia[next]);
setCurrentIndex(next);
};

const prevMedia = () => {
const prev = (currentIndex - 1 + filteredMedia.length) % filteredMedia.length;
setSelected(filteredMedia[prev]);
setCurrentIndex(prev);
};

return (

<>
<Navbar />

<section className="pt-32 pb-20 px-6 bg-gray-50 min-h-screen">

<div className="max-w-7xl mx-auto">

<h1 className="text-3xl font-semibold text-blue-600 text-center">
Multimedia Gallery
</h1>

<p className="text-gray-500 text-center mt-2">
Explore the beauty of Lanao del Sur through photos and videos
</p>

{/* FILTER */}

<div className="flex justify-center flex-wrap gap-3 mt-10">

{categories.map((cat,index)=>(

<button
key={index}
onClick={()=>setFilter(cat)}
className={`px-4 py-2 rounded-full text-sm border transition
${filter===cat
? "bg-blue-600 text-white border-blue-600"
: "bg-white hover:bg-blue-50"
}`}
>

{cat}

</button>

))}

</div>

{/* GALLERY GRID */}

<div className="grid md:grid-cols-3 gap-6 mt-12">

{filteredMedia.map((item,index)=>(

<div
key={index}
onClick={()=>openMedia(item,index)}
className="relative rounded-2xl overflow-hidden bg-white border shadow-sm hover:shadow-lg transition duration-300 cursor-pointer group"
>

{item.type === "image" ? (

<img
src={item.src}
className="w-full h-72 object-cover group-hover:scale-105 transition duration-300"
/>

) : (

<video
src={item.src}
className="w-full h-72 object-cover"
/>

)}

<div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end">

<div className="text-white p-4 opacity-0 group-hover:opacity-100 transition">

<p className="text-sm opacity-80">
{item.category}
</p>

<h3 className="font-semibold">
{item.title}
</h3>

</div>

</div>

</div>

))}

</div>

</div>

</section>

{/* LIGHTBOX */}

{selected && (

<div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999]">

<button
onClick={()=>setSelected(null)}
className="absolute top-6 right-8 text-white text-3xl"
>
✕
</button>

<button
onClick={prevMedia}
className="absolute left-6 text-white text-4xl"
>
‹
</button>

<button
onClick={nextMedia}
className="absolute right-6 text-white text-4xl"
>
›
</button>

<div className="max-w-5xl w-full px-6 text-center">

{selected.type === "image" ? (

<img
src={selected.src}
className="w-full max-h-[80vh] object-contain rounded-xl"
/>

) : (

<video
src={selected.src}
controls
autoPlay
className="w-full max-h-[80vh] rounded-xl"
/>

)}

<p className="text-white mt-4 text-lg">
{selected.title}
</p>

</div>

</div>

)}

</>

);

}

export default Gallery;