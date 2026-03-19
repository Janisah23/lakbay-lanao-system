import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Link } from "react-router-dom";

function TourismBlog() {

  const [posts, setPosts] = useState([]);
  const [page,setPage] = useState(1);
  const perPage = 6;

  const start = (page-1)*perPage;
  const end = start + perPage;

const paginated = posts.slice(start,end);

  useEffect(() => {

    const unsubscribe = onSnapshot(
      collection(db, "tourismContent"),
      (snapshot) => {

        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const published = data.filter(
          item => item.status === "published"
        );

        setPosts(published);

      }
    );

    return () => unsubscribe();

  }, []);

  return (

    <div className="max-w-7xl mx-auto px-6 py-20">

      <h1 className="text-3xl font-semibold mb-10">
        Tourism Blog
      </h1>

      <div className="grid md:grid-cols-3 gap-8">

        {paginated.map(post => (

          <Link
            to={`/article/${post.id}`}
            key={post.id}
            className="border rounded-xl overflow-hidden hover:shadow-lg transition"
          >

            <img
              src={post.imageURL}
              className="h-40 w-full object-cover"
            />

            <div className="flex justify-center gap-3 mt-10">

            <button
            onClick={()=>setPage(page-1)}
            disabled={page===1}
            className="px-4 py-2 border rounded"
            >
            Prev
            </button>

            <button
            onClick={()=>setPage(page+1)}
            disabled={end >= posts.length}
            className="px-4 py-2 border rounded"
            >
            Next
            </button>

            </div>


            <div className="p-4">

              <h3 className="font-semibold">
                {post.title}
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                {post.summary}
              </p>

            </div>

          </Link>

        ))}

      </div>

    </div>

  );

}

export default TourismBlog;