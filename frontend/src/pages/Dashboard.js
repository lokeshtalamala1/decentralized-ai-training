import React, { useState, useEffect } from 'react';
import { useHedera } from '../context/HederaContext';
import DatasetRegistry from '../contracts/DatasetRegistry.json';

function Dashboard() {
  const { account, client } = useHedera();
  const [ownedDatasets, setOwnedDatasets] = useState([]);
  const [licensedDatasets, setLicensedDatasets] = useState([]);
  const [loading, setLoading] = useState(true);

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

  useEffect(() => {
    async function loadDatasets() {
      if (!client || !account) return;

      try {
        const count = await client.getDatasetCount();
        const datasetList = [];

        for (let i = 0; i < count; i++) {
          const cid = await client.getDatasetCid(i);
          const info = await client.getDatasetInfo(cid);
          const hasLicense = await client.hasLicense(cid, account.toString());

          if (info.owner.toLowerCase() === account.toString().toLowerCase()) {
            ownedDatasets.push({
              cid,
              ...info
            });
          }

          if (hasLicense) {
            licensedDatasets.push({
              cid,
              ...info
            });
          }
        }

        setOwnedDatasets(ownedDatasets);
        setLicensedDatasets(licensedDatasets);
        setLoading(false);
      } catch (error) {
        console.error('Error loading datasets:', error);
        setLoading(false);
      }
    }

    loadDatasets();
  }, [client, account]);

  const removeDataset = async (cid) => {
    if (!client || !account) return;

    try {
      await client.removeDataset(cid);
      // Refresh dataset list
      window.location.reload();
    } catch (error) {
      console.error('Error removing dataset:', error);
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
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-extrabold text-gray-900">Dashboard</h2>

      {/* Owned Datasets */}
      <div className="mt-8">
        <h3 className="text-2xl font-semibold text-gray-900">My Datasets</h3>
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          {ownedDatasets.map((dataset) => (
            <div key={dataset.cid} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h4 className="text-lg font-medium text-gray-900">{dataset.cid}</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Price: {dataset.price} HBAR
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Status: {dataset.isPublic ? 'Public' : 'Private'}
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => removeDataset(dataset.cid)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                  >
                    Remove Dataset
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Licensed Datasets */}
      <div className="mt-12">
        <h3 className="text-2xl font-semibold text-gray-900">Licensed Datasets</h3>
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          {licensedDatasets.map((dataset) => (
            <div key={dataset.cid} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h4 className="text-lg font-medium text-gray-900">{dataset.cid}</h4>
                <p className="mt-1 text-sm text-gray-500">
                  Owner: {dataset.owner.toString().slice(0, 6)}...{dataset.owner.toString().slice(-4)}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Price: {dataset.price} HBAR
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 