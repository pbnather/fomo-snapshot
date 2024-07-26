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
        for (let i = 1; i < staker.actions.length; i++) {
            const action = staker.actions[i];
            const points = currentStaked * (BigInt(action.block) - previousBlock);
            totalPoints = totalPoints + BigInt(points);
            currentStaked += BigInt(action.amount);
            previousBlock = BigInt(action.block);
        }
        // add points since last action to snapshot block
        const points = currentStaked * (snpashotBlock - previousBlock);
        totalPoints += points;
        sumOfPoints += totalPoints;

        stakerPoints.push({ address: staker.address, points: totalPoints });
    }

    console.log(`Total points for stakers: ${parseEther(sumOfPoints.toString())}`);
    return stakerPoints;
}

async function main() {
    let airdropAmount = BigInt(process.env.AIRDROP_AMOUNT!);
    let multiplier = BigInt(process.env.LP_MULTIPLIER!);
    let snapshotBlock = await ethers.provider.getBlockNumber();
    console.log("Snapshot block:", snapshotBlock);
    console.log("LP Mulitplier:", multiplier);
    console.log("Airdrop amount:", airdropAmount);

    let snapshotData = await loadData(snapshotBlock)

    let lpPoints = processStakers(BigInt(snapshotBlock), snapshotData.lp);
    let fomoPoints = processStakers(BigInt(snapshotBlock), snapshotData.fomo);

    
    console.log(`Merging results with LP multiplier of ${multiplier}`)
    
    let lpPointsMultiplied = lpPoints.map((staker) => {
        return { address: staker.address, points: staker.points * multiplier * (10n ** 18n) }
    });

    await saveSnapshotAsJson(snapshotBlock, `lp_points`, lpPoints.sort((a, b) => Number(b.points - a.points)), multiplier.toString());
    await saveSnapshotAsJson(snapshotBlock, `lp_points_mul`, lpPointsMultiplied.sort((a, b) => Number(b.points - a.points)), multiplier.toString());
    await saveSnapshotAsJson(snapshotBlock, `fomo_points`, fomoPoints.sort((a, b) => Number(b.points - a.points)), multiplier.toString());

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

    mergedPointsArray.sort((a, b) => Number(b.points - a.points))
    
    await saveSnapshotAsJson(snapshotBlock, `points_all`, mergedPointsArray, multiplier.toString());
    
    let total = mergedPointsArray.reduce((acc, curr) => { return {address: 'Total', points: acc.points + curr.points }})
    console.log('Total', total.points)

    let percentPointsArray = mergedPointsArray.map((point) => {
        let percent = (point.points * (10n ** 18n)) / total.points
        return { address: point.address, points: percent }
    })

    await saveSnapshotAsJson(snapshotBlock, `points_percent`, percentPointsArray, multiplier.toString());
    
    let airdropArray = percentPointsArray.map((point) => {
        let airdrop = (point.points * airdropAmount) / (10n ** 18n)
        return { address: point.address, amount: airdrop }
    })
    
    airdropArray.filter((point) => point.amount > 0n)
    
    await saveSnapshotAsJson(snapshotBlock, `final`, airdropArray, multiplier.toString());
    console.log("SUCCESS")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
