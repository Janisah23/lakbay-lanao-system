import { FiSearch, FiPlus } from "react-icons/fi";

function TourismContent() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-[#2563EB]">
        Manage Tourism Content
      </h2>

      <p className="text-gray-500 mt-2 text-sm">
        Create, edit, and manage tourism articles, highlights, featured
        content, images, and informational descriptions displayed on the
        public website.
      </p>

      {/* Search + Button */}
      <div className="flex flex-wrap items-center gap-6 mt-8">
        <div
          className="flex items-center bg-white w-[420px] max-w-full
          px-5 py-3 rounded-full shadow-sm border border-gray-200"
        >
          <input
            type="text"
            placeholder="Search by title, category, or keyword"
            className="flex-1 outline-none text-sm bg-transparent"
          />

          <div className="bg-[#2563EB] text-white p-2 rounded-full">
            <FiSearch />
          </div>
        </div>

        <button
          className="flex items-center gap-2 bg-[#2563EB]
          text-white px-6 py-3 rounded-full shadow-md
          hover:shadow-lg hover:bg-blue-700 transition duration-300"
        >
          <FiPlus />
          <span className="text-sm font-medium">Add Content</span>
        </button>
      </div>

      {/* Table Header */}
      <div className="mt-10 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-5 px-6 py-4 text-sm text-gray-600 font-medium">
          <span>Title</span>
          <span>Category</span>
          <span>Status</span>
          <span>Last Updated</span>
          <span>Action</span>
        </div>
      </div>
    </>
  );
}

export default TourismContent;
