import { useState, useEffect } from "react";
import {
  FiSearch,
  FiPlus,
  FiX,
  FiFilter,
  FiGrid,
  FiList,
  FiEdit2,
  FiArchive,
  FiRefreshCw,
  FiImage,
  FiVideo,
  FiCheckCircle,
} from "react-icons/fi";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase/config";

function ManageGallery() {
  const [openModal, setOpenModal] = useState(false);
  const [galleryList, setGalleryList] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [showArchived, setShowArchived] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    type: "",
  });

  const categories = [
    "Destination",
    "Establishment",
    "Landmark",
    "Cultural Heritage Site",
  ];

  const typeOptions = ["image", "video"];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "gallery"), (snapshot) => {
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setGalleryList(data);
    });

    return () => unsubscribe();
  }, []);

  const filteredGallery = galleryList.filter((item) => {
    const isArchived = item.status === "archived";

    if (!showArchived && isArchived) return false;
    if (showArchived && !isArchived) return false;

    const matchesSearch = item.title
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "" || item.category === selectedCategory;

    const matchesType = selectedType === "" || item.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      type: "",
    });
    setMediaFile(null);
    setEditingId(null);
  };

  const showToastMessage = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const handleArchive = async () => {
    if (!selectedId) return;

    try {
      await updateDoc(doc(db, "gallery", selectedId), {
        status: "archived",
      });

      showToastMessage("Media archived successfully!");
    } catch (error) {
      console.error("Archive failed:", error);
    }

    setShowConfirm(false);
    setSelectedId(null);
  };

  const handleRestore = async (id) => {
    try {
      await updateDoc(doc(db, "gallery", id), {
        status: "active",
      });

      showToastMessage("Media restored successfully!");
    } catch (error) {
      console.error("Restore failed:", error);
    }
  };

  const uploadToCloudinary = async (file, type) => {
    const uploadData = new FormData();

    uploadData.append("file", file);
    uploadData.append("upload_preset", "tourism_upload");

    const endpoint =
      type === "video"
        ? "https://api.cloudinary.com/v1_1/dbyz3shts/video/upload"
        : "https://api.cloudinary.com/v1_1/dbyz3shts/image/upload";

    const response = await fetch(endpoint, {
      method: "POST",
      body: uploadData,
    });

    const data = await response.json();

    if (!response.ok || !data.secure_url) {
      throw new Error(data.error?.message || "Cloudinary upload failed");
    }

    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let mediaURL = null;

      if (mediaFile) {
        mediaURL = await uploadToCloudinary(mediaFile, formData.type);
      }

      if (editingId) {
        await updateDoc(doc(db, "gallery", editingId), {
          title: formData.title,
          category: formData.category,
          type: formData.type,
          ...(mediaURL && { src: mediaURL }),
        });

        showToastMessage("Media updated successfully!");
      } else {
        if (!mediaURL) {
          alert("Upload failed. No media URL returned.");
          setLoading(false);
          return;
        }

        await addDoc(collection(db, "gallery"), {
          title: formData.title,
          category: formData.category,
          type: formData.type,
          src: mediaURL,
          status: "active",
          createdAt: serverTimestamp(),
        });

        showToastMessage("Media added successfully!");
      }

      setOpenModal(false);
      resetForm();
    } catch (error) {
      console.error("Save media failed:", error);
      alert("Something went wrong while saving media. Check console.");
    }

    setLoading(false);
  };

  const inputStyle =
    "w-full rounded-[18px] border border-blue-100 bg-white px-4 py-3 text-sm font-medium text-gray-600 outline-none shadow-sm transition duration-300 placeholder:text-gray-400 hover:border-[#2563eb]/40 hover:bg-blue-50/40 focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100";

  const secondaryButton =
    "inline-flex items-center justify-center gap-2 rounded-[18px] border border-[#2563eb]/20 bg-white px-5 py-3 text-sm font-medium text-[#2563eb] shadow-sm transition duration-300 hover:bg-blue-50";

  const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-[18px] bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-300 hover:bg-blue-700";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedType("");
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fbff] font-['Poppins']">
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10 lg:px-10">
        {/* HEADER */}
        <section className="mb-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
                Staff Gallery
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
                Manage Gallery
              </h1>

              <p className="mt-2 max-w-2xl text-base leading-relaxed text-gray-500">
                Upload, update, archive, and organize tourism images and videos
                for the public gallery.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowArchived(!showArchived)}
                className={
                  showArchived
                    ? "inline-flex items-center justify-center rounded-[18px] border border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-red-500 shadow-sm transition hover:bg-red-100"
                    : secondaryButton
                }
              >
                {showArchived ? "View Active Media" : "View Archived"}
              </button>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setOpenModal(true);
                }}
                className={primaryButton}
              >
                <FiPlus />
                Add Media
              </button>
            </div>
          </div>
        </section>

        {/* TOOLBAR */}
        <section className="mb-8 rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#2563eb]">
                Gallery Library
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Browse uploaded media by title, category, and media type.
              </p>
            </div>

            {(searchTerm || selectedCategory || selectedType) && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-red-100 bg-white px-4 py-2.5 text-sm font-medium text-red-500 shadow-sm transition hover:bg-red-50"
              >
                <FiX />
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_220px_170px_auto]">
            <div className="relative w-full">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />

              <input
                type="text"
                placeholder="Search media titles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputStyle} pl-11 pr-11`}
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                >
                  <FiX className="text-base" />
                </button>
              )}
            </div>

            <div className="relative w-full">
              <FiFilter className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`${inputStyle} cursor-pointer appearance-none pl-11`}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full">
              <FiImage className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={`${inputStyle} cursor-pointer appearance-none pl-11 capitalize`}
              >
                <option value="">All Types</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            <div className="flex h-[48px] items-center rounded-[18px] border border-blue-100 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex h-full items-center justify-center gap-2 rounded-[14px] px-4 text-sm font-medium transition ${
                  viewMode === "list"
                    ? "bg-blue-50 text-[#2563eb]"
                    : "text-gray-500 hover:bg-blue-50/60 hover:text-[#2563eb]"
                }`}
              >
                <FiList className="text-lg" />
                List
              </button>

              <button
                type="button"
                onClick={() => setViewMode("tiles")}
                className={`flex h-full items-center justify-center gap-2 rounded-[14px] px-4 text-sm font-medium transition ${
                  viewMode === "tiles"
                    ? "bg-blue-50 text-[#2563eb]"
                    : "text-gray-500 hover:bg-blue-50/60 hover:text-[#2563eb]"
                }`}
              >
                <FiGrid className="text-lg" />
                Tiles
              </button>
            </div>
          </div>
        </section>

        {/* DISPLAY */}
        {filteredGallery.length === 0 ? (
          <section className="flex flex-col items-center justify-center rounded-[28px] border border-blue-100 bg-white px-6 py-20 text-center shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#2563eb]">
              <FiSearch className="text-2xl" />
            </div>

            <h3 className="text-lg font-semibold text-gray-700">
              No media found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filters.
            </p>
          </section>
        ) : viewMode === "list" ? (
          <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-12 gap-4 border-b border-blue-50 bg-[#f8fbff] px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <span className="col-span-2">Preview</span>
                  <span className="col-span-3">Title</span>
                  <span className="col-span-3">Category</span>
                  <span className="col-span-2">Type / Status</span>
                  <span className="col-span-2 text-center">Actions</span>
                </div>

                <div className="max-h-[600px] overflow-y-auto">
                  {filteredGallery.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 items-center gap-4 border-b border-blue-50 px-6 py-4 text-sm transition duration-300 last:border-b-0 hover:bg-blue-50/50"
                    >
                      <div className="col-span-2">
                        {item.type === "image" ? (
                          <div className="h-14 w-20 overflow-hidden rounded-[14px] border border-blue-100 bg-[#f8fbff] shadow-sm">
                            <img
                              src={item.src}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="relative flex h-14 w-20 items-center justify-center overflow-hidden rounded-[14px] border border-blue-100 bg-slate-800 shadow-sm">
                            <video
                              src={item.src}
                              className="h-full w-full object-cover opacity-60"
                              muted
                              playsInline
                              preload="metadata"
                            />

                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/30">
                                <span className="ml-0.5 text-[10px] text-white">
                                  ▶
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="col-span-3 pr-2">
                        <p className="line-clamp-2 font-semibold text-gray-700">
                          {item.title}
                        </p>
                      </div>

                      <div className="col-span-3">
                        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#2563eb]">
                          {item.category}
                        </span>
                      </div>

                      <div className="col-span-2 flex flex-col items-start gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold capitalize ${
                            item.type === "video"
                              ? "border-purple-100 bg-purple-50 text-purple-600"
                              : "border-blue-100 bg-blue-50 text-[#2563eb]"
                          }`}
                        >
                          {item.type === "video" ? <FiVideo /> : <FiImage />}
                          {item.type}
                        </span>

                        {showArchived && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                            Archived
                          </span>
                        )}
                      </div>

                      <div className="col-span-2 flex items-center justify-center gap-2">
                        {!showArchived ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(item.id);
                                setFormData({
                                  title: item.title,
                                  category: item.category,
                                  type: item.type,
                                });
                                setOpenModal(true);
                              }}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm transition hover:bg-blue-50 hover:text-[#2563eb]"
                            >
                              <FiEdit2 />
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedId(item.id);
                                setShowConfirm(true);
                              }}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-500 shadow-sm transition hover:bg-red-50"
                            >
                              <FiArchive />
                              Archive
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRestore(item.id)}
                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-green-100 bg-white px-3 py-2 text-xs font-semibold text-green-600 shadow-sm transition hover:bg-green-50"
                          >
                            <FiRefreshCw />
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(37,99,235,0.08)]"
              >
                <div className="relative h-48 flex-shrink-0 overflow-hidden bg-[#f8fbff]">
                  {item.type === "image" ? (
                    <img
                      src={item.src}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                    />
                  ) : (
                    <div className="relative h-full w-full bg-slate-800">
                      <video
                        src={item.src}
                        className="h-full w-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-[1.015]"
                        muted
                        playsInline
                        preload="metadata"
                      />

                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/20">
                          <span className="ml-1 text-lg text-white">▶</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="absolute left-3 top-3 rounded-full border border-white/80 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm">
                    {item.type}
                  </div>

                  {showArchived && (
                    <div className="absolute right-3 top-3 rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
                      Archived
                    </div>
                  )}
                </div>

                <div className="flex flex-grow flex-col px-5 pb-5 pt-4">
                  <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
                    {item.category}
                  </span>

                  <h4 className="line-clamp-2 min-h-[48px] text-base font-bold text-gray-700 transition group-hover:text-[#2563eb]">
                    {item.title}
                  </h4>

                  <div className="mt-auto flex items-center gap-3 border-t border-blue-50 pt-4">
                    {!showArchived ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setFormData({
                              title: item.title,
                              category: item.category,
                              type: item.type,
                            });
                            setOpenModal(true);
                          }}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-blue-100 bg-white py-2 text-xs font-semibold text-gray-600 shadow-sm transition hover:bg-blue-50 hover:text-[#2563eb]"
                        >
                          <FiEdit2 />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedId(item.id);
                            setShowConfirm(true);
                          }}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-100 bg-white py-2 text-xs font-semibold text-red-500 shadow-sm transition hover:bg-red-50"
                        >
                          <FiArchive />
                          Archive
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRestore(item.id)}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-green-100 bg-white py-2 text-xs font-semibold text-green-600 shadow-sm transition hover:bg-green-50"
                      >
                        <FiRefreshCw />
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-blue-100 bg-white p-7 shadow-[0_14px_35px_rgba(37,99,235,0.10)]">
            <button
              type="button"
              onClick={() => {
                setOpenModal(false);
                resetForm();
              }}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-gray-400 transition hover:text-red-500"
            >
              <FiX className="text-lg" />
            </button>

            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
                <FiImage className="text-xl" />
              </div>

              <h3 className="text-2xl font-bold text-[#2563eb]">
                {editingId ? "Edit Media Details" : "Upload New Media"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add gallery images or videos with category and type details.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Media Title
                </label>

                <input
                  type="text"
                  placeholder="e.g. Festival Highlights"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Category
                </label>

                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                  className={`${inputStyle} cursor-pointer appearance-none`}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Media Type
                </label>

                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  required
                  className={`${inputStyle} cursor-pointer appearance-none capitalize`}
                >
                  <option value="">Select Type</option>
                  {typeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-[18px] border border-blue-100 bg-[#f8fbff] p-4">
                <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {editingId ? "Replace File Optional" : "Upload File"}
                </label>

                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setMediaFile(e.target.files[0])}
                  {...(!editingId && { required: true })}
                  className="w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-bold file:text-[#2563eb] hover:file:bg-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-blue-50 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setOpenModal(false);
                    resetForm();
                  }}
                  className="rounded-full border border-[#2563eb]/20 bg-white px-6 py-3 text-sm font-medium text-[#2563eb] shadow-sm transition hover:bg-blue-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex min-w-[140px] items-center justify-center rounded-full bg-[#2563eb] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    "Save Media"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-sm rounded-[28px] border border-blue-100 bg-white p-7 text-center shadow-[0_14px_35px_rgba(37,99,235,0.10)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
              <FiArchive className="text-3xl" />
            </div>

            <h3 className="text-xl font-bold text-gray-700">
              Archive Media?
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              This media will be hidden from the public gallery. You can
              restore it later.
            </p>

            <div className="mt-8 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="w-full rounded-full border border-[#2563eb]/20 bg-white px-5 py-3 text-sm font-medium text-[#2563eb] transition hover:bg-blue-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleArchive}
                className="w-full rounded-full bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Yes, Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 rounded-[20px] border border-green-100 bg-white px-6 py-4 text-sm font-medium text-gray-600 shadow-[0_14px_35px_rgba(37,99,235,0.10)]">
          <FiCheckCircle className="text-lg text-green-500" />
          {toast}
        </div>
      )}
    </div>
  );
}

export default ManageGallery;