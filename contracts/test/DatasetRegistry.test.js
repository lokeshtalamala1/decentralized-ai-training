const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DatasetRegistry", function () {
  let DatasetRegistry;
  let registry;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    DatasetRegistry = await ethers.getContractFactory("DatasetRegistry");
    registry = await DatasetRegistry.deploy();
    await registry.deployed();
  });

  describe("Dataset Registration", function () {
    it("Should register a new dataset", async function () {
      const cid = "QmTestCID";
      const name = "Test Dataset";
      const description = "This is a test dataset.";
      const price = ethers.utils.parseEther("1.0");
      const isPublic = false;

      await registry.registerDataset(cid, name, description, price, isPublic);
      const dataset = await registry.getDatasetInfo(cid);

      expect(dataset.owner).to.equal(owner.address);
      expect(dataset.cid).to.equal(cid);
      expect(dataset.name).to.equal(name);
      expect(dataset.description).to.equal(description);
      expect(dataset.price).to.equal(price);
      expect(dataset.isPublic).to.equal(isPublic);
      expect(dataset.isRemoved).to.equal(false);
    });

    it("Should not allow duplicate CID registration", async function () {
      const cid = "QmTestCID";
      const name = "Test Dataset";
      const description = "This is a test dataset.";
      const price = ethers.utils.parseEther("1.0");

      await registry.registerDataset(cid, name, description, price, false);
      await expect(registry.registerDataset(cid, name, description, price, false))
        .to.be.revertedWith("Dataset already registered");
    });

    it("Should not allow empty CID", async function () {
      const name = "Test Dataset";
      const description = "This is a test dataset.";
      const price = ethers.utils.parseEther("1.0");
      await expect(registry.registerDataset("", name, description, price, false))
        .to.be.revertedWith("CID cannot be empty");
    });

    it("Should not allow zero price", async function () {
      const cid = "QmTestCID";
      const name = "Test Dataset";
      const description = "This is a test dataset.";
      await expect(registry.registerDataset(cid, name, description, 0, false))
        .to.be.revertedWith("Price must be greater than 0");
    });
  });

  describe("Dataset Removal", function () {
    it("Should allow owner to remove dataset", async function () {
      const cid = "QmTestCID";
      const name = "Test Dataset";
      const description = "This is a test dataset.";
      await registry.registerDataset(cid, name, description, ethers.utils.parseEther("1.0"), false);
      await registry.removeDataset(cid);
      const dataset = await registry.getDatasetInfo(cid);
      expect(dataset.isRemoved).to.equal(true);
    });

    it("Should allow compliance role to remove dataset", async function () {
      const cid = "QmTestCID";
      const name = "Test Dataset";
      const description = "This is a test dataset.";
      await registry.registerDataset(cid, name, description, ethers.utils.parseEther("1.0"), false);
      await registry.grantRole(await registry.COMPLIANCE_ROLE(), addr1.address);
      await registry.connect(addr1).removeDataset(cid);
      const dataset = await registry.getDatasetInfo(cid);
      expect(dataset.isRemoved).to.equal(true);
    });

    it("Should not allow non-owner to remove dataset", async function () {
      const cid = "QmTestCID";
      const name = "Test Dataset";
      const description = "This is a test dataset.";
      await registry.registerDataset(cid, name, description, ethers.utils.parseEther("1.0"), false);
      await expect(registry.connect(addr1).removeDataset(cid))
        .to.be.revertedWith("Not authorized to remove dataset");
    });
  });

  describe("License Management", function () {
    it("Should grant license to user", async function () {
      const cid = "QmTestCID";
      const name = "Test Dataset";
      const description = "This is a test dataset.";
      await registry.registerDataset(cid, name, description, ethers.utils.parseEther("1.0"), false);
      await registry.grantLicense(cid, addr1.address);
      const hasLicense = await registry.hasLicense(cid, addr1.address);
      expect(hasLicense).to.equal(true);
    });

    it("Should not grant license for removed dataset", async function () {
      const cid = "QmTestCID";
      const name = "Test Dataset";
      const description = "This is a test dataset.";
      await registry.registerDataset(cid, name, description, ethers.utils.parseEther("1.0"), false);
      await registry.removeDataset(cid);
      await expect(registry.grantLicense(cid, addr1.address))
        .to.be.revertedWith("Dataset is removed");
    });

    it("Should not allow non-owner to grant license", async function () {
      const cid = "QmTestCID";
      const name = "Test Dataset";
      const description = "This is a test dataset.";
      await registry.registerDataset(cid, name, description, ethers.utils.parseEther("1.0"), false);
      await expect(registry.connect(addr1).grantLicense(cid, addr2.address))
        .to.be.revertedWith("Not the dataset owner");
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause contract", async function () {
      await registry.pause();
      const cid = "QmTestCID";
      await expect(registry.registerDataset(cid, "Test Dataset", "This is a test dataset.", ethers.utils.parseEther("1.0"), false))
        .to.be.revertedWith("Pausable: paused");

      await registry.unpause();
      await registry.registerDataset(cid, "Test Dataset", "This is a test dataset.", ethers.utils.parseEther("1.0"), false);
      const dataset = await registry.getDatasetInfo(cid);
      expect(dataset.cid).to.equal(cid);
    });

    it("Should not allow non-admin to pause", async function () {
      const adminRole = await registry.ADMIN_ROLE();
      await expect(registry.connect(addr1).pause())
        .to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${adminRole.toLowerCase()}`);
    });
  });
});
