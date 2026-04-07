import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./index.css";
import LoginPage from "./components/LoginPage";
import AdminDashboard from "./components/AdminDashboard";
import OrganizerDashboard from "./components/OrganizerDashboard";
import StudentDashboard from "./components/StudentDashboard";
import ClaimPage from "./components/ClaimPage";

const router = createBrowserRouter([
  { path: "/", element: <LoginPage /> },
  { path: "/admin", element: <AdminDashboard /> },
  { path: "/organizer", element: <OrganizerDashboard /> },
  { path: "/student", element: <StudentDashboard /> },
  { path: "/claim/:eventId", element: <ClaimPage /> },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
