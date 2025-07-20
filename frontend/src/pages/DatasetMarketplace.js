import React, { useState, useEffect } from "react";
import { useHedera } from "../context/HederaContext";
import { ethers } from "ethers";
import { useLicense } from "../context/LicenseContext";

function DatasetMarketplace() {
  const { account, contract } = useHedera();
  const { licenseContract } = useLicense();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [status, setStatus] = useState("");
  const [hbarBalance, setHbarBalance] = useState("0");

  useEffect(() => {
    fetchDatasets();
    if (account) {
      fetchHbarBalance();
    }
  }, [account, contract]);

  const fetchHbarBalance = async () => {
    if (!account) return;
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(account);
      setHbarBalance(ethers.utils.formatUnits(balance, 18)); // 18 decimals for HBAR
    } catch (error) {
      console.error("Error fetching HBAR balance:", error);
    }
  };

  const fetchDatasets = async () => {
    if (!contract || !account) return;
    try {
      const count = await contract.getDatasetCount();
      const datasetList = [];

      for (let i = 0; i < count; i++) {
        const cid = await contract.getDatasetCid(i);
        const info = await contract.getDatasetInfo(cid);

        // Skip if dataset is removed
        if (info.isRemoved) {
          continue;
        }

        const hasLicense = await contract.hasLicense(cid, account.toString());

        // Store the raw BigNumber for price
        datasetList.push({
          cid,
          owner: info.owner,
          priceRaw: info.price, // Store raw BigNumber
          priceFormatted: ethers.utils.formatUnits(info.price, 18), // 18 decimals for HBAR
          isPublic: info.isPublic,
          name: info.name,
          description: info.description,
          hasLicense,
        });
      }

      setDatasets(datasetList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching datasets:", error);
      setError("Failed to fetch datasets");
      setLoading(false);
    }
  };

  const purchaseDataset = async (dataset) => {
    if (!contract || !account || !licenseContract) {
      setError("Wallet not connected");
      return;
    }

    if (isPurchasing) {
      setError("Purchase already in progress");
      return;
    }

    setIsPurchasing(true);
    setError(null);

    try {
      setStatus("Preparing purchase...");

      // First check if the dataset is available and get its price
      const datasetInfo = await contract.getDatasetInfo(dataset.cid);
      console.log("Dataset info:", datasetInfo);

      if (datasetInfo.isPublic) {
        throw new Error(
          "This dataset is public and does not require a license"
        );
      }

      if (datasetInfo.isRemoved) {
        throw new Error("This dataset has been removed");
      }

      // Get price in HBAR (18 decimals)
      const priceInHBAR = dataset.priceRaw; // Use the raw BigNumber price
      console.log("Price in HBAR (raw):", priceInHBAR.toString());
      console.log(
        "Price in HBAR (formatted):",
        ethers.utils.formatUnits(priceInHBAR, 18)
      );

      // Get the provider
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // Get the current gas price
      const gasPrice = await provider.getGasPrice();
      console.log(
        "Current gas price:",
        ethers.utils.formatUnits(gasPrice, "gwei"),
        "gwei"
      );

      // Use a fixed gas limit that's known to work for this transaction
      const gasLimit = ethers.BigNumber.from("500000");

      // Calculate gas cost in HBAR
      const gasCost = gasLimit.mul(gasPrice);
      console.log("Gas cost in HBAR:", ethers.utils.formatUnits(gasCost, 18));

      // Add 20% buffer to the base price to account for gas and fees
      const totalCost = priceInHBAR.mul(120).div(100);

      console.log("Cost breakdown:", {
        basePrice: ethers.utils.formatUnits(priceInHBAR, 18),
        gasCost: ethers.utils.formatUnits(gasCost, 18),
        totalCost: ethers.utils.formatUnits(totalCost, 18),
      });

      // Check if user already has a license
      const hasLicense = await contract.hasLicense(dataset.cid, account);
      console.log("Has license:", hasLicense);
      if (hasLicense) {
        throw new Error("You already have a license for this dataset");
      }

      // Check if the dataset owner is valid
      console.log("Dataset owner:", datasetInfo.owner);
      if (datasetInfo.owner === ethers.constants.AddressZero) {
        throw new Error("Invalid dataset owner");
      }

      // Check if the price is valid
      if (priceInHBAR.isZero()) {
        throw new Error("Invalid dataset price");
      }

      // Get user's HBAR balance
      const balance = await provider.getBalance(account);
      console.log(
        "User balance:",
        ethers.utils.formatUnits(balance, 18),
        "HBAR"
      );

      if (balance.lt(totalCost)) {
        throw new Error(
          `Insufficient HBAR balance. Need ${ethers.utils.formatUnits(
            totalCost,
            18
          )} HBAR but have ${ethers.utils.formatUnits(balance, 18)} HBAR`
        );
      }

      setStatus("Purchasing license...");

      // Prepare transaction with fixed gas parameters
      console.log("Price in HBAR Before calling purchaseLicense:", priceInHBAR);
      const tx = await licenseContract.purchaseLicense(dataset.cid, {
        value: priceInHBAR,
        gasLimit: gasLimit,
        gasPrice: gasPrice,
      });

      console.log("Transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);

      setStatus("License purchased successfully!");
      fetchDatasets();
      fetchHbarBalance(); // Update HBAR balance after purchase
    } catch (error) {
      console.error("Purchase error:", error);
      if (error.message.includes("Insufficient HBAR")) {
        setError(error.message);
      } else if (error.message.includes("License already active")) {
        setError("You already have an active license for this dataset.");
      } else if (error.message.includes("Dataset is public")) {
        setError("This dataset is public and does not require a license.");
      } else if (error.message.includes("Dataset is removed")) {
        setError("This dataset has been removed and is no longer available.");
      } else if (error.message.includes("already have a license")) {
        setError("You already have a license for this dataset.");
      } else if (error.message.includes("Invalid dataset owner")) {
        setError("This dataset has an invalid owner.");
      } else if (error.message.includes("Invalid dataset price")) {
        setError("This dataset has an invalid price.");
      } else if (error.code === -32603) {
        setError(
          "Transaction rejected. Please check your HBAR balance and try again."
        );
      } else {
        setError("Failed to purchase license: " + error.message);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Dataset Marketplace
          </h2>
          <div className="flex items-center">
            <div className="text-lg font-medium bg-gray-100 px-4 py-2 rounded-md">
              Balance: {parseFloat(hbarBalance).toFixed(4)} HBAR
              <button
                onClick={fetchHbarBalance}
                className="ml-2 text-blue-600 hover:text-blue-800"
                title="Refresh balance"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {status && (
          <div className="mt-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            {status}
          </div>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {datasets.map((dataset) => (
            <div
              key={dataset.cid}
              className="bg-white overflow-hidden shadow rounded-lg border border-gray-200"
            >
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {dataset.name ? dataset.name : "Unnamed Dataset"}
                </h3>
                
                <p className="mt-2 text-sm text-gray-500">
                Description:{dataset.description
                    ? dataset.description
                    : "No description provided"}
                </p>
                <div className="mt-4 space-y-1">
                  <div className="dataset-price">
                    Price: {dataset.priceFormatted} HBAR
                  </div>
                  <p className="text-sm text-gray-600">
                    Owner:{" "}
                    {dataset.owner
                      ? `${dataset.owner
                          .toString()
                          .slice(0, 6)}...${dataset.owner.toString().slice(-4)}`
                      : "Unknown"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Visibility: {dataset.isPublic ? "Public" : "Private"}
                  </p>
                </div>

                {dataset.hasLicense ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Licensed
                  </span>
                ) : (
                  <button
                    onClick={() => purchaseDataset(dataset)}
                    disabled={isPurchasing}
                    className={`mt-2 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                      isPurchasing
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isPurchasing ? "Purchasing..." : "Buy License"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DatasetMarketplace;
