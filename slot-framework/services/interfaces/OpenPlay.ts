export interface OpenPlayRequestData{
    method : string;
    params: {
        sessionId: string;
    }
}


export interface OpenPlayResponseData{
    sessionId: string;
    playId: number;
    balance: number;
    freeBalance: number;
    casinoData:object;
    method: string;
}