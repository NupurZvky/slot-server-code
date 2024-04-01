
export function checkFreeSpinData(bonusInfoList: any) {
    return bonusInfoList.find((bonus: any) => bonus.bonusName === "BonusFreeSpins") || false;
}

export function checkBaseLockFeature(bonusInfoList: any) {
    return bonusInfoList.find((bonus: any) => bonus.bonusName === "BaseLockFeature") || false;
}