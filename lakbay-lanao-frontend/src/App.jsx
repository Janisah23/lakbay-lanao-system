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

if (loading)
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-white via-[#f8fbff] to-[#eef4ff]">
      <div className="relative flex flex-col items-center px-8">

        {/* Soft background glow */}
        <div className="absolute h-56 w-56 rounded-full bg-blue-100/30 blur-3xl" />

        {/* Spinner ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-32 w-32 animate-spin rounded-full border-[4px] border-gray-100 border-t-[#2563eb]" />

          {/* PTO Logo only */}
          <img
            src="src/assets/pto.png"
            alt="Lakbay Lanao"
            className="relative h-24 w-24 object-contain"
          />
        </div>

        <h1 className="mt-8 text-3xl font-bold tracking-tight text-[#2563eb]">
          Lakbay Lanao
        </h1>

        <p className="mt-3 text-sm font-medium text-gray-500">
          Preparing your travel experience...
        </p>

        {/* Loading dots */}
        <div className="mt-6 flex gap-3">
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#2563eb]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#2563eb] [animation-delay:150ms]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#2563eb] [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );

  return (
    <FavoritesProvider>
      <AppRoutes currentUser={user} />
    </FavoritesProvider>
  );
}

export default App;