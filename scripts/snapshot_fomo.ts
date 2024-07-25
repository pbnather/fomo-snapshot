import { ethers } from "hardhat";
import * as fs from 'node:fs/promises';
import { FOMO_INCENTIVES_CONTROLLER_ADDRESS_V1, FOMO_INCENTIVES_CONTROLLER_ADDRESS_V2, FOMO_INCENTIVES_CONTROLLER_START_BLOCK_V1, FOMO_INCENTIVES_CONTROLLER_START_BLOCK_V2, Staker, StakerAction } from "../utils/constants";
import { markContracts, saveHolders, saveSnapshotAsJson, snapshotDeposits, snapshotWithdrawals } from "../utils/helpers";

var balances: { [id: string]: StakerAction[]; } = {}

async function main() {
    let snapshotBlock = await ethers.provider.getBlockNumber()
    console.log("Snapshot block:", snapshotBlock);
    let dataName = `fomo_token_incentives_${snapshotBlock}`;

    try {
        console.log(`Getting FOMO stakers from data/${dataName}.json...`);
        let jsonHolders = await fs.readFile(`data/${dataName}.json`, 'utf8');
        holders = JSON.parse(jsonHolders) as Staker[];
    } catch (err) {
        console.log("Getting FOMO stakers in V1");
        await snapshotDeposits(snapshotBlock, FOMO_INCENTIVES_CONTROLLER_ADDRESS_V1, FOMO_INCENTIVES_CONTROLLER_START_BLOCK_V1, balances);
        await snapshotWithdrawals(snapshotBlock, FOMO_INCENTIVES_CONTROLLER_ADDRESS_V1, FOMO_INCENTIVES_CONTROLLER_START_BLOCK_V1, balances);
        console.log("Getting FOMO stakers in V2");
        await snapshotDeposits(snapshotBlock, FOMO_INCENTIVES_CONTROLLER_ADDRESS_V2, FOMO_INCENTIVES_CONTROLLER_START_BLOCK_V2, balances);
        await snapshotWithdrawals(snapshotBlock, FOMO_INCENTIVES_CONTROLLER_ADDRESS_V2, FOMO_INCENTIVES_CONTROLLER_START_BLOCK_V2, balances);
        var holders: Staker[] = await saveHolders(balances);
        await markContracts(holders);
        await saveSnapshotAsJson(dataName, holders);
        console.log("SUCCESS")
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
