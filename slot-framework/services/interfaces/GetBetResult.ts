
interface Params{
    reelLayout?: number[];
    winningLines?: WinningLines;
    bonusInfo: {
            bonusName: BonusInfo[];
        }[];
    jackpotsInfo: number[];
    creditsWon?: number;
    debug?: {
        generatedSequence: string;
    };
    type: string;
    dummy?: boolean;
    gameVersion: string;
}

interface WinningLines {
    creditsWon: number;
    lines: Line[];
}

interface Line {
    count: number;
    matchPositions: number[];
    line: number;
    creditsWon: number;
    symbol: number;
}

export interface BonusInfo {
    bonusName: string
    bonuscant?: number;
    cantFreeSpins?: number;
    count?: number;
    creditsWon?: number
    freeSpinList?: FreeSpinList[][]
    matchAmmount?: number
    matchPositions?: number[]
    multiplier?: number
    symbol?: number
}
  
export interface FreeSpinList {
    bonusInfo: SubBonusInfo[];
    creditsWon: number;
    creditsWonAccumulated: number;
    reelLayout: number[]
    type: string;
    winningLines: SubWinningLines
}
  
export interface SubWinningLines {
    creditsWon: number;
    lines: any[];
}
  
export interface SubBonusInfo {
    multiplier?: number;
    bonusName: string;
    bonuscant: number;
    matchPositions?: number[]
    creditsWon?: number
    prize?: Prize[];
}

export interface Prize {
    nextLevel?: number;
    Mnr?: number;
}

export interface GetBetResultRequestData{
    method : string;
    params:{
        sessionId: string;
        debug?:{
          random ?: string;
        }
    }
}

export interface GetBetResultResponseData{
    sessionId: string;
    playId: number;
    balance: number;
    freeBalance: number;
    params: Params[];
    casinoData: object;
    freePlaysData: object;
    playingFreePlay: boolean;
    method: string;
}