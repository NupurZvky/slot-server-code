export interface ClosePlayRequestData{
    method:string;
    params: {
        sessionId: string;
        playId:number;
    }
}

export interface ClosePlayResponseData{
    sessionId: string;
    casinoData: object;
    freePlaysData: object;
    method: string;
}