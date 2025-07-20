const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // Deploy DatasetToken
  const DatasetToken = await hre.ethers.getContractFactory("DatasetToken");
  const token = await DatasetToken.deploy(
    "AI Dataset Token",
    "AIDT",
    ethers.utils.parseEther("1000000") // 1 million tokens
  );
  await token.deployed();
  console.log("DatasetToken deployed to:", token.address);

  // Deploy DatasetRegistry
  const DatasetRegistry = await hre.ethers.getContractFactory(
    "DatasetRegistry"
  );
  const registry = await DatasetRegistry.deploy();
  await registry.deployed();
  console.log("DatasetRegistry deployed to:", registry.address);

  // Deploy LicenseManager
  const LicenseManager = await hre.ethers.getContractFactory("LicenseManager");
  const licenseManager = await LicenseManager.deploy(
    token.address,
    registry.address,
    100 // 1% platform fee
  );
  await licenseManager.deployed();
  console.log("LicenseManager deployed to:", licenseManager.address);

  // Grant roles
  const [deployer] = await hre.ethers.getSigners();

  // Grant MINTER_ROLE to LicenseManager
  const MINTER_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("MINTER_ROLE")
  );
  await token.grantRole(MINTER_ROLE, licenseManager.address);
  console.log("Granted MINTER_ROLE to LicenseManager");

  // Grant BURNER_ROLE to LicenseManager
  const BURNER_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("BURNER_ROLE")
  );
  await token.grantRole(BURNER_ROLE, licenseManager.address);
  console.log("Granted BURNER_ROLE to LicenseManager");

  // Grant ADMIN_ROLE to deployer in all contracts
  const ADMIN_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("ADMIN_ROLE")
  );
  await token.grantRole(ADMIN_ROLE, deployer.address);
  await registry.grantRole(ADMIN_ROLE, deployer.address);
  await licenseManager.grantRole(ADMIN_ROLE, deployer.address);
  console.log("Granted ADMIN_ROLE to deployer in all contracts");

  // Grant COMPLIANCE_ROLE to deployer in all contracts
  const COMPLIANCE_ROLE = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes("COMPLIANCE_ROLE")
  );
  await registry.grantRole(COMPLIANCE_ROLE, deployer.address);
  await licenseManager.grantRole(COMPLIANCE_ROLE, deployer.address);
  console.log("Granted COMPLIANCE_ROLE to deployer in all contracts");

  // Grant DEFAULT_ADMIN_ROLE to deployer in all contracts
  const DEFAULT_ADMIN_ROLE = ethers.constants.HashZero;
  await token.grantRole(DEFAULT_ADMIN_ROLE, deployer.address);
  await registry.grantRole(DEFAULT_ADMIN_ROLE, deployer.address);
  await licenseManager.grantRole(DEFAULT_ADMIN_ROLE, deployer.address);
  console.log("Granted DEFAULT_ADMIN_ROLE to deployer in all contracts");

  console.log("Deployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
