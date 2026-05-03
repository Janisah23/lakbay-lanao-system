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
  FiCheckCircle
} from "react-icons/fi";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "../../firebase/config";

// 1. Dynamic Categories (Gallery Omitted)
const CATEGORY_OPTIONS = {
  Article: [
    "Travel Guides",
    "Local Stories & Features",
    "History & Heritage",
    "Food & Culinary Tourism",
    "Travel Tips & Safety",
    "News & Tourism Updates"
  ],
  Highlight: [
    "Featured Destinations",
    "Featured Videos",
    "Featured Articles",
    "Trending Locations",
    "Editor’s Picks",
    "Popular Attractions"
  ],
  Event: [
    "Festivals",
    "Cultural Celebrations",
    "Religious Events",
    "Concerts & Performances",
    "Exhibitions & Trade Fairs",
    "Community Events",
    "Seasonal Activities"
  ]
};

const ManageTourismContent = () => {
  const [contentList, setContentList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [viewMode, setViewMode] = useState("list"); // List or Tiles
  const [openModal, setOpenModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form State (Content Rich Text Omitted, Only Summary)
  const [formData, setFormData] = useState({
    contentType: "",
    category: "",
    title: "",
    summary: "",
    status: "draft",
    imageURL: "",
    videoURL: "",
    eventDate: "",
  });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchContent = async () => {
    try {
      const snapshot = await getDocs(collection(db, "tourismContent"));
      const data = snapshot.docs.map((docItem) => {
        const raw = docItem.data();
        return {
          id: docItem.id,
          ...raw,
          createdAt: raw.createdAt?.toDate() || null,
          updatedAt: raw.updatedAt?.toDate() || null,
        };
      });
      setContentList(data);
    } catch (error) {
      console.error("Error fetching content:", error);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const filteredContent = contentList.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType ? item.contentType === filterType : true;
    const matchesArchive = showArchived ? item.status === "archived" : item.status !== "archived";

    return matchesSearch && matchesType && matchesArchive;
  });

  const handleArchive = async () => {
    try {
      await updateDoc(doc(db, "tourismContent", selectedId), { status: "archived" });
      setShowConfirm(false);
      fetchContent();
      showToast("Content archived successfully!");
    } catch (error) {
      console.error(error);
    }
  };

  const handleRestore = async (id) => {
    try {
      await updateDoc(doc(db, "tourismContent", id), { status: "draft" });
      fetchContent();
      showToast("Content restored to drafts!");
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalData = { ...formData };

      if (finalData.contentType === "Event" && finalData.eventDate) {
        finalData.eventDate = Timestamp.fromDate(new Date(finalData.eventDate));
      }

      if (editingId) {
        await updateDoc(doc(db, "tourismContent", editingId), {
          ...finalData,
          updatedAt: serverTimestamp(),
        });
        showToast("Content updated successfully!");
      } else {
        await addDoc(collection(db, "tourismContent"), {
          ...finalData,
          status: finalData.status || "draft",
          createdAt: serverTimestamp(),
        });
        showToast("Content saved successfully!");
      }

      setOpenModal(false);
      fetchContent();
    } catch (error) {
      console.error(error);
    }
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
      setFormData({ ...formData, imageURL: result.secure_url });
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Reusable Input Style
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
              Publish and organize articles, highlights, and local events.
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
              onClick={() => {
                setEditingId(null);
                setFormData({
                  title: "", contentType: "", category: "", summary: "",
                  status: "draft", videoURL: "", imageURL: "", eventDate: "",
                });
                setOpenModal(true);
              }}
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
              placeholder="Search content..."
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
              <option value="">All Types</option>
              <option value="Article">Article</option>
              <option value="Highlight">Highlight</option>
              <option value="Event">Event</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-[12px] p-1 shadow-sm w-full md:w-auto md:col-span-3 lg:col-span-3 md:justify-self-end justify-center">
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-[8px] flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                viewMode === "list" ? "bg-blue-50 text-[#2563eb] shadow-sm" : "text-gray-400 hover:text-gray-700"
              }`}
              title="Content List View"
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

        {/* --- VIEW: CONTENT (TABLE / LIST) --- */}
        {viewMode === "list" && (
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

                {filteredContent.length === 0 ? (
                  <div className="p-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#2563eb] mb-4">
                      <FiSearch className="text-2xl" />
                    </div>
                    <h3 className="text-gray-800 font-bold text-lg mb-1">No content found</h3>
                    <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
                  </div>
                ) : (
                  <div className="max-h-[600px] overflow-y-auto">
                    {filteredContent.map((item) => (
                      <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 text-sm border-b border-gray-50 items-center hover:bg-blue-50/30 transition-colors last:border-b-0">
                        {/* Title & Image */}
                        <div className="col-span-3 flex items-center gap-4 pr-2">
                          <div className="w-12 h-12 rounded-[12px] bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-200">
                            {item.imageURL ? (
                              <img src={item.imageURL} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <FiImage className="text-gray-400 text-lg" />
                            )}
                          </div>
                          <span className="font-bold text-gray-900 line-clamp-2">{item.title}</span>
                        </div>

                        {/* Type & Category */}
                        <div className="col-span-2 flex flex-col items-start gap-1">
                          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-50 text-[#2563eb] border border-blue-100 uppercase tracking-wide">
                            {item.contentType}
                          </span>
                          {item.category && <span className="text-xs font-medium text-gray-500">{item.category}</span>}
                        </div>

                        {/* Status & Date */}
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

                        {/* Summary */}
                        <div className="col-span-4 text-gray-500 text-xs leading-relaxed line-clamp-3 pr-4">
                          {item.summary || <em className="text-gray-400">No summary provided.</em>}
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex flex-col gap-2 items-center">
                          {!showArchived ? (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(item.id);
                                  setFormData({
                                    title: item.title || "",
                                    contentType: item.contentType || "",
                                    category: item.category || "",
                                    summary: item.summary || "",
                                    status: item.status || "draft",
                                    imageURL: item.imageURL || "",
                                    videoURL: item.videoURL || "",
                                    eventDate: item.eventDate ? new Date(item.eventDate.toDate()).toISOString().split('T')[0] : "",
                                  });
                                  setOpenModal(true);
                                }}
                                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-white border border-gray-200 text-gray-700 hover:text-[#2563eb] hover:border-[#2563eb] hover:bg-blue-50 transition shadow-sm"
                              >
                                <FiEdit2 /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedId(item.id);
                                  setShowConfirm(true);
                                }}
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
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW: TILES (GRID) --- */}
        {viewMode === "tiles" && (
          <div className="animate-in fade-in duration-300">
            {filteredContent.length === 0 ? (
              <div className="bg-white rounded-[28px] border border-gray-200 p-16 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#2563eb] mb-4">
                  <FiSearch className="text-2xl" />
                </div>
                <h3 className="text-gray-800 font-bold text-lg mb-1">No content found</h3>
                <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredContent.map((item) => (
                  <div key={item.id} className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:border-blue-200 transition-all duration-300">
                    
                    {/* Tile Image Header */}
                    <div className="h-48 bg-gray-100 relative overflow-hidden">
                      {item.imageURL ? (
                        <img src={item.imageURL} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                          <FiImage className="text-4xl" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex flex-col gap-2">
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm backdrop-blur-md ${
                            item.status === 'published' ? 'bg-green-500/90 text-white' : 
                            item.status === 'archived' ? 'bg-red-500/90 text-white' : 
                            'bg-gray-800/90 text-white'
                          }`}>
                            {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Tile Content */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex gap-2 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563eb] bg-blue-50 px-2 py-1 rounded-md border border-blue-100">{item.contentType}</span>
                        {item.category && <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">{item.category}</span>}
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-[#2563eb] transition-colors">{item.title}</h3>
                      <p className="text-xs text-gray-500 line-clamp-3 mb-4 leading-relaxed">
                        {item.summary || <em className="text-gray-400">No summary provided.</em>}
                      </p>
                      
                      {/* Tile Actions Footer */}
                      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                          <FiCalendar /> {item.createdAt?.toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          {!showArchived ? (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(item.id);
                                  setFormData({
                                    title: item.title || "",
                                    contentType: item.contentType || "",
                                    category: item.category || "",
                                    summary: item.summary || "",
                                    status: item.status || "draft",
                                    imageURL: item.imageURL || "",
                                    videoURL: item.videoURL || "",
                                    eventDate: item.eventDate ? new Date(item.eventDate.toDate()).toISOString().split('T')[0] : "",
                                  });
                                  setOpenModal(true);
                                }}
                                className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-[#2563eb] transition border border-transparent hover:border-blue-200"
                                title="Edit"
                              >
                                <FiEdit2 />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedId(item.id);
                                  setShowConfirm(true);
                                }}
                                className="p-2 rounded-full bg-gray-50 text-red-500 hover:bg-red-50 hover:text-red-600 transition border border-transparent hover:border-red-200"
                                title="Archive"
                              >
                                <FiArchive />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleRestore(item.id)}
                              className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition border border-transparent hover:border-green-200"
                              title="Restore"
                            >
                              <FiRefreshCw />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL (ADD / EDIT) */}
      {openModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] shadow-2xl p-8 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setOpenModal(false);
                setEditingId(null);
                setFormData({
                  title: "", contentType: "", category: "", summary: "",
                  status: "draft", videoURL: "", imageURL: "", eventDate: ""
                });
              }}
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
            >
              <FiX className="text-lg" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? "Edit Content" : "Add Tourism Content"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Title</label>
                <input
                  type="text"
                  placeholder="Enter content title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className={inputStyle}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Content Type</label>
                  <select
                    value={formData.contentType}
                    onChange={(e) => setFormData({ ...formData, contentType: e.target.value, category: "" })}
                    required
                    className={`${inputStyle} appearance-none cursor-pointer`}
                  >
                    <option value="">Select Type</option>
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
                    required
                    disabled={!formData.contentType}
                    className={`${inputStyle} appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed`}
                  >
                    <option value="">Select Category</option>
                    {formData.contentType && CATEGORY_OPTIONS[formData.contentType]?.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
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
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">YouTube Video Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="e.g. https://youtube.com/watch?v=..."
                    value={formData.videoURL}
                    onChange={(e) => setFormData({ ...formData, videoURL: e.target.value, imageURL: e.target.value ? "" : formData.imageURL })}
                    className={inputStyle}
                  />
                </div>
              )}

              {!(formData.contentType === "Highlight" && formData.videoURL) && (
                <div className="rounded-[12px] border border-gray-200 p-4 bg-gray-50">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    {editingId && formData.imageURL ? "Replace Cover Image" : "Upload Cover Image"}
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (file) await uploadImage(file);
                      }}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#2563eb] hover:file:bg-blue-100 cursor-pointer"
                    />
                    {isUploading && <span className="text-sm font-medium text-[#2563eb] animate-pulse whitespace-nowrap">Uploading...</span>}
                  </div>
                  {formData.imageURL && (
                    <img src={formData.imageURL} alt="Preview" className="h-24 w-auto rounded-lg object-cover mt-4 shadow-sm border border-gray-200" />
                  )}
                </div>
              )}

              {/* ONLY SUMMARY IMPLEMENTATION */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Summary / Content</label>
                <textarea
                  rows="6"
                  placeholder="Write the summary or full content here..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  required
                  className={`${inputStyle} resize-none`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={`${inputStyle} appearance-none cursor-pointer`}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Publish</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-6 py-3 rounded-full text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex items-center justify-center px-8 py-3 rounded-full text-sm font-medium text-white bg-[#2563eb] shadow-sm hover:shadow-md hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {editingId ? "Update Content" : "Save Content"}
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
              This will remove the content from the active public view. You can restore it later.
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