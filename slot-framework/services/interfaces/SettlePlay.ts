export interface SettlePlayRequestData{
    method:string;
    params: {
        sessionId:string;
        playId?:number;
    }
}

export interface SettlePlayResponseData{
    sessionId: string,
    playId: number;
    balance: number;
    freeBalance: number;
    maxWinningsExceeded: boolean;
    casinoData: object;
    method: string;
}