import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";

function ArticleDetails() {

  const { id } = useParams();
  const [article, setArticle] = useState(null);

  useEffect(() => {

    const fetchArticle = async () => {

      const ref = doc(db, "tourismContent", id);
      const snap = await getDoc(ref);

      if(snap.exists()){
        setArticle(snap.data());
      }

    };

    fetchArticle();

  }, [id]);

  if(!article) return <p>Loading...</p>;

  return (

    <div className="max-w-4xl mx-auto px-6 py-16">

      <img
        src={article.imageURL}
        className="w-full h-[350px] object-cover rounded-xl"
      />

      <h1 className="text-3xl font-semibold mt-6">
        {article.title}
      </h1>

      <p className="text-gray-500 mt-4">
        {article.summary}
      </p>

      <div
        className="prose mt-6"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

    </div>

  );

}

export default ArticleDetails;