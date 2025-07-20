import React from "react";
import { useHedera } from "../context/HederaContext";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const { account, connect, disconnect, error } = useHedera();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-primary-600">
                AI Data Chain
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className={`${
                  isActive("/")
                    ? "border-primary-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Home
              </Link>
              <Link
                to="/datasets"
                className={`${
                  isActive("/datasets")
                    ? "border-primary-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Datasets
              </Link>
              <Link
                to="/upload"
                className={`${
                  isActive("/upload")
                    ? "border-primary-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Upload Dataset
              </Link>
              <Link
                to="/marketplace"
                className={`${
                  isActive("/marketplace")
                    ? "border-primary-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Marketplace
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {error && <div className="mr-4 text-red-600 text-sm">{error}</div>}
            {account ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </span>
                <button
                  onClick={disconnect}
                  className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
