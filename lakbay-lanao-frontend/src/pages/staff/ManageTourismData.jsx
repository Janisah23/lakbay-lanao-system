import { useState, useEffect } from "react";
import { FiSearch, FiPlus, FiX } from "react-icons/fi";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { updateDoc, doc } from "firebase/firestore";


const getCoordinates = async (place, province) => {
  try {
    const res = await fetch(
      `http://localhost:5000/api/geocode?place=${encodeURIComponent(place)}&province=${encodeURIComponent(province)}`
    );

    if (!res.ok) {
      console.error("Geocode failed:", res.status);
      return null;
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};


function ManageTourismData() {
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [tourismList, setTourismList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    type: "",
    description: "",
    province: "Lanao del Sur",
    municipality: "",
    latitude: "",
    longitude: ""
  });


const handleArchive = async () => {
  if (!selectedId) return;

  try {
    await updateDoc(doc(db, "tourismData", selectedId), {
      status: "archived",
    });

    setToast("Entry archived successfully!");
  } catch (error) {
    console.error("Archive failed:", error);
  }

  setShowConfirm(false);
  setSelectedId(null);

  setTimeout(() => setToast(""), 3000);
};

const handleRestore = async (id) => {
  try {
    await updateDoc(doc(db, "tourismData", id), {
      status: "active",
    });

    setToast("Entry restored successfully!");
    setTimeout(() => setToast(""), 3000);
  } catch (error) {
    console.error("Restore failed:", error);
  }
};

  const typeOptions = {
  Destination: ["Beach", "Mountain", "Waterfall", "Island"],
  Establishment: ["Hotel", "Restaurant", "Resort", "Cafe"],
  Landmark: ["Historical", "Natural", "Architectural"],
  "Cultural Heritage Site": ["Museum", "Ancestral House", "Festival Site"],
};

  const municipalities = [
  "Amai Manabilang", "Bacolod-Kalawi", "Balabagan", "Balindong", "Bayang", "Binidayan", "Buadiposo-Buntong", "Bubong",
  "Butig", "Calanogas", "Ditsaan-Ramain", "Ganassi", "Kapai", "Kapatagan", "Lumba-Bayabao", "Lumbaca-Unayan", "Lumbatan", "Lumbayanague",
  "Madalum", "Madamba", "Maguing", "Malabang", "Marantao", "Marogong", "Masiu", "Mulondo", "Pagayawan", "Piagapo",
  "Picong", "Poona Bayabao", "Pualas", "Saguiaran", "Sultan Dumalondong", "Tagoloan II", "Tamparan", "Taraka", "Tubaran", "Tugaya", "Wao"
  ];


const filteredTourism = tourismList.filter((item) => {
  const isArchived = item.status === "archived";

  if (!showArchived && isArchived) return false;
  if (showArchived && !isArchived) return false;

  const matchesSearch =
    item.name.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesCategory =
    selectedCategory === "" || item.category === selectedCategory;

  return matchesSearch && matchesCategory;
});

// REALTIME LISTENER
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "tourismData"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTourismList(data);
      }
    );

    return () => unsubscribe();
  }, []);

const handleChange = async (e) => {
  const { name, value } = e.target;

  // CATEGORY CHANGE
  if (name === "category") {
    setFormData((prev) => ({
      ...prev,
      category: value,
      type: "",
    }));
    return;
  }

  // MUNICIPALITY CHANGE (AUTO COORDINATES)
if (name === "municipality") {
  // ❗ prevent empty place name
  if (!formData.name) {
    console.warn("Place name is empty, skipping geocode");
    setFormData((prev) => ({
      ...prev,
      municipality: value,
    }));
    return;
  }

  try {
    const coords = await getCoordinates(
      `${formData.name}, ${value}`,
      formData.province
    );

    setFormData((prev) => ({
      ...prev,
      municipality: value,
      latitude: coords?.lat || "",
      longitude: coords?.lng || "",
    }));
  } catch (error) {
    console.error("Failed to get coordinates:", error);
  }

  return;
}
// DEFAULT INPUT CHANGE
  setFormData((prev) => ({
    ...prev,
    [name]: value,
  }));
};

const handleSubmit = async (e) => {
  
const user = auth.currentUser;

console.log("CURRENT USER:", user);

if (!user) {
  alert("You must be logged in to add data.");
  setLoading(false);
  return;
}
  e.preventDefault();
  setLoading(true);

  try {
    console.log("STEP 1: Start submit");

    let imageURL = null;

    // 🔹 IMAGE UPLOAD
    if (imageFile) {
      console.log("STEP 2: Uploading image...");

      const formDataImage = new FormData();
      formDataImage.append("file", imageFile);
      formDataImage.append("upload_preset", "tourism_upload");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dbyz3shts/image/upload",
        {
          method: "POST",
          body: formDataImage,
        }
      );

      const data = await response.json();
      imageURL = data.secure_url;

      console.log("STEP 3: Image uploaded:", imageURL);
    }

    // 🔹 UPDATE
    if (editingId) {
      console.log("STEP 4: Updating document", editingId);

      await updateDoc(doc(db, "tourismData", editingId), {
        name: formData.name,
        category: formData.category,
        type: formData.type,
        description: formData.description,
        location: {
          province: "Lanao del Sur",
          municipality: formData.municipality,
        },
        coordinates: {
          lat: Number(formData.latitude),
          lng: Number(formData.longitude),
        },
        ...(imageURL && { imageURL }),
      });

      console.log("✅ UPDATE SUCCESS");
      setToast("Entry updated successfully!");
    } 
    
    // 🔹 ADD NEW
    else {
      console.log("STEP 5: Adding new document");

      if (!imageURL) {
        console.log("❌ ERROR: No image");
        alert("Please upload an image");
        setLoading(false);
        return;
      }

      console.log("STEP 6: Sending to Firestore...");

      await addDoc(collection(db, "tourismData"), {
        name: formData.name,
        category: formData.category,
        type: formData.type,
        description: formData.description,
        location: {
          province: "Lanao del Sur",
          municipality: formData.municipality,
        },
        coordinates: {
          lat: Number(formData.latitude),
          lng: Number(formData.longitude),
        },
        imageURL,
        status: "active",
        createdAt: serverTimestamp(),
      });

      console.log("✅ ADD SUCCESS");
      setToast("Entry added successfully!");
    }

    console.log("STEP 7: Done");

    setOpenModal(false);
    setEditingId(null);
    setImageFile(null);

    setTimeout(() => setToast(""), 3000);

  } catch (error) {
    console.error("FINAL ERROR:", error);
  }

  setLoading(false);
};

  return (
    <>
      <h2 className="text-2xl font-semibold text-[#2563EB]">
        Manage Tourism Data
      </h2>

      {/* Search + Filters + Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-8">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">

          {/* Search */}
          <div className="relative flex items-center bg-white 
          w-full md:w-[350px] px-5 py-3 rounded-full 
          shadow-sm border border-gray-200">

            <input
              type="text"
              placeholder="Search tourism..."
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

          {/* Category Filter */}
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
              <option value="Destination">Destination</option>
              <option value="Establishment">Establishment</option>
              <option value="Landmark">Landmark</option>
              <option value="Cultural Heritage Site">
                Cultural Heritage Site
              </option>
            </select>

            <svg
              className="pointer-events-none absolute right-4 top-1/2 
              -translate-y-1/2 w-4 h-4 text-gray-500 
              transition-transform duration-300 
              group-focus-within:rotate-180"
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

          {/* Buttons */}
          <div className="flex items-center gap-3">

            {/* View Archived — FIXED: removed duplicate hover:bg and transition */}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="px-5 py-3 rounded-full text-sm border border-gray-300
              hover:bg-gray-100 hover:shadow-lg transition duration-300"
            >
              {showArchived ? "View Active" : "View Archived"}
            </button>

            {/* Add Entry */}
            <button
              onClick={() => setOpenModal(true)}
              className="flex items-center gap-2 bg-[#2563EB]
              text-white px-6 py-3 rounded-full shadow-md
              hover:shadow-lg hover:bg-blue-700 transition duration-300"
            >
              <FiPlus />
              <span className="text-sm font-medium">Add Entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="mt-10 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* HEADER */}
        <div className="grid grid-cols-7 gap-4 px-6 py-4 text-sm text-gray-600 font-medium">
          <span>Image</span>
          <span>Name</span>
          <span>Category</span>
          <span>Type</span>
          <span>Location</span>
          <span>Description</span>
          <span className="text-center">Actions</span>
        </div>

        {/* BODY */}
        {filteredTourism.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 text-sm">
            No entries found.
          </div>
        ) : (
          filteredTourism.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-7 gap-4 px-6 py-4 text-sm border-t items-center"
            >
              <img
                src={item.imageURL}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-lg"
              />

              <span className="font-medium">{item.name}</span>
              <span>{item.category}</span>
              <span>{item.type}</span>
              <span>{item.location?.municipality}, {item.location?.province}</span>
              <span className="truncate max-w-[200px]">{item.description}</span>

              <div className="flex flex-col items-center gap-2">
                {!showArchived ? (
                  <>
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setFormData({
                          name: item.name,
                          category: item.category,
                          type: item.type,
                          description: item.description,
                          municipality: item.location?.municipality || "",
                          province: item.location?.province || "Lanao del Sur",
                          latitude: item.coordinates?.lat || "",
                          longitude: item.coordinates?.lng || "",
                        });
                        setOpenModal(true);
                      }}
                      className="w-20 px-3 py-1 text-xs rounded-md 
                      bg-yellow-100 text-yellow-700 
                      hover:bg-yellow-200 transition"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => {
                        setSelectedId(item.id);
                        setShowConfirm(true);
                      }}
                      className="w-20 px-3 py-1 text-xs rounded-md 
                      bg-red-100 text-red-600 
                      hover:bg-red-200 transition"
                    >
                      Archive
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleRestore(item.id)}
                    className="w-20 px-3 py-1 text-xs rounded-md 
                    bg-green-100 text-green-700 
                    hover:bg-green-200 transition"
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] 
          overflow-y-auto rounded-2xl shadow-xl p-6 relative 
          transform transition-all duration-300 scale-100 opacity-100">
            <button
              onClick={() => {
                setOpenModal(false);
                setEditingId(null);
                setImageFile(null);
                setFormData({
                  name: "", category: "", type: "", description: "",
                  province: "Lanao del Sur", municipality: "", latitude: "", longitude: ""
                });
              }}
              className="absolute top-5 right-5 text-gray-500 hover:text-red-500"
            >
              <FiX />
            </button>

            <h3 className="text-xl font-semibold text-[#2563EB] mb-6">
              {editingId ? "Update Tourism Entry" : "Add Tourism Entry"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">

              <input
                type="text"
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-4 py-3"
              />

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-4 py-3"
              >
                <option value="">Select Category</option>
                <option value="Destination">Destination</option>
                <option value="Establishment">Establishment</option>
                <option value="Landmark">Landmark</option>
                <option value="Cultural Heritage Site">Cultural Heritage Site</option>
              </select>

              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-4 py-3"
              >
                <option value="">Select Type</option>
                {formData.category &&
                  typeOptions[formData.category]?.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
              </select>

              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                className="w-full border rounded-lg px-4 py-3 resize-none"
              />

              <select
                name="municipality"
                value={formData.municipality}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-4 py-3"
              >
                <option value="">Select Municipality</option>
                {municipalities.map((mun, index) => (
                  <option key={index} value={mun}>{mun}</option>
                ))}
              </select>

              <input
                type="number"
                name="latitude"
                value={formData.latitude}
                readOnly
                className="w-full border rounded-lg px-4 py-3 bg-gray-100"
              />

              <input
                type="number"
                name="longitude"
                value={formData.longitude}
                readOnly
                className="w-full border rounded-lg px-4 py-3 bg-gray-100"
              />
              <input
                type="text"
                value="Lanao del Sur"
                readOnly
                className="w-full border rounded-lg px-4 py-3 bg-gray-100"
              />

              <div className="border rounded-lg px-4 py-3">
                <label className="block text-sm text-gray-500 mb-1">
                  {editingId ? "Replace Image (optional)" : "Upload Image"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  {...(!editingId && { required: true })}
                  className="w-full text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2563EB] text-white py-3 rounded-lg
                hover:bg-blue-700 transition duration-300 font-medium"
              >
                {loading ? "Uploading..." : "Save Entry"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM ARCHIVE */}
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeIn">
          {toast}
        </div>
      )}
    </>
  );
}

export default ManageTourismData;