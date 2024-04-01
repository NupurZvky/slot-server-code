import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { InitializeGameRequestData, InitializeGameResponseData } from '../interfaces/InitializeGame';
import { GetJackPotsRequestData, GetJackPotsResponseData, } from '../interfaces/GetJackopots';
import { MatDialog } from '@angular/material/dialog';
import { SettlePlayRequestData, SettlePlayResponseData } from '../interfaces/SettlePlay';
import { OpenPlayRequestData, OpenPlayResponseData } from '../interfaces/OpenPlay';
import { SaveDataRequestData } from '../interfaces/SaveData';
import { GetBetResultRequestData, GetBetResultResponseData } from '../interfaces/GetBetResult';
import { ClosePlayRequestData, ClosePlayResponseData } from '../interfaces/ClosePlay';
import { METHOD_NAME } from '../methods';
import { GameEventsManager, IGameEvent } from '../events/eventsManager';
import { GameEvents } from '../events/gameEvents';
import { SignalControllerService } from '../signal-controller/signal-controller.service';
import { PlaceBetRequestData, PlaceBetResponseData } from '../interfaces/PlaceBet';
import { HandleErrorService } from './error-handling/handle-error.service';
import { StateManager } from '../gameLogic/StateManager';
import { checkFreeSpinData, checkBaseLockFeature } from './bonus-utils';
import { PreviousGameMessageComponent } from 'src/app/game/components/previous-game-message/previous-game-message.component';


@Injectable({
  providedIn: 'root'
})
export class ServerCommunicationService {

  sessionId: string;
  baseUrl: string;
  placeBetUrl: string;
  getBalanceUrl: string;
  notifyUrl: string;
  endGameUrl: string;
  endFreeGameUrl: string;
  playerId: number;
  lineLayoutLength: number;
  betAmount: number;
  isDebugModeOn: boolean = false;
  sequenceData?: string;
  isAutoPlay:boolean = false;
  isFreeSpinActivated:boolean = false;
  interruptGameResponse: any;
  isAutoPaused: boolean = false;
  settleSubscribe: any

  constructor(
    public MUIDialog: MatDialog,
    private dispatcher: GameEventsManager,
    private http: HttpClient,
    private signalController: SignalControllerService,
    private handleError: HandleErrorService,
    private stateManager: StateManager
  ) {
    const urlParams = new URLSearchParams(window.location.search);
    this.baseUrl = urlParams.get("serverAddress") ?? "";
    dispatcher.addListener(GameEvents.GAME_BET_RESULT_REQUEST, this.getBetResult, this);
    dispatcher.addListener(GameEvents.INITIALIZE_GAME_REQUEST, this.initializeGame, this);
    dispatcher.addListener(GameEvents.OPEN_PLAY_REQUEST, this.openPlay, this);
    dispatcher.addListener(GameEvents.PLACE_BET_REQUEST, this.placeBet, this);
    dispatcher.addListener(GameEvents.SETTLE_PLAY_REQUEST, this.settlePlay, this);
    dispatcher.addListener(GameEvents.GET_JACKPOTS_REQUEST, this.getJackpots, this);
    dispatcher.addListener(GameEvents.CLOSE_PLAY_REQUEST, this.closePlay, this);
    dispatcher.addListener(GameEvents.FREE_SPIN_SAVE_DATA, this.freeSpinSaveData, this);
    dispatcher.addListener(GameEvents.FREE_SPIN_SETTLE_DATA, this.freeSpinSettleData, this);
      
  }

  setAutoPlayValue(value: boolean) {
    this.isAutoPlay = value;
    this.isAutoPaused = true;
  }

  getAutoPlayValue() {
    return this.isAutoPlay;
  }

  handlePreviousGameMessage() {
    const dialogRef = this.MUIDialog.open(PreviousGameMessageComponent, {
      minHeight: '100vh',
      minWidth: '100vw',
    });
  }

