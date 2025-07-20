import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HederaProvider } from "./context/HederaContext";
import { LicenseProvider } from "./context/LicenseContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import DatasetMarketplace from "./pages/DatasetMarketplace";
import UploadDataset from "./pages/UploadDataset";
import ViewDatasets from "./pages/ViewDatasets";

function App() {
  return (
    <HederaProvider>
      <LicenseProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/marketplace" element={<DatasetMarketplace />} />
                <Route path="/upload" element={<UploadDataset />} />
                <Route path="/datasets" element={<ViewDatasets />} />
              </Routes>
            </main>
          </div>
        </Router>
      </LicenseProvider>
    </HederaProvider>
  );
}

export default App;
