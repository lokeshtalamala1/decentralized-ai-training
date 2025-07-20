import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Decentralized AI Dataset</span>
            <span className="block text-primary-600">Marketplace</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Buy, sell, and manage AI datasets securely on the blockchain. Our platform ensures data integrity, 
            transparency, and fair compensation for data providers.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                to="/marketplace"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
              >
                Browse Datasets
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link
                to="/upload"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Upload Dataset
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Secure Transactions</h3>
              <p className="mt-2 text-base text-gray-500">
                All transactions are secured by smart contracts on the blockchain, ensuring fair and transparent exchanges.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Data Integrity</h3>
              <p className="mt-2 text-base text-gray-500">
                Each dataset is verified and stored with its metadata on the blockchain, guaranteeing authenticity.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Fair Compensation</h3>
              <p className="mt-2 text-base text-gray-500">
                Data providers receive direct compensation for their contributions through smart contracts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home; 