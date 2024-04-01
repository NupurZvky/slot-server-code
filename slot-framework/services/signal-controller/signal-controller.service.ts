import { Injectable } from '@angular/core';
import { InitializeGameResponseData } from '../interfaces/InitializeGame';
import { GameEventsManager, IGameEvent } from '../events/eventsManager';
import { GameEvents } from '../events/gameEvents';
import { OpenPlayResponseData } from '../interfaces/OpenPlay';
import { PlaceBetResponseData } from '../interfaces/PlaceBet';
import { GetBetResultResponseData } from '../interfaces/GetBetResult';
import { SettlePlayResponseData } from '../interfaces/SettlePlay';

@Injectable({
  providedIn: 'root'
})
export class SignalControllerService {

  initGameResponse:InitializeGameResponseData
  openPlayResponse: OpenPlayResponseData
  placeBetResponse: PlaceBetResponseData
  getBetResultResponse: GetBetResultResponseData
  settlePlayResultResponse: SettlePlayResponseData
  
  balance:number;
  betAmount:number;
  lines:number;
  beforeWinAmount: number;
  afterWinAmount:number;
  totalWinAmount:number;
  bonusInfoLength: number;
  bonusInfo: any;
  
  constructor(private dispatcher: GameEventsManager) { 
    this.betAmount = 1.2;
    dispatcher.addListener(GameEvents.BET_AMOUNT_CHANGED, this.updateBetAmount, this);
  }

  updateBetAmount(event: IGameEvent){
    this.betAmount = event.data?.betAmount;
  }

  setInitGameData(response:InitializeGameResponseData) {
    this.initGameResponse = response
    if(response?.balance){
      this.balance = response?.balance;
      this.beforeWinAmount = response?.balance;
      this.lines = response?.params.lineLayout.length;
      this.betAmount = response?.params?.betPerLine[0];
      
      this.dispatcher.fireEvent({eventType: GameEvents.INITIALIZE_GAME_RESPONSE, data: {}});
      this.betAmount = response?.params?.betDivisor * response?.params?.betPerLine[2];
      this.dispatcher.fireEvent({eventType: GameEvents.BET_AMOUNT_CHANGED, data: {betAmount: this.betAmount}});
    }
  }

  setOpenPlayData(response:OpenPlayResponseData) {
    this.openPlayResponse = response
    this.balance = response?.balance;
    this.beforeWinAmount = response?.balance;
    this.dispatcher.fireEvent({eventType: GameEvents.OPEN_PLAY_RESPONSE, data: {}});
  }
  
  setPlaceBetData(response:PlaceBetResponseData) {
    this.placeBetResponse = response
    this.dispatcher.fireEvent({eventType: GameEvents.PLACE_BET_RESPONSE, data: {}});
  }

  setGetBetResultData(response:GetBetResultResponseData) {
    this.getBetResultResponse = response
    this.balance = response?.balance;
    this.bonusInfoLength = response?.params[0].bonusInfo.length;
    this.bonusInfo = response?.params[0].bonusInfo;
    this.dispatcher.fireEvent({ eventType: GameEvents.GAME_BET_RESULT_RESPONSE, data: {} });
  }

  setSettlePlayResult(response:SettlePlayResponseData) {
    this.settlePlayResultResponse = response
    this.balance = response?.balance;
    this.afterWinAmount = response?.balance
    this.totalWinAmount = this.afterWinAmount - this.beforeWinAmount
    console.log("Win Amount : ",this.totalWinAmount);    
    this.dispatcher.fireEvent({eventType: GameEvents.SETTLE_PLAY_RESPONSE, data: {}});
  }
}
