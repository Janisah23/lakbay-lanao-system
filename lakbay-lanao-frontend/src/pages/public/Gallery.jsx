import Navbar from "../../components/common/Navbar";
import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore"; 
import { db } from "../../firebase/config";

function Gallery() {
  const [selected, setSelected] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState("All");
  const [media, setMedia] = useState([]);
  const [categories, setCategories] = useState(["All"]);

  useEffect(() => {
    // FIX 1: Match the capital "G" exactly as it is in your Firestore database
    const galleryQuery = query(
      collection(db, "tourismContent"),
      where("contentType", "==", "Gallery") 
    );

    const unsubscribe = onSnapshot(
      galleryQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMedia(data);

        // FIX 3: Automatically grab all unique categories from your database
        const uniqueCategories = [
          "All",
          ...new Set(data.map((item) => item.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);
      },
      (error) => {
        console.error("Error fetching gallery:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredMedia =
    filter === "All"
      ? media
      : media.filter((item) => item.category === filter);

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

          {/* DYNAMIC FILTER BUTTONS */}
          <div className="flex justify-center flex-wrap gap-3 mt-10">
            {categories.map((cat, index) => (
              <button
                key={index}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm border transition ${
                  filter === cat
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white hover:bg-blue-50 text-gray-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* GALLERY GRID */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {filteredMedia.map((item, index) => (
              <div
                key={index}
                onClick={() => openMedia(item, index)}
                className="relative rounded-2xl overflow-hidden bg-white border shadow-sm hover:shadow-lg transition duration-300 cursor-pointer group"
              >
                {/* FIX 2: Changed item.src to item.imageURL to match database */}
                {/* Fallback to video if you add a type field later, otherwise assume image */}
                {item.type === "video" ? (
                  <video
                    src={item.videoURL || item.imageURL}
                    className="w-full h-72 object-cover"
                  />
                ) : (
                  <img
                    src={item.imageURL || "/default.jpg"}
                    className="w-full h-72 object-cover group-hover:scale-105 transition duration-300"
                    alt={item.title || "Gallery image"}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="text-white p-5 w-full">
                    <p className="text-xs font-medium uppercase tracking-wider text-blue-300 mb-1">
                      {item.category}
                    </p>
                    <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIGHTBOX */}
      {selected && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[9999]">
          <button
            onClick={() => setSelected(null)}
            className="absolute top-6 right-8 text-white/70 hover:text-white text-3xl transition"
          >
            ✕
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); prevMedia(); }}
            className="absolute left-4 md:left-10 text-white/50 hover:text-white text-5xl transition"
          >
            ‹
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); nextMedia(); }}
            className="absolute right-4 md:right-10 text-white/50 hover:text-white text-5xl transition"
          >
            ›
          </button>

          <div className="max-w-5xl w-full px-12 text-center" onClick={(e) => e.stopPropagation()}>
            {selected.type === "video" ? (
              <video
                src={selected.videoURL || selected.imageURL}
                controls
                autoPlay
                className="w-full max-h-[75vh] rounded-xl shadow-2xl"
              />
            ) : (
              <img
                src={selected.imageURL}
                className="w-full max-h-[75vh] object-contain rounded-xl shadow-2xl mx-auto"
                alt={selected.title || "Selected media"}
              />
            )}

            <div className="mt-6 text-left inline-block w-full max-w-3xl">
              <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-md font-medium">
                {selected.category}
              </span>
              <h2 className="text-white mt-2 text-2xl font-semibold">
                {selected.title}
              </h2>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Gallery;