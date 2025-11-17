// deploy/deploy.ts
import { Wallet, Provider, ContractFactory } from "zksync-web3";
import * as ethers from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config();

async function main() {
  console.log(`Running deploy script`);

  // Initialize the provider
  const zkSyncProvider = new Provider("https://sepolia.era.zksync.dev");

  // Initialize the wallet
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Please set your PRIVATE_KEY in a .env file");
  }
  const wallet = new Wallet(privateKey, zkSyncProvider);

  // Load the artifact
  const artifactPath = path.join(
    __dirname,
    "../artifacts-zk/contracts/FinancialInstitution.sol/FinancialInstitution.json"
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error("Artifact not found. Did you compile the contract?");
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  // Create a contract factory
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);

  // Deploy the contract
  console.log(`Deploying contract...`);
  const contract = await factory.deploy(); // Removed `estimateGas`

  // Wait for the deployment to be mined
  await contract.deployed();

  console.log(`Contract deployed at address: ${contract.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
