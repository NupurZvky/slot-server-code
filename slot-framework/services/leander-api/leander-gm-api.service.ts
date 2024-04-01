import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { GameEventsManager, IGameEvent } from '../events/eventsManager';
import { GameEvents } from '../events/gameEvents';
import { EVENT_TYPE } from './constants';
import { ServerCommunicationService } from '../server-communication/server-communication.service';
import { BalanceUpdateInterface } from '../interfaces/LeanderAPI';

@Injectable({
  providedIn: 'root'
})
export class LeanderGmApiService {

  leanderAPI:any;
  sessionToken : string;
  constructor(private gameEventsManager:GameEventsManager,private server_com_obj: ServerCommunicationService ) { 
    this.gameEventsManager.addListener(GameEvents.PRE_LOADING, this.preLoading, this);
    this.gameEventsManager.addListener(GameEvents.LEANDER_API_OPEN_PLAY, this.openPlay, this);
    this.gameEventsManager.addListener(GameEvents.LEANDER_API_SETTLE_PLAY, this.settlePlay, this);
    this.gameEventsManager.addListener(GameEvents.LEANDER_API_CLOSE_PLAY, this.closePlay, this);
    this.gameEventsManager.addListener(GameEvents.LEANDER_API_IDLE_PLAY, this.idleGame, this);
    this.gameEventsManager.addListener(GameEvents.BALANCE_UPDATED_GAME, this.balanceUpdated, this);
    this.gameEventsManager.addListener(GameEvents.TOTAL_BET_UPDATED, this.totalBetUpdated, this);
    this.gameEventsManager.addListener(GameEvents.TOTAL_WIN_UPDATED, this.totalWinUpdated, this);
    this.gameEventsManager.addListener(GameEvents.PLAY_ID_UPDATED, this.playIdupdate, this);
  }
  
  initialize() {
    if (typeof((window as any).leanderGMApi) != 'undefined') {
      if ((window as any).leanderGMApi != null && (window as any).leanderGMApi.initialized) {
        console.log("--initialited---");
        this.leanderAPI = (window as any).leanderGMApi; 
        this.gameEventsManager.fireEvent({eventType: GameEvents.LENDER_API_INITIALIZED, data : {"is_visible":true}});
      }else{
        setTimeout(()=>{this.initialize() }, 1000);
      }
    } else {
      console.log("--Undefined result---");
      setTimeout(()=>{this.initialize() }, 1000); 
    }
  }

  initializeGamePublishEvent() {
    console.log("INITIALIZE EVENT");
    this.leanderAPI.publishEvent(this.leanderAPI.publications.INITIALIZED);
  }

  openPlay(){
    console.log("OPEN PLAY EVENT");
    this.leanderAPI.publishEvent(this.leanderAPI.publications.GAME_STATUS_CHANGED, this.leanderAPI.gameStates.OPEN_PLAY );
  }

  settlePlay(){
    console.log("SETTLE PLAY EVENT");
    this.leanderAPI.publishEvent(this.leanderAPI.publications.GAME_STATUS_CHANGED, this.leanderAPI.gameStates.SETTLE_PLAY );
  }

  closePlay(){
    console.log("CLOSE PLAY EVENT");
    this.leanderAPI.publishEvent(this.leanderAPI.publications.GAME_STATUS_CHANGED, this.leanderAPI.gameStates.CLOSE_PLAY );
  }

  idleGame(){
    console.log("IDLE EVENT");
    this.leanderAPI.publishEvent(this.leanderAPI.publications.GAME_STATUS_CHANGED, this.leanderAPI.gameStates.IDLE );
  }

  preLoading(event: IGameEvent) {
    if(event.data.event_type === EVENT_TYPE.PRELOAD_START){
      console.log("start game");
      this.leanderAPI.publishEvent(this.leanderAPI.publications.PRELOADING_STARTED);
    }
    else if(event.data.event_type === EVENT_TYPE.PRELOAD_PROCESSING){
      this.leanderAPI.publishEvent(this.leanderAPI.publications.PRELOADING_PROGRESS_UPDATED,event.data.progress);
    }
    else if(event.data.event_type === EVENT_TYPE.PRELOAD_END){
      console.log("end game");
      this.leanderAPI.publishEvent(this.leanderAPI.publications.PRELOADING_ENDED);
      // init call flow
      var subscribeInitConfirmation = this.leanderAPI.subscribeToEvent(
        this.leanderAPI.publications.INITIALIZED_CONFIRMED,() => {
          this.initializeGame(subscribeInitConfirmation);
        }
      );
      // publish init 
      this.initializeGamePublishEvent()

    }
    else{
      console.log("Error : Invalid type of Pre-load event");
    }
  }

  initializeGame(subscribeInitConfirmation: any) {
    this.sessionToken = this.leanderAPI.sessionData.sessionId;
    if (this.sessionToken) {
      // initGame API
      this.server_com_obj.initializeGame(this.sessionToken);
      this.leanderAPI.unsubscribeFromEvent( subscribeInitConfirmation );
    } else {
      setTimeout(()=>{this.initializeGame(subscribeInitConfirmation) }, 100);
    }
  }
  
  fullScreenMode(event: IGameEvent){
    if(event.data.screen_type == EVENT_TYPE.FULLSCREEN_ON){
      this.leanderAPI.publishEvent( this.leanderAPI.publications. FULLSCREEN_MODE_ON );
    }
    else if(event.data.screen_type == EVENT_TYPE.FULLSCREEN_OFF){
      this.leanderAPI.publishEvent( this.leanderAPI.publications. FULLSCREEN_MODE_OFF );
    }
    else{
      console.log("Error : Invalid mode of full screen");
    }
  }

  balanceUpdated(event: IGameEvent){
    console.log("BALANCE_UPDATED_GAME");
    this.leanderAPI.publishEvent(
      this.leanderAPI.publications.BALANCE_UPDATED_GAME,
      {
        balance: event.data.balance,
        free_balance: event.data.freeBalance
      }
    );
  }

  totalBetUpdated(event: IGameEvent){
    console.log("TOTALBET_UPDATED");
    this.leanderAPI.publishEvent(
      this.leanderAPI.publications.TOTALBET_UPDATED,
      event.data?.totalBet
    );
  }

  totalWinUpdated(event: IGameEvent){
    this.leanderAPI.publishEvent(
      this.leanderAPI.publications.TOTALWIN_UPDATED,
      event.data?.winAmount
    );
  }

  playIdupdate(event: IGameEvent){
    console.log("PLAY_ID_UPDATED")
    this.leanderAPI.setCurrentPlayId(event.data?.playId);
    this.leanderAPI.setActualPlayId(event.data?.playId);
  }

  sessionDataUpdate(){
    const subscribeToSessionIdEvent = this.leanderAPI.subscribeToEvent(
      this.leanderAPI.requestStatus.SESSION_DATA_UPDATED,
      (res:any)=>{
        var responseData = res.data;
        const sessionId = responseData.sessionId;
        console.log(sessionId)
        this.leanderAPI.unsubscribeFromEvent(subscribeToSessionIdEvent );
      }
      );
  }

  getDebugOptionId() {
    return this.leanderAPI.debugOptionId;
  }
}
