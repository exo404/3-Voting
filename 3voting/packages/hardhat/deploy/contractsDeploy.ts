import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

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

  console.log("✅ SBT deployed at:", sbtDeployment.address);
  console.log("✅ VotationManager deployed at:", votationManagerDeployment.address);
  console.log("✅ Verifier deployed at:", verifierDeployment.address);
};

export default deployContracts;

deployContracts.tags = ["SBT", "VotationManager", "verifier"];
