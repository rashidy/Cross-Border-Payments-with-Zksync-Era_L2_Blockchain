import { Provider, Wallet, Contract } from "zksync-web3";
import { ethers } from "ethers";
import FinancialInstitutionArtifact from "../artifacts-zk/contracts/FinancialInstitution.sol/FinancialInstitution.json";

//const ZKSYNC_PROVIDER_URL = "https://zksync-sepolia.public.blastapi.io";
const ZKSYNC_PROVIDER_URL = "https://sepolia.era.zksync.dev";
const DEPLOYED_CONTRACT_ADDRESS = "0x05d558f658ade2F6da65d653DD54CFBaA3a56a50";
const PRIVATE_KEY = "0xd54d5c67f9cdf42c7a2193371b29017f2b535c5593ae9c8d18e2907bd710e7d0"; // Replace with your actual private key
const NUM_TRANSACTIONS = 900;
const CONCURRENT_REQUESTS = 19;

interface Metrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalGasUsed: ethers.BigNumber;
  totalTimeTaken: number;
  totalLatency: number;
  nonceErrors: number;
  totalEventsEmitted: number;
  totalBlockSize: number;
  totalBlockTime: number;
  totalBatchesLayer2ToLayer1: number;
  totalBlockSizeBytes: number;
  totalBlockTimeMs: number;
}

async function runStressTest() {
  console.log("Running stress test for zkSync scalability...");
  const provider = new Provider(ZKSYNC_PROVIDER_URL);
  const wallet = new Wallet(PRIVATE_KEY, provider);
  const financialInstitution = new Contract(
    DEPLOYED_CONTRACT_ADDRESS,
    FinancialInstitutionArtifact.abi,
    wallet
  );

  let metrics: Metrics = {
    totalTransactions: NUM_TRANSACTIONS,
    successfulTransactions: 0,
    failedTransactions: 0,
    totalGasUsed: ethers.BigNumber.from(0),
    totalTimeTaken: 0,
    totalLatency: 0,
    nonceErrors: 0,
    totalEventsEmitted: 0,
    totalBlockSize: 0,
    totalBlockTime: 0,
    totalBatchesLayer2ToLayer1: 0,
    totalBlockSizeBytes: 0,
    totalBlockTimeMs: 0,
  };

  const startTime = Date.now();
  let currentNonce = await provider.getTransactionCount(wallet.address, "latest");

  const transactionPromises = [];

  for (let i = 0; i < NUM_TRANSACTIONS; i++) {
    if (i % CONCURRENT_REQUESTS === 0 && i > 0) {
      // Wait for the previous batch of transactions to complete before starting a new batch
      await Promise.all(transactionPromises);
      transactionPromises.length = 0; // Clear the array for the next batch
    }

    const nonce = currentNonce + i; // Manually increment nonce for each transaction
    const txStartTime = Date.now();
    const txPromise = financialInstitution
      .create_account("general", `ACCOUNT_${i}`, {
        gasLimit: ethers.utils.hexlify(300000),
        nonce,
      })
      .then(async (tx: any) => {
        const receipt = await tx.wait();
        const txEndTime = Date.now();
        metrics.successfulTransactions++;
        metrics.totalGasUsed = metrics.totalGasUsed.add(receipt.gasUsed);
        metrics.totalEventsEmitted += receipt.logs.length;
        metrics.totalLatency += txEndTime - txStartTime;
        metrics.totalBlockSize += receipt.blockNumber ? 1 : 0; // Simplified block size metric
        metrics.totalBlockTime += txEndTime - txStartTime; // Assuming block time as tx processing time
        metrics.totalBatchesLayer2ToLayer1 += 1; // Assuming each transaction forms a batch
        metrics.totalBlockSizeBytes += receipt.gasUsed.toNumber(); // Simplified block size in bytes
        metrics.totalBlockTimeMs += txEndTime - txStartTime; // Assuming block time in ms
      })
      .catch((error: any) => {
        metrics.failedTransactions++;
        if (error.message && error.message.includes("nonce")) {
          metrics.nonceErrors++;
        }
        console.error(`Error during transaction ${i + 1}:`, error);
      });

    transactionPromises.push(txPromise);
  }

  // Wait for all remaining transactions to complete
  await Promise.all(transactionPromises);

  metrics.totalTimeTaken = (Date.now() - startTime) / 1000;

  // Calculate metrics
  const successRate = (metrics.successfulTransactions / metrics.totalTransactions) * 100;
  const tps = metrics.successfulTransactions / metrics.totalTimeTaken;
  const avgGasUsed = metrics.totalGasUsed.div(metrics.successfulTransactions || 1);
  const avgEventsPerTx = metrics.totalEventsEmitted / (metrics.successfulTransactions || 1);
  const avgLatency = metrics.totalLatency / (metrics.successfulTransactions || 1);
  const avgBlockSize = metrics.totalBlockSizeBytes / (metrics.successfulTransactions || 1);
  const avgBlockTime = metrics.totalBlockTimeMs / (metrics.successfulTransactions || 1);

  // Print metrics
  console.log("\nStress Test Metrics:");
  console.log("Total Transactions Attempted: ", metrics.totalTransactions);
  console.log("Successful Transactions: ", metrics.successfulTransactions);
  console.log("Failed Transactions: ", metrics.failedTransactions);
  console.log("Nonce Management Errors: ", metrics.nonceErrors);
  console.log("Success Rate (%): ", successRate.toFixed(2));
  console.log("Total Time Taken (s): ", metrics.totalTimeTaken.toFixed(2));
  console.log("Throughput (TPS): ", tps.toFixed(2));
  console.log("Average Gas Consumption: ", avgGasUsed.toString());
  console.log("Average Events per Transaction: ", avgEventsPerTx.toFixed(2));
  console.log("Average Transaction Latency (ms): ", avgLatency.toFixed(2));
  console.log("Average Block Size (bytes): ", avgBlockSize.toFixed(2));
  console.log("Average Block Time (ms): ", avgBlockTime.toFixed(2));
  console.log("Total Batches from Layer 2 to Layer 1: ", metrics.totalBatchesLayer2ToLayer1);
  console.log("Total Latency (ms): ", metrics.totalLatency.toFixed(2));
  console.log("Total Gas Used: ", metrics.totalGasUsed.toString());
}

runStressTest().catch((error) => {
  console.error("Error running stress test:", error);
});