# FOMO Snapshot

Create snapshot of FOMO and FOMO-USDC LP stakers, including:
- FOMO-USDC LP in IncentivesController (V1)
- FOMO-USDC LP in TokenIncentivesController (V2)
- FOMO in FomoIncentivesController (V1)
- FOMO in TokenEmissionsController (V2)

## Usage

0. Run `yarn`.
1. Create `.env` file based on `.env.example`. Few notes of consideration:
    - `SNAPSHOT_BLOCK` is a block at which snapshot will happen.
    - `NODE_URL` is Base archive node URL, eg. using Alchemy.
    - `LP_MULTIPLIER` is factor by which FOMO-USDC LP should be scaled.
    - `AIRDROP_AMOUNT` is amount of airopped tokens.
2. Run snapshot scripts in any order:
    - `yarn snapshot:lp`
    - `yarn snapshot:fomo`
3. Run processing script:
    - `yarn snapshot:process`

Scripts will produce files in `/data` folder. 
File called `/data/<SNAPSHOT_BLOCK>/<LP_MULTIPLIER>/final.json` is final airdrop data.
Other files are intermiedaite snapshot data etc.