  initializeGame(sessionId: string) {
    // @ts-expect-error
    window.leanderGMApi.gameOptions.regulatedMarket === "AB" ? (this.stateManager.shouldHaveAutoplayLimit = true ): (this.stateManager.shouldHaveAutoplayLimit = false);

    // @ts-expect-error
    window.leanderGMApi.gameOptions.regulatedMarket === "it" || window.leanderGMApi.gameOptions.regulatedMarket === "on" ? (this.stateManager.shouldHideAutoplay = false ): (this.stateManager.shouldHideAutoplay = true);
    // @ts-expect-error
    if (window.leanderGMApi.gameOptions.regulatedMarket === "it" || window.leanderGMApi.gameOptions.regulatedMarket === "on") {
      this.dispatcher.fireEvent({eventType: "HIDE_AUTOPLAY"});
    }
    const url = this.baseUrl;
    this.sessionId = sessionId;
    const body_obj: InitializeGameRequestData[] = [
      {
        method: METHOD_NAME.INITIALIZE_GAME,
        params: {
          sessionId: sessionId
        }
      }
    ]
    const body = JSON.stringify(body_obj);
    const response = this.http.post<InitializeGameResponseData>(url, body)
    response?.subscribe(
      (response: any) => {
        if (this.handleError.displayError(response[0])) {
          // Handle the response data here
          this.signalController.setInitGameData(response[0]);
          this.lineLayoutLength = response[0].params.lineLayout.length
          this.interruptGameResponse = response[0]?.params?.responseHistory;
          if(this.interruptGameResponse)
          {
            this.handlePreviousGameMessage()
            this.betAmount = this.interruptGameResponse[0]?.bet
            this.playerId = this.interruptGameResponse[0]?.playerId
            const lastCallMethod = this.interruptGameResponse[this.interruptGameResponse.length-1].method
            
            if(lastCallMethod === METHOD_NAME.INITIALIZE_GAME)
              this.openPlay(this.sessionId, this.betAmount, this.lineLayoutLength,false )
            else if(lastCallMethod === METHOD_NAME.OPEN_PLAY)
              this.saveData(this.sessionId)
            else if(lastCallMethod === METHOD_NAME.SAVE_DATA)
              this.placeBet(this.sessionId)
            else if (lastCallMethod === METHOD_NAME.PLACE_BET)
              this.getBetResult(this.sessionId)
            else if (lastCallMethod === METHOD_NAME.GET_BET_RESULT) {
              const bonusInfo = checkFreeSpinData(this.interruptGameResponse[1]?.params[0]?.bonusInfo)
              if (bonusInfo) {
                const currentCount = response[0]?.data?.bettingParameters?.currentCount
                const spinsRemaining = response[0]?.data?.bettingParameters?.spinsRemaining
                this.isFreeSpinActivated = true;
                this.dispatcher.fireEvent({ eventType: GameEvents.FREE_SPIN_ACTIVATED, data: { isActive: this.isFreeSpinActivated } });
                this.dispatcher.fireEvent({ eventType: GameEvents.BROKEN_GAME_FREE_SPIN_RESPONSE_RECEIVED, data: { data: this.interruptGameResponse[1], freeSpinCountDetails: { currentCount: currentCount, spinsRemaining: spinsRemaining } } });
              }
              else {
                this.settlePlay(sessionId, this.playerId)
              }
            }
            else if(lastCallMethod === METHOD_NAME.SETTLE_PLAY_URL)
              this.closePlay(this.sessionId)
            else
              console.log('ERROR : No Method Found !!!!');  
          }
        }
      });
  }

