import { useState, useEffect } from "react";
import { FiSearch, FiPlus, FiX } from "react-icons/fi";
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
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
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
  console.log("Cloudinary response:", data);

  if (!response.ok || !data.secure_url) {
    throw new Error(data.error?.message || "Cloudinary upload failed");
  }

  return data.secure_url;
};

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    console.log("Submitting gallery item...");
    console.log("Form data:", formData);
    console.log("Selected file:", mediaFile);

    let mediaURL = null;

    if (mediaFile) {
      console.log("Uploading to Cloudinary...");

      mediaURL = await uploadToCloudinary(mediaFile, formData.type);

      console.log("Cloudinary URL:", mediaURL);
    }

    if (editingId) {
      console.log("Updating existing media:", editingId);

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

      console.log("Saving to Firestore...");

      await addDoc(collection(db, "gallery"), {
        title: formData.title,
        category: formData.category,
        type: formData.type,
        src: mediaURL,
        status: "active",
        createdAt: serverTimestamp(),
      });

      console.log("Saved successfully to Firestore.");
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

  return (
    <>
      <h2 className="text-2xl font-semibold text-[#2563EB]">
        Manage Gallery
      </h2>

      <div className="flex flex-wrap items-center justify-between gap-4 mt-8">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div
            className="relative flex items-center bg-white
            w-full md:w-[350px] px-5 py-3 rounded-full
            shadow-sm border border-gray-200"
          >
            <input
              type="text"
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-sm bg-transparent pr-8"
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

          <div className="relative group">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-white border border-gray-200
              px-5 py-3 pr-10 rounded-full text-sm shadow-sm
              focus:outline-none focus:ring-2 focus:ring-[#2563EB]
              h-[48px] cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <svg
              className="pointer-events-none absolute right-4 top-1/2
              -translate-y-1/2 w-4 h-4 text-gray-500
              transition-transform duration-300 group-focus-within:rotate-180"
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

          <div className="relative group">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="appearance-none bg-white border border-gray-200
              px-5 py-3 pr-10 rounded-full text-sm shadow-sm
              focus:outline-none focus:ring-2 focus:ring-[#2563EB]
              h-[48px] cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>

            <svg
              className="pointer-events-none absolute right-4 top-1/2
              -translate-y-1/2 w-4 h-4 text-gray-500
              transition-transform duration-300 group-focus-within:rotate-180"
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="px-5 py-3 rounded-full text-sm border border-gray-300
              hover:bg-gray-100 hover:shadow-lg transition duration-300"
            >
              {showArchived ? "View Active" : "View Archived"}
            </button>

            <button
              onClick={() => setOpenModal(true)}
              className="flex items-center gap-2 bg-[#2563EB]
              text-white px-6 py-3 rounded-full shadow-md
              hover:shadow-lg hover:bg-blue-700 transition duration-300"
            >
              <FiPlus />
              <span className="text-sm font-medium">Add Media</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-10 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-6 gap-4 px-6 py-4 text-sm text-gray-600 font-medium">
          <span>Preview</span>
          <span>Title</span>
          <span>Category</span>
          <span>Type</span>
          <span>Status</span>
          <span className="text-center">Actions</span>
        </div>

        {filteredGallery.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 text-sm">
            No media found.
          </div>
        ) : (
          filteredGallery.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-6 gap-4 px-6 py-4 text-sm border-t items-center"
            >
              <div>
                {item.type === "image" ? (
                  <img
                    src={item.src}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                ) : (
                 <div className="relative w-16 h-16">
                  <video
                    src={item.src}
                    className="w-16 h-16 object-cover rounded-lg bg-black"
                    muted
                    playsInline
                    preload="metadata"
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-black/55 flex items-center justify-center">
                      <span className="text-white text-[10px] ml-[1px]">▶</span>
                    </div>
                  </div>
                </div>
                )}
              </div>

              <span className="font-medium">{item.title}</span>
              <span>{item.category}</span>
              <span className="capitalize">{item.type}</span>
              <span className="capitalize">{item.status || "active"}</span>

              <div className="flex flex-col items-center gap-2">
                {!showArchived ? (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setFormData({
                          title: item.title || "",
                          category: item.category || "",
                          type: item.type || "",
                        });
                        setOpenModal(true);
                      }}
                      className="w-20 px-3 py-1 text-xs rounded-md
                      bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        setSelectedId(item.id);
                        setShowConfirm(true);
                      }}
                      className="w-20 px-3 py-1 text-xs rounded-md
                      bg-red-100 text-red-600 hover:bg-red-200 transition"
                    >
                      Archive
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleRestore(item.id)}
                    className="w-20 px-3 py-1 text-xs rounded-md
                    bg-green-100 text-green-700 hover:bg-green-200 transition"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div
            className="bg-white w-full max-w-2xl max-h-[90vh]
            overflow-y-auto rounded-2xl shadow-xl p-6 relative"
          >
            <button
              onClick={() => {
                setOpenModal(false);
                resetForm();
              }}
              className="absolute top-5 right-5 text-gray-500 hover:text-red-500"
            >
              <FiX />
            </button>

            <h3 className="text-xl font-semibold text-[#2563EB] mb-6">
              {editingId ? "Update Media" : "Add Media"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                className="w-full border rounded-lg px-4 py-3"
              />

              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
                className="w-full border rounded-lg px-4 py-3"
              >
                <option value="">Select Category</option>
                {categories.map((cat, index) => (
                  <option key={index} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                required
                className="w-full border rounded-lg px-4 py-3"
              >
                <option value="">Select Type</option>
                {typeOptions.map((type, index) => (
                  <option key={index} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <div className="border rounded-lg px-4 py-3">
                <label className="block text-sm text-gray-500 mb-1">
                  {editingId ? "Replace File (optional)" : "Upload Image / Video"}
                </label>

                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setMediaFile(e.target.files[0])}
                  {...(!editingId && { required: true })}
                  className="w-full text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-medium transition duration-300 flex items-center justify-center gap-2
                  ${
                    loading
                      ? "bg-blue-400 text-white cursor-not-allowed"
                      : "bg-[#2563EB] text-white hover:bg-blue-700"
                  }`}
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                )}
                {loading ? "Uploading..." : "Save Entry"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[350px] shadow-lg text-center">
            <h3 className="text-lg font-semibold mb-4">Archive this media?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This media will be hidden from the gallery but not permanently deleted.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                onClick={handleArchive}
                className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeIn">
          {toast}
        </div>
      )}
    </>
  );
}

export default ManageGallery;