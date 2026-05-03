import Navbar from "../../components/common/Navbar";
import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";

function Gallery() {
  const [selected, setSelected] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [media, setMedia] = useState([]);

  useEffect(() => {
    const unsubscribeTourism = onSnapshot(
      collection(db, "tourismData"),
      (snapshot) => {
        const tourismMedia = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            title: doc.data().name,
            category: (doc.data().category || "").toLowerCase(),
            type: "image",
            src: doc.data().imageURL,
            source: "tourismData",
            status: doc.data().status || "active",
          }))
          .filter(
            (item) =>
              item.src &&
              item.status !== "archived" &&
              [
                "destination",
                "establishment",
                "landmark",
                "cultural heritage site",
              ].includes(item.category)
          );

        setMedia((prev) => {
          const galleryOnly = prev.filter((item) => item.source === "gallery");
          return [...tourismMedia, ...galleryOnly];
        });
      }
    );

    const unsubscribeGallery = onSnapshot(
      collection(db, "gallery"),
      (snapshot) => {
        const galleryMedia = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            source: "gallery",
            category: (doc.data().category || "").toLowerCase(),
            type: (doc.data().type || "image").toLowerCase(),
          }))
          .filter(
            (item) =>
              item.src &&
              item.status !== "archived" &&
              [
                "destination",
                "establishment",
                "landmark",
                "cultural heritage site",
              ].includes(item.category)
          );

        setMedia((prev) => {
          const tourismOnly = prev.filter(
            (item) => item.source === "tourismData"
          );
          return [...tourismOnly, ...galleryMedia];
        });
      }
    );

    return () => {
      unsubscribeTourism();
      unsubscribeGallery();
    };
  }, []);

  const categories = [
    "all",
    "destination",
    "establishment",
    "landmark",
    "cultural heritage site",
  ];

  const mediaTypes = [
    { label: "All Media", value: "all" },
    { label: "Images", value: "image" },
    { label: "Videos", value: "video" },
  ];

  const filteredMedia = media.filter((item) => {
    const matchesCategory = filter === "all" || item.category === filter;
    const matchesType = typeFilter === "all" || item.type === typeFilter;

    return matchesCategory && matchesType;
  });

  const openMedia = (item, index) => {
    setSelected(item);
    setCurrentIndex(index);
  };

  const nextMedia = () => {
    if (filteredMedia.length === 0) return;

    const next = (currentIndex + 1) % filteredMedia.length;
    setSelected(filteredMedia[next]);
    setCurrentIndex(next);
  };

  const prevMedia = () => {
    if (filteredMedia.length === 0) return;

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
          <div className="mt-10 rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
            {/* MEDIA TYPE FILTER */}
            <div className="flex justify-center flex-wrap gap-3">
              {mediaTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setTypeFilter(type.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                    typeFilter === type.value
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="my-4 border-t border-gray-100" />

            {/* CATEGORY FILTER */}
            <div className="flex justify-center flex-wrap gap-3">
              {categories.map((cat, index) => (
                <button
                  key={index}
                  onClick={() => setFilter(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border capitalize transition ${
                    filter === cat
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* GALLERY GRID */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {filteredMedia.length === 0 ? (
              <div className="md:col-span-3 text-center text-gray-400 py-20">
                No media available for this filter.
              </div>
            ) : (
              filteredMedia.map((item, index) => (
                <div
                  key={`${item.source}-${item.id}`}
                  onClick={() => openMedia(item, index)}
                  className="relative rounded-2xl overflow-hidden bg-white border shadow-sm hover:shadow-lg transition duration-300 cursor-pointer group"
                >
                  {item.type === "image" ? (
                    <img
                      src={item.src || "/default.jpg"}
                      alt={item.title}
                      className="w-full h-72 object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="relative">
                      <video
                        src={item.src || "/default-video.mp4"}
                        className="w-full h-72 object-cover bg-black"
                        muted
                        playsInline
                        preload="metadata"
                      />

                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center shadow-lg">
                          <span className="text-white text-xl ml-1">▶</span>
                        </div>
                      </div>
                    </div>
                  )}

                

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end">
                    <div className="text-white p-4 opacity-0 group-hover:opacity-100 transition">
                      <p className="text-sm opacity-80 capitalize">
                        {item.category}
                      </p>
                      <h3 className="font-semibold">{item.title}</h3>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* LIGHTBOX */}
      {selected && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999]">
          <button
            onClick={() => setSelected(null)}
            className="absolute top-6 right-8 text-white text-3xl"
          >
            ✕
          </button>

          {filteredMedia.length > 1 && (
            <>
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
            </>
          )}

          <div className="max-w-5xl w-full px-6 text-center">
            {selected.type === "image" ? (
              <img
                src={selected.src}
                alt={selected.title}
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

            <p className="text-white mt-4 text-lg">{selected.title}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default Gallery;