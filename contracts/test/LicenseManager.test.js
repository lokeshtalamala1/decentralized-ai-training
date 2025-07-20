const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LicenseManager", function () {
  let DatasetToken;
  let DatasetRegistry;
  let LicenseManager;
  let token;
  let registry;
  let licenseManager;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy DatasetToken
    DatasetToken = await ethers.getContractFactory("DatasetToken");
    token = await DatasetToken.deploy("Dataset Token", "DTT", 8); // 8 decimals
    await token.deployed();

    // Deploy DatasetRegistry
    DatasetRegistry = await ethers.getContractFactory("DatasetRegistry");
    registry = await DatasetRegistry.deploy();
    await registry.deployed();

    // Deploy LicenseManager
    LicenseManager = await ethers.getContractFactory("LicenseManager");
    licenseManager = await LicenseManager.deploy(
      token.address,
      registry.address,
      100 // 1% platform fee
    );
    await licenseManager.deployed();

    // Register a private dataset
    await registry.registerDataset(
      "QmTestCID",
      "Test Dataset",
      "This is a test dataset",
      ethers.utils.parseUnits("1.0", 8), // 1 DTT with 8 decimals
      false // private
    );

    // Mint tokens to addr1
    await token.mint(addr1.address, ethers.utils.parseUnits("2.0", 8));

    // Grant COMPLIANCE_ROLE to owner
    const complianceRole = await licenseManager.COMPLIANCE_ROLE();
    await licenseManager.grantRole(complianceRole, owner.address);
  });

  describe("Token Allowance", function () {
    it("Should check and approve token allowance successfully", async function () {
      const amount = ethers.utils.parseUnits("1.0", 8);
      
      // First approve tokens to the license manager
      await token.connect(addr1).approve(licenseManager.address, amount);
      
      // Then check and approve allowance
      const tx = await licenseManager.connect(addr1).checkAndApproveTokenAllowance(amount);
      await expect(tx)
        .to.emit(licenseManager, "TokenApprovalChecked")
        .withArgs(addr1.address, amount);
      
      // Verify allowance
      const allowance = await token.allowance(addr1.address, licenseManager.address);
      expect(allowance).to.equal(amount);
    });

    it("Should not approve zero amount", async function () {
      await expect(licenseManager.connect(addr1).checkAndApproveTokenAllowance(0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should not allow purchase without sufficient allowance", async function () {
      const cid = "QmTestCID";
      await expect(licenseManager.connect(addr1).purchaseLicense(cid))
        .to.be.revertedWith("Insufficient token allowance. Please call checkAndApproveTokenAllowance first");
    });
  });

  describe("License Purchase", function () {
    beforeEach(async function () {
      // Approve license manager to spend tokens
      const amount = ethers.utils.parseUnits("2.0", 8);
      await token.connect(addr1).approve(licenseManager.address, amount);
      await licenseManager.connect(addr1).checkAndApproveTokenAllowance(amount);
    });

    it("Should purchase license successfully", async function () {
      const cid = "QmTestCID";
      const tx = await licenseManager.connect(addr1).purchaseLicense(cid);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      // Calculate license ID using the same method as the contract
      const licenseId = ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ["address", "string", "uint256"],
          [addr1.address, cid, block.timestamp]
        )
      );
      
      await expect(tx)
        .to.emit(licenseManager, "LicenseGranted")
        .withArgs(licenseId, addr1.address, cid, "Test Dataset", "This is a test dataset", block.timestamp + 365 * 24 * 60 * 60);
      
      const license = await licenseManager.licenses(licenseId);
      expect(license.isActive).to.be.true;
      expect(license.expirationTimestamp).to.be.gt(0);
    });

    it("Should not allow purchasing license for public dataset", async function () {
      // Register a public dataset
      await registry.registerDataset(
        "QmPublicCID",
        "Public Dataset",
        "This is a public dataset",
        ethers.utils.parseUnits("1.0", 8),
        true // public
      );
      
      // Try to purchase license for public dataset
      await expect(licenseManager.connect(addr1).purchaseLicense("QmPublicCID"))
        .to.be.revertedWith("Dataset is public, no license needed");
    });

    it("Should not allow purchasing license twice", async function () {
      const cid = "QmTestCID";
      
      // First purchase
      await licenseManager.connect(addr1).purchaseLicense(cid);
      
      // Try to purchase again
      await expect(licenseManager.connect(addr1).purchaseLicense(cid))
        .to.be.revertedWith("License already active");
    });

    it("Should handle gas limits correctly", async function () {
      const cid = "QmTestCID";
      const tx = await licenseManager.connect(addr1).purchaseLicense(cid);
      const receipt = await tx.wait();
      
      // Verify gas used is within reasonable limits
      expect(receipt.gasUsed).to.be.lt(ethers.BigNumber.from("500000"));
    });
  });

  describe("License Revocation", function () {
    beforeEach(async function () {
      // Approve license manager to spend tokens
      const amount = ethers.utils.parseUnits("2.0", 8);
      await token.connect(addr1).approve(licenseManager.address, amount);
      await licenseManager.connect(addr1).checkAndApproveTokenAllowance(amount);
      
      // Grant COMPLIANCE_ROLE to owner
      const complianceRole = await licenseManager.COMPLIANCE_ROLE();
      await licenseManager.grantRole(complianceRole, owner.address);
    });

    it("Should revoke license successfully", async function () {
      const cid = "QmTestCID";
      
      // Purchase license
      const tx = await licenseManager.connect(addr1).purchaseLicense(cid);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      // Calculate license ID using the same method as the contract
      const licenseId = ethers.utils.keccak256(
        ethers.utils.solidityPack(
          ["address", "string", "uint256"],
          [addr1.address, cid, block.timestamp]
        )
      );
      
      // Revoke license
      await expect(licenseManager.revokeLicense(cid, addr1.address))
        .to.emit(licenseManager, "LicenseRevoked")
        .withArgs(licenseId);
      
      const license = await licenseManager.licenses(licenseId);
      expect(license.isActive).to.be.false;
    });

    it("Should not allow non-compliance role to revoke license", async function () {
      const cid = "QmTestCID";
      
      // Purchase license
      await licenseManager.connect(addr1).purchaseLicense(cid);
      
      const complianceRole = await licenseManager.COMPLIANCE_ROLE();
      await expect(licenseManager.connect(addr1).revokeLicense(cid, addr1.address))
        .to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${complianceRole.toLowerCase()}`);
    });
  });

  describe("Platform Fee", function () {
    beforeEach(async function () {
      // Grant ADMIN_ROLE to owner
      const adminRole = await licenseManager.ADMIN_ROLE();
      await licenseManager.grantRole(adminRole, owner.address);
    });

    it("Should update platform fee by admin", async function () {
      await licenseManager.setPlatformFee(200); // 2%
      expect(await licenseManager.platformFee()).to.equal(200);
    });

    it("Should not allow non-admin to update platform fee", async function () {
      const adminRole = await licenseManager.ADMIN_ROLE();
      await expect(licenseManager.connect(addr1).setPlatformFee(200))
        .to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${adminRole.toLowerCase()}`);
    });

    it("Should not allow fee above 10%", async function () {
      await expect(licenseManager.setPlatformFee(1001))
        .to.be.revertedWith("Fee cannot exceed 10%");
    });
  });

  describe("Pause/Unpause", function () {
    beforeEach(async function () {
      // Grant DEFAULT_ADMIN_ROLE to owner
      const defaultAdminRole = await licenseManager.DEFAULT_ADMIN_ROLE();
      await licenseManager.grantRole(defaultAdminRole, owner.address);
    });

    it("Should pause and unpause contract", async function () {
      await licenseManager.pause();
      expect(await licenseManager.paused()).to.be.true;

      await licenseManager.unpause();
      expect(await licenseManager.paused()).to.be.false;
    });

    it("Should not allow non-admin to pause", async function () {
      const defaultAdminRole = await licenseManager.DEFAULT_ADMIN_ROLE();
      await expect(licenseManager.connect(addr1).pause())
        .to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${defaultAdminRole.toLowerCase()}`);
    });
  });
});
