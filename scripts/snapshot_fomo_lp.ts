import { ethers } from "hardhat";
import * as fs from 'node:fs/promises';
import { Staker, StakerAction, TOKEN_INCENTIVES_CONTROLLER_ADDRESS_V1, TOKEN_INCENTIVES_CONTROLLER_ADDRESS_V2, TOKEN_INCENTIVES_CONTROLLER_START_BLOCK_V1, TOKEN_INCENTIVES_CONTROLLER_START_BLOCK_V2 } from "../utils/constants";
import { markContracts, saveHolders, saveSnapshotAsJson, snapshotDeposits, snapshotWithdrawals } from "../utils/helpers";

var balances: { [id: string]: StakerAction[]; } = {}

async function main() {
    let snapshotBlock = await ethers.provider.getBlockNumber()
    console.log("Snapshot block:", snapshotBlock);
    let dataName = `lp_token_incentives`;

    try {
        console.log(`Getting FOMO stakers from data/${snapshotBlock}/${dataName}.json...`);
        let jsonHolders = await fs.readFile(`data/${snapshotBlock}/${dataName}.json`, 'utf8');
        holders = JSON.parse(jsonHolders) as Staker[];
    } catch (err) {
        console.log("Getting FOMO-USDC LP stakers in V1");
        await snapshotDeposits(snapshotBlock, TOKEN_INCENTIVES_CONTROLLER_ADDRESS_V1, TOKEN_INCENTIVES_CONTROLLER_START_BLOCK_V1, balances);
        await snapshotWithdrawals(snapshotBlock, TOKEN_INCENTIVES_CONTROLLER_ADDRESS_V1, TOKEN_INCENTIVES_CONTROLLER_START_BLOCK_V1, balances);
        console.log("Getting FOMO-USDC LP stakers in V2");
        await snapshotDeposits(snapshotBlock, TOKEN_INCENTIVES_CONTROLLER_ADDRESS_V2, TOKEN_INCENTIVES_CONTROLLER_START_BLOCK_V2, balances);
        await snapshotWithdrawals(snapshotBlock, TOKEN_INCENTIVES_CONTROLLER_ADDRESS_V2, TOKEN_INCENTIVES_CONTROLLER_START_BLOCK_V2, balances);
        var holders: Staker[] = await saveHolders(balances);
        await markContracts(holders);
        await saveSnapshotAsJson(snapshotBlock, dataName, holders);
        console.log("SUCCESS")
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
