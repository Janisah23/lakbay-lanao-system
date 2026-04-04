import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "../components/common/Navbar";

import Home from "../pages/public/Home";
import Events from "../pages/public/Events";
import Destinations from "../pages/public/Destinations";
import MapView from "../pages/public/MapView";
import Gallery from "../pages/public/Gallery";
import PlaceDetails from "../pages/public/PlaceDetails";
import TourismBlog from "../pages/public/TourismBlog";
import ArticleDetails from "../pages/public/ArticleDetails";
import EventDetails from "../pages/public/EventDetails";


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
import ProtectedRoute from "../components/common/ProtectedRoute";


import Itinerary from "../pages/public/Itinerary";
import TourismChatbot from "../components/chatbot/TourismChatbot";
import Favorites from "../pages/public/Favorites";

function AppRoutes() {
  return (
    <BrowserRouter>
     <Navbar />
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
      <Route path="/destinations" element={<Destinations />} />
        <Route path="/map" element={<MapView />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/place/:id" element={<PlaceDetails />} />
        <Route path="/article/:id" element={<ArticleDetails />} />
        <Route path="/blog" element={<TourismBlog />} />  
        <Route path="/home" element={<Home />} />
        <Route path="/chatbot" element={<TourismChatbot />} />
        <Route path="/itinerary" element={<ProtectedRoute><Itinerary /></ProtectedRoute>}/>
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/event/:id" element={<EventDetails />} />

        

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
         <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout/>
              </ProtectedRoute>
            }
          />

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;