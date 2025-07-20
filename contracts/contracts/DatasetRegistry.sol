// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract DatasetRegistry is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    struct Dataset {
        address owner;
        string cid;
        string name;
        string description;
        uint256 price;
        bool isPublic;
        bool isRemoved;
        uint256 uploadTimestamp;
        mapping(address => bool) licensees;
    }

    mapping(string => Dataset) public datasets;
    string[] public datasetCids;

    event DatasetRegistered(string indexed cid, address indexed owner, uint256 price, string name, string description);
    event DatasetRemoved(string indexed cid);
    event LicenseGranted(string indexed cid, address indexed licensee);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(COMPLIANCE_ROLE, msg.sender);
    }

    function registerDataset(
        string memory _cid,
        string memory _name,
        string memory _description,
        uint256 _price,
        bool _isPublic
    ) external whenNotPaused {
        require(bytes(_cid).length > 0, "CID cannot be empty");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(_isPublic || _price > 0, "Dataset must be public or have a price greater than 0");
        require(datasets[_cid].owner == address(0), "Dataset already registered");

        Dataset storage dataset = datasets[_cid];
        dataset.owner = msg.sender;
        dataset.cid = _cid;
        dataset.name = _name;
        dataset.description = _description;
        dataset.price = _price;
        dataset.isPublic = _isPublic;
        dataset.uploadTimestamp = block.timestamp;
        dataset.isRemoved = false;

        datasetCids.push(_cid);
        emit DatasetRegistered(_cid, msg.sender, _price, _name, _description);
    }

    function removeDataset(string memory _cid) external {
        require(datasets[_cid].owner == msg.sender || hasRole(COMPLIANCE_ROLE, msg.sender),
            "Not authorized to remove dataset");
        datasets[_cid].isRemoved = true;
        emit DatasetRemoved(_cid);
    }

    function grantLicense(string memory _cid, address _licensee) external {
        require(!datasets[_cid].isRemoved, "Dataset is removed");
        datasets[_cid].licensees[_licensee] = true;
        emit LicenseGranted(_cid, _licensee);
    }

    function hasLicense(string memory _cid, address _user) external view returns (bool) {
        require(datasets[_cid].owner != address(0), "Dataset does not exist");
        if(_user==datasets[_cid].owner){
            return true;
        }
        return datasets[_cid].isPublic || datasets[_cid].licensees[_user];
    }

    function getDatasetCount() external view returns (uint256) {
        return datasetCids.length;
    }

    function getDatasetIdxOfNotRemoved() external view returns (uint256[] memory) {
        uint256 count = 0;
        
        for (uint256 i = 0; i < datasetCids.length; i++) {
            if (!datasets[datasetCids[i]].isRemoved) {
                count++;
            }
        }

        
        uint256[] memory indices = new uint256[](count);
        uint256 j = 0;

        
        for (uint256 i = 0; i < datasetCids.length; i++) {
            if (!datasets[datasetCids[i]].isRemoved) {
                indices[j] = i;
                j++;
            }
        }

        return indices;
    }


    function getDatasetCid(uint256 index) external view returns (string memory) {
        require(index < datasetCids.length, "Index out of bounds");
        return datasetCids[index];
    }

    function getDatasetInfo(string memory _cid) external view returns (
        address owner,
        string memory cid,
        string memory name,
        string memory description,
        uint256 price,
        bool isPublic,
        bool isRemoved,
        uint256 uploadTimestamp
    ) {
        Dataset storage dataset = datasets[_cid];
        require(dataset.owner != address(0), "Dataset does not exist");
        return (
            dataset.owner,
            dataset.cid,
            dataset.name,
            dataset.description,
            dataset.price,
            dataset.isPublic,
            dataset.isRemoved,
            dataset.uploadTimestamp
        );
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
}
