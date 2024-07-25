import { HardhatUserConfig } from "hardhat/types";
import "@nomicfoundation/hardhat-toolbox";

require('dotenv').config();

// console.log(Number(process.env.BSC_SNAPSHOT_BLOCK))

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    hardhat: {
      forking: {
        url: process.env.BSC_NODE_URL || "",
        blockNumber: Number(process.env.BSC_SNAPSHOT_BLOCK)
      }
    },
  }
};

export default config;
