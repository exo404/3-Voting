import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys contracts for the voting system
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy SBT contract
  const sbtDeployment = await deploy("SBT", {
    from: deployer,
  });

  // Deploy VotationManager contract
  const votationManagerDeployment = await deploy("VotationManager", {
    from: deployer,
  });

  // Deploy verifier contract
  const verifierDeployment = await deploy("Groth16Verifier", {
    from: deployer,
  });

  // Get deployed contracts
  const sbtContract = await hre.ethers.getContract<Contract>("SBT", deployer);
  const votationManager = await hre.ethers.getContract<Contract>("VotationManager", deployer);
  
  console.log("✅ SBT deployed at:", sbtDeployment.address);
  console.log("✅ VotationManager deployed at:", votationManagerDeployment.address);
  console.log("✅ Verifier deployed at:", verifierDeployment.address);
};

export default deployContracts;

deployContracts.tags = ["SBT", "VotationManager", "verifier"];
