import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../../firebase/config";
import { doc, getDoc } from "firebase/firestore";

function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const user = auth.currentUser;

      if (!user) {
        setLoading(false);
        return;
      }

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().role === "admin") {
        setIsAdmin(true);
      }

      setLoading(false);
    };

    checkRole();
  }, []);

  if (loading) return null;

  if (!isAdmin) {
    return <Navigate to="/tourist" replace />;
  }

  return children;
}

export default AdminRoute;