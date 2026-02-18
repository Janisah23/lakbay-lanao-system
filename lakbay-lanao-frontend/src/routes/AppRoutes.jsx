import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/public/Home";
import Events from "../Pages/public/Events";
import Destinations from "../Pages/public/Destinations";
import MapView from "../Pages/public/MapView";
import Gallery from "../Pages/public/Gallery";
import TouristDashboard from "../pages/tourist/TouristDashboard";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";




function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/dashboard" element={<TouristDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
       


      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
