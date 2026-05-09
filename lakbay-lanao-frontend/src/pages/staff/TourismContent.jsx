import React, { useState, useEffect } from "react";
import { 
  FiSearch, 
  FiPlus, 
  FiX, 
  FiFilter, 
  FiList, 
  FiGrid, 
  FiEdit2, 
  FiArchive, 
  FiRefreshCw, 
  FiCalendar, 
  FiImage,
  FiCheckCircle,
  FiVideo
} from "react-icons/fi";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const CATEGORY_OPTIONS = {
  Article: [
    "Travel Guides",
    "Local Stories & Features",
    "History & Heritage",
    "Food & Culinary Tourism",
    "Travel Tips & Safety",
    "News & Tourism Updates",
  ],
  Highlight: [
    "Featured Destinations",
    "Featured Videos",
    "Featured Articles",
    "Trending Locations",
    "Editor’s Picks",
    "Popular Attractions",
  ],
  Event: [
    "Festivals",
    "Cultural Celebrations",
    "Religious Events",
    "Concerts & Performances",
    "Exhibitions & Trade Fairs",
    "Community Events",
    "Seasonal Activities",
  ],
};

const INITIAL_FORM_DATA = {
  contentType: "",
  category: "",
  title: "",
  summary: "",
  content: "",
  status: "draft",
  imageURL: "",
  videoURL: "",
  eventDate: "",
};

const ManageTourismContent = () => {
  const [contentList, setContentList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [viewMode, setViewMode] = useState("list"); 
  const [openModal, setOpenModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const filteredContent = contentList.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.summary && item.summary.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType ? item.contentType === filterType : true;
    const matchesArchive = showArchived
      ? item.status === "archived"
      : item.status !== "archived";

    return matchesSearch && matchesType && matchesArchive;
  });

  const fetchContent = async () => {
    try {
      const snapshot = await getDocs(collection(db, "tourismContent"));
      const data = snapshot.docs.map((docItem) => {
        const raw = docItem.data();
        return {
          id: docItem.id,
          ...raw,
          createdAt: raw.createdAt?.toDate?.() || null,
          updatedAt: raw.updatedAt?.toDate?.() || null,
        };
      });
      setContentList(data);
    } catch (error) {
      console.error("Error fetching content:", error);
      showToast("Failed to fetch content.");
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const openAddModal = () => {
    resetForm();
    setOpenModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      contentType: item.contentType || "",
      category: item.category || "",
      title: item.title || "",
      summary: item.summary || "",
      content: item.content || "",
      status: item.status || "draft",
      imageURL: item.imageURL || "",
      videoURL: item.videoURL || "",
      eventDate: item.eventDate?.seconds
        ? new Date(item.eventDate.seconds * 1000).toISOString().split("T")[0]
        : item.eventDate || "",
    });
    setOpenModal(true);
  };

  const handleArchive = async () => {
    await updateDoc(doc(db, "tourismContent", selectedId), {
      status: "archived",
    });
    setShowConfirm(false);
    fetchContent();
    showToast("Content archived successfully!");
  };

  const handleRestore = async (id) => {
    await updateDoc(doc(db, "tourismContent", id), {
      status: "draft",
    });
    fetchContent();
    showToast("Content restored to drafts!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.contentType) {
        showToast("Please select a content type.");
        setLoading(false);
        return;
      }
      if (!formData.title.trim()) {
        showToast("Please enter a title.");
        setLoading(false);
        return;
      }

      const finalData = {
        ...formData,
        title: formData.title.trim(),
        summary: formData.summary?.trim() || "",
        videoURL: formData.videoURL?.trim() || "",
      };

      if (finalData.contentType === "Gallery") {
        finalData.summary = "";
        finalData.content = "";
        finalData.videoURL = "";
        finalData.eventDate = "";
      }

      if (finalData.contentType !== "Event") finalData.eventDate = "";
      if (finalData.contentType === "Event" && finalData.eventDate) {
        finalData.eventDate = Timestamp.fromDate(new Date(finalData.eventDate));
      }
      if (finalData.contentType !== "Highlight") finalData.videoURL = "";

      if (editingId) {
        await updateDoc(doc(db, "tourismContent", editingId), {
          ...finalData,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "tourismContent"), {
          ...finalData,
          status: finalData.status || "published",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      setOpenModal(false);
      resetForm();
      fetchContent();
      showToast(editingId ? "Content updated successfully!" : "Content saved successfully!");
    } catch (error) {
      console.error("Error saving content:", error);
      showToast("Failed to save content.");
    }
    setLoading(false);
  };

  const uploadImage = async (file) => {
    setIsUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "tourism_upload");

      const res = await fetch("https://api.cloudinary.com/v1_1/dbyz3shts/image/upload", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      setIsUploading(false);

      if (!result.secure_url) {
        throw new Error("Image upload failed.");
      }
      return result.secure_url;
    } catch (error) {
      setIsUploading(false);
      throw error;
    }
  };

  const inputStyle = "w-full rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition hover:border-[#2563eb] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100";

  return (
    <div className="w-full font-sans text-gray-800">
      <div className="max-w-7xl mx-auto pt-10 pb-20 px-6 lg:px-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#2563eb] tracking-tight">
              Manage Tourism Content
            </h1>
            <p className="text-gray-500 mt-2">
              Publish and manage articles, events, highlights, and promotional content.
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
              {showArchived ? "View Active Content" : "View Archived"}
            </button>

            <button
              onClick={openAddModal}
              className="flex items-center gap-2 rounded-full bg-[#2563eb] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
            >
              <FiPlus />
              Add Content
            </button>
          </div>
        </div>

        {/* TOOLBAR: Search, Filters, & View Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8 items-center">
          
          {/* Search Bar */}
          <div className="relative w-full md:col-span-5 lg:col-span-5">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
            <input
              type="text"
              placeholder="Search content titles or summaries..."
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

          {/* Type Filter */}
          <div className="relative w-full md:col-span-4 lg:col-span-4">
            <FiFilter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none" />
              <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`${inputStyle} pl-11 appearance-none cursor-pointer`}
            >
              <option value="">All Content Types</option>
              <option value="Article">Article</option>
              <option value="Highlight">Highlight</option>
              <option value="Event">Event</option>
            </select>
          </div>

          {/* List/Tiles Toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-[12px] p-1 shadow-sm w-full md:w-auto md:col-span-3 lg:col-span-3 md:justify-self-end justify-center">
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-[8px] flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                viewMode === "list" ? "bg-blue-50 text-[#2563eb] shadow-sm" : "text-gray-400 hover:text-gray-700"
              }`}
              title="List View"
            >
              <FiList className="text-lg" />
              <span className="hidden sm:inline pr-1">List</span>
            </button>
            <button
              onClick={() => setViewMode("tiles")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-[8px] flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                viewMode === "tiles" ? "bg-blue-50 text-[#2563eb] shadow-sm" : "text-gray-400 hover:text-gray-700"
              }`}
              title="Tiles View"
            >
              <FiGrid className="text-lg" />
              <span className="hidden sm:inline pr-1">Tiles</span>
            </button>
          </div>

        </div>

        {/* ==============================================================
            DYNAMIC DATA DISPLAY (LIST vs TILES)
        ============================================================== */}
        
        {filteredContent.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#2563eb] mb-4">
              <FiSearch className="text-2xl" />
            </div>
            <h3 className="text-gray-800 font-bold text-lg mb-1">No content found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : viewMode === "list" ? (
          /* CONTENT VIEW (TABLE) */
          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <div className="min-w-[1000px]">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span className="col-span-3">Title & Media</span>
                  <span className="col-span-2">Type & Category</span>
                  <span className="col-span-2">Status & Date</span>
                  <span className="col-span-4">Summary</span>
                  <span className="col-span-1 text-center">Actions</span>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredContent.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 text-sm border-b border-gray-50 items-center hover:bg-blue-50/30 transition-colors last:border-b-0">
                      
                      <div className="col-span-3 flex items-center gap-4 pr-2">
                        <div className="w-12 h-12 rounded-[12px] bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-200">
                          {item.imageURL ? (
                            <img src={item.imageURL} alt={item.title} className="w-full h-full object-cover" />
                          ) : item.videoURL ? (
                            <FiVideo className="text-gray-400 text-lg" />
                          ) : (
                            <FiImage className="text-gray-400 text-lg" />
                          )}
                        </div>
                        <span className="font-bold text-gray-900 line-clamp-2">{item.title}</span>
                      </div>

                      <div className="col-span-2 flex flex-col items-start gap-1">
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-50 text-[#2563eb] border border-blue-100 uppercase tracking-wide">
                          {item.contentType}
                        </span>
                        {item.category && <span className="text-xs font-medium text-gray-500">{item.category}</span>}
                      </div>

                      <div className="col-span-2 flex flex-col items-start gap-1">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wide border shadow-sm ${
                          item.status === 'published' ? 'bg-green-50 text-green-600 border-green-100' : 
                          item.status === 'archived' ? 'bg-red-50 text-red-600 border-red-100' : 
                          'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-1">
                          <FiCalendar /> {item.createdAt?.toLocaleDateString()}
                        </span>
                      </div>

                      <div className="col-span-4 text-gray-500 text-xs leading-relaxed line-clamp-3 pr-4">
                        {item.contentType === 'Gallery' ? <em className="text-gray-400">Media format</em> : item.summary}
                      </div>

                      <div className="col-span-1 flex flex-col gap-2 items-center">
                        {!showArchived ? (
                          <>
                            <button
                              onClick={() => openEditModal(item)}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-white border border-gray-200 text-gray-700 hover:text-[#2563eb] hover:border-[#2563eb] hover:bg-blue-50 transition shadow-sm"
                            >
                              <FiEdit2 /> Edit
                            </button>
                            <button
                              onClick={() => { setSelectedId(item.id); setShowConfirm(true); }}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-white border border-gray-200 text-red-600 hover:bg-red-50 hover:border-red-200 transition shadow-sm"
                            >
                              <FiArchive /> Archive
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRestore(item.id)}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-white border border-gray-200 text-green-600 hover:bg-green-50 hover:border-green-200 transition shadow-sm"
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
          /* TILES VIEW (GRID) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-300">
            {filteredContent.map((item) => (
              <div key={item.id} className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-300 group flex flex-col h-full">
                
                <div className="h-44 bg-gray-100 relative overflow-hidden flex-shrink-0">
                  {item.imageURL ? (
                    <img src={item.imageURL} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : item.videoURL ? (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-800">
                      <FiVideo className="text-4xl text-gray-400" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <FiImage className="text-4xl" />
                    </div>
                  )}
                  
                  <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full shadow-sm text-[10px] font-extrabold uppercase tracking-wider border backdrop-blur-sm ${
                      item.status === 'published' ? 'bg-green-500/90 text-white border-green-400/50' : 
                      item.status === 'archived' ? 'bg-red-500/90 text-white border-red-400/50' : 
                      'bg-gray-800/90 text-white border-gray-600/50'
                    }`}>
                    {item.status}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <div className="flex gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563eb] bg-blue-50 px-2 py-1 rounded-md border border-blue-100">{item.contentType}</span>
                    {item.category && <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded-md border border-gray-200 line-clamp-1">{item.category}</span>}
                  </div>
                  
                  <h4 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-[#2563eb] transition-colors">{item.title}</h4>
                  
                  <p className="text-sm text-gray-600 line-clamp-3 mb-6 flex-grow leading-relaxed">
                    {item.contentType === 'Gallery' ? <em className="text-gray-400">Media Gallery</em> : item.summary}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100">
                    {!showArchived ? (
                      <>
                        <button 
                          onClick={() => openEditModal(item)}
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
          <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[28px] shadow-2xl p-8 relative animate-in fade-in zoom-in-95 duration-200">
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
              {editingId ? "Edit Content" : "Add Tourism Content"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Content Type</label>
                  <select
                    value={formData.contentType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contentType: e.target.value,
                        category: "", eventDate: "", videoURL: "", summary: "", content: "",
                      })
                    }
                    required
                    className={`${inputStyle} appearance-none cursor-pointer`}
                  >
                    <option value="">Select Content Type</option>
                    <option value="Article">Article</option>
                    <option value="Highlight">Highlight</option>
                    <option value="Event">Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    disabled={!formData.contentType}
                    className={`${inputStyle} appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed`}
                  >
                    <option value="">Select Category</option>
                    {formData.contentType &&
                      CATEGORY_OPTIONS[formData.contentType]?.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Title</label>
                <input
                  type="text"
                  placeholder="Content Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className={inputStyle}
                />
              </div>

              {formData.contentType === "Event" && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Event Date</label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                    className={inputStyle}
                  />
                </div>
              )}

              {formData.contentType === "Highlight" && (
                <div className="rounded-[16px] border border-blue-100 bg-blue-50 p-5">
                  <label className="block text-xs font-bold text-[#2563eb] uppercase tracking-wider mb-2">Video Link (Optional)</label>
                  <input
                    type="text"
                    placeholder="Paste YouTube or Facebook video link"
                    value={formData.videoURL}
                    onChange={(e) => setFormData({ ...formData, videoURL: e.target.value })}
                    className="w-full rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-2 text-xs text-gray-500">Supported: YouTube and public Facebook video links.</p>
                </div>
              )}

              <div className="rounded-[12px] border border-gray-200 p-4 bg-gray-50">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Upload Cover Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    try {
                      const file = e.target.files[0];
                      if (!file) return;
                      const url = await uploadImage(file);
                      setFormData({ ...formData, imageURL: url });
                      showToast("Image uploaded successfully!");
                    } catch (error) {
                      console.error("Upload error:", error);
                      showToast("Image upload failed.");
                    }
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#2563eb] hover:file:bg-blue-100 cursor-pointer"
                />
                {isUploading && <p className="text-xs text-blue-500 mt-2 font-bold animate-pulse">Uploading image...</p>}
                {formData.imageURL && (
                  <div className="mt-3 relative w-full h-40 rounded-[12px] overflow-hidden border border-gray-200 shadow-sm">
                    <img src={formData.imageURL} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {formData.contentType !== "Gallery" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Short Summary</label>
                    <textarea
                      rows="2"
                      placeholder="Brief overview of the content..."
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      className={`${inputStyle} resize-none`}
                    />
                  </div>

                  {formData.contentType !== "Highlight" && (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Content</label>
                      <div className="border border-gray-200 rounded-[12px] overflow-hidden focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-100 transition bg-white shadow-sm">
                        <ReactQuill
                          theme="snow"
                          value={formData.content}
                          onChange={(value) => setFormData({ ...formData, content: value })}
                          className="bg-white min-h-[200px]"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Publishing Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={`${inputStyle} appearance-none cursor-pointer font-bold ${formData.status === 'published' ? 'text-green-600' : 'text-gray-600'}`}
                >
                  <option value="draft">Draft (Hidden)</option>
                  <option value="published">Published (Live)</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-6 py-3 rounded-full text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || isUploading}
                  className="flex items-center justify-center px-8 py-3 rounded-full text-sm font-bold text-white bg-[#2563eb] shadow-sm hover:shadow-md hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><FiRefreshCw className="animate-spin" /> Saving...</span>
                  ) : (
                    editingId ? "Update Content" : "Save Content"
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Archive Content?</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              This content will be moved to the archive and hidden from public view. You can restore it later.
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
};

export default ManageTourismContent;