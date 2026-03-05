import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { db, auth } from "../../firebase/config";
import { doc, getDoc } from "firebase/firestore";

function ProtectedRoute({ children, role }) {
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      const user = auth.currentUser;

      if (!user) {
        setLoading(false);
        return;
      }

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserRole(docSnap.data().role);
      }

      setLoading(false);
    };

    checkRole();
  }, []);

  if (loading) return null; // or spinner

  if (!auth.currentUser) {
    return <Navigate to="/" />;
  }

  if (role && userRole !== role) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;