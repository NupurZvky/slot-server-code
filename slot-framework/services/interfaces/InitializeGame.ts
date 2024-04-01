export interface InitializeGameRequestData{
    method:string;
    params: {
        sessionId: string
    }
}
export interface InitializeGameResponseData{
    sessionId:string;
    gameMode: string;
    balance: number;
    freeBalance: number;
    params: ParamsInterface;
    data:DataInterface;
    casinoData:CasinoDataInterface;
    maxWinnings:number;
    sessionExpirationTimeoutSeconds:number;
    gameRTP:number;
    gameRTPUP:string;
    gameRTPJP:number;
    currencyId:string;
    freePlaysData:FreePlayInterface;
    jackpotsInfo:JakePotInterface[];
    method:string;
}

export interface ParamsInterface{
    payTable:[string, {
        id: number;
        values:{
            "1": number
            "2": number
            "3": number
            "4": number
            "5": number  
        }
    }][];
    responseHistory : {
        bet:number;
        method:string;
        playId: number;
        sessionId:string;
    }[];
    noPrizeReelLayout: number [];
    lineLayout: number [][];
    betDivisor:number;
    0: {
        bonusInfo: {
                bonusName: string;
                missionDetails: {
                    activeid: number;
                    all_mission_done: boolean;
                    missions: {
                        id: number;
                        goal: number;
                        progress: number;
                        status: string;
                }[]
            }
        }[]
    },
    betPerLine: number[];
    betPerLineDefault: number;
    autoPlayList: number[];
    autoPlayDefault: 10;
    currencyPrefix: string;
    currencySuffix: string;
    currencyDecimalPlaces: number;
    lastChanceGambleEnabled: boolean;
}
export interface DataInterface{
    bettingParameters: {
        betPerLineDefault: number;
        denomination: number;   
        lines: number;
    },
    brokenData: {
        data: {
            CurrentCount:number;
            freeSpinCount:number;
            freegamePresent: boolean;
            freegameAvail: boolean;
            AfterBrokenSpinsRemaining: string;
        }
    }
}
export interface CasinoDataInterface{}
export interface FreePlayInterface{}
export interface JakePotInterface{
    jackpot_id: number;
    name: string;
    currency_id: string;
    progressive_accumulated: number;
    details: string;
    rtp_jp: number;
    progressive_accumulated_in_session_currency: number;
    progressive: boolean;
    seeding: number [];
    seeding_in_session_currency: number [];
    contribution: number [];
}