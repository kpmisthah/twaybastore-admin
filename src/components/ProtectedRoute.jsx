import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { isAuthed, bootstrapped } = useAuth();
  const location = useLocation();

  // Do nothing until we've read/validated any stored token
  if (!bootstrapped) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-gray-500">Loading…</div>
      </div>
    );
  }

  if (!isAuthed) {
    // Use location.state to avoid building a changing ?next=... string
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
