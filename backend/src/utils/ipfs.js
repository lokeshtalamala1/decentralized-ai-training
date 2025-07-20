const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
require('dotenv').config();

class PinataIPFS {
    constructor() {
        this.apiKey = process.env.PINATA_API_KEY;
        this.secretKey = process.env.PINATA_SECRET_KEY;
        this.gatewayUrl = process.env.PINATA_GATEWAY_URL;
    }

    async uploadFile(filePath, fileName) {
        try {
            const formData = new FormData();
            const fileStream = fs.createReadStream(filePath);
            
            formData.append('file', fileStream, {
                filename: fileName
            });

            const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
                maxBodyLength: 'Infinity',
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                    'pinata_api_key': this.apiKey,
                    'pinata_secret_api_key': this.secretKey
                }
            });

            return {
                ipfsHash: response.data.IpfsHash,
                pinSize: response.data.PinSize,
                timestamp: response.data.Timestamp,
                url: `${this.gatewayUrl}${response.data.IpfsHash}`
            };
        } catch (error) {
            console.error('Error uploading to IPFS:', error);
            throw new Error('Failed to upload file to IPFS');
        }
    }

    async uploadJSON(data) {
        try {
            const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', data, {
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': this.apiKey,
                    'pinata_secret_api_key': this.secretKey
                }
            });

            return {
                ipfsHash: response.data.IpfsHash,
                pinSize: response.data.PinSize,
                timestamp: response.data.Timestamp,
                url: `${this.gatewayUrl}${response.data.IpfsHash}`
            };
        } catch (error) {
            console.error('Error uploading JSON to IPFS:', error);
            throw new Error('Failed to upload JSON to IPFS');
        }
    }

    async getFile(ipfsHash) {
        try {
            const response = await axios.get(`${this.gatewayUrl}${ipfsHash}`, {
                responseType: 'stream'
            });
            return response.data;
        } catch (error) {
            console.error('Error retrieving file from IPFS:', error);
            throw new Error('Failed to retrieve file from IPFS');
        }
    }
}

module.exports = new PinataIPFS(); 