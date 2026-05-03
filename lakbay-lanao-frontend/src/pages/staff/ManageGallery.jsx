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
  FiCheckCircle
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
  
  // Filters & Views
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [viewMode, setViewMode] = useState("list"); // "list" | "tiles"
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

  const categories = ["Destination", "Establishment", "Landmark", "Cultural Heritage Site"];
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

    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "" || item.category === selectedCategory;
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

  const inputStyle = "w-full rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100";

  return (
    <div className="w-full font-sans text-gray-800">
      <div className="max-w-7xl mx-auto pt-10 pb-20 px-6 lg:px-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#2563eb] tracking-tight">
              Manage Gallery
            </h1>
            <p className="text-gray-500 mt-2">
              Upload and organize images and videos across destinations and events.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition shadow-sm border ${
                showArchived 
                  ? "bg-gray-800 text-white border-gray-800 hover:bg-gray-700" 
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {showArchived ? "View Active Media" : "View Archived"}
            </button>

            <button
              onClick={() => {
                resetForm();
                setOpenModal(true);
              }}
              className="flex items-center gap-2 rounded-full bg-[#2563eb] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
            >
              <FiPlus />
              Add Media
            </button>
          </div>
        </div>

        {/* TOOLBAR: Search, Filters, & View Toggle */}
        <div className="flex flex-col xl:flex-row gap-4 mb-8 items-center w-full">
          
          <div className="flex flex-col md:flex-row gap-4 w-full flex-grow">
            {/* Search Bar */}
            <div className="relative w-full flex-grow">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
              <input
                type="text"
                placeholder="Search media titles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputStyle} pl-11`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition p-1"
                >
                  <FiX className="text-base" />
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="relative w-full md:w-[220px] flex-shrink-0">
              <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`${inputStyle} pl-11 appearance-none cursor-pointer`}
              >
                <option value="">All Categories</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="relative w-full md:w-[160px] flex-shrink-0">
              <FiImage className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={`${inputStyle} pl-11 appearance-none cursor-pointer capitalize`}
              >
                <option value="">All Types</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>

          {/* EXACT IMAGE ATTACHMENT VIEW TOGGLE (List | Tiles) */}
          <div className="flex items-center bg-white border border-gray-200 rounded-[16px] p-1.5 shadow-sm h-[48px] flex-shrink-0 w-full xl:w-auto">
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-[12px] text-sm transition-all duration-200 ${
                viewMode === "list" 
                  ? "bg-blue-50 text-[#2563eb] font-bold" 
                  : "text-gray-500 font-medium hover:text-gray-800"
              }`}
            >
              <FiList className="text-lg" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("tiles")}
              className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-[12px] text-sm transition-all duration-200 ${
                viewMode === "tiles" 
                  ? "bg-blue-50 text-[#2563eb] font-bold" 
                  : "text-gray-500 font-medium hover:text-gray-800"
              }`}
            >
              <FiGrid className="text-lg" />
              <span>Tiles</span>
            </button>
          </div>
          
        </div>

        {/* ==============================================================
            DYNAMIC DATA DISPLAY (LIST vs TILES)
        ============================================================== */}
        
        {filteredGallery.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#2563eb] mb-4">
              <FiSearch className="text-2xl" />
            </div>
            <h3 className="text-gray-800 font-bold text-lg mb-1">No media found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : viewMode === "list" ? (
          
          /* --- CONTENT VIEW (TABLE) --- */
          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span className="col-span-2">Preview</span>
                  <span className="col-span-3">Title</span>
                  <span className="col-span-3">Category</span>
                  <span className="col-span-2">Type / Status</span>
                  <span className="col-span-2 text-center">Actions</span>
                </div>

                {/* Body */}
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredGallery.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 text-sm border-b border-gray-50 items-center hover:bg-blue-50/30 transition-colors last:border-b-0">
                      
                      {/* Preview Image/Video */}
                      <div className="col-span-2">
                        {item.type === "image" ? (
                          <div className="w-20 h-14 rounded-[12px] bg-gray-100 overflow-hidden border border-gray-200 shadow-sm">
                            <img src={item.src} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="relative w-20 h-14 rounded-[12px] bg-black overflow-hidden border border-gray-200 shadow-sm flex items-center justify-center">
                            <video src={item.src} className="w-full h-full object-cover opacity-60" muted playsInline preload="metadata" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                                <span className="text-white text-[10px] ml-0.5">▶</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <div className="col-span-3 font-bold text-gray-900 line-clamp-2 pr-2">
                        {item.title}
                      </div>

                      {/* Category */}
                      <div className="col-span-3">
                        <span className="px-3 py-1.5 text-[11px] font-bold rounded-full bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wide">
                          {item.category}
                        </span>
                      </div>

                      {/* Type & Status */}
                      <div className="col-span-2 flex flex-col items-start gap-1.5">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold capitalize ${item.type === 'video' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                          {item.type === 'video' ? <FiVideo /> : <FiImage />} {item.type}
                        </div>
                        {showArchived && (
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Archived</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-2 flex items-center justify-center gap-2">
                        {!showArchived ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(item.id);
                                setFormData({ title: item.title, category: item.category, type: item.type });
                                setOpenModal(true);
                              }}
                              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full bg-white border border-gray-200 text-gray-700 hover:text-[#2563eb] hover:border-[#2563eb] hover:bg-blue-50 transition shadow-sm w-full"
                            >
                              <FiEdit2 /> Edit
                            </button>
                            <button
                              onClick={() => { setSelectedId(item.id); setShowConfirm(true); }}
                              className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full bg-white border border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200 transition shadow-sm w-full"
                            >
                              <FiArchive /> Archive
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRestore(item.id)}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full bg-white border border-gray-200 text-green-600 hover:bg-green-50 hover:border-green-200 transition shadow-sm w-full"
                          >
                            <FiRefreshCw /> Restore
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          
          /* --- TILES VIEW (GRID) --- */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
            {filteredGallery.map((item) => (
              <div key={item.id} className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-300 group flex flex-col h-full">
                
                {/* Media Top Half */}
                <div className="h-48 bg-gray-100 relative overflow-hidden flex-shrink-0">
                  {item.type === "image" ? (
                    <img src={item.src} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="relative w-full h-full bg-black group-hover:scale-105 transition-transform duration-500">
                      <video src={item.src} className="w-full h-full object-cover opacity-70" muted playsInline preload="metadata" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 group-hover:bg-white/40 transition">
                          <span className="text-white text-lg ml-1 drop-shadow-md">▶</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <div className="bg-white/95 backdrop-blur-sm p-2 rounded-full shadow-sm text-gray-700">
                      {item.type === 'video' ? <FiVideo className="text-sm" /> : <FiImage className="text-sm" />}
                    </div>
                  </div>
                  
                  {showArchived && (
                    <div className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm text-[10px] font-bold text-white uppercase tracking-wider">
                      Archived
                    </div>
                  )}
                </div>

                {/* Content Bottom Half */}
                <div className="p-5 flex flex-col flex-grow">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563eb] mb-2">{item.category}</span>
                  <h4 className="font-bold text-gray-900 text-lg mb-4 line-clamp-2 group-hover:text-[#2563eb] transition-colors">{item.title}</h4>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100">
                    {!showArchived ? (
                      <>
                        <button 
                          onClick={() => {
                            setEditingId(item.id);
                            setFormData({ title: item.title, category: item.category, type: item.type });
                            setOpenModal(true);
                          }}
                          className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-[12px] text-xs font-bold hover:bg-blue-50 hover:text-[#2563eb] hover:border-[#2563eb] transition shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <FiEdit2 /> Edit
                        </button>
                        <button 
                          onClick={() => { setSelectedId(item.id); setShowConfirm(true); }}
                          className="flex-1 bg-white border border-gray-200 text-red-600 py-2 rounded-[12px] text-xs font-bold hover:bg-red-50 hover:border-red-200 transition shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <FiArchive /> Archive
                        </button>
                      </>
                    ) : (
                      <button 
                          onClick={() => handleRestore(item.id)}
                          className="w-full bg-white border border-gray-200 text-green-600 py-2 rounded-[12px] text-xs font-bold hover:bg-green-50 hover:border-green-200 transition shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <FiRefreshCw /> Restore
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL (ADD / EDIT) */}
      {openModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[28px] shadow-2xl p-8 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setOpenModal(false);
                resetForm();
              }}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
            >
              <FiX className="text-lg" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? "Edit Media Details" : "Upload New Media"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Media Title</label>
                <input
                  type="text"
                  placeholder="e.g. Festival Highlights"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className={`${inputStyle} appearance-none cursor-pointer`}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Media Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  className={`${inputStyle} appearance-none cursor-pointer capitalize`}
                >
                  <option value="">Select Type</option>
                  {typeOptions.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-[12px] border border-gray-200 p-4 bg-gray-50">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  {editingId ? "Replace File (optional)" : "Upload File"}
                </label>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setMediaFile(e.target.files[0])}
                  {...(!editingId && { required: true })}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-[#2563eb] hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setOpenModal(false); resetForm(); }}
                  className="px-6 py-3 rounded-full text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center px-8 py-3 rounded-full text-sm font-bold text-white bg-[#2563eb] shadow-sm hover:shadow-md hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed min-w-[140px]"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    "Save Media"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM ARCHIVE MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-[24px] p-8 w-full max-w-sm shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <FiArchive className="text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Archive Media?</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              This media will be hidden from the public gallery. You can restore it later.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="w-full px-5 py-3 rounded-full text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                className="w-full px-5 py-3 rounded-full text-sm font-bold text-white bg-red-500 shadow-sm hover:bg-red-600 transition"
              >
                Yes, Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-8 right-8 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 z-50 font-medium text-sm">
          <FiCheckCircle className="text-green-400 text-lg" />
          {toast}
        </div>
      )}
    </div>
  );
}

export default ManageGallery;