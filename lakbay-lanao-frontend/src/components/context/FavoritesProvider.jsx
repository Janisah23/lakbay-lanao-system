import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { FavoritesContext } from "./FavoritesContext";
import { onAuthStateChanged } from "firebase/auth";



const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setFavorites([]); 
        return;
      }

      const ref = collection(db, "users", user.uid, "favorites");

      const unsubscribe = onSnapshot(ref, (snap) => {
        const favs = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setFavorites(favs);
      });

      return () => unsubscribe();
    });

    return () => unsubscribeAuth();
  }, []);

  // ✅ THIS WAS MISSING
  return (
    <FavoritesContext.Provider value={{ favorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesProvider;