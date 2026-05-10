import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import AppRoutes from "./routes/AppRoutes";
import FavoritesProvider from "./components/context/FavoritesProvider";
import lakbayLogo from "./assets/lakbay-logos.png";

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

          {/* Logo only */}
          <img
            src={lakbayLogo}
            alt="Lakbay Lanao"
            className="relative h-28 w-28 object-contain"
          />

          <h1 className="mt-8 text-3xl font-bold tracking-tight text-[#2563eb]">
            Lakbay Lanao
          </h1>

          <p className="mt-3 text-sm font-medium text-gray-500">
            Preparing your travel experience...
          </p>

          {/* Loading dots only */}
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