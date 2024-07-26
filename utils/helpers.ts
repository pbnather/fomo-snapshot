import { ethers } from "hardhat";
import { INCREMENT, Staker } from "./constants";
import tokenIncentivesControllerAbi from '../abi/TokenIncentivesController.json';
import { EventLog } from "ethers";
import * as fs from 'node:fs/promises';
const cliProgress = require('cli-progress');

(BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

export async function snapshotDeposits(snapshotBlock: number, incentivesAddress: string, startBlock: number, balances: { [id: string]: {
    amount: bigint,
    block: bigint
}[]; }): Promise<void> {
    // create a new progress bar instance and use shades_classic theme
    console.log("Processing Deposit events...");
    let mpxBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    let mpx = await ethers.getContractAt(
        tokenIncentivesControllerAbi,
        incentivesAddress,
        undefined);
    mpxBar.start(snapshotBlock - startBlock, 0);
    let filter = mpx.filters.Deposited();
    let increment = INCREMENT;

    try {
        for (var i = startBlock; i < snapshotBlock; i = i + increment + 1) {
            mpxBar.update(i + increment + 1 - startBlock);
            var end = i + increment;
            if (end >= snapshotBlock) end = snapshotBlock;
            var events = await retry(3, mpx.queryFilter(filter, i, end)) as EventLog[];
            events.forEach((event) => {
                let user: string = event.args.user;
                let amount: bigint = BigInt(event.args.amount);
                if (amount != BigInt(0)) {
                    balances[user] = balances[user] || [];
                    balances[user].push({ amount, block: BigInt(event.blockNumber) });
                }
            });
        }
        console.log("Events processed");
    } catch (e: any) {
        console.log(e.message);
        throw e;
    } finally {
        mpxBar.stop();
    }
}

export async function snapshotWithdrawals(snapshotBlock: number, incentivesAddress: string, startBlock: number, balances: { [id: string]: {
    amount: bigint,
    block: bigint
}[]; }): Promise<void> {
    // create a new progress bar instance and use shades_classic theme
    console.log("Processing Withdrawn events...");
    let mpxBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    let mpx = await ethers.getContractAt(
        tokenIncentivesControllerAbi,
        incentivesAddress,
        undefined);
    mpxBar.start(snapshotBlock - startBlock, 0);
    let filter = mpx.filters.Withdrawn();
    let increment = INCREMENT;

    try {
        for (var i = startBlock; i < snapshotBlock; i = i + increment + 1) {
            mpxBar.update(i + increment + 1 - startBlock);
            var end = i + increment;
            if (end >= snapshotBlock) end = snapshotBlock;
            var events = await retry(3, mpx.queryFilter(filter, i, end)) as EventLog[];
            events.forEach((event) => {
                let user: string = event.args.user;
                let amount: bigint = BigInt(event.args.amount) * BigInt(-1);
                if (amount != BigInt(0)) {
                    balances[user] = balances[user] || [];
                    balances[user].push({ amount, block: BigInt(event.blockNumber) });
                }
            });
        }
        console.log("Events processed");
    } catch (e: any) {
        console.log(e.message);
        throw e;
    } finally {
        mpxBar.stop();
    }
}

export async function saveHolders(balances: { [id: string]: {
    amount: bigint,
    block: bigint
}[]; }): Promise<Staker[]> {
    var mpxHolders: Staker[] = [];
    for (var key in balances) {
        balances[key].sort((a: { amount: bigint, block: bigint }, b: { amount: bigint, block: bigint }) => {
            if (a.block > b.block) return 1;
            else if (a.block < b.block) return -1;
            else return 0;
        })
        mpxHolders.push({ address: key, actions: balances[key], isContract: false });
    }

    return mpxHolders;
}

export async function retry<Type>(retries: number, promise: Promise<Type>): Promise<Type> {
    try {
        const result = await promise;
        return result;
    } catch (e: any) {
        console.log(e.message);
        console.log("Retrying...");
        if (retries > 0) {
            await new Promise(f => setTimeout(f, 10000));
            return retry(retries - 1, promise);
        } else {
            throw e;
        }
    }
}

export async function markContracts(accounts: Staker[]) {
    console.log("Marking contracts...")
    let progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(accounts.length, 0);
    try {
        for (var i = 0; i < accounts.length; i++) {
            progressBar.update(i + 1);
            let code = await ethers.provider.getCode(accounts[i].address);
            if (code != "0x") {
                accounts[i].isContract = true;
            }
        }
    } catch (err) {
        console.log(err);
    } finally {
        progressBar.stop();
    }
}

export async function saveSnapshotAsJson(snapshotBlock: number, name: string, data: any, multiplier?: string) {
    let ownersJson = JSON.stringify(data);
    try {
    if (multiplier) {
        await fs.mkdir(`data/${snapshotBlock}/${multiplier}`, { recursive: true });
    } else {
        await fs.mkdir(`data/${snapshotBlock}`, { recursive: true });
    }} catch (err) {
        console.log(err);
    }
    let path = multiplier ? `data/${snapshotBlock}/${multiplier}/${name}.json` : `data/${snapshotBlock}/${name}.json`;
    await fs.writeFile(path, ownersJson, { flag: 'w' });
    console.log(`Snapshot saved as ${path}`);
}

export async function loadData(snapshotBlock: number): Promise<{ fomo: Staker[], lp: Staker[]}> {
    var lpStakers: Staker[];
    var fomoStakers: Staker[];
    try {
        let path = `data/${snapshotBlock}/lp_token_incentives.json`;
        console.log(`Getting FOMO-USDC LP stakers from ${path}...`);
        let jsonHolders = await fs.readFile(path, 'utf8');
        lpStakers = JSON.parse(jsonHolders) as Staker[];
    } catch (err) {
        console.log(err)
        throw err;
    }

    try {
        let path = `data/${snapshotBlock}/fomo_token_incentives.json`;
        console.log(`Getting FOMO stakers from ${path}...`);
        let jsonHolders = await fs.readFile(path, 'utf8');
        fomoStakers = JSON.parse(jsonHolders) as Staker[];
    } catch (err) {
        console.log(err);
        throw err;
    }
    return { fomo: fomoStakers, lp: lpStakers };
}