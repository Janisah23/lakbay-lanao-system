import { useState, useEffect } from "react";
import { 
  FiSearch, 
  FiPlus, 
  FiX, 
  FiFilter, 
  FiEdit2, 
  FiArchive, 
  FiRefreshCw, 
  FiImage, 
  FiMapPin,
  FiGrid,
  FiList,
  FiBold,
  FiItalic,
  FiAlignLeft
} from "react-icons/fi";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  doc
} from "firebase/firestore";
import { db, auth } from "../../firebase/config";

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
  const [viewMode, setViewMode] = useState("content"); // "content" (List) | "tiles"
  const [showArchived, setShowArchived] = useState(false);
  
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState("");

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
    "Cultural Heritage Site": ["Museum", "Crafts", "Tradition", "Heritage", "Historical"],
  };

  const municipalities = [
    "Amai Manabilang", "Bacolod-Kalawi", "Balabagan", "Balindong", "Bayang", "Binidayan", "Buadiposo-Buntong", "Bubong",
    "Butig", "Calanogas", "Ditsaan-Ramain", "Ganassi", "Kapai", "Kapatagan", "Lumba-Bayabao", "Lumbaca-Unayan", "Lumbatan", "Lumbayanague",
    "Madalum", "Madamba", "Maguing", "Malabang", "Marantao", "Marawi", "Marogong", "Masiu", "Mulondo", "Pagayawan", "Piagapo",
    "Picong", "Poona Bayabao", "Pualas", "Saguiaran", "Sultan Dumalondong", "Tagoloan II", "Tamparan", "Taraka", "Tubaran", "Tugaya", "Wao"
  ];

  const filteredTourism = tourismList.filter((item) => {
    const isArchived = item.status === "archived";
    if (!showArchived && isArchived) return false;
    if (showArchived && !isArchived) return false;

    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tourismData"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTourismList(data);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = async (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      setFormData((prev) => ({ ...prev, category: value, type: "" }));
      return;
    }

    if (name === "municipality") {
      if (!formData.name) {
        setFormData((prev) => ({ ...prev, municipality: value }));
        return;
      }

      try {
        const coords = await getCoordinates(`${formData.name}, ${value}`, formData.province);
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

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to add data.");
      setLoading(false);
      return;
    }
    e.preventDefault();
    setLoading(true);

    try {
      let imageURL = null;

      if (imageFile) {
        const formDataImage = new FormData();
        formDataImage.append("file", imageFile);
        formDataImage.append("upload_preset", "tourism_upload");

        const response = await fetch("https://api.cloudinary.com/v1_1/dbyz3shts/image/upload", {
          method: "POST",
          body: formDataImage,
        });

        const data = await response.json();
        imageURL = data.secure_url;
      }

      if (editingId) {
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
        setToast("Entry updated successfully!");
      } else {
        if (!imageURL) {
          alert("Please upload an image");
          setLoading(false);
          return;
        }

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
        setToast("Entry added successfully!");
      }

      setOpenModal(false);
      setEditingId(null);
      setImageFile(null);
      setTimeout(() => setToast(""), 3000);

    } catch (error) {
      console.error("FINAL ERROR:", error);
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
              Manage Tourism Data
            </h1>
            <p className="text-gray-500 mt-2">
              Add, update, and organize destinations, heritage sites, and landmarks.
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
              {showArchived ? "View Active Entries" : "View Archived"}
            </button>

            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  name: "", category: "", type: "", description: "",
                  province: "Lanao del Sur", municipality: "", latitude: "", longitude: ""
                });
                setImageFile(null);
                setOpenModal(true);
              }}
              className="flex items-center gap-2 rounded-full bg-[#2563eb] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
            >
              <FiPlus />
              Add Entry
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
              placeholder="Search destinations..."
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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`${inputStyle} pl-11 appearance-none cursor-pointer`}
            >
              <option value="">All Categories</option>
              <option value="Destination">Destination</option>
              <option value="Establishment">Establishment</option>
              <option value="Landmark">Landmark</option>
              <option value="Cultural Heritage Site">Cultural Heritage Site</option>
            </select>
          </div>

          <div className="flex items-center bg-white border border-gray-200 rounded-[12px] p-1 shadow-sm w-full md:w-auto md:col-span-3 lg:col-span-3 md:justify-self-end justify-center">
            <button
              onClick={() => setViewMode("content")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-[8px] flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                viewMode === "content" ? "bg-blue-50 text-[#2563eb] shadow-sm" : "text-gray-400 hover:text-gray-700"
              }`}
              title="content"
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
            DYNAMIC DATA DISPLAY (CONTENT vs TILES)
        ============================================================== */}
        
        {filteredTourism.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-[#2563eb] mb-4">
              <FiSearch className="text-2xl" />
            </div>
            <h3 className="text-gray-800 font-bold text-lg mb-1">No entries found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : viewMode === "content" ? (
          /* CONTENT VIEW (TABLE) */
          <div className="bg-white rounded-[28px] border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
              <div className="min-w-[1000px]">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span className="col-span-3">Destination</span>
                  <span className="col-span-2">Category & Type</span>
                  <span className="col-span-3">Location</span>
                  <span className="col-span-3">Description</span>
                  <span className="col-span-1 text-center">Actions</span>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredTourism.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 text-sm border-b border-gray-50 items-center hover:bg-blue-50/30 transition-colors last:border-b-0">
                      <div className="col-span-3 flex items-center gap-4 pr-2">
                        <div className="w-12 h-12 rounded-[12px] bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-200">
                          {item.imageURL ? (
                            <img src={item.imageURL} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <FiImage className="text-gray-400 text-lg" />
                          )}
                        </div>
                        <span className="font-bold text-gray-900 line-clamp-2">{item.name}</span>
                      </div>
                      <div className="col-span-2 flex flex-col items-start gap-1">
                        <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-50 text-[#2563eb] border border-blue-100 uppercase tracking-wide">
                          {item.category}
                        </span>
                        <span className="text-xs font-medium text-gray-500">{item.type}</span>
                      </div>
                      <div className="col-span-3 flex items-center gap-2 text-gray-700 font-medium">
                        <FiMapPin className="text-[#2563eb] flex-shrink-0" />
                        <span className="line-clamp-2">{item.location?.municipality}, {item.location?.province}</span>
                      </div>
                      <div className="col-span-3 text-gray-500 text-xs leading-relaxed line-clamp-3 pr-4">
                        {item.description}
                      </div>
                      <div className="col-span-1 flex flex-col gap-2 items-center">
                        {!showArchived ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(item.id);
                                setFormData({
                                  name: item.name, category: item.category, type: item.type, description: item.description,
                                  municipality: item.location?.municipality || "", province: item.location?.province || "Lanao del Sur",
                                  latitude: item.coordinates?.lat || "", longitude: item.coordinates?.lng || "",
                                });
                                setOpenModal(true);
                              }}
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
            {filteredTourism.map((item) => (
              <div key={item.id} className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-300 group flex flex-col h-full">
                
                <div className="h-44 bg-gray-100 relative overflow-hidden flex-shrink-0">
                  {item.imageURL ? (
                    <img src={item.imageURL} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <FiImage className="text-4xl" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm text-[10px] font-extrabold text-[#2563eb] uppercase tracking-wider border border-white/50">
                    {item.category}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <h4 className="font-bold text-gray-900 text-lg mb-1.5 line-clamp-1 group-hover:text-[#2563eb] transition-colors">{item.name}</h4>
                  
                  <div className="flex items-center gap-1.5 text-[#2563eb] text-xs font-medium mb-3">
                     <FiMapPin /> 
                     <span className="text-gray-500 line-clamp-1">{item.location?.municipality}, {item.location?.province}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-3 mb-6 flex-grow leading-relaxed">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100">
                    {!showArchived ? (
                      <>
                        <button 
                          onClick={() => {
                            setEditingId(item.id);
                            setFormData({
                              name: item.name, category: item.category, type: item.type, description: item.description,
                              municipality: item.location?.municipality || "", province: item.location?.province || "Lanao del Sur",
                              latitude: item.coordinates?.lat || "", longitude: item.coordinates?.lng || "",
                            });
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
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[28px] shadow-2xl p-8 relative animate-in fade-in zoom-in-95 duration-200">
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
              className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
            >
              <FiX className="text-lg" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? "Edit Tourism Entry" : "Add New Entry"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Destination Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Lake Lanao"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={inputStyle}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className={`${inputStyle} appearance-none cursor-pointer`}
                  >
                    <option value="">Select Category</option>
                    <option value="Destination">Destination</option>
                    <option value="Establishment">Establishment</option>
                    <option value="Landmark">Landmark</option>
                    <option value="Cultural Heritage Site">Cultural Heritage Site</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    disabled={!formData.category}
                    className={`${inputStyle} appearance-none cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed`}
                  >
                    <option value="">Select Type</option>
                    {formData.category &&
                      typeOptions[formData.category]?.map((type, index) => (
                        <option key={index} value={type}>{type}</option>
                      ))}
                  </select>
                </div>
              </div>

              {/* UPGRADED DESCRIPTION FIELD (Rich Text Feel) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                <div className="border border-gray-200 rounded-[12px] overflow-hidden focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-blue-100 transition bg-white shadow-sm">
                  <div className="bg-gray-50 border-b border-gray-200 px-3 py-2.5 flex items-center gap-1.5 text-gray-500">
                     <button type="button" className="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded-md transition" title="Bold"><FiBold /></button>
                     <button type="button" className="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded-md transition" title="Italic"><FiItalic /></button>
                     <div className="w-px h-4 bg-gray-300 mx-2"></div>
                     <button type="button" className="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded-md transition" title="Align"><FiAlignLeft /></button>
                     <button type="button" className="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded-md transition" title="List"><FiList /></button>
                     <div className="ml-auto text-[10px] uppercase font-bold tracking-wider text-gray-400 pr-2">
                       Text Editor
                     </div>
                  </div>
                  <textarea
                    name="description"
                    placeholder="Write an engaging and detailed description about this location..."
                    value={formData.description}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-4 text-sm outline-none resize-y min-h-[160px] text-gray-700 leading-relaxed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Municipality</label>
                  <select
                    name="municipality"
                    value={formData.municipality}
                    onChange={handleChange}
                    required
                    className={`${inputStyle} appearance-none cursor-pointer`}
                  >
                    <option value="">Select Municipality</option>
                    {municipalities.map((mun, index) => (
                      <option key={index} value={mun}>{mun}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Province</label>
                  <input
                    type="text"
                    value="Lanao del Sur"
                    readOnly
                    className="w-full rounded-[12px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Latitude (Auto-filled)</label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    readOnly
                    className="w-full rounded-[12px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 outline-none cursor-not-allowed"
                    placeholder="e.g. 7.9942"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Longitude (Auto-filled)</label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    readOnly
                    className="w-full rounded-[12px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 outline-none cursor-not-allowed"
                    placeholder="e.g. 124.2845"
                  />
                </div>
              </div>

              <div className="rounded-[12px] border border-gray-200 p-4 bg-gray-50">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  {editingId ? "Replace Image (optional)" : "Upload Cover Image"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  {...(!editingId && { required: true })}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#2563eb] hover:file:bg-blue-100 cursor-pointer"
                />
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
                  disabled={loading}
                  className="flex items-center justify-center px-8 py-3 rounded-full text-sm font-medium text-white bg-[#2563eb] shadow-sm hover:shadow-md hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><FiRefreshCw className="animate-spin" /> Saving...</span>
                  ) : (
                    "Save Entry"
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Archive Entry?</h3>
            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
              This entry will be moved to the archive and hidden from public view. You can restore it later.
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

export default ManageTourismData;