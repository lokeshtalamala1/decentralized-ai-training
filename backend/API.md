# AI Data Token Platform API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All endpoints require authentication using Ethereum signatures. Include the following in request headers:
```
Authorization: Bearer <signature>
```

## Datasets API

### Get All Datasets
```http
GET /datasets
```
Returns a list of all registered datasets.

**Response:**
```json
[
  {
    "id": "0",
    "name": "Sample Dataset",
    "description": "Description of the dataset",
    "owner": "0x...",
    "price": "1.0",
    "isPublic": true
  }
]
```

### Register New Dataset
```http
POST /datasets
```
Register a new dataset.

**Request Body:**
```json
{
  "name": "New Dataset",
  "description": "Dataset description",
  "price": "1.5",
  "isPublic": false
}
```

**Response:**
```json
{
  "message": "Dataset registered successfully",
  "transactionHash": "0x..."
}
```

### Get Dataset by ID
```http
GET /datasets/:id
```
Get details of a specific dataset.

**Response:**
```json
{
  "id": "0",
  "name": "Sample Dataset",
  "description": "Description of the dataset",
  "owner": "0x...",
  "price": "1.0",
  "isPublic": true
}
```

### Update Dataset Price
```http
PUT /datasets/:id/price
```
Update the price of a dataset (owner only).

**Request Body:**
```json
{
  "price": "2.0"
}
```

**Response:**
```json
{
  "message": "Dataset price updated successfully",
  "transactionHash": "0x..."
}
```

## License API

### Get User Licenses
```http
GET /licenses/user/:address
```
Get all licenses for a specific user.

**Response:**
```json
[
  {
    "datasetId": "0",
    "user": "0x...",
    "expiryDate": "1234567890",
    "isActive": true
  }
]
```

### Purchase License
```http
POST /licenses/purchase
```
Purchase a license for a dataset.

**Request Body:**
```json
{
  "datasetId": "0",
  "buyer": "0x..."
}
```

**Response:**
```json
{
  "message": "License purchased successfully",
  "transactionHash": "0x..."
}
```

### Check License Status
```http
GET /licenses/check/:datasetId/:address
```
Check if a user has a valid license for a dataset.

**Response:**
```json
{
  "hasValidLicense": true,
  "licenseDetails": {
    "expiryDate": "1234567890",
    "isActive": true
  }
}
```

### Revoke License
```http
POST /licenses/revoke
```
Revoke a user's license (compliance role only).

**Request Body:**
```json
{
  "datasetId": "0",
  "userAddress": "0x..."
}
```

**Response:**
```json
{
  "message": "License revoked successfully",
  "transactionHash": "0x..."
}
```

## Token API

### Get Token Balance
```http
GET /tokens/balance/:address
```
Get token balance for an address.

**Response:**
```json
{
  "address": "0x...",
  "balance": "100.0"
}
```

### Transfer Tokens
```http
POST /tokens/transfer
```
Transfer tokens to another address.

**Request Body:**
```json
{
  "to": "0x...",
  "amount": "10.0"
}
```

**Response:**
```json
{
  "message": "Tokens transferred successfully",
  "transactionHash": "0x..."
}
```

### Get Token Allowance
```http
GET /tokens/allowance/:owner/:spender
```
Check token allowance between addresses.

**Response:**
```json
{
  "owner": "0x...",
  "spender": "0x...",
  "allowance": "50.0"
}
```

### Approve Token Spending
```http
POST /tokens/approve
```
Approve another address to spend tokens.

**Request Body:**
```json
{
  "spender": "0x...",
  "amount": "100.0"
}
```

**Response:**
```json
{
  "message": "Token approval set successfully",
  "transactionHash": "0x..."
}
```

### Get Total Supply
```http
GET /tokens/total-supply
```
Get total token supply.

**Response:**
```json
{
  "totalSupply": "1000000.0"
}
```

### Mint Tokens
```http
POST /tokens/mint
```
Mint new tokens (admin only).

**Request Body:**
```json
{
  "to": "0x...",
  "amount": "1000.0"
}
```

**Response:**
```json
{
  "message": "Tokens minted successfully",
  "transactionHash": "0x..."
}
```

## Error Responses

All endpoints may return the following error responses:

```json
{
  "error": "Error message"
}
```

Common HTTP Status Codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error 