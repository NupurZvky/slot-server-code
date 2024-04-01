export interface PlaceBetRequestData{
    method: string;
    params: {
        bet:number;
        params:{
            linesPlayed:number;
        },
        sessionId:string;
        type:string;
    }
}

export interface PlaceBetResponseData{
    method: string
    balance: number
    sessionId: string
    playId: number
}