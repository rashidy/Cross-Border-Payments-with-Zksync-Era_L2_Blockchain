import { Wallet, Provider, Contract } from "zksync-web3";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config();

async function main() {
  console.log(`Running interaction script`);

  // Initialize the provider
  const zkSyncProviderUrl = "https://sepolia.era.zksync.dev";
  console.log(`Connecting to zkSync Testnet RPC URL: ${zkSyncProviderUrl}`);

  const zkSyncProvider = new Provider(zkSyncProviderUrl);

  // Initialize the wallet
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Please set your PRIVATE_KEY in a .env file");
  }

  const wallet = new Wallet(privateKey, zkSyncProvider);

  // Load the contract ABI
  const artifactPath = path.join(
    __dirname,
    "../artifacts-zk/contracts/FinancialInstitution.sol/FinancialInstitution.json"
  );

  if (!fs.existsSync(artifactPath)) {
    throw new Error("Artifact not found. Did you compile the contract?");
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  const contractAddress = "0x05d558f658ade2F6da65d653DD54CFBaA3a56a50";

  // Create a contract instance
  const contract = new Contract(contractAddress, artifact.abi, wallet);

  // Example interaction: Create an account
  console.log(`Creating an account...`);
  const createAccountTx = await contract.create_account("general", "AX0000");
  await createAccountTx.wait();
  console.log(`Account created: AX0000`);

  // Example interaction: Get balance
  console.log(`Getting balance for account...`);
  const accountNo = "AX0000"; // Replace with the valid account number
  const balance = await contract.get_balance(accountNo);
  console.log(`Balance of account ${accountNo}: ${ethers.utils.formatEther(balance)} ETH`);

  // Example interaction: Deposit funds
  console.log(`Depositing funds to account...`);
  const depositTx = await contract.deposit(accountNo, {
    value: ethers.utils.parseEther("0.1"),
  });

  // Wait for the transaction to be mined
  await depositTx.wait();
  console.log(`Deposit transaction confirmed: ${depositTx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });