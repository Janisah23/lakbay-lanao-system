import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../pages/public/Home";
import Events from "../pages/public/Events";
import Destinations from "../pages/public/Destinations";
import MapView from "../pages/public/MapView";
import Gallery from "../pages/public/Gallery";

import StaffLayout from "../layout/StaffLayout";
import ManageTourismData from "../pages/staff/ManageTourismData";
import TourismContent from "../pages/staff/TourismContent";
import FeedbackRatings from "../pages/staff/FeedbackRatings";

import AdminLayout from "../layout/AdminLayout";
import AccountManagement from "../pages/admin/AccountManagement";
import RatingsSummary from "../pages/admin/RatingsSummary";
import SystemLogs from "../pages/admin/SystemLogs";

import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";

import AdminRoute from "../components/common/AdminRoute";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* Staff Routes */}
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<ManageTourismData />} />
          <Route path="manage" element={<ManageTourismData />} />
          <Route path="content" element={<TourismContent />} />
          <Route path="feedback" element={<FeedbackRatings />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AccountManagement />} />
          <Route path="accounts" element={<AccountManagement />} />
          <Route path="ratings" element={<RatingsSummary />} />
          <Route path="logs" element={<SystemLogs />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;