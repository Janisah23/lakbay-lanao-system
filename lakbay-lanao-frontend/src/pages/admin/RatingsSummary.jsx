function RatingsSummary() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-[#2563EB]">
        Ratings Summary
      </h2>

      <p className="text-gray-500 text-sm mt-2">
        Overview of tourist feedback and satisfaction metrics
      </p>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">

        {[
          { title: "TOTAL RATINGS", value: "133", sub: "User reviews collected" },
          { title: "AVERAGE RATING", value: "4.6", sub: "Out of 5.0 stars" },
          { title: "SATISFACTION", value: "100%", sub: "5 star ratings" },
        ].map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">{item.title}</p>
            <h3 className="text-3xl font-semibold mt-2">{item.value}</h3>
            <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
          </div>
        ))}

      </div>

      {/* Rating Bars */}
      <div className="mt-10 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <p className="text-sm font-medium mb-4">Rating Distribution</p>

        {[85, 48, 20, 10, 5].map((percent, index) => (
          <div key={index} className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{5 - index} Stars</span>
              <span>{percent}</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full">
              <div
                className="bg-[#2563EB] h-2 rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default RatingsSummary;