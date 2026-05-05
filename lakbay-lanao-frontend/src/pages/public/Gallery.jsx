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

      <section className="min-h-screen bg-[#f3f9ff] px-6 pb-24 pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
              Multimedia Gallery
            </h1>

            <p className="mx-auto mt-2 max-w-2xl text-gray-500">
              Explore the beauty of Lanao del Sur through photos and videos
            </p>
          </div>

          {/* FILTER */}
          <div className="mt-10 rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_10px_28px_rgba(37,99,235,0.08)]">
            {/* MEDIA TYPE FILTER */}
            <div className="flex flex-wrap justify-center gap-3">
              {mediaTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setTypeFilter(type.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    typeFilter === type.value
                      ? "border-[#2563eb] bg-[#2563eb] text-white shadow-sm"
                      : "border-blue-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="my-4 border-t border-blue-50" />

            {/* CATEGORY FILTER */}
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((cat, index) => (
                <button
                  key={index}
                  onClick={() => setFilter(cat)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium capitalize transition ${
                    filter === cat
                      ? "border-[#2563eb] bg-[#2563eb] text-white shadow-sm"
                      : "border-blue-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* GALLERY GRID */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {filteredMedia.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-blue-100 bg-white py-20 text-center text-gray-400 shadow-sm md:col-span-3">
                No media available for this filter.
              </div>
            ) : (
              filteredMedia.map((item, index) => (
                <div
                  key={`${item.source}-${item.id}`}
                  onClick={() => openMedia(item, index)}
                  className="group relative h-[280px] cursor-pointer overflow-hidden rounded-[28px] border border-white/80 bg-blue-50 shadow-[0_10px_28px_rgba(37,99,235,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_14px_34px_rgba(37,99,235,0.12)]"
                >
                  {item.type === "image" ? (
                    <img
                      src={item.src || "/default.jpg"}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                    />
                  ) : (
                    <>
                      <video
                        src={item.src || "/default-video.mp4"}
                        className="h-full w-full bg-black object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                        muted
                        playsInline
                        preload="metadata"
                      />

                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/45 shadow-lg backdrop-blur-[2px]">
                          <span className="ml-1 text-xl text-white">▶</span>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-80 transition group-hover:opacity-95" />

                  <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-white/75">
                      {item.category}
                    </p>

                    <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-white">
                      {item.title}
                    </h3>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* LIGHTBOX */}
      {selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 px-6">
          <button
            onClick={() => setSelected(null)}
            className="absolute right-8 top-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl text-white shadow-sm backdrop-blur-[2px] transition hover:bg-white/20"
          >
            ✕
          </button>

          {filteredMedia.length > 1 && (
            <>
              <button
                onClick={prevMedia}
                className="absolute left-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-4xl text-white shadow-sm backdrop-blur-[2px] transition hover:bg-white/20"
              >
                ‹
              </button>

              <button
                onClick={nextMedia}
                className="absolute right-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-4xl text-white shadow-sm backdrop-blur-[2px] transition hover:bg-white/20"
              >
                ›
              </button>
            </>
          )}

          <div className="w-full max-w-5xl text-center">
            <div className="overflow-hidden rounded-[28px] border border-white/15 bg-white/10 p-2 shadow-2xl backdrop-blur-[2px]">
              {selected.type === "image" ? (
                <img
                  src={selected.src}
                  alt={selected.title}
                  className="max-h-[80vh] w-full rounded-[22px] object-contain"
                />
              ) : (
                <video
                  src={selected.src}
                  controls
                  autoPlay
                  className="max-h-[80vh] w-full rounded-[22px]"
                />
              )}
            </div>

            <p className="mt-4 text-lg font-medium text-white">
              {selected.title}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default Gallery;