export interface SaveDataRequestData{
    method:string;
    params: {
        data:{
            featureBet:number;
            denomination:number;
            betPerLine:number;
            lines: number;
            currentCount?: number;
            spinsRemaining?: number;
        },
        name:string;
        sessionId: string;
    }
}