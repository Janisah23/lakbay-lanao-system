import Navbar from "../../components/common/Navbar";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState } from "react";

function Itinerary() {

  const [places] = useState([
    {
      id: "1",
      name: "Misty Cottage",
      location: "Wato Balindong",
      type: "establishment",
      image: "/misty-cottage.jpg",
    },
    {
      id: "2",
      name: "Mt. Matampor",
      location: "Balindong",
      type: "destination",
      image: "/mt-matampor.jpg",
    },
    {
      id: "3",
      name: "Sumpitan Falls",
      location: "Lanao del Sur",
      type: "landmark",
      image: "/sumpitan-falls.jpg",
    },
    {
      id: "4",
      name: "Torogan House",
      location: "Marawi",
      type: "cultural",
      image: "/torogan.jpg",
    }
  ]);

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
    <>
      <Navbar />

      <section className="pt-32 pb-20 px-6 bg-gray-50 min-h-screen">

        <div className="max-w-7xl mx-auto">

          <h1 className="text-3xl font-semibold text-blue-600">
            Itinerary Builder
          </h1>

          <p className="text-gray-500 mt-2">
            Plan your travel in Lanao del Sur.
          </p>

         

          <div className="mt-6 flex items-center gap-3">

            <label className="text-sm text-gray-600">
              Trip Duration:
            </label>

            <input
              type="number"
              min="1"
              max="10"
              value={dayCount}
              onChange={(e) => handleDayChange(e.target.value)}
              className="border rounded-md px-3 py-1 w-20"
            />

            <span className="text-sm text-gray-500">
              days
            </span>

          </div>

          <DragDropContext onDragEnd={handleDragEnd}>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-10">

              

              <Droppable droppableId="places">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-white p-6 rounded-2xl shadow-sm border"
                  >

                    <h2 className="font-semibold text-gray-700">
                      Saved Destinations
                    </h2>

                    <div className="space-y-4 mt-6">

                      {places.map((place, index) => (

                        <Draggable
                          draggableId={place.id}
                          index={index}
                          key={place.id}
                        >
                          {(provided) => (

                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex items-center gap-3 p-3 border rounded-xl hover:shadow bg-white cursor-pointer"
                            >

                              <img
                                src={place.image}
                                className="w-14 h-14 rounded-lg object-cover"
                              />

                              <div>
                                <p className="font-medium text-sm">
                                  {place.name}
                                </p>

                                <p className="text-xs text-gray-400">
                                  {place.location}
                                </p>

                                <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                  {place.type}
                                </span>

                              </div>

                            </div>

                          )}
                        </Draggable>

                      ))}

                      {provided.placeholder}

                    </div>

                  </div>
                )}
              </Droppable>

             

              <div className="md:col-span-3 space-y-8">

                {Object.keys(days).map((day) => (

                  <Droppable droppableId={day} key={day}>
                    {(provided) => (

                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="bg-white p-6 rounded-2xl shadow-sm border"
                      >

                        <h3 className="font-semibold text-blue-600 mb-6">
                          {day.toUpperCase()}
                        </h3>

                        <div className="space-y-4">

                          {days[day].length === 0 && (
                            <p className="text-gray-400 text-sm">
                              Drag destinations here
                            </p>
                          )}

                          {days[day].map((place, index) => (

                            <Draggable
                              key={place.id + day}
                              draggableId={place.id + day}
                              index={index}
                            >
                              {(provided) => (

                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="flex items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border"
                                >

                                  <div className="flex items-center gap-4">

                                    <img
                                      src={place.image}
                                      className="w-16 h-16 rounded-lg object-cover"
                                    />

                                    <div>
                                      <p className="font-medium">
                                        {place.name}
                                      </p>

                                      <p className="text-xs text-gray-400">
                                        {place.location}
                                      </p>

                                      <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                        {place.type}
                                      </span>
                                    </div>

                                  </div>

                                  <div className="flex items-center gap-3">

                                    <input
                                      type="time"
                                      value={place.time}
                                      onChange={(e) =>
                                        updateTime(day, index, e.target.value)
                                      }
                                      className="border rounded-md px-2 py-1 text-sm"
                                    />

                                    <button
                                      onClick={() => removePlace(day, index)}
                                      className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                      Remove
                                    </button>

                                  </div>

                                </div>

                              )}
                            </Draggable>

                          ))}

                          {provided.placeholder}

                        </div>

                       

                        <textarea
                          placeholder="Add notes for this day..."
                          value={notes[day] || ""}
                          onChange={(e) =>
                            setNotes({
                              ...notes,
                              [day]: e.target.value
                            })
                          }
                          className="w-full mt-6 border rounded-lg p-3 text-sm"
                        />

                      </div>

                    )}
                  </Droppable>

                ))}

              </div>

            </div>

          </DragDropContext>

        </div>

      </section>
    </>
  );
}

export default Itinerary;