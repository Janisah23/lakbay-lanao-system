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
  const [visibleCount, setVisibleCount] = useState(16);

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

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(18);
  }, [filter, typeFilter]);

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

  // Only show up to visibleCount items
  const visibleMedia = filteredMedia.slice(0, visibleCount);
  const hasMore = filteredMedia.length > visibleCount;

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

    const prev =
      (currentIndex - 1 + filteredMedia.length) % filteredMedia.length;

    setSelected(filteredMedia[prev]);
    setCurrentIndex(prev);
  };

  useEffect(() => {
    if (!selected) return;

    const handleKeyDown = (event) => {
      if (event.key === "ArrowRight") {
        nextMedia();
      }

      if (event.key === "ArrowLeft") {
        prevMedia();
      }

      if (event.key === "Escape") {
        setSelected(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selected, currentIndex, filteredMedia]);

  const chunkArray = (array, size) => {
    const chunks = [];

    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }

    return chunks;
  };

  const mediaChunks = chunkArray(visibleMedia, 9);

  const bentoPattern = [
    "md:col-start-1 md:col-end-3 md:row-start-1 md:row-end-2",
    "md:col-start-2 md:col-end-4 md:row-start-2 md:row-end-4",
    "md:col-start-3 md:col-end-4 md:row-start-1 md:row-end-2",
    "md:col-start-4 md:col-end-5 md:row-start-1 md:row-end-3",
    "md:col-start-1 md:col-end-2 md:row-start-3 md:row-end-5",
    "md:col-start-4 md:col-end-5 md:row-start-3 md:row-end-4",
    "md:col-start-3 md:col-end-5 md:row-start-4 md:row-end-5",
    "md:col-start-2 md:col-end-3 md:row-start-4 md:row-end-5",
    "md:col-start-1 md:col-end-2 md:row-start-2 md:row-end-3",
  ];

  return (
    <>
      <Navbar />

      <section className="min-h-screen bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff] px-4 pb-24 pt-28 sm:px-6 md:pt-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          {/* HEADER */}
          <div className="text-center">
            
            <h1 className="text-2xl font-bold leading-snug tracking-tight text-[#2563eb] sm:text-3xl md:text-4xl">
              Multimedia Gallery
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-base">
              Explore the beauty of Lanao del Sur through photos and videos
            </p>
          </div>

          {/* FILTER */}
          <div className="mx-auto mt-8 max-w-5xl rounded-[24px] border border-blue-100/80 bg-white/80 p-4 shadow-[0_14px_40px_rgba(37,99,235,0.08)] backdrop-blur-xl sm:mt-10 sm:rounded-[28px] sm:p-5">
            {/* MEDIA TYPE FILTER */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {mediaTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setTypeFilter(type.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:py-2 sm:text-sm ${
                    typeFilter === type.value
                      ? "border-[#2563eb] bg-[#2563eb] text-white shadow-[0_8px_18px_rgba(37,99,235,0.2)]"
                      : "border-blue-100 bg-white/80 text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="my-4 border-t border-blue-50" />

            {/* CATEGORY FILTER */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              {categories.map((cat, index) => (
                <button
                  key={index}
                  onClick={() => setFilter(cat)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition sm:px-4 sm:py-2 sm:text-sm ${
                    filter === cat
                      ? "border-[#2563eb] bg-[#2563eb] text-white shadow-[0_8px_18px_rgba(37,99,235,0.2)]"
                      : "border-blue-100 bg-white/80 text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* BENTO GALLERY GRID */}
          <div className="mt-12 lg:mt-14">
            {filteredMedia.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-blue-100 bg-white/80 py-16 text-center text-sm text-gray-400 shadow-sm backdrop-blur-md md:rounded-[28px] md:py-20">
                No media available for this filter.
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                {mediaChunks.map((chunk, chunkIndex) => (
                  <div
                    key={chunkIndex}
                    className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:auto-rows-[145px] lg:auto-rows-[170px] xl:auto-rows-[190px]"
                  >
                    {chunk.map((item, index) => {
                      const realIndex = chunkIndex * 9 + index;

                      return (
                        <div
                          key={`${item.source}-${item.id}`}
                          onClick={() => openMedia(item, realIndex)}
                          className={`group relative h-[210px] cursor-pointer overflow-hidden rounded-[24px] border border-white/80 bg-blue-50 shadow-[0_12px_30px_rgba(37,99,235,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_18px_40px_rgba(37,99,235,0.14)] sm:h-[250px] sm:rounded-[26px] md:h-auto md:rounded-[30px] ${bentoPattern[index]}`}
                        >
                          {item.type === "image" ? (
                            <img
                              src={item.src || "/default.jpg"}
                              alt={item.title}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                            />
                          ) : (
                            <>
                              <video
                                src={item.src || "/default-video.mp4"}
                                className="h-full w-full bg-black object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                                muted
                                playsInline
                                preload="metadata"
                              />

                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/45 shadow-lg backdrop-blur-[3px] sm:h-12 sm:w-12 lg:h-14 lg:w-14">
                                  <span className="ml-0.5 text-base text-white sm:ml-1 sm:text-lg lg:text-xl">
                                    ▶
                                  </span>
                                </div>
                              </div>
                            </>
                          )}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent opacity-85 transition duration-300 group-hover:opacity-95" />

                          <div className="absolute left-3 top-3 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur-md sm:left-4 sm:top-4 sm:text-[10px]">
                            {item.type}
                          </div>

                          <div className="absolute bottom-0 left-0 right-0 p-3 text-white sm:p-4 lg:p-5">
                            <p className="line-clamp-1 text-[8px] font-semibold uppercase tracking-widest text-white/75 sm:text-[10px] lg:text-[11px]">
                              {item.category}
                            </p>

                            <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-tight text-white sm:text-base lg:text-lg lg:leading-snug">
                              {item.title}
                            </h3>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* SHOW MORE */}
                {hasMore && (
                  <div className="flex flex-col items-center gap-2 pt-4">
                    <p className="text-xs text-gray-400">
                      Showing {visibleCount} of {filteredMedia.length} items
                    </p>
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 16)}
                      className="rounded-full border border-[#2563eb]/20 bg-white px-8 py-3 text-sm font-semibold text-[#2563eb] shadow-sm transition hover:bg-blue-50 hover:border-[#2563eb]/40"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* LIGHTBOX */}
      {selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 px-4 sm:px-6">
          <button
            onClick={() => setSelected(null)}
            className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl text-white shadow-sm backdrop-blur-[2px] transition hover:bg-white/20 sm:right-8 sm:top-6 sm:h-11 sm:w-11 sm:text-2xl"
          >
            ✕
          </button>

          {filteredMedia.length > 1 && (
            <>
              <button
                onClick={prevMedia}
                className="absolute left-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-3xl text-white shadow-sm backdrop-blur-[2px] transition hover:bg-white/20 sm:left-6 sm:h-12 sm:w-12 sm:text-4xl"
              >
                ‹
              </button>

              <button
                onClick={nextMedia}
                className="absolute right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-3xl text-white shadow-sm backdrop-blur-[2px] transition hover:bg-white/20 sm:right-6 sm:h-12 sm:w-12 sm:text-4xl"
              >
                ›
              </button>
            </>
          )}

          <div className="w-full max-w-5xl text-center">
            <div className="overflow-hidden rounded-[22px] border border-white/15 bg-white/10 p-1.5 shadow-2xl backdrop-blur-[2px] sm:rounded-[28px] sm:p-2">
              {selected.type === "image" ? (
                <img
                  src={selected.src}
                  alt={selected.title}
                  className="max-h-[74vh] w-full rounded-[18px] object-contain sm:max-h-[80vh] sm:rounded-[22px]"
                />
              ) : (
                <video
                  src={selected.src}
                  controls
                  autoPlay
                  className="max-h-[74vh] w-full rounded-[18px] sm:max-h-[80vh] sm:rounded-[22px]"
                />
              )}
            </div>

            <p className="mt-4 line-clamp-2 px-10 text-sm font-medium text-white sm:text-lg">
              {selected.title}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default Gallery;