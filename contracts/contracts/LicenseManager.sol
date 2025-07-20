// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./DatasetToken.sol";
import "./DatasetRegistry.sol";

contract LicenseManager is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    DatasetToken public token;
    DatasetRegistry public registry;
    uint256 public platformFee; // in basis points (1% = 100)
    uint256 public constant GAS_LIMIT = 500000; // Increased gas limit
    uint256 public constant EXCHANGE_RATE = 1000; // 1 HBAR = 1000 DTT
    uint256 public constant HBAR_DECIMALS = 18;
    uint256 public constant TOKEN_DECIMALS = 8;

    struct License {
        address licensee;
        string datasetCid;
        uint256 purchaseTimestamp;
        uint256 expirationTimestamp;
        bool isActive;
    }

    mapping(bytes32 => License) public licenses;
    mapping(address => bytes32[]) public userLicenses;
    mapping(address => mapping(string => bytes32)) public userDatasetLicenses;

    event LicenseGranted(
        bytes32 indexed licenseId,
        address indexed licensee,
        string datasetCid,
        string name,
        string description,
        uint256 expirationTimestamp
    );
    event LicenseRevoked(bytes32 indexed licenseId);
    event LicenseRenewed(bytes32 indexed licenseId, uint256 newExpirationTimestamp);
    event PlatformFeeUpdated(uint256 newFee);
    event TokenApprovalChecked(address indexed user, uint256 amount);
    event TokensPurchased(address indexed buyer, uint256 hbarAmount, uint256 tokenAmount);

    constructor(
        address _token,
        address _registry,
        uint256 _platformFee
    ) {
        require(_token != address(0), "Invalid token address");
        require(_registry != address(0), "Invalid registry address");
        require(_platformFee <= 1000, "Fee cannot exceed 10%");

        token = DatasetToken(_token);
        registry = DatasetRegistry(_registry);
        platformFee = _platformFee;

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(COMPLIANCE_ROLE, msg.sender);
    }

    function setPlatformFee(uint256 _platformFee) external onlyRole(ADMIN_ROLE) {
        require(_platformFee <= 1000, "Fee cannot exceed 10%");
        platformFee = _platformFee;
        emit PlatformFeeUpdated(_platformFee);
    }

    function checkAndApproveTokenAllowance(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        uint256 currentAllowance = token.allowance(msg.sender, address(this));
        
        if (currentAllowance < amount) {
            require(token.approve(address(this), amount), "Token approval failed");
        }
        
        emit TokenApprovalChecked(msg.sender, amount);
    }

    function purchaseLicense(string memory datasetCid) external payable whenNotPaused {
    // Get dataset info first
    (
        address owner,
        string memory cid,
        string memory name,
        string memory description,
        uint256 price,
        bool isPublic,
        bool isRemoved,
        uint256 uploadTimestamp
    ) = registry.getDatasetInfo(datasetCid);
    
    require(!isPublic, "Dataset is public, no license needed");
    require(!isRemoved, "Dataset is removed");
    require(price > 0, "Dataset price must be greater than 0");

    // Check if license already exists
    bytes32 existingLicenseId = userDatasetLicenses[msg.sender][datasetCid];
    require(existingLicenseId == bytes32(0) || !licenses[existingLicenseId].isActive, "License already active");

    uint256 ownerAmount = msg.value;

    // Check if user sent enough HBAR
    require(msg.value >= 0, "Insufficient HBAR sent");


    // Send HBAR directly to dataset owner
    (bool ownerSent, ) = payable(owner).call{value: ownerAmount}("");
    require(ownerSent, "Payment to owner failed");

    // Grant license in DatasetRegistry
    registry.grantLicense(datasetCid, msg.sender);

    // Grant license
    uint256 purchaseTimestamp = block.timestamp;
    bytes32 licenseId = keccak256(abi.encodePacked(msg.sender, datasetCid, purchaseTimestamp));
    uint256 expirationTimestamp = purchaseTimestamp + 365 days; // 1 year license

    licenses[licenseId] = License({
        licensee: msg.sender,
        datasetCid: datasetCid,
        purchaseTimestamp: purchaseTimestamp,
        expirationTimestamp: expirationTimestamp,
        isActive: true
    });

    userLicenses[msg.sender].push(licenseId);
    userDatasetLicenses[msg.sender][datasetCid] = licenseId;
    
    emit LicenseGranted(licenseId, msg.sender, datasetCid, name, description, expirationTimestamp);
}


    function revokeLicense(string memory datasetCid, address licensee) external onlyRole(COMPLIANCE_ROLE) whenNotPaused {
        bytes32 licenseId = userDatasetLicenses[licensee][datasetCid];
        require(licenseId != bytes32(0), "License does not exist");
        require(licenses[licenseId].isActive, "License is not active");
        licenses[licenseId].isActive = false;
        emit LicenseRevoked(licenseId);
    }

    function isValidLicense(bytes32 licenseId) external view returns (bool) {
        require(licenses[licenseId].licensee != address(0), "License does not exist");
        License memory license = licenses[licenseId];
        return license.isActive && block.timestamp < license.expirationTimestamp;
    }

    function getUserLicenses(address user) external view returns (bytes32[] memory) {
        return userLicenses[user];
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function buyTokens(uint256 tokenAmount) external payable whenNotPaused {
        require(tokenAmount > 0, "Token amount must be greater than 0");
        
        uint256 hbarAmount = tokenAmount/EXCHANGE_RATE;
        require(msg.value >= hbarAmount, "Insufficient HBAR sent");
        
        // Mint tokens to buyer
        token.mint(msg.sender, tokenAmount);
        
        // Refund excess HBAR if any
        if (msg.value > hbarAmount) {
            (bool success, ) = msg.sender.call{value: msg.value - hbarAmount}("");
            require(success, "HBAR refund failed");
        }
        
        emit TokensPurchased(msg.sender, hbarAmount, tokenAmount);
    }
}
