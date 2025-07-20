import React, { useState } from "react";
import { ethers } from "ethers";
import { useHedera } from "../context/HederaContext";
import CryptoJS from "crypto-js";

function UploadDataset() {
  const { account, contract, registerDataset } = useHedera();
  const [formData, setFormData] = useState({
    files: [],
    price: "",
    isPublic: false,
    description: "",
    name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cid, setCid] = useState("");

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        files: [...prev.files, ...files],
      }));
    }
  };

  const handleFolderChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFormData((prev) => ({
        ...prev,
        files: [...prev.files, ...files],
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "isPublic") {
      // If toggling isPublic, update the checkbox state
      setFormData((prev) => ({
        ...prev,
        isPublic: checked,
      }));
    } else if (name === "price") {
      // Only accept positive numbers for price
      if (value === "" || parseFloat(value) > 0) {
        setFormData((prev) => ({
          ...prev,
          price: value,
        }));
        setError("");
      } else {
        setError("Private datasets must have a price greater than zero");
      }
    } else {
      // For other fields
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const removeFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.name) {
      setError("Please enter a dataset name");
      return false;
    }

    if (formData.files.length === 0) {
      setError("Please select at least one file or folder to upload");
      return false;
    }

    if (
      !formData.isPublic &&
      (formData.price === "" || parseFloat(formData.price) <= 0)
    ) {
      setError("Private datasets must have a price greater than zero");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract || !account) {
      setError("Please connect your wallet first");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");
    setUploadProgress(0);

    try {
      // Create FormData object
      const formDataObj = new FormData();
      formData.files.forEach((file) => {
        formDataObj.append("file", file);
      });
      formDataObj.append("name", formData.name);
      formDataObj.append("description", formData.description);

      // Upload files + metadata to backend
      const uploadResponse = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formDataObj,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload files");
      }

      const uploadResult = await uploadResponse.json();
      const secretKey = process.env.REACT_APP_SECRET_KEY; // reads your secret key from env
      const uploadResultString = JSON.stringify(uploadResult.ipfsHash);
      const encryptedipfshash = CryptoJS.AES.encrypt(
        uploadResultString,
        secretKey
      ).toString();
      setCid(encryptedipfshash);

      // Set the price based on whether the dataset is public or private
      const finalPrice = formData.isPublic ? "0" : formData.price;

      // Register the dataset with the contract
      await registerDataset(
        encryptedipfshash,
        formData.name,
        formData.description,
        ethers.utils.parseUnits(finalPrice, 18),
        formData.isPublic
      );

      // Reset form and show success message
      setFormData({
        files: [],
        price: "",
        isPublic: false,
        description: "",
        name: "",
      });
      setCid("");
      alert("Dataset uploaded and registered successfully!");
    } catch (error) {
      console.error("Error uploading dataset:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-900">
          Upload Dataset
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Dataset Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter dataset name"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              name="description"
              id="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter dataset description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Upload Files or Folder
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <span>Upload files</span>
                    <input
                      id="file-upload"
                      name="file"
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={handleFileChange}
                    />
                  </label>
                  
                </div>
                <p className="text-xs text-gray-500">
                  CSV, JSON, TXT, or any data files up to 100MB total
                </p>
              </div>
            </div>

            {formData.files.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Selected Files:
                </h3>
                <ul className="mt-2 divide-y divide-gray-200">
                  {formData.files.map((file, index) => (
                    <li
                      key={index}
                      className="py-2 flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-500">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              name="isPublic"
              id="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isPublic"
              className="ml-2 block text-sm text-gray-900"
            >
              Make dataset public (free)
            </label>
          </div>

          {!formData.isPublic && (
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700"
              >
                Price (HBAR){" "}
                <span className="text-red-500 text-xs ml-1">*Required</span>
              </label>
              <input
                type="number"
                name="price"
                id="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0.000000001"
                step="0.000000001"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Enter price in HBAR"
              />
              <p className="mt-1 text-xs text-gray-500">
                Private datasets must have a price greater than zero
              </p>
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          {cid && (
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">CID: {cid}</p>
            </div>
          )}

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {loading ? "Uploading..." : "Upload Dataset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UploadDataset;
