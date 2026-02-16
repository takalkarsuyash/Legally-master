import React from "react";
import { Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import Navbar from "./components/Navbar";
import { ErrorBoundary } from "./components/ErrorBoundary";
import LandingPage from "./pages/LandingPage";
import Summarisation from "./pages/Summarisation";
import DocumentQuery from "./pages/DocumentQuery";
import Draft from "./pages/Draft";
import PropertyTax from "./pages/PropertyTax";
import ChatSection from "./components/Chatbot";
import FindLawyer from "./pages/FindLawyer";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import UploadFile from "./pages/UploadFile";
import Retrieve from "./pages/Retrieve";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import { WalletProvider } from "./contexts/WalletContext";
import { ToastContainer } from "react-toastify";

const AppContent: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/summarisation"
            element={
              <ProtectedRoute>
                <Summarisation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/query"
            element={
              <ProtectedRoute>
                <DocumentQuery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/draft"
            element={
              <ProtectedRoute>
                <Draft />
              </ProtectedRoute>
            }
          />
          <Route
            path="/property-tax"
            element={
              <ProtectedRoute>
                <PropertyTax />
              </ProtectedRoute>
            }
          />
          <Route
            path="/find-lawyer"
            element={
              <ProtectedRoute>
                <FindLawyer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadFile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/retrieve"
            element={
              <ProtectedRoute>
                <Retrieve />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
      <ChatSection />
      <Analytics />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WalletProvider>
             <AppContent />
        </WalletProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
