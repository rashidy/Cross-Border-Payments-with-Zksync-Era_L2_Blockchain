import { HardhatUserConfig } from "hardhat/config";
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
  zksolc: {
    version: "1.5.4",
    compilerSource: "binary",
    settings: {},
  },
  defaultNetwork: "zkSyncTestnet",
  networks: {
    zkSyncTestnet: {
      url: "https://sepolia.era.zksync.dev", // zkSync RPC URL for Sepolia testnet
      ethNetwork: "https://rpc.sepolia.org", // L1 Ethereum network (Sepolia)
      zksync: true,
    },
  },
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

export default config;
