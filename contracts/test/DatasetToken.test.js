const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DatasetToken", function () {
  let DatasetToken;
  let token;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    DatasetToken = await ethers.getContractFactory("DatasetToken");
    token = await DatasetToken.deploy("AI Dataset Token", "AIDT", ethers.utils.parseEther("1000000"));
    await token.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await token.name()).to.equal("AI Dataset Token");
      expect(await token.symbol()).to.equal("AIDT");
    });

    it("Should set the correct initial supply", async function () {
      expect(await token.totalSupply()).to.equal(ethers.utils.parseEther("1000000"));
      expect(await token.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("1000000"));
    });

    it("Should set the correct decimals", async function () {
      expect(await token.decimals()).to.equal(18);
    });
  });

  describe("Minting", function () {
    it("Should mint tokens by minter role", async function () {
      await token.grantRole(await token.MINTER_ROLE(), addr1.address);
      await token.connect(addr1).mint(addr2.address, ethers.utils.parseEther("1000"));
      expect(await token.balanceOf(addr2.address)).to.equal(ethers.utils.parseEther("1000"));
    });

    it("Should not mint tokens by non-minter role", async function () {
      const minterRole = await token.MINTER_ROLE();
      await expect(token.connect(addr1).mint(addr2.address, ethers.utils.parseEther("1000")))
        .to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${minterRole.toLowerCase()}`);
    });

    it("Should not mint tokens when paused", async function () {
      await token.grantRole(await token.MINTER_ROLE(), addr1.address);
      await token.pause();
      await expect(token.connect(addr1).mint(addr2.address, ethers.utils.parseEther("1000")))
        .to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Burning", function () {
    it("Should burn tokens by burner role", async function () {
      await token.grantRole(await token.BURNER_ROLE(), addr1.address);
      await token.transfer(addr1.address, ethers.utils.parseEther("1000"));
      await token.connect(addr1).burn(addr1.address, ethers.utils.parseEther("500"));
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("500"));
    });

    it("Should not burn tokens by non-burner role", async function () {
      const burnerRole = await token.BURNER_ROLE();
      await token.transfer(addr1.address, ethers.utils.parseEther("1000"));
      await expect(token.connect(addr1).burn(addr1.address, ethers.utils.parseEther("500")))
        .to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${burnerRole.toLowerCase()}`);
    });

    it("Should not burn tokens when paused", async function () {
      await token.grantRole(await token.BURNER_ROLE(), addr1.address);
      await token.transfer(addr1.address, ethers.utils.parseEther("1000"));
      await token.pause();
      await expect(token.connect(addr1).burn(addr1.address, ethers.utils.parseEther("500")))
        .to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause by admin", async function () {
      await token.pause();
      expect(await token.paused()).to.equal(true);
      
      await token.unpause();
      expect(await token.paused()).to.equal(false);
    });

    it("Should not pause by non-admin", async function () {
      const adminRole = await token.DEFAULT_ADMIN_ROLE();
      await expect(token.connect(addr1).pause())
        .to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${adminRole.toLowerCase()}`);
    });

    it("Should not unpause by non-admin", async function () {
      const adminRole = await token.DEFAULT_ADMIN_ROLE();
      await token.pause();
      await expect(token.connect(addr1).unpause())
        .to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role ${adminRole.toLowerCase()}`);
    });
  });
}); 