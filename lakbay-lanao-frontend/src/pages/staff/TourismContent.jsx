import React, { useState, useEffect } from "react";
import {
  FiSearch, FiPlus, FiX, FiFilter, FiList, FiGrid, FiEdit2, FiArchive, FiRefreshCw,
  FiCalendar, FiImage, FiCheckCircle, FiVideo, FiChevronLeft,
  FiChevronRight, FiUser,
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
import imageCompression from 'browser-image-compression';

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
    "Editor's Picks",
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
  writtenBy: "",
  summary: "",
  status: "draft",
  imageURL: "",
  imageURLs: [],
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
  const [imageFiles, setImageFiles] = useState([]); // STAGING AREA FOR NEW UPLOADS
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const filteredContent = contentList.filter((item) => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType ? item.contentType === filterType : true;

    const matchesArchive = showArchived
      ? item.status === "archived"
      : item.status !== "archived";

    return matchesSearch && matchesType && matchesArchive;
  });

  const totalPages = Math.max(1, Math.ceil(filteredContent.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedContent = filteredContent.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, showArchived, viewMode]);

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
    setImageFiles([]); // Reset staging area
    setFormData(INITIAL_FORM_DATA);
  };

  const openAddModal = () => {
    resetForm();
    setOpenModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setImageFiles([]); // Clear staging area, ready for new replacement files if needed
    setFormData({
      contentType: item.contentType || "",
      category: item.category || "",
      title: item.title || "",
      author: item.author || "",
      summary: item.summary || "",
      status: item.status || "draft",
      imageURL: item.imageURL || "",
      imageURLs: item.imageURLs || [],
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

  const handleImageSelection = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImageFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

const uploadImage = async (file) => {
  if (!file) return null;

  // 1. Compress the image before uploading
  const options = {
    maxSizeMB: 2, // Compress to max 2MB
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  let fileToUpload = file;
  
  // Only compress if it's actually an image (ignore if they somehow select a video here)
  if (file.type.startsWith("image/")) {
    try {
      fileToUpload = await imageCompression(file, options);
    } catch (compressionError) {
      console.error("Failed to compress image:", compressionError);
      throw new Error("Image compression failed.");
    }
  }

  // 2. Prepare for Cloudinary
  const formDataImage = new FormData();
  formDataImage.append("file", fileToUpload);
  
  // Make SURE this matches your Cloudinary Upload Preset exactly!
  formDataImage.append("upload_preset", "tourism_upload"); 

  // 3. Send to Cloudinary
  const response = await fetch(
    "https://api.cloudinary.com/v1_1/dbyz3shts/image/upload",
    {
      method: "POST",
      body: formDataImage,
    }
  );

  // 4. Handle Errors Better
  if (!response.ok) {
    const errorData = await response.json();
    console.error("Cloudinary Error Details:", errorData); // This reveals the exact 400 error!
    throw new Error(`Cloudinary upload failed: ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.secure_url;
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

      let uploadedURLs = [];

      // Loop and upload all selected images
      if (imageFiles.length > 0) {
        setIsUploading(true);
        for (const file of imageFiles) {
          const url = await uploadImage(file);
          uploadedURLs.push(url);
        }
        setIsUploading(false);
      }

      const finalData = {
        ...formData,
        title: formData.title.trim(),
        summary: formData.summary?.trim() || "",
        videoURL: formData.videoURL?.trim() || "",
        author: formData.contentType === "Article" ? (formData.author?.trim() || "") : "",
      };

      // Assign new image URLs if any were uploaded
      if (uploadedURLs.length > 0) {
        finalData.imageURL = uploadedURLs[0]; // Set first as primary
        finalData.imageURLs = uploadedURLs; // Save the full array
      }

      if (finalData.contentType !== "Event") {
        finalData.eventDate = "";
      }

      if (finalData.contentType === "Event" && finalData.eventDate) {
        finalData.eventDate = Timestamp.fromDate(new Date(finalData.eventDate));
      }

      if (finalData.contentType !== "Highlight") {
        finalData.videoURL = "";
      }

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
      setIsUploading(false);
    }

    setLoading(false);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("");
    setCurrentPage(1);
  };

  const inputStyle =
    "w-full rounded-[18px] border border-blue-100 bg-white px-4 py-3 text-sm font-medium text-gray-600 outline-none shadow-sm transition duration-300 placeholder:text-gray-400 hover:border-[#2563eb]/40 hover:bg-blue-50/40 focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100";

  const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-[18px] bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-300 hover:bg-blue-700";

  const secondaryButton =
    "inline-flex items-center justify-center gap-2 rounded-[18px] border border-[#2563eb]/20 bg-white px-5 py-3 text-sm font-medium text-[#2563eb] shadow-sm transition duration-300 hover:bg-blue-50";

  const StatusBadge = ({ status }) => {
    const style =
      status === "published"
        ? "border-green-100 bg-green-50 text-green-600"
        : status === "archived"
        ? "border-red-100 bg-red-50 text-red-600"
        : "border-gray-200 bg-gray-50 text-gray-600";

    return (
      <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${style}`}>
        {status || "draft"}
      </span>
    );
  };

  const Pagination = () => {
    if (filteredContent.length <= itemsPerPage) return null;

    return (
      <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-[24px] border border-blue-100 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(37,99,235,0.06)] sm:flex-row">
        <p className="text-sm font-medium text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-700">{startIndex + 1}</span>{" "}
          to{" "}
          <span className="font-semibold text-gray-700">
            {Math.min(startIndex + itemsPerPage, filteredContent.length)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-700">{filteredContent.length}</span>{" "}
          content items
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition ${
              currentPage === 1
                ? "cursor-not-allowed border-blue-50 bg-white text-gray-300"
                : "border-blue-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
            }`}
          >
            <FiChevronLeft className="text-lg" />
          </button>

          <span className="rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition ${
              currentPage === totalPages
                ? "cursor-not-allowed border-blue-50 bg-white text-gray-300"
                : "border-blue-100 bg-white text-gray-600 hover:bg-blue-50 hover:text-[#2563eb]"
            }`}
          >
            <FiChevronRight className="text-lg" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fbff] font-['Poppins']">
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-10 lg:px-10">

        {/* HEADER */}
        <section className="mb-10">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
                Staff Content
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#2563eb] md:text-4xl">
                Manage Tourism Content
              </h1>

              <p className="mt-2 max-w-2xl text-base leading-relaxed text-gray-500">
                Publish and manage articles, events, highlights, and promotional content for Lakbay Lanao.
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
                {showArchived ? "View Active Content" : "View Archived"}
              </button>

              <button type="button" onClick={openAddModal} className={primaryButton}>
                <FiPlus />
                Add Content
              </button>
            </div>
          </div>
        </section>

        {/* TOOLBAR */}
        <section className="mb-8 rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#2563eb]">Content Library</h2>
              <p className="mt-1 text-sm text-gray-500">
                Search, filter, edit, archive, or restore tourism content.
              </p>
            </div>

            {(searchTerm || filterType) && (
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

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_260px_auto]">
            <div className="relative w-full">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
              <input
                type="text"
                placeholder="Search content titles or summaries..."
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
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`${inputStyle} cursor-pointer appearance-none pl-11`}
              >
                <option value="">All Content Types</option>
                <option value="Article">Article</option>
                <option value="Highlight">Highlight</option>
                <option value="Event">Event</option>
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

        {/* CONTENT DISPLAY */}
        {filteredContent.length === 0 ? (
          <section className="flex flex-col items-center justify-center rounded-[28px] border border-blue-100 bg-white px-6 py-20 text-center shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#2563eb]">
              <FiSearch className="text-2xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">No content found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
          </section>
        ) : viewMode === "list" ? (
          <>
            <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
              <div className="overflow-x-auto">
                <div className="min-w-[1000px]">
                  <div className="grid grid-cols-12 gap-4 border-b border-blue-50 bg-[#f8fbff] px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span className="col-span-3">Title & Media</span>
                    <span className="col-span-2">Type & Category</span>
                    <span className="col-span-2">Status & Date</span>
                    <span className="col-span-4">Summary</span>
                    <span className="col-span-1 text-center">Actions</span>
                  </div>

                  <div className="max-h-[640px] overflow-y-auto">
                    {paginatedContent.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 items-center gap-4 border-b border-blue-50 px-6 py-4 text-sm transition duration-300 last:border-b-0 hover:bg-blue-50/50"
                      >
                        <div className="col-span-3 flex items-center gap-4 pr-2">
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-blue-100 bg-[#f8fbff] text-gray-400">
                            {item.imageURL ? (
                              <img src={item.imageURL} alt={item.title} className="h-full w-full object-cover" />
                            ) : item.videoURL ? (
                              <FiVideo className="text-lg" />
                            ) : (
                              <FiImage className="text-lg" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="line-clamp-2 font-semibold text-gray-700">{item.title}</span>
                            {item.contentType === "Article" && item.author && (
                              <span className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                                <FiUser className="flex-shrink-0" />
                                {item.author}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2 flex flex-col items-start gap-1.5">
                          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2563eb]">
                            {item.contentType}
                          </span>
                          {item.category && (
                            <span className="line-clamp-1 text-xs font-medium text-gray-500">{item.category}</span>
                          )}
                        </div>

                        <div className="col-span-2 flex flex-col items-start gap-1.5">
                          <StatusBadge status={item.status} />
                          <span className="mt-1 flex items-center gap-1 text-xs font-medium text-gray-400">
                            <FiCalendar />
                            {item.createdAt?.toLocaleDateString() || "No date"}
                          </span>
                        </div>

                        <div className="col-span-4 pr-4 text-xs leading-relaxed text-gray-500 line-clamp-3">
                          {item.summary || <em className="text-gray-400">No summary available</em>}
                        </div>

                        <div className="col-span-1 flex flex-col items-center gap-2">
                          {!showArchived ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition hover:bg-blue-50 hover:text-[#2563eb]"
                              >
                                <FiEdit2 />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => { setSelectedId(item.id); setShowConfirm(true); }}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-red-100 bg-white px-3 py-1.5 text-xs font-semibold text-red-500 shadow-sm transition hover:bg-red-50"
                              >
                                <FiArchive />
                                Archive
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRestore(item.id)}
                              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-green-100 bg-white px-3 py-1.5 text-xs font-semibold text-green-600 shadow-sm transition hover:bg-green-50"
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
            <Pagination />
          </>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedContent.map((item) => (
                <div
                  key={item.id}
                  className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(37,99,235,0.08)]"
                >
                  <div className="relative h-44 flex-shrink-0 overflow-hidden bg-[#f8fbff]">
                    {item.imageURL ? (
                      <img
                        src={item.imageURL}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                      />
                    ) : item.videoURL ? (
                      <div className="flex h-full w-full items-center justify-center bg-slate-800 text-gray-300">
                        <FiVideo className="text-4xl text-gray-400" />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <FiImage className="text-4xl" />
                      </div>
                    )}
                    <div className="absolute right-3 top-3">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>

                  <div className="flex flex-grow flex-col px-5 pb-5 pt-4">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2563eb]">
                        {item.contentType}
                      </span>
                      {item.category && (
                        <span className="line-clamp-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                          {item.category}
                        </span>
                      )}
                    </div>

                    <h4 className="line-clamp-2 min-h-[48px] text-base font-bold text-gray-700 transition group-hover:text-[#2563eb]">
                      {item.title}
                    </h4>

                    {item.contentType === "Article" && item.writtenBy && (
                      <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <FiUser className="flex-shrink-0" />
                        {item.writtenBy}
                      </span>
                    )}

                    <p className="mb-6 mt-2 line-clamp-3 flex-grow text-sm leading-relaxed text-gray-500">
                      {item.summary || <em className="text-gray-400">No summary available</em>}
                    </p>

                    <div className="mt-auto flex items-center gap-3 border-t border-blue-50 pt-4">
                      {!showArchived ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-blue-100 bg-white py-2 text-xs font-semibold text-gray-600 shadow-sm transition hover:bg-blue-50 hover:text-[#2563eb]"
                          >
                            <FiEdit2 />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => { setSelectedId(item.id); setShowConfirm(true); }}
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
            <Pagination />
          </>
        )}
      </main>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-blue-100 bg-white p-7 shadow-[0_14px_35px_rgba(37,99,235,0.10)]">
            <button
              type="button"
              onClick={() => { setOpenModal(false); resetForm(); }}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-gray-400 transition hover:text-red-500"
            >
              <FiX className="text-lg" />
            </button>

            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#2563eb]">
                <FiImage className="text-xl" />
              </div>
              <h3 className="text-2xl font-bold text-[#2563eb]">
                {editingId ? "Edit Content" : "Add Tourism Content"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create articles, highlights, or events for the public tourism pages.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Content Type & Category */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Content Type
                  </label>
                  <select
                    value={formData.contentType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contentType: e.target.value,
                        category: "",
                        eventDate: "",
                        videoURL: "",
                        writtenBy: "",
                        summary: "",
                      })
                    }
                    required
                    className={`${inputStyle} cursor-pointer appearance-none`}
                  >
                    <option value="">Select Content Type</option>
                    <option value="Article">Article</option>
                    <option value="Highlight">Highlight</option>
                    <option value="Event">Event</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    disabled={!formData.contentType}
                    className={`${inputStyle} cursor-pointer appearance-none disabled:cursor-not-allowed disabled:bg-blue-50/50`}
                  >
                    <option value="">Select Category</option>
                    {formData.contentType &&
                      CATEGORY_OPTIONS[formData.contentType]?.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Content Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className={inputStyle}
                />
              </div>

              {/* Author — Article only */}
              {formData.contentType === "Article" && (
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Written By
                  </label>
                  <div className="relative">
                    <FiUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" />
                    <input
                      type="text"
                      placeholder="Name of the article author"
                      value={formData.writtenBy}
                      onChange={(e) => setFormData({ ...formData, writtenBy: e.target.value })}
                      className={`${inputStyle} pl-11`}
                    />
                  </div>
                </div>
              )}

              {/* Event Date */}
              {formData.contentType === "Event" && (
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    required
                    className={inputStyle}
                  />
                </div>
              )}

              {/* Video URL — Highlight only */}
              {formData.contentType === "Highlight" && (
                <div className="rounded-[18px] border border-blue-100 bg-blue-50/70 p-5">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#2563eb]">
                    Video Link Optional
                  </label>
                  <input
                    type="text"
                    placeholder="Paste YouTube or Facebook video link"
                    value={formData.videoURL}
                    onChange={(e) => setFormData({ ...formData, videoURL: e.target.value })}
                    className={inputStyle}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Supported: YouTube and public Facebook video links.
                  </p>
                </div>
              )}

              {/* Cover Image Upload (MULTIPLE IMAGES INTEGRATION) */}
              <div className="rounded-[18px] border border-blue-100 bg-[#f8fbff] p-4">
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {editingId ? "Replace Images (Optional)" : "Upload Cover Images"}
                </label>
                
                <p className="mb-3 text-[11px] text-gray-500">
                  Accepted formats: <strong className="text-gray-700">JPG, PNG, WEBP</strong>. Max size: <strong className="text-gray-700">30MB</strong> per image.
                </p>

                {/* CUSTOM UPLOAD BUTTON & NO IMAGE TEXT WRAPPER */}
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-blue-50/50 px-5 py-2.5 text-sm font-semibold text-[#2563eb] transition hover:bg-blue-100">
                    <span>Browse Images</span>
                    
                    {/* HIDDEN NATIVE INPUT */}
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp" 
                      multiple 
                      onChange={handleImageSelection}
                      className="hidden" 
                    />
                  </label>

                  {/* HIDDEN WHEN IMAGES ARE UPLOADED */}
                  {imageFiles.length === 0 && (
                    <span className="text-xs font-medium italic text-gray-400">
                      No uploaded images
                    </span>
                  )}
                </div>

                {/* Image Preview List showing what will be uploaded */}
                {imageFiles.length > 0 && (
                  <div className="mt-5 border-t border-blue-100/50 pt-4">
                    <p className="mb-3 text-xs font-semibold text-[#2563eb]">
                      {imageFiles.length} file(s) ready to upload:
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[14px] border border-blue-200 bg-white shadow-sm transition hover:border-[#2563eb]">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`Preview ${index}`} 
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-110" 
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition hover:bg-red-600 hover:scale-110"
                            title="Remove image"
                          >
                            <FiX className="text-[12px]" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {isUploading && (
                  <p className="mt-3 text-xs font-bold text-[#2563eb] animate-pulse">
                    Uploading images...
                  </p>
                )}
              </div>

              {/* Quick Summary */}
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Quick Summary
                </label>
                <textarea
                  rows="8"
                  placeholder="Brief overview of the content..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className={`${inputStyle} resize-none`}
                />
              </div>

              {/* Publishing Status */}
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Publishing Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={`${inputStyle} cursor-pointer appearance-none font-bold ${
                    formData.status === "published" ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-blue-50 pt-6">
                <button
                  type="button"
                  onClick={() => { setOpenModal(false); resetForm(); }}
                  className="rounded-full border border-[#2563eb]/20 bg-white px-6 py-3 text-sm font-medium text-[#2563eb] shadow-sm transition hover:bg-blue-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || isUploading}
                  className="inline-flex min-w-[150px] items-center justify-center rounded-full bg-[#2563eb] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading || isUploading ? (
                    <span className="flex items-center gap-2">
                      <FiRefreshCw className="animate-spin" />
                      Saving...
                    </span>
                  ) : editingId ? (
                    "Update Content"
                  ) : (
                    "Save Content"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM ARCHIVE MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-sm rounded-[28px] border border-blue-100 bg-white p-7 text-center shadow-[0_14px_35px_rgba(37,99,235,0.10)]">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
              <FiArchive className="text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-gray-700">Archive Content?</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              This content will be moved to the archive and hidden from public view. You can restore it later.
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
};

export default ManageTourismContent;