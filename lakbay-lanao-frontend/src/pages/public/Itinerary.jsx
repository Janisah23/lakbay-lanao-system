import Navbar from "../../components/common/Navbar";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState } from "react";
import { useFavorites } from "../../components/context/FavoritesContext";
import { FiCalendar, FiTrash2, FiClock, FiMapPin } from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";

function Itinerary() {
  const { favorites } = useFavorites();

  // Filter only locations suitable for an itinerary
  const places = favorites.filter(
    item => item.category === "Destination" || item.category === "Establishment" || item.category === "Cultural and Heritage" || item.category === "Landmark"
  );

  const [dayCount, setDayCount] = useState(3);

  const createDays = (count) => {
    const newDays = {};
    for (let i = 1; i <= count; i++) {
      newDays[`day${i}`] = [];
    }
    return newDays;
  };

  const [days, setDays] = useState(createDays(3));
  const [notes, setNotes] = useState({});

  const handleDayChange = (value) => {
    const count = Number(value);
    setDayCount(count);

    const newDays = createDays(count);

    // Persist existing data when changing day count
    Object.keys(days).forEach(day => {
      if (newDays[day]) {
        newDays[day] = days[day];
      }
    });

    setDays(newDays);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === "places") {
      const place = places[source.index];

      // Prevent duplicates in the same day
      const exists = days[destination.droppableId].some(
        (item) => item.id === place.id
      );

      if (exists) return;

      const newPlace = {
        ...place,
        time: ""
      };

      setDays({
        ...days,
        [destination.droppableId]: [
          ...days[destination.droppableId],
          newPlace
        ]
      });
    }
  };

  const removePlace = (day, index) => {
    const updated = [...days[day]];
    updated.splice(index, 1);

    setDays({
      ...days,
      [day]: updated
    });
  };

  const updateTime = (day, index, value) => {
    const updated = [...days[day]];
    updated[index].time = value;

    setDays({
      ...days,
      [day]: updated
    });
  };

  return (
    <div className="font-sans text-gray-900 bg-gray-50 min-h-screen pb-20">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative w-full h-[300px] md:h-[400px] overflow-hidden flex items-end pb-12 px-8 md:px-12 lg:px-20">
        <img 
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop" 
          alt="Itinerary Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
        
        <div className="relative z-10 max-w-[1400px] w-full mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-md mb-3">
            My Itinerary
          </h1>
          <p className="text-white/90 text-lg md:text-xl font-medium max-w-2xl drop-shadow-sm">
            Plan your perfect trip to Lanao del Sur. Drag your saved destinations into your daily schedule.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="py-12 px-6 md:px-12 lg:px-20">
        <div className="max-w-[1400px] mx-auto">
          
          {/* CONTROL PANEL */}
          <div className="bg-white p-6 md:px-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Trip Planner</h2>
              <p className="text-sm text-gray-500 mt-1">Set the duration of your stay to generate your daily schedule.</p>
            </div>
            
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200">
              <label className="text-sm font-semibold text-gray-700">
                Duration:
              </label>
              <input
                type="number"
                min="1"
                max="14"
                value={dayCount}
                onChange={(e) => handleDayChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 w-20 text-center font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
              <span className="text-sm font-semibold text-gray-700">
                Days
              </span>
            </div>
          </div>

          {/* DRAG AND DROP CONTEXT */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              
              {/* SIDEBAR: SAVED DESTINATIONS (Sticky) */}
              <Droppable droppableId="places" isDropDisabled={true}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col sticky top-24 h-[calc(100vh-120px)]"
                  >
                    <div className="p-5 border-b border-gray-100 bg-gray-50 rounded-t-2xl flex items-center gap-2">
                      <FiMapPin className="text-blue-600 text-lg" />
                      <h2 className="font-bold text-gray-800 text-lg">
                        Saved Places
                      </h2>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                      {places.length === 0 ? (
                        <div className="text-center py-10 px-4 text-gray-400 text-sm">
                          You haven't saved any destinations yet. Go to the map or content pages to favorite some places!
                        </div>
                      ) : (
                        places.map((place, index) => (
                          <Draggable
                            draggableId={place.id}
                            index={index}
                            key={place.id}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`flex items-center gap-3 p-3 border rounded-xl bg-white cursor-grab active:cursor-grabbing transition-shadow
                                  ${snapshot.isDragging ? "shadow-lg border-blue-400 ring-1 ring-blue-400" : "hover:border-gray-300 shadow-sm border-gray-100"}`}
                              >
                                <MdDragIndicator className="text-gray-300 text-xl" />
                                
                                <img
                                  src={place.imageURL || "/default-event.jpg"}
                                  alt={place.title}
                                  className="w-12 h-12 rounded-lg object-cover border border-gray-100"
                                />

                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-gray-900 truncate">
                                    {place.title || place.name}
                                  </p>
                                  <p className="text-[10px] font-bold text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded-sm mt-1 uppercase tracking-wider">
                                    {place.type || place.category}
                                  </p>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>

              {/* MAIN CONTENT: ITINERARY DAYS */}
              <div className="lg:col-span-3 space-y-8">
                {Object.keys(days).map((day, index) => (
                  <div key={day} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    
                    {/* Day Header */}
                    <div className="bg-blue-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <FiCalendar className="text-blue-700 text-lg" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-xl">
                        Day {index + 1}
                      </h3>
                    </div>

                    <Droppable droppableId={day}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`p-6 transition-colors min-h-[150px] ${snapshot.isDraggingOver ? "bg-blue-50/30" : "bg-white"}`}
                        >
                          <div className="space-y-4">
                            {days[day].length === 0 && (
                              <div className="h-24 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm font-medium">
                                Drag and drop destinations here
                              </div>
                            )}

                            {days[day].map((place, index) => (
                              <Draggable
                                key={place.id + day}
                                draggableId={place.id + day}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border bg-white group
                                      ${snapshot.isDragging ? "shadow-lg border-blue-400 ring-1 ring-blue-400" : "shadow-sm border-gray-200 hover:border-blue-300"}`}
                                  >
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                      <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-gray-500">
                                        <MdDragIndicator className="text-2xl" />
                                      </div>
                                      
                                      <img
                                        src={place.imageURL || "/default-event.jpg"}
                                        alt={place.title}
                                        className="w-16 h-16 rounded-lg object-cover border border-gray-100"
                                      />

                                      <div>
                                        <p className="font-bold text-gray-900 text-base">
                                          {place.title || place.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm uppercase tracking-wider">
                                            {place.type || place.category}
                                          </span>
                                          <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <FiMapPin className="text-gray-400" />
                                            {place.location ? `${place.location.municipality}` : "Lanao del Sur"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Time Input and Remove Button */}
                                    <div className="flex items-center justify-between w-full sm:w-auto gap-4 pl-10 sm:pl-0">
                                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
                                        <FiClock className="text-gray-400" />
                                        <input
                                          type="time"
                                          value={place.time}
                                          onChange={(e) => updateTime(day, index, e.target.value)}
                                          className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 w-24"
                                        />
                                      </div>

                                      <button
                                        onClick={() => removePlace(day, index)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove from day"
                                      >
                                        <FiTrash2 className="text-lg" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>

                          {/* Notes Section for the Day */}
                          <div className="mt-6 pt-6 border-t border-gray-100">
                            <textarea
                              placeholder="Add daily notes, reminders, or transportation details..."
                              value={notes[day] || ""}
                              onChange={(e) =>
                                setNotes({
                                  ...notes,
                                  [day]: e.target.value
                                })
                              }
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none min-h-[80px]"
                            />
                          </div>
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>

            </div>
          </DragDropContext>
        </div>
      </section>
    </div>
  );
}

export default Itinerary;