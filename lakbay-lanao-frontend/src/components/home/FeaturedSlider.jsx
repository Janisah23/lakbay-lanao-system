import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

function FeaturedSlider() {

  const [featured, setFeatured] = useState([]);

  useEffect(() => {

    const unsubscribe = onSnapshot(
      collection(db, "tourismContent"),
      (snapshot) => {

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const filtered = data.filter(
          item => item.contentType === "Featured" && item.status === "published"
        );

        setFeatured(filtered);

      }
    );

    return () => unsubscribe();

  }, []);

  return (

    <section className="max-w-7xl mx-auto px-6 py-16">

      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 5000 }}
        loop
      >

        {featured.map(item => (

          <SwiperSlide key={item.id}>

            <div className="grid md:grid-cols-2 gap-10 items-center">

              <img
                src={item.imageURL}
                className="rounded-xl h-[350px] w-full object-cover"
              />

              <div>

                <h2 className="text-3xl font-semibold">
                  {item.title}
                </h2>

                <p className="text-gray-500 mt-4">
                  {item.summary}
                </p>

              </div>

            </div>

          </SwiperSlide>

        ))}

      </Swiper>

    </section>

  );
}

export default FeaturedSlider;