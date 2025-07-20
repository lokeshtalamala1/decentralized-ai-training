import React, { useState, useEffect } from "react";
import { useHedera } from "../context/HederaContext";
import { ethers } from "ethers";
import CryptoJS from "crypto-js";
import axios from "axios"; // Added axios to fetch from IPFS

function ViewDatasets() {
  const { account, contract } = useHedera();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'public', 'private'

  const IPFS_GATEWAY = "https://ipfs.io/ipfs/"; // You can change to another IPFS gateway if you want

  const getAvailableDatasets = async () => {
    if (!contract) throw new Error("Contract not initialized");

    try {
      const count = parseInt(await contract.getDatasetCount());
      const datasets = [];

      for (let i = 0; i < count; i++) {
        const cid = await contract.getDatasetCid(i);
        const data = await contract.getDatasetInfo(cid);

        if (data.isRemoved) continue;

        datasets.push({
          id: cid,
          owner: data.owner,
          price: ethers.utils.formatUnits(data.price, 18),
          isPublic: data.isPublic,
          uploaded: new Date(data.uploadTimestamp.toNumber() * 1000),
          name: data.name,
          description: data.description,
        });
      }

      return datasets;
    } catch (err) {
      console.error("Error in getAvailableDatasets:", err);
      throw new Error("Failed to retrieve datasets");
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, [account, contract]);

  const fetchDatasets = async () => {
    if (!contract || !account) return;

    setLoading(true);
    setError("");

    try {
      const fetchedDatasets = await getAvailableDatasets();
      setDatasets(fetchedDatasets);
    } catch (error) {
      console.error("Error fetching datasets:", error);
      setError("Failed to fetch datasets");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleDownload = async (dataset) => {
    if (!contract || !account) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Check if the user has a license to download the dataset
      const hasLicense = await contract.hasLicense(dataset.id, account);

      if (!hasLicense && !dataset.isPublic) {
        setError("You need a license to download this private dataset");
        return;
      }

      console.log("Downloading from IPFS:", dataset.id);

      // Use the Pinata gateway URL from environment variables
      const pinataGateway = process.env.REACT_APP_PINATA_GATEWAY_URL;
      const decryptedBytes = CryptoJS.AES.decrypt(
        dataset.id,
        process.env.REACT_APP_SECRET_KEY
      );
      const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
      const decryptedData = JSON.parse(decryptedText);

      // Fetch file from IPFS via Pinata
      const response = await axios.get(`${pinataGateway}${decryptedData}`, {
        responseType: "blob", // Important for file downloads
      });

      const fileType =
        response.headers["content-type"] || "application/octet-stream"; // Fallback if no type is specified

      let fileExtension = "";
      switch (fileType) {
        case "application/zip":
          fileExtension = ".zip";
          break;
        case "application/pdf":
          fileExtension = ".pdf";
          break;
        case "image/jpeg":
          fileExtension = ".jpg";
          break;
        case "image/png":
          fileExtension = ".png";
          break;
        case "text/plain":
          fileExtension = ".txt";
          break;
        // Add more cases as needed for other file types
        default:
          fileExtension = ""; // Fallback for unknown file types
          break;
      }

      // Create a Blob link to download the file
      const blob = new Blob([response.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Set the file name with the correct extension (fallback to ID if no name)
      const fileName = dataset.name
        ? dataset.name.replace(/\s+/g, "_")
        : dataset.id;
      link.setAttribute("download", `${fileName}${fileExtension}`);

      // Trigger the download
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Error downloading dataset:", error);
      setError("Failed to download dataset");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (dataset) => {
    if (!contract || !account) {
      setError("Please connect your wallet first");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Check if the user is the owner of the dataset
      if (dataset.owner.toLowerCase() !== account.toLowerCase()) {
        setError("Only the dataset owner can delete this dataset");
        return;
      }

      // Call the contract's removeDataset function
      const tx = await contract.removeDataset(dataset.id);
      await tx.wait();

      // Refresh the datasets list
      await fetchDatasets();
    } catch (error) {
      console.error("Error deleting dataset:", error);
      setError("Failed to delete dataset");
    } finally {
      setLoading(false);
    }
  };

  const filteredDatasets = datasets.filter((dataset) => {
    const name = dataset.name || "";
    const description = dataset.description || "";
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "public") return matchesSearch && dataset.isPublic;
    if (filter === "private") return matchesSearch && !dataset.isPublic;
    return matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-extrabold text-gray-900">
          Available Datasets
        </h2>

        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search datasets..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <select
                value={filter}
                onChange={handleFilterChange}
                className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Datasets</option>
                <option value="public">Public Only</option>
                <option value="private">Private Only</option>
              </select>
            </div>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading datasets...</p>
            </div>
          ) : filteredDatasets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No datasets found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDatasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="bg-white shadow rounded-lg p-6"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {dataset.name || "null"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {dataset.description || "No description provided"}
                      </p>
                      <div className="mt-2 flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          Price: {dataset.price} HBAR
                        </span>
                        <span className="text-sm text-gray-500">
                          {dataset.isPublic ? "Public" : "Private"}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownload(dataset)}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Download
                      </button>
                      {dataset.owner.toLowerCase() ===
                        account?.toLowerCase() && (
                        <button
                          onClick={() => handleDelete(dataset)}
                          disabled={loading}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewDatasets;
