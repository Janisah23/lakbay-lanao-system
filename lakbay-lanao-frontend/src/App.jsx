import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import AppRoutes from "./routes/AppRoutes";
import FavoritesProvider from "./components/context/FavoritesProvider";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <FavoritesProvider>
      <AppRoutes currentUser={user} />
    </FavoritesProvider>
  );
}

export default App;