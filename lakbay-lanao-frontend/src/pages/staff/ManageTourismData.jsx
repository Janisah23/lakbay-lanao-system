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
  FiAlignLeft,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
} from "react-icons/fi";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import imageCompression from 'browser-image-compression';

const getCoordinates = async (place, province) => {
  try {
    const res = await fetch(
      `https://lakbay-lanao-backend.onrender.com/api/geocode?place=${encodeURIComponent(
        place
      )}&province=${encodeURIComponent(province)}`
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
  
  const [imageFiles, setImageFiles] = useState([]); 
  
  const [tourismList, setTourismList] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [viewMode, setViewMode] = useState("content");
  const [showArchived, setShowArchived] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState("");

  const [showMapAlert, setShowMapAlert] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    type: "",
    description: "",
    province: "Lanao del Sur",
    municipality: "",
    barangay: "", 
    street: "",   
    latitude: "",
    longitude: "",
  });

  const typeOptions = {
    Destination: ["Beach", "Mountain", "Waterfall", "Island"],
    Establishment: ["Hotel", "Restaurant", "Resort", "Cafe"],
    Landmark: ["Landmark","Historical", "Natural", "Architectural", "Religious", "Monument", "Public Sites"],
    "Cultural Heritage Site": [
      "Museum",
      "Crafts",
      "Tradition",
      "Heritage",
      "Historical",
    ],
  };

  const municipalities = [
    "Amai Manabilang", "Bacolod-Kalawi", "Balabagan", "Balindong", "Bayang",
    "Binidayan", "Buadiposo-Buntong", "Bubong", "Butig", "Calanogas",
    "Ditsaan-Ramain", "Ganassi", "Kapai", "Kapatagan", "Lumba-Bayabao",
    "Lumbaca-Unayan", "Lumbatan", "Lumbayanague", "Madalum", "Madamba",
    "Maguing", "Malabang", "Marantao", "Marawi", "Marogong", "Masiu",
    "Mulondo", "Pagayawan", "Piagapo", "Picong", "Poona Bayabao", "Pualas",
    "Saguiaran", "Sultan Dumalondong", "Tagoloan II", "Tamparan", "Taraka",
    "Tubaran", "Tugaya", "Wao",
  ];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "tourismData"), (snapshot) => {
      const data = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));
      setTourismList(data);
    });

    return () => unsubscribe();
  }, []);

  const filteredTourism = tourismList.filter((item) => {
    const isArchived = item.status === "archived";

    if (!showArchived && isArchived) return false;
    if (showArchived && !isArchived) return false;

    const matchesSearch = item.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "" || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTourism.length / itemsPerPage)
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedTourism = filteredTourism.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const resetForm = () => {
    setEditingId(null);
    setImageFiles([]); 
    setShowMapAlert(false);
    setFormData({
      name: "",
      category: "",
      type: "",
      description: "",
      province: "Lanao del Sur",
      municipality: "",
      barangay: "", 
      street: "",   
      latitude: "",
      longitude: "",
    });
  };

  const showToastMessage = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const handleArchive = async () => {
    if (!selectedId) return;

    try {
      await updateDoc(doc(db, "tourismData", selectedId), {
        status: "archived",
      });
      showToastMessage("Entry archived successfully!");
    } catch (error) {
      console.error("Archive failed:", error);
    }

    setShowConfirm(false);
    setSelectedId(null);
  };

  const handleRestore = async (id) => {
    try {
      await updateDoc(doc(db, "tourismData", id), {
        status: "active",
      });
      showToastMessage("Entry restored successfully!");
    } catch (error) {
      console.error("Restore failed:", error);
    }
  };

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

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // NEW: Appends newly selected images to the existing array
  const handleImageSelection = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImageFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
    // Clear the input value so the same file can be selected again if needed
    e.target.value = null;
  };

  // NEW: Removes an image from the staging array
  const removeImage = (indexToRemove) => {
    setImageFiles((prevFiles) => prevFiles.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to add data.");
      return;
    }

    // Manual validation since we removed the HTML 'required' tag on the file input
    if (!editingId && imageFiles.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    setLoading(true);

    try {
      let uploadedURLs = [];

      if (imageFiles.length > 0) {
        const options = {
          maxSizeMB: 2, 
          maxWidthOrHeight: 1920, 
          useWebWorker: false, 
        };

        try {
          const uploadPromises = imageFiles.map(async (file) => {
            const compressedFile = await imageCompression(file, options);
            
            const formDataImage = new FormData();
            formDataImage.append("file", compressedFile); 
            formDataImage.append("upload_preset", "tourism_upload");

            const response = await fetch(
              "https://api.cloudinary.com/v1_1/dbyz3shts/image/upload",
              {
                method: "POST",
                body: formDataImage,
              }
            );

            if (!response.ok) {
              throw new Error(`Upload failed with status: ${response.status}`);
            }

            const data = await response.json();
            return data.secure_url;
          });

          uploadedURLs = await Promise.all(uploadPromises);

        } catch (compressionError) {
          console.error("Upload process failed:", compressionError);
          alert("Failed to compress or upload images. Please try again.");
          setLoading(false);
          return;
        }
      }
      
      if (editingId) {
        const updatePayload = {
          name: formData.name,
          category: formData.category,
          type: formData.type,
          description: formData.description,
          location: {
            province: "Lanao del Sur",
            municipality: formData.municipality,
            barangay: formData.barangay, 
            street: formData.street,     
          },
          coordinates: {
            lat: Number(formData.latitude),
            lng: Number(formData.longitude),
          }
        };

        if (uploadedURLs.length > 0) {
          updatePayload.imageURL = uploadedURLs[0]; 
          updatePayload.imageURLs = uploadedURLs;   
        }

        await updateDoc(doc(db, "tourismData", editingId), updatePayload);
        showToastMessage("Entry updated successfully!");
      } else {
        await addDoc(collection(db, "tourismData"), {
          name: formData.name,
          category: formData.category,
          type: formData.type,
          description: formData.description,
          location: {
            province: "Lanao del Sur",
            municipality: formData.municipality,
            barangay: formData.barangay, 
            street: formData.street,     
          },
          coordinates: {
            lat: Number(formData.latitude),
            lng: Number(formData.longitude),
          },
          imageURL: uploadedURLs[0], 
          imageURLs: uploadedURLs,   
          status: "active",
          createdAt: serverTimestamp(),
        });

        showToastMessage("Entry added successfully!");
      }

      setOpenModal(false);
      resetForm();
    } catch (error) {
      console.error("FINAL ERROR:", error);
      alert("Something went wrong during upload. Please try again.");
    }

    setLoading(false);
  };

  const inputStyle =
    "w-full rounded-[18px] border border-blue-100 bg-white px-4 py-3 text-sm font-medium text-gray-600 outline-none shadow-sm transition duration-300 placeholder:text-gray-400 hover:border-[#2563eb]/40 hover:bg-blue-50/40 focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100";

  const primaryButton =
    "inline-flex items-center justify-center gap-2 rounded-[18px] bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-sm transition duration-300 hover:bg-blue-700";

  const secondaryButton =
    "inline-flex items-center justify-center gap-2 rounded-[18px] border border-[#2563eb]/20 bg-white px-5 py-3 text-sm font-medium text-[#2563eb] shadow-sm transition duration-300 hover:bg-blue-50";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setCurrentPage(1);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      type: item.type,
      description: item.description,
      municipality: item.location?.municipality || "",
      province: item.location?.province || "Lanao del Sur",
      barangay: item.location?.barangay || "", 
      street: item.location?.street || "",     
      latitude: item.coordinates?.lat || "",
      longitude: item.coordinates?.lng || "",
    });
    setShowMapAlert(false);
    setOpenModal(true);
  };

  const Pagination = () => {
    if (filteredTourism.length <= itemsPerPage) return null;

    return (
      <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-[24px] border border-blue-100 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(37,99,235,0.06)] sm:flex-row">
        <p className="text-sm font-medium text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-700">
            {startIndex + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold text-gray-700">
            {Math.min(startIndex + itemsPerPage, filteredTourism.length)}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-700">
            {filteredTourism.length}
          </span>{" "}
          entries
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
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
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
                Manage Tourism Data
              </h1>

              <p className="mt-2 max-w-2xl text-base leading-relaxed text-gray-500">
                Add, update, archive, and organize destinations,
                establishments, landmarks, and cultural heritage sites.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setShowArchived(!showArchived);
                  setCurrentPage(1); 
                }}
                className={
                  showArchived
                    ? "inline-flex items-center justify-center rounded-[18px] border border-red-100 bg-red-50 px-5 py-3 text-sm font-medium text-red-500 shadow-sm transition hover:bg-red-100"
                    : secondaryButton
                }
              >
                {showArchived ? "View Active Entries" : "View Archived"}
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
                Add Entry
              </button>
            </div>
          </div>
        </section>

        {/* TOOLBAR */}
        <section className="mb-8 rounded-[28px] border border-blue-100 bg-white p-5 shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#2563eb]">
                Tourism Entries
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Search and filter entries by name or category.
              </p>
            </div>

            {(searchTerm || selectedCategory) && (
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
                placeholder="Search destinations..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); 
                }}
                className={`${inputStyle} pl-11 pr-11`}
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1); 
                  }}
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
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1); 
                }}
                className={`${inputStyle} cursor-pointer appearance-none pl-11`}
              >
                <option value="">All Categories</option>
                <option value="Destination">Destination</option>
                <option value="Establishment">Establishment</option>
                <option value="Landmark">Landmark</option>
                <option value="Cultural Heritage Site">
                  Cultural Heritage Site
                </option>
              </select>
            </div>

            <div className="flex h-[48px] items-center rounded-[18px] border border-blue-100 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setViewMode("content");
                  setCurrentPage(1); 
                }}
                className={`flex h-full items-center justify-center gap-2 rounded-[14px] px-4 text-sm font-medium transition ${
                  viewMode === "content"
                    ? "bg-blue-50 text-[#2563eb]"
                    : "text-gray-500 hover:bg-blue-50/60 hover:text-[#2563eb]"
                }`}
              >
                <FiList className="text-lg" />
                List
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewMode("tiles");
                  setCurrentPage(1); 
                }}
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
        {filteredTourism.length === 0 ? (
          <section className="flex flex-col items-center justify-center rounded-[28px] border border-blue-100 bg-white px-6 py-20 text-center shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#2563eb]">
              <FiSearch className="text-2xl" />
            </div>

            <h3 className="text-lg font-semibold text-gray-700">
              No entries found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filters.
            </p>
          </section>
        ) : viewMode === "content" ? (
          <>
            <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)]">
              <div className="overflow-x-auto">
                <div className="min-w-[1000px]">
                  <div className="grid grid-cols-12 gap-4 border-b border-blue-50 bg-[#f8fbff] px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span className="col-span-3">Destination</span>
                    <span className="col-span-2">Category & Type</span>
                    <span className="col-span-3">Location</span>
                    <span className="col-span-3">Description</span>
                    <span className="col-span-1 text-center">Actions</span>
                  </div>

                  <div className="max-h-[600px] overflow-y-auto">
                    {paginatedTourism.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 items-center gap-4 border-b border-blue-50 px-6 py-4 text-sm transition duration-300 last:border-b-0 hover:bg-blue-50/50"
                      >
                        <div className="col-span-3 flex items-center gap-4 pr-2">
                          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-blue-100 bg-[#f8fbff] text-gray-400">
                            {item.imageURL ? (
                              <img
                                src={item.imageURL}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <FiImage className="text-lg" />
                            )}
                          </div>

                          <span className="line-clamp-2 font-semibold text-gray-700">
                            {item.name}
                          </span>
                        </div>

                        <div className="col-span-2 flex flex-col items-start gap-1.5">
                          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2563eb]">
                            {item.category}
                          </span>

                          <span className="text-xs font-medium text-gray-500">
                            {item.type}
                          </span>
                        </div>

                        <div className="col-span-3 flex items-center gap-2 font-medium text-gray-600">
                          <FiMapPin className="flex-shrink-0 text-[#2563eb]" />

                          <span className="line-clamp-2">
                            {item.location?.municipality},{" "}
                            {item.location?.province}
                          </span>
                        </div>

                        <div className="col-span-3 pr-4 text-xs leading-relaxed text-gray-500 line-clamp-3">
                          {item.description}
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
                                onClick={() => {
                                  setSelectedId(item.id);
                                  setShowConfirm(true);
                                }}
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
              {paginatedTourism.map((item) => (
                <div
                  key={item.id}
                  className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(37,99,235,0.06)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(37,99,235,0.08)]"
                >
                  <div className="relative h-44 flex-shrink-0 overflow-hidden bg-[#f8fbff]">
                    {item.imageURL ? (
                      <img
                        src={item.imageURL}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <FiImage className="text-4xl" />
                      </div>
                    )}

                    <div className="absolute right-3 top-3 rounded-full border border-white/80 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#2563eb] shadow-sm">
                      {item.category}
                    </div>

                    {showArchived && (
                      <div className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
                        Archived
                      </div>
                    )}
                  </div>

                  <div className="flex flex-grow flex-col px-5 pb-5 pt-4">
                    <h4 className="line-clamp-2 min-h-[48px] text-base font-bold text-gray-700 transition group-hover:text-[#2563eb]">
                      {item.name}
                    </h4>

                    <div className="mb-3 mt-2 flex items-center gap-1.5 text-xs font-medium text-[#2563eb]">
                      <FiMapPin />

                      <span className="line-clamp-1 text-gray-500">
                        {item.location?.municipality},{" "}
                        {item.location?.province}
                      </span>
                    </div>

                    <p className="mb-6 line-clamp-3 flex-grow text-sm leading-relaxed text-gray-500">
                      {item.description}
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

            <Pagination />
          </>
        )}
      </main>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-blue-100 bg-white p-7 shadow-[0_14px_35px_rgba(37,99,235,0.10)]">
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
                <FiMapPin className="text-xl" />
              </div>

              <h3 className="text-2xl font-bold text-[#2563eb]">
                {editingId ? "Edit Tourism Entry" : "Add New Entry"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Provide destination details, location, coordinates, and cover
                image.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Destination Name
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Lake Lanao"
                  value={formData.name}
                  onChange={handleChange}
                  onClick={() => setShowMapAlert(true)}
                  required
                  className={inputStyle}
                />
                
                {/* NOTIFICATION/ALERT DIALOG for Google Maps */}
                {showMapAlert && (
                  <div className="mt-3 flex items-start gap-2 rounded-[16px] border border-blue-100 bg-[#f8fbff] p-3 text-sm text-blue-700 shadow-sm animate-fadeIn">
                    <FiAlertCircle className="mt-0.5 flex-shrink-0 text-blue-600" />
                    <span className="leading-relaxed">
                      <strong>Important:</strong> Please ensure this tourist spot is already registered and visible on Google Maps before saving. This guarantees accurate map placement and geocoding.
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setShowMapAlert(false)} 
                      className="ml-auto rounded-full p-1 transition hover:bg-blue-100 hover:text-blue-800"
                    >
                      <FiX />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Category
                  </label>

                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className={`${inputStyle} cursor-pointer appearance-none`}
                  >
                    <option value="">Select Category</option>
                    <option value="Destination">Destination</option>
                    <option value="Establishment">Establishment</option>
                    <option value="Landmark">Landmark</option>
                    <option value="Cultural Heritage Site">
                      Cultural Heritage Site
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Type
                  </label>

                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    disabled={!formData.category}
                    className={`${inputStyle} cursor-pointer appearance-none disabled:cursor-not-allowed disabled:bg-blue-50/50`}
                  >
                    <option value="">Select Type</option>
                    {formData.category &&
                      typeOptions[formData.category]?.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

               <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="Write an engaging and detailed description about this location..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className={`${inputStyle} min-h-[200px] resize-y`}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Street / Building (Optional)
                  </label>
                  <input
                    type="text"
                    name="street"
                    placeholder="e.g. Quezon Avenue"
                    value={formData.street}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Barangay (Optional)
                  </label>
                  <input
                    type="text"
                    name="barangay"
                    placeholder="e.g. Poblacion"
                    value={formData.barangay}
                    onChange={handleChange}
                    className={inputStyle}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Municipality
                  </label>

                  <select
                    name="municipality"
                    value={formData.municipality}
                    onChange={handleChange}
                    required
                    className={`${inputStyle} cursor-pointer appearance-none`}
                  >
                    <option value="">Select Municipality</option>
                    {municipalities.map((mun) => (
                      <option key={mun} value={mun}>
                        {mun}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Province
                  </label>

                  <input
                    type="text"
                    value="Lanao del Sur"
                    readOnly
                    className="w-full cursor-not-allowed rounded-[18px] border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm font-medium text-gray-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Latitude Auto-filled
                  </label>

                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    readOnly
                    className="w-full cursor-not-allowed rounded-[18px] border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm font-medium text-gray-500 outline-none"
                    placeholder="e.g. 7.9942"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Longitude Auto-filled
                  </label>

                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    readOnly
                    className="w-full cursor-not-allowed rounded-[18px] border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm font-medium text-gray-500 outline-none"
                    placeholder="e.g. 124.2845"
                  />
                </div>
              </div>

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
                    <span className="flex items-center gap-2">
                      <FiRefreshCw className="animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save Entry"
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
              Archive Entry?
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              This entry will be moved to the archive and hidden from public
              view. You can restore it later.
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

export default ManageTourismData;