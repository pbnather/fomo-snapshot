export const TOKEN_INCENTIVES_CONTROLLER_ADDRESS_V1 = "0x9407f05De31B1Abf5dFD534f37aeb109f2de5609";
export const TOKEN_INCENTIVES_CONTROLLER_START_BLOCK_V1 = 13159258
export const TOKEN_INCENTIVES_CONTROLLER_ADDRESS_V2 = "0xaFbc149aDFc6169BDb81919CA1FFD4dcB5Ce720A";
export const TOKEN_INCENTIVES_CONTROLLER_START_BLOCK_V2 = 16226813

export const FOMO_INCENTIVES_CONTROLLER_ADDRESS_V1 = "0x638214d6E73fbFE22b6E9512413538d5e9d59ca6";
export const FOMO_INCENTIVES_CONTROLLER_START_BLOCK_V1 = 13812185
export const FOMO_INCENTIVES_CONTROLLER_ADDRESS_V2 = "0x132436f212407bAe77517bEA694393d07A2F797e";
export const FOMO_INCENTIVES_CONTROLLER_START_BLOCK_V2 = 16260984

export const INCREMENT = 1000;

export type StakerPoints = {
    address: string;
    points: bigint;
}

export type StakerAction = {
    amount: bigint;
    block: bigint;
}

export type Staker = {
    address: string;
    actions: StakerAction[];
    isContract: Boolean;
}
