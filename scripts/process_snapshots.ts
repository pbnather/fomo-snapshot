import * as fs from 'node:fs/promises';
import { ethers } from 'hardhat';
import { Staker, StakerPoints } from '../utils/constants';
import { loadData, saveSnapshotAsJson } from '../utils/helpers';
import { parseEther } from 'ethers';

require('dotenv').config();

function processStakers(snpashotBlock: bigint, lp: Staker[]): StakerPoints[] {
    const stakerPoints: StakerPoints[] = [];

    let sumOfPoints = BigInt(0);

    for (const staker of lp) {
        let totalPoints = BigInt(0);
        let previousBlock = BigInt(staker.actions[0].block);
        let currentStaked = BigInt(staker.actions[0].amount);
        // console.log(0)
        // console.log(staker.actions[0])

        // console.log(staker.address)
        for (let i = 1; i < staker.actions.length; i++) {
            // console.log(i)
            // console.log(staker.actions[i])
            const action = staker.actions[i];
            const points = currentStaked * (BigInt(action.block) - previousBlock);
            // console.log(points)
            totalPoints = totalPoints + BigInt(points);
            currentStaked += BigInt(action.amount);
            // console.log(currentStaked)
            previousBlock = BigInt(action.block);
        }

        const points = currentStaked * (snpashotBlock - previousBlock);
        totalPoints += points;
        sumOfPoints += totalPoints;

        stakerPoints.push({ address: staker.address, points: totalPoints });
    }

    console.log(`Total points for stakers: ${parseEther(sumOfPoints.toString())}`);
    return stakerPoints;
}


async function saveArrays(addressesData: string[], amountsData: string[]) {
    let addressJson = JSON.stringify(addressesData);
    let amountsJson = JSON.stringify(amountsData);

    let adressesPath = `data/mpx_final_snapshot_addresses.json`;
    await fs.writeFile(adressesPath, addressJson);

    let amountsPath = `data/mpx_final_snapshot_amounts.json`;
    await fs.writeFile(amountsPath, amountsJson);
    console.log(`Snapshots saved in arrays!`);
}


async function main() {
    let multiplier = process.env.LP_MULTIPLIER;
    let snapshotBlock = await ethers.provider.getBlockNumber();
    console.log("Snapshot block:", snapshotBlock);

    let snapshotData = await loadData(snapshotBlock)

    let lpPoints = processStakers(BigInt(snapshotBlock), snapshotData.lp);
    let fomoPoints = processStakers(BigInt(snapshotBlock), snapshotData.fomo);

    
    console.log(`Merging results with LP multiplier of ${multiplier}`)
    
    let lpPointsMultiplied = lpPoints.map((staker) => {
        return { address: staker.address, points: staker.points * BigInt(multiplier!) }
    });

    await saveSnapshotAsJson(`lp_points_${snapshotBlock}`, lpPoints.sort((a, b) => Number(b.points - a.points)));
    await saveSnapshotAsJson(`lp_points_multiplied_${snapshotBlock}`, lpPoints.sort((a, b) => Number(b.points - a.points)));
    await saveSnapshotAsJson(`fomo_points_${snapshotBlock}`, fomoPoints.sort((a, b) => Number(b.points - a.points)));

    // Merge lpPointsMultiplied and fomoPoints into one array
    const mergedPoints = [...lpPointsMultiplied, ...fomoPoints];

    // Create an object to store the merged points for each address
    const mergedPointsMap: { [address: string]: bigint } = {};

    // Iterate over the mergedPoints array and add up the points for each address
    for (const point of mergedPoints) {
        const { address, points } = point;
        if (mergedPointsMap[address]) {
            mergedPointsMap[address] += points;
        } else {
            mergedPointsMap[address] = points;
        }
    }

    // Create an array from the mergedPointsMap
    const mergedPointsArray = Object.entries(mergedPointsMap).map(([address, points]) => ({ address, points }));

    await saveSnapshotAsJson(`final_mul_${multiplier}_${snapshotBlock}`, mergedPointsArray.sort((a, b) => Number(b.points - a.points)));

    console.log(mergedPointsArray.reduce((acc, curr) => { return {address: 'Total', points: acc.points + curr.points }  }), { address: 'Total', points: BigInt(0) });
    console.log("SUCCESS")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