  openPlay(sessionID: string, betAmount: number, payLines: number, isDebugMode: boolean = false, isAutoPlay: boolean = false, sequenceData?: string) {
    if (this.isFreeSpinActivated || this.stateManager.isBonusActive) {
      this.placeBet(sessionID)
      return;
    }
    this.betAmount = betAmount
    this.lineLayoutLength = payLines
    this.isDebugModeOn = isDebugMode
    this.sequenceData = sequenceData
    this.isAutoPlay = isAutoPlay
    this.dispatcher.fireEvent({ eventType: GameEvents.LEANDER_API_OPEN_PLAY, data: {} });
    const url = this.baseUrl;
    const body_obj: OpenPlayRequestData[] = [
      {
        method: METHOD_NAME.OPEN_PLAY,
        params: {
          sessionId: sessionID
        }
      }
    ]
    const body = JSON.stringify(body_obj);
   
    const response = this.http.post(url, body);
    response?.subscribe(
      async (response: any) => {
        console.log("**********", response);
        if (this.handleError.displayError(response[0])) {
          this.signalController.setOpenPlayData(response[0]);
          await this.saveData(sessionID)
          this.playerId = response[0]?.playId
          this.dispatcher.fireEvent({ eventType: GameEvents.BALANCE_UPDATED_GAME, data: { balance: response[0]?.balance, freeBalance: response[0]?.freeBalance } });
          this.dispatcher.fireEvent({ eventType: GameEvents.TOTAL_BET_UPDATED, data: { totalBet: this.lineLayoutLength * this.betAmount } });
          this.dispatcher.fireEvent({ eventType: GameEvents.PLAY_ID_UPDATED, data: { playId: response[0]?.playId } });
          return response;
        }
      });
  }

  saveData(sessionID: string) {
    const url = this.baseUrl;
    const body_obj: SaveDataRequestData[] = [
      {
        method: METHOD_NAME.SAVE_DATA,
        params: {
          data: {
            featureBet: 0,
            denomination: 1,
            betPerLine: this.betAmount,
            lines: this.lineLayoutLength
          },
          name: "bettingParameters",
          sessionId: sessionID,
        }
      }
    ]
    const body = JSON.stringify(body_obj);
    const response = this.http.post<OpenPlayResponseData>(url, body)
    response?.subscribe(
      async (response: any) => {
        if (this.handleError.displayError(response[0])) {
          await this.placeBet(sessionID)
        }
      });
  }

  placeBet(sessionID: string) {
    console.log("place bet")
    if (this.isFreeSpinActivated || this.stateManager.isBonusActive) {
      this.getBetResult(sessionID)
      return;
    }
    const url = this.baseUrl;
    const body_obj: PlaceBetRequestData[] = [
      {
        method: METHOD_NAME.PLACE_BET,
        params: {
          bet: Number((this.lineLayoutLength * this.betAmount).toPrecision(3)),
          params: {
            linesPlayed: this.lineLayoutLength
          },
          sessionId: sessionID,
          type: "spin"
        }
      }
    ]
    const body = JSON.stringify(body_obj);
    const response = this.http.post<PlaceBetResponseData>(url, body)
    response?.subscribe(
      async (response: any) => {
        if (this.handleError.displayError(response[0])) {
          this.signalController.setPlaceBetData(response[0]);
          await this.getBetResult(sessionID)
        }
      });
  }

  getBetResult(sessionId: string) {
    console.log("get bet result")
    if (this.stateManager.isBonusActive) {
      console.log(this.stateManager.currentJackpotSpinsData.freeSpinList);
      console.log(this.stateManager.currentJackpotSpinsData.count);
      const paramsData = [{...this.stateManager.currentJackpotSpinsData.freeSpinList[this.stateManager.currentJackpotSpinsData.count][0], totalBet: this.lineLayoutLength * this.betAmount}]
      const fsSpin = {params : paramsData}
      console.log(fsSpin)
      console.log("game response received outside")
      this.dispatcher.fireEvent({ eventType: GameEvents.GAME_RESPONSE_RECIEVED, data: fsSpin });
      return;
    }

    if (this.isFreeSpinActivated) {
      const count = this.stateManager.currentFreeSpinsData.count
      const paramsData = [{...this.stateManager.currentFreeSpinsData.freeSpinList[this.stateManager.currentFreeSpinsData.count][0], totalBet: this.lineLayoutLength * this.betAmount}]
      const fsSpin = {params : paramsData}
      console.log(fsSpin)
      console.log("game response received outside")
      this.dispatcher.fireEvent({ eventType: GameEvents.GAME_RESPONSE_RECIEVED, data: fsSpin });
      //this.signalController.setGetBetResultData(fsSpin);
      return;
    }
    const url = this.baseUrl;
    let body_obj: GetBetResultRequestData[] = [{
      method: METHOD_NAME.GET_BET_RESULT,
      params: {
        sessionId: sessionId,
        debug: this.isDebugModeOn ? { random: this.sequenceData } : undefined
      }
    }]
    const body = JSON.stringify(body_obj);

    const response = this.http.post<GetBetResultResponseData>(url, body);
    response.subscribe(async (response: any) => {
      if (this.handleError.displayError(response[0])) {
        console.log("game response received inside")
        response[0].params[0]["totalBet"] = this.lineLayoutLength * this.betAmount;
        this.dispatcher.fireEvent({ eventType: GameEvents.GAME_RESPONSE_RECIEVED, data: response[0] });
        this.signalController.setGetBetResultData(response[0]);
        const bonusInfo = checkFreeSpinData(response[0]?.params[0]?.bonusInfo)
        const bonusInfoBaseLock = checkBaseLockFeature(response[0]?.params[0]?.bonusInfo)
        console.log(bonusInfoBaseLock);
        console.log(bonusInfo)
        if (bonusInfo) {
          console.log("free spin activated")
          this.isFreeSpinActivated = true;
          this.dispatcher.fireEvent({ eventType: GameEvents.FREE_SPIN_ACTIVATED, data: {isActive : this.isFreeSpinActivated} });
        }
        else
        {
          if (bonusInfoBaseLock) {
            this.dispatcher.fireEvent({ eventType: GameEvents.BONUS_BASE_LOCK_INFO, data: { 'bonusInfoBaseLock': bonusInfoBaseLock } });
          }
          await this.settlePlay(sessionId, response[0].playId)
        }
      }
      else {
        this.dispatcher.fireEvent({ eventType: GameEvents.PLAY_STOP, data: { } });
      }
    });
  }

  settlePlay(sessionID: string, playerId?: number) {
    console.log("settle play")
    this.dispatcher.fireEvent({ eventType: GameEvents.LEANDER_API_SETTLE_PLAY, data: {} });
    const url = this.baseUrl;
    const body_obj: SettlePlayRequestData[] = [
      {
        method: METHOD_NAME.SETTLE_PLAY_URL,
        params: {
          sessionId: sessionID,
          playId: playerId
        }
      }
    ]
    const body = JSON.stringify(body_obj);
    // @ts-expect-error
    this.settleSubscribe = window.leanderGMApi.subscribeToEvent(
      // @ts-expect-error
      window.leanderGMApi.requestStatus.REQUEST_COMPLETED, 
      this.onSettleSuccess.bind(this)
      );
    //@ts-expect-error
    window.leanderGMApi.sendRequest(body_obj);
    // const response = this.http.post(url, body);
    // response.subscribe(async (response: any) => {
    //   if (this.handleError.displayError(response[0])) {
       
    //   }
    // });
  }

  closePlay(sessionID: string) {
    console.log("close play")
    this.dispatcher.fireEvent({ eventType: GameEvents.LEANDER_API_CLOSE_PLAY, data: {} });
    const url = this.baseUrl;
    const body_obj: ClosePlayRequestData[] = [
      {
        method: METHOD_NAME.CLOSE_PLAY,
        params: {
          sessionId: sessionID,
          playId: this.playerId
        }
      }
    ]
    const body = JSON.stringify(body_obj);
    const response = this.http.post<ClosePlayResponseData>(url, body);
    response.subscribe(async (response: any) => {
      if (this.handleError.displayError(response[0])) {
        console.log(this.isAutoPlay);
        if(this.isAutoPlay) {
          this.dispatcher.fireEvent({ eventType: GameEvents.AUTOPLAY_ROUND, data: {} });
        } else if (this.isAutoPaused) {
          this.dispatcher.fireEvent({ eventType: GameEvents.AUTOPLAY_DEFAULT, data: {} });
          this.isAutoPaused = false;
        }
      }
    });
  }

  getJackpots(sessionID: string) {
    const url = this.baseUrl;
    const body_obj: GetJackPotsRequestData[] = [
      {
        method: METHOD_NAME.SETTLE_PLAY_URL,
        params: {
          sessionId: sessionID,
        }
      }
    ]
    const body = JSON.stringify(body_obj);
    const response = this.http.post<GetJackPotsResponseData>(url, body);
    response.subscribe((response: any) => {
      if (this.handleError.displayError(response[0])) {
        console.log("--get-jack-pot--", response)
      }
    });
  }

  freeSpinSaveData(event: IGameEvent) {
    const url = this.baseUrl;
    const body_obj: SaveDataRequestData[] = [
      {
        method: METHOD_NAME.SAVE_DATA,
        params: {
          data: {
            featureBet: 0,
            denomination: 1,
            betPerLine: this.betAmount,
            lines: this.lineLayoutLength,
            currentCount: this.stateManager.currentFreeSpinsData.cantFreeSpins - this.stateManager.currentFreeSpinsData.count,
            spinsRemaining: this.stateManager.currentFreeSpinsData.count
          },
          name: "bettingParameters",
          sessionId: this.sessionId,
        }
      }
    ]
    const body = JSON.stringify(body_obj);
    const response = this.http.post<OpenPlayResponseData>(url, body)
    response.subscribe((response: any) => {
      if (this.handleError.displayError(response[0])) {
        console.log(response[0])
      }
    });
  }

  freeSpinSettleData(event: IGameEvent) {
    this.dispatcher.fireEvent({ eventType: GameEvents.LEANDER_API_SETTLE_PLAY, data: {} });
    const url = this.baseUrl;
    const body_obj: SettlePlayRequestData[] = [
      {
        method: METHOD_NAME.SETTLE_PLAY_URL,
        params: {
          sessionId: this.sessionId,
          playId: this.playerId
        }
      }
    ]
    const body = JSON.stringify(body_obj);
     // @ts-expect-error
    this.settleSubscribe = window.leanderGMApi.subscribeToEvent(
      // @ts-expect-error
      window.leanderGMApi.requestStatus.REQUEST_COMPLETED, 
      this.onSettleSuccess.bind(this)
      );
       //@ts-expect-error
    window.leanderGMApi.sendRequest(body_obj);
    // const response = this.http.post<SettlePlayResponseData>(url, body);
    // response.subscribe((response: any) => {
    //   if (this.handleError.displayError(response[0])) {
     
    //   }
    // });
  }

  onSettleSuccess(event: any) {
    const response = event.data;
    // @ts-expect-error
    window.leanderGMApi.unsubscribeFromEvent(this.settleSubscribe);
    console.log(event);
    if (this.isFreeSpinActivated) {
      this.dispatcher.fireEvent({ eventType: GameEvents.SETTLE_PLAY_RESPONSE, data: response[0] });
      this.dispatcher.fireEvent({ eventType: GameEvents.BALANCE_UPDATED_GAME, data: { balance: response[0]?.balance, freeBalance: response[0]?.freeBalance } });
      this.signalController.setSettlePlayResult(response[0]);
      // free spin flow process complete
      this.isFreeSpinActivated = false;
      this.dispatcher.fireEvent({ eventType: GameEvents.FREE_SPIN_ACTIVATED, data: {isActive : this.isFreeSpinActivated} });
      this.closePlay(this.sessionId)
    } else {

      this.dispatcher.fireEvent({ eventType: GameEvents.SETTLE_PLAY_RESPONSE, data: response[0] });
      this.signalController.setSettlePlayResult(response[0]);
      this.closePlay(this.sessionId);
      this.dispatcher.fireEvent({ eventType: GameEvents.BALANCE_UPDATED_GAME, data: { balance: response[0]?.balance, freeBalance: response[0]?.freeBalance } });
    }
  }

}
