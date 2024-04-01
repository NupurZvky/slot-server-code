export interface GetJackPotsRequestData{
    method : string
    params: {
        sessionId: string;
    }
}

interface JackPotInfoInterface {
    currency_id:string,
    jackpot_id:number,
    name:string,
    progressive_accumulated:number
}
export interface GetJackPotsResponseData{
    jackpotsInfo:JackPotInfoInterface[];
    sessionId: string;
    method: string;
}