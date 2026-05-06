import { useState, useEffect } from "react";
import { FiPlus, FiSearch, FiX } from "react-icons/fi";
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
  Gallery: ["Sights & Attractions", "Cultural & Arts", "Spots"],
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
  const [openModal, setOpenModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const filteredContent = contentList.filter((item) => {
    const title = item.title || "";
    const summary = item.summary || "";

    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.toLowerCase().includes(searchTerm.toLowerCase());

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
    if (!selectedId) return;

    try {
      await updateDoc(doc(db, "tourismContent", selectedId), {
        status: "archived",
        updatedAt: serverTimestamp(),
      });

      setShowConfirm(false);
      setSelectedId(null);
      fetchContent();
      showToast("Content archived!");
    } catch (error) {
      console.error("Error archiving content:", error);
      showToast("Failed to archive content.");
    }
  };

  const handleRestore = async (id) => {
    try {
      await updateDoc(doc(db, "tourismContent", id), {
        status: "draft",
        updatedAt: serverTimestamp(),
      });

      fetchContent();
      showToast("Content restored as draft!");
    } catch (error) {
      console.error("Error restoring content:", error);
      showToast("Failed to restore content.");
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.contentType) {
        showToast("Please select a content type.");
        return;
      }

      if (!formData.title.trim()) {
        showToast("Please enter a title.");
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
    }
  };

  const uploadImage = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "tourism_upload");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dbyz3shts/image/upload",
      {
        method: "POST",
        body: data,
      }
    );

    const result = await res.json();

    if (!result.secure_url) {
      throw new Error("Image upload failed.");
    }

    return result.secure_url;
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-[#2563EB]">
        Manage Tourism Content
      </h2>

      {/* SEARCH + FILTERS + BUTTONS */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex w-full flex-wrap items-center gap-4 md:w-auto">
          <div className="relative flex w-full items-center rounded-full border border-gray-200 bg-white px-5 py-3 shadow-sm md:w-[350px]">
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent pr-10 text-sm outline-none"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-10 text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            )}

            <FiSearch className="text-gray-500" />
          </div>

          <div className="group relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-[48px] cursor-pointer appearance-none rounded-full border border-gray-200 bg-white px-5 py-3 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="">All Types</option>
              <option value="Article">Article</option>
              <option value="Highlight">Highlight</option>
              <option value="Event">Event</option>
              <option value="Gallery">Gallery</option>
            </select>

            <svg
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-transform duration-300 group-focus-within:rotate-180"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          <button
            onClick={() => setShowArchived(!showArchived)}
            className="rounded-full border border-gray-300 px-5 py-3 text-sm transition hover:bg-gray-100 hover:shadow-lg"
          >
            {showArchived ? "View Active" : "View Archived"}
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-full bg-[#2563EB] px-6 py-3 text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
          >
            <FiPlus />
            Add Content
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="mt-10 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-6 gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-sm font-medium text-gray-600">
          <span>Title</span>
          <span>Type & Category</span>
          <span>Status</span>
          <span>Summary</span>
          <span>Date</span>
          <span className="text-center">Actions</span>
        </div>

        {filteredContent.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-6 items-center gap-4 border-b px-6 py-4 text-sm transition last:border-b-0 hover:bg-gray-50"
          >
            <span className="line-clamp-2 font-medium">{item.title}</span>

            <div className="flex flex-col">
              <span className="font-semibold text-[#2563EB]">
                {item.contentType}
              </span>
              {item.category && (
                <span className="text-xs text-gray-500">{item.category}</span>
              )}
            </div>

            <span className="capitalize">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  item.status === "published"
                    ? "bg-green-100 text-green-700"
                    : item.status === "archived"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {item.status}
              </span>
            </span>

            <span className="truncate">
              {item.contentType === "Gallery" ? (
                <em className="text-gray-400">Media only</em>
              ) : item.contentType === "Highlight" && item.videoURL ? (
                <em className="text-gray-500">Video highlight</em>
              ) : (
                item.summary
              )}
            </span>

            <span className="text-xs text-gray-500">
              {item.createdAt?.toLocaleDateString?.() || "—"}
            </span>

            <div className="flex flex-col items-center gap-2">
              {!showArchived ? (
                <>
                  <button
                    onClick={() => openEditModal(item)}
                    className="w-20 rounded-md bg-yellow-100 px-3 py-1 text-xs text-yellow-700 transition hover:bg-yellow-200"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => {
                      setSelectedId(item.id);
                      setShowConfirm(true);
                    }}
                    className="w-20 rounded-md bg-red-100 px-3 py-1 text-xs text-red-600 transition hover:bg-red-200"
                  >
                    Archive
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleRestore(item.id)}
                  className="w-20 rounded-md bg-green-100 px-3 py-1 text-xs text-green-700 transition hover:bg-green-200"
                >
                  Restore
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredContent.length === 0 && (
          <div className="p-10 text-center text-gray-500">
            No content found.
          </div>
        )}
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl animate-fadeIn">
            <button
              onClick={() => {
                setOpenModal(false);
                resetForm();
              }}
              className="absolute right-5 top-5 text-gray-500 hover:text-red-500"
            >
              <FiX />
            </button>

            <h3 className="mb-6 text-xl font-semibold text-[#2563EB]">
              {editingId ? "Edit Content" : "Add Tourism Content"}
            </h3>

            <div className="space-y-4">
              {/* CONTENT TYPE + CATEGORY */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <select
                  value={formData.contentType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contentType: e.target.value,
                      category: "",
                      eventDate: "",
                      videoURL: "",
                      imageURL: "",
                      summary: "",
                      content: "",
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select Content Type</option>
                  <option value="Article">Article</option>
                  <option value="Highlight">Highlight</option>
                  <option value="Event">Event</option>
                  <option value="Gallery">Gallery</option>
                </select>

                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  disabled={!formData.contentType}
                  className={`w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 ${
                    !formData.contentType ? "cursor-not-allowed bg-gray-100" : ""
                  }`}
                >
                  <option value="">Select Category</option>
                  {formData.contentType &&
                    CATEGORY_OPTIONS[formData.contentType]?.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>

              {/* TITLE */}
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              />

              {/* EVENT DATE */}
              {formData.contentType === "Event" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-500">
                    Event Date
                  </label>

                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        eventDate: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              )}

              {/* HIGHLIGHT VIDEO URL */}
              {formData.contentType === "Highlight" && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                  <label className="mb-1 block text-xs font-semibold text-[#2563EB]">
                    Video Link Optional
                  </label>

                  <input
                    type="text"
                    placeholder="Paste YouTube or Facebook video link"
                    value={formData.videoURL}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        videoURL: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    Supported: YouTube links and public Facebook video links.
                    Upload an image below as thumbnail or fallback.
                  </p>
                </div>
              )}

              {/* IMAGE UPLOAD */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500">
                  Image / Thumbnail
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
                      showToast("Image uploaded!");
                    } catch (error) {
                      console.error("Upload error:", error);
                      showToast("Image upload failed.");
                    }
                  }}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                />

                {formData.imageURL && (
                  <img
                    src={formData.imageURL}
                    alt="Preview"
                    className="mt-3 h-36 w-full rounded-xl object-cover"
                  />
                )}
              </div>

              {/* SUMMARY + CONTENT */}
              {formData.contentType !== "Gallery" && (
                <>
                  <textarea
                    rows="2"
                    placeholder="Short Summary"
                    value={formData.summary}
                    onChange={(e) =>
                      setFormData({ ...formData, summary: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
                  />

                  {formData.contentType !== "Highlight" && (
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <ReactQuill
                        theme="snow"
                        value={formData.content}
                        onChange={(value) =>
                          setFormData({ ...formData, content: value })
                        }
                      />
                    </div>
                  )}
                </>
              )}

              {/* STATUS */}
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>

              <button
                onClick={handleSubmit}
                className="w-full rounded-lg bg-[#2563EB] py-3 font-medium text-white transition hover:bg-blue-700"
              >
                {editingId ? "Update Content" : "Save Content"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM ARCHIVE MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[350px] rounded-xl bg-white p-6 text-center shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Archive this entry?</h3>

            <p className="mb-6 text-sm text-gray-500">
              This entry will be hidden from the list but not permanently
              deleted.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setSelectedId(null);
                }}
                className="rounded-md bg-gray-100 px-4 py-2 font-medium hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                onClick={handleArchive}
                className="rounded-md bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-green-500 px-6 py-3 text-white shadow-lg animate-fadeIn">
          {toast}
        </div>
      )}
    </div>
  );
};

export default ManageTourismContent;