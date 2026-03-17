import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/config";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";


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
  
    <Toaster position="top-right" />


  if (loading) return <div>Loading...</div>;

  return <AppRoutes currentUser={user} />;
}

export default App;