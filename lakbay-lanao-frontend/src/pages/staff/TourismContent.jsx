import { useState, useEffect } from "react";
import { FiPlus, FiSearch, FiX } from "react-icons/fi";
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
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";


// 1. Updated Dynamic Categories based on your new Schema
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
    "Featured Events",
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
  ],
  Gallery: [
    "Sights & Attractions",
    "Cultural & Arts",
    "Spots"
  ]
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

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

const [formData, setFormData] = useState({
  title: "",
  contentType: "",
  category: "", 
  summary: "",
  content: "",
  status: "draft",
  imageURL: "",
  eventDate: "",
});

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

  const handleArchive = async () => {
    await updateDoc(doc(db, "tourismContent", selectedId), {
      status: "archived",
    });

    setShowConfirm(false);
    fetchContent();
    showToast("Content archived!");
  };

  const handleSubmit = async () => {
    try {
      // If saving a Gallery, ensure summary and content are cleared
      const finalData = { ...formData };
      if (finalData.contentType === "Gallery") {
        finalData.summary = "";
        finalData.content = "";
      }

    if (finalData.contentType === "Event" && finalData.eventDate) {
      finalData.eventDate = Timestamp.fromDate(new Date(finalData.eventDate));
    }

      if (editingId) {
        await updateDoc(doc(db, "tourismContent", editingId), {
          ...finalData,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "tourismContent"), {
          ...finalData,
          status: "published",
          createdAt: serverTimestamp(),
        });
      }

      setOpenModal(false);
      fetchContent();
      showToast("Content saved successfully!");
    } catch (error) {
      console.error(error);
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
    return result.secure_url;
  };

  return (
    <div>  
      <h2 className="text-2xl font-semibold text-[#2563EB]">
        Manage Tourism Content
      </h2>

      {/* Search + Filters + Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-8">
        {/* LEFT SIDE */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex items-center bg-white w-full md:w-[350px] px-5 py-3 rounded-full shadow-sm border border-gray-200">
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-sm bg-transparent pr-10"
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

          {/* Type Filter */}
          <div className="relative group">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none bg-white border border-gray-200 px-5 py-3 pr-10 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] h-[48px] cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="Article">Article</option>
              <option value="Highlight">Highlight</option>
              <option value="Event">Event</option>
              <option value="Gallery">Gallery</option>
            </select>
            <svg
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-transform duration-300 group-focus-within:rotate-180"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* View Archived */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="px-5 py-3 rounded-full text-sm border border-gray-300 hover:bg-gray-100 hover:shadow-lg transition"
          >
            {showArchived ? "View Active" : "View Archived"}
          </button>

          {/* Add Content */}
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                title: "",
                contentType: "",
                category: "",
                summary: "",
                content: "",
                status: "draft",
                imageURL: "",
                eventDate: "",
              });
              setOpenModal(true);
            }}
            className="flex items-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-full shadow-md hover:shadow-lg hover:bg-blue-700 transition"
          >
            <FiPlus />
            Add Content
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="mt-10 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-6 gap-4 px-6 py-4 text-sm text-gray-600 font-medium bg-gray-50 border-b border-gray-200">
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
            className="grid grid-cols-6 gap-4 px-6 py-4 text-sm border-b last:border-b-0 items-center hover:bg-gray-50 transition"
          >
            <span className="font-medium line-clamp-2">{item.title}</span>
            <div className="flex flex-col">
              <span className="font-semibold text-[#2563EB]">{item.contentType}</span>
              {item.category && <span className="text-xs text-gray-500">{item.category}</span>}
            </div>
            <span className="capitalize">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${item.status === 'published' ? 'bg-green-100 text-green-700' : item.status === 'archived' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                {item.status}
              </span>
            </span>
            <span className="truncate">{item.contentType === 'Gallery' ? <em className="text-gray-400">Media only</em> : item.summary}</span>
            <span className="text-xs text-gray-500">{item.createdAt?.toLocaleDateString()}</span>
            
            {/* ACTIONS */}
            <div className="flex flex-col items-center gap-2">
              {!showArchived ? (
                <>
                  <button
                    onClick={() => {
                      setEditingId(item.id);
                      setFormData({
                        ...item,
                        category: item.category || "", 
                      });
                      setOpenModal(true);
                    }}
                    className="w-20 px-3 py-1 text-xs rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => {
                      setSelectedId(item.id);
                      setShowConfirm(true);
                    }}
                    className="w-20 px-3 py-1 text-xs rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition"
                  >
                    Archive
                  </button>
                </>
              ) : (
                <button
                  className="w-20 px-3 py-1 text-xs rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition"
                >
                  Restore
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredContent.length === 0 && (
           <div className="p-10 text-center text-gray-500">No content found.</div>
        )}
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl p-6 relative animate-fadeIn">
            <button
              onClick={() => setOpenModal(false)}
              className="absolute top-5 right-5 text-gray-500 hover:text-red-500"
            >
              <FiX />
            </button>

            <h3 className="text-xl font-semibold text-[#2563EB] mb-6">
              {editingId ? "Edit Content" : "Add Tourism Content"}
            </h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border rounded-lg px-4 py-3 text-sm"
              />
              
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const url = await uploadImage(file);
                  setFormData({ ...formData, imageURL: url });
                }}
                className="w-full border rounded-lg px-4 py-3 text-sm"
              />
              
              {formData.imageURL && (
                 <img src={formData.imageURL} alt="Preview" className="h-32 rounded-lg object-cover" />
              )}

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={formData.contentType}
                  onChange={(e) =>
                    setFormData({ ...formData, contentType: e.target.value, category: "" })
                  }
                  className="w-full border rounded-lg px-4 py-3 text-sm"
                >
                  <option value="">Select Content Type</option>
                  <option value="Article">Article</option>
                  <option value="Highlight">Highlight</option>
                  <option value="Event">Event</option>
                  <option value="Gallery">Gallery</option>
                </select>


                
              {formData.contentType === "Event" && (
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      eventDate: e.target.value,
                    })
                  }
                  className="w-full border p-2 mb-3"
                />
              )}

          
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  disabled={!formData.contentType}
                  className={`w-full border rounded-lg px-4 py-3 text-sm ${!formData.contentType ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Category</option>
                  {formData.contentType && CATEGORY_OPTIONS[formData.contentType]?.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* HIDE THESE FIELDS IF TYPE IS GALLERY */}
              {formData.contentType !== "Gallery" && (
                <>
                  <textarea
                    rows="2"
                    placeholder="Short Summary"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full border rounded-lg px-4 py-3 text-sm"
                  />

                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                  />
                </>
              )}
              
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border rounded-lg px-4 py-3 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>

              <button
                onClick={handleSubmit}
                className="w-full bg-[#2563EB] text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                {editingId ? "Update Content" : "Save Content"}
              </button>            
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM ARCHIVE MODAL */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[350px] shadow-lg text-center">
            <h3 className="text-lg font-semibold mb-4">Archive this entry?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This entry will be hidden from the list but not permanently deleted.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeIn z-50">
          {toast}
        </div>
      )}
    </div>
  );
};

export default ManageTourismContent;