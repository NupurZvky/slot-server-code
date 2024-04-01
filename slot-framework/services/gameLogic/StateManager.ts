import { Injectable } from '@angular/core';
import { GameEventsManager } from '../events/eventsManager';
import { GameEvents } from '../events/gameEvents';
@Injectable({
    providedIn: 'root',
  })
export class StateManager {
    private _states = [
        "idle",
        "reel_spinning",
        "reel_stopped",
        "spaghetti",
        "freespins_intro",
        "bonus_intro",
        "jackpot_wheel",
        "bonus_outro",
        "freespins_outro",
        "autoplay",
        "bigwin",
        "bigwin2"
    ];
    private _currentState = 0;
    public currentSpinData: any;
    private currentWinData: any;
    public currentFreeSpinsData: any;
    public currentFreeSpinNumber: number;
    public initialFreeSpinWin: number = 0;
    public isFreeSpinsActive: boolean;
    public isFreeSpinJustWon: boolean;
    public isFreeSpinsJustEnded: boolean;
    public isBonusJustEnded: boolean;
    public isBonusActive: boolean;
    public isBonusJustWon: boolean;
    public currentJackpotSpinsData: any;
    public currentBonusLevel: number;
    public isAutoPlayActive = false;
    public shouldHaveAutoplayLimit = false;
    public shouldHideAutoplay = true;
    public autoplayCount: number = 0;

    private setupListeners() {
        this.dispatcher.addListener("UPDATE_GAME_STATE", this.updateCurrentState, this);
        this.dispatcher.addListener(GameEvents.INTENT_START_REEL_SPIN, this.startReelSpin, this);
        //this.dispatcher.addListener(GameEvents.REELS_SPIN_STOPPED, this.stoppedReelSpin, this);
    }
    private registeredHandlers = [this.showIdleState, this.startReelSpin, this.stoppedReelSpin, this.showSpaghetti, this.showFreeSpinsIntro, this.showBonusIntro, this.showJackpotWheel ,this.showBonusOutro, this.showFreeSpinsOutro, this.handleAutoPlay, this.showBigWin, this.showBigWinBonusAndFS];
    public get currentState () {
        return this._states[this._currentState];
    }

    private updateCurrentState(data?: any) {
        if (this._currentState === (this._states.length - 1)) {
            this._currentState = 0;
            const fn = this.registeredHandlers[this._currentState]?.bind(this);
            fn && fn(data);
            return;
        }
        this._currentState += 1;  
        const fn = this.registeredHandlers[this._currentState]?.bind(this);
        fn && fn(data);
    }
    public setToInitialState() {
        this._currentState = 0;
    }

    public setSpinData(data: any) {
        this.currentSpinData = data; 
        this.currentWinData = data.winningLines;

        if (this.currentSpinData.bonusInfo?.length && this.currentSpinData.bonusInfo[1]?.bonusName === "Scatter") {
            this.initialFreeSpinWin += this.currentSpinData.bonusInfo[1].creditsWon;
            const credits = this.currentWinData["creditsWon"];
            const totalAmount = credits ? credits + this.currentSpinData.bonusInfo[1].creditsWon : 0;
            this.currentWinData["creditsWon"] = totalAmount;
            const lineData: any = {};
            lineData["creditsWon"] = this.currentSpinData.bonusInfo[1].creditsWon;
            lineData["matchPositions"] = this.currentSpinData.bonusInfo[1].matchPositions;
            lineData["symbol"] = this.currentSpinData.bonusInfo[1].symbol;
            this.currentWinData.lines.push(lineData);
        }
    }

    constructor(private dispatcher: GameEventsManager) {
        this.setupListeners();
    }
    
    showIdleState() {
        if (this.isBonusJustEnded) {
            this.currentJackpotSpinsData = null;
        }
        if (!this.isFreeSpinsActive && !this.isBonusActive) {
            !this.isAutoPlayActive &&!this.isFreeSpinsJustEnded &&this.dispatcher.fireEvent({eventType: GameEvents.UPDATE_BALANCE, data: this.currentSpinData.creditsWon});
        } 
        if (this.isFreeSpinsJustEnded) {
            !this.isBonusJustEnded && this.dispatcher.fireEvent({eventType: GameEvents.UPDATE_REEL_STRIPS});
            !this.isAutoPlayActive && this.dispatcher.fireEvent({eventType: GameEvents.UPDATE_BALANCE, data: this.currentFreeSpinsData.freeSpinList[this.currentFreeSpinNumber - 1][0].creditsWonAccumulated + this.currentFreeSpinsData.freeSpinList[this.currentFreeSpinNumber - 1][0].creditsWon + this.initialFreeSpinWin});
            this.currentFreeSpinsData = null;
            this.currentFreeSpinNumber = 0;
            this.initialFreeSpinWin = 0;
        }
       
        // add a little delay before enabling the buttons again
        setTimeout(() => {
            this.dispatcher.fireEvent({eventType: GameEvents.PAUSE_ENABLE});
            if (!this.isFreeSpinsActive && !this.isBonusActive) {this.dispatcher.fireEvent({eventType: GameEvents.PLAY_ENABLE})};
        }, 200);
        setTimeout(() => {
            if (this.isBonusActive || this.isFreeSpinsActive) {
                // TODO: Calculate time for toggle and then dispatch this event
                this.dispatcher.fireEvent({eventType: "FREE_SPIN_PLAY_CLICK"});
            }
        }, 1200);
        if (this.currentWinData.lines?.length) {
            if (!this.isFreeSpinsActive && !this.isFreeSpinsJustEnded) {
                this.dispatcher.fireEvent({eventType: GameEvents.TOGGLE_WINS, data: this.currentSpinData.winningLines.lines});
            }     else {
                return;
            }
        } else {
            return;
        }
    }

    startReelSpin(data: any) {
        this.dispatcher.fireEvent({eventType: GameEvents.START_REEL_SPIN});
        this._currentState = 1;
        this.isFreeSpinsJustEnded = false;
        this.isBonusJustEnded = false;
        this.isFreeSpinJustWon = false;
        this.isBonusJustWon = false;
        this.dispatcher.fireEvent({ eventType: GameEvents.SET_WIN_AMOUNT, data: {winAmount: 0} });
    }

    stoppedReelSpin() {
        this.updateCurrentState();
    }

    showSpaghetti() {
        
        if(this.currentWinData.lines?.length) {
            this.dispatcher.fireEvent({eventType: "SHOW_SPAGHETTI", data: {lines: this.currentSpinData.winningLines.lines, bet: this.currentSpinData.totalBet}});
            if (this.isFreeSpinsActive) {
                this.dispatcher.fireEvent({eventType: "UPDATE_WINS_METER", data: {count:(this.initialFreeSpinWin || 0) + this.currentSpinData.winningLines.creditsWon + this.currentSpinData.creditsWonAccumulated , isJackpot: false}});
            } else {
                this.dispatcher.fireEvent({eventType: "UPDATE_WINS_METER", data: {count:(this.initialFreeSpinWin || 0) , isJackpot: false}});
                
                // in case of autoplay update the balance here itselft because game doesn't go into idle state
                if (this.isAutoPlayActive &&  this.currentSpinData.bonusInfo[2]?.bonusName !== "BonusFreeSpins") {
                    this.dispatcher.fireEvent({eventType: GameEvents.UPDATE_BALANCE, data: this.currentSpinData.creditsWon});
                } 
            }
            
        } else {
            this.updateCurrentState(null);
        }  
    }

    showFreeSpinsIntro() {
        // update data if retriggered
        if ( this.showFreeSpinsRetrigger()) {
            return;
        }
       
        if (this.currentSpinData.bonusInfo[2]?.bonusName === "BonusFreeSpins" && !this.isFreeSpinsActive) {
            this.currentFreeSpinsData = this.currentSpinData.bonusInfo[2];
            this.dispatcher.fireEvent({eventType: "INTENT_SHOW_FREE_SPINS_INTRO", data: {count: this.currentFreeSpinsData.count}});

            // show the initial count then start the count from zero
            this.currentFreeSpinsData.count = 0;
            this.currentFreeSpinNumber = 0;
            this.isFreeSpinsActive = true;
            this.isFreeSpinJustWon = true;
            // disable autoplay by default
            this.isAutoPlayActive = false;
            this.dispatcher.fireEvent({eventType: GameEvents.AUTO_PLAY_DISABLE}); //GameEvents.AUTO_PLAY_DISABLE
            this.dispatcher.fireEvent({eventType: "ENABLE_BUTTONS"});
            this.dispatcher.fireEvent({eventType: GameEvents.AUTO_PLAY_DISABLE});
            this.autoplayCount = 0;
            this.dispatcher.fireEvent({eventType: "SHOW_SPIN_METER", data: {count: this.currentFreeSpinsData.cantFreeSpins - this.currentFreeSpinNumber, isJackpot: false}});
            this.dispatcher.fireEvent({eventType: "UPDATE_WINS_METER", data: {count: this.initialFreeSpinWin || 0, isJackpot: false}});
        }
        else {
            this.updateCurrentState();
            return;
        }
    }
    showFreeSpinsRetrigger() {
        //2122222222410417000022391536300739301222190812272535000004160105350732172836030730392225243114003133020324460307283243013425022115184411271049262670700410324047093303261313303306050748202005434418040906492202201905363807342207
        if (this.currentSpinData.bonusInfo[1]?.bonusName === "FreeSpinsReTrigger" && this.isFreeSpinsActive) {
            this.initialFreeSpinWin += this.currentSpinData.bonusInfo[0].creditsWon;
            this.currentFreeSpinsData.cantFreeSpins = this.currentFreeSpinsData.cantFreeSpins + this.currentSpinData.bonusInfo[1]?.cantFreeSpins;
            this.dispatcher.fireEvent({eventType: "UPDATE_SPIN_METER", data: {count: this.currentFreeSpinsData.cantFreeSpins - this.currentFreeSpinNumber, isJackpot: false}});

            this.dispatcher.fireEvent({eventType: "INTENT_SHOW_FREE_SPINS_INTRO", data: {count: this.currentFreeSpinsData.count, isRetrigger: true}});

            // disable autoplay by default
            this.isAutoPlayActive = false;
            this.dispatcher.fireEvent({eventType: "ENABLE_BUTTONS"});
            this.autoplayCount = 0;
            return true;
        } else {
            return false
        }
    }

    showFreeSpinsOutro() {
        if (this.currentFreeSpinsData == null) {
            this.updateCurrentState();
            return;
        }
        if (this.currentFreeSpinsData?.count === this.currentFreeSpinsData?.freeSpinList.length) {
            if (this.isBonusActive) {
                this.updateCurrentState();
                return;
            }
            this.isFreeSpinsJustEnded = true;
            this.dispatcher.fireEvent({eventType: GameEvents.FREE_SPIN_SETTLE_DATA});
            this.dispatcher.fireEvent({eventType: "INTENT_SHOW_FREE_SPINS_OUTRO", data: this.currentFreeSpinsData.creditsWon + this.initialFreeSpinWin});
            this.isFreeSpinsActive = false;
            
            
            setTimeout(() => {
                this.dispatcher.fireEvent({eventType: "HIDE_SPIN_METER"});
            }, 2500);
            return;
        }
        this.updateCurrentState();
    }

    showBonusIntro() {
        if (this.currentSpinData.bonusInfo.find(this.checkForBonusStart)) {
            this.dispatcher.fireEvent({eventType: "SHOW_RESPIN_MSG"});
           this.currentJackpotSpinsData = this.createBonusSpinsArray();
            this.currentBonusLevel = this.currentSpinData.reelLayout.filter((item : number) => item === 12).length;
            this.isBonusActive = true;
            this.isBonusJustWon = true;
             // disable autoplay by default
             this.isAutoPlayActive = false;
             this.autoplayCount = 0;
             this.dispatcher.fireEvent({eventType: "ENABLE_BUTTONS"})

            this.currentJackpotSpinsData.count = 0;
            if (!this.isFreeSpinsActive) {
                //this.dispatcher.fireEvent({eventType: "SHOW_SPIN_METER", data: {count: this.currentJackpotSpinsData.count, isJackpot: true}});
            } else {
                //this.dispatcher.fireEvent({eventType: "UPDATE_SPIN_METER", data: {count: this.currentJackpotSpinsData.count, isJackpot: true}});
            }   
            this.dispatcher.fireEvent({eventType: "START_BONUS"});
        } else {
            this.updateCurrentState();
        }
    }

    showBonusOutro() {
        if (this.isBonusActive && (this.currentJackpotSpinsData.count === this.currentJackpotSpinsData.freeSpinList.length)) {
            this.currentBonusLevel = 0;
            this.isBonusJustEnded = true;
            if (this.isFreeSpinsActive) {
                // this.currentFreeSpinsData.count += this.currentJackpotSpinsData.freeSpinList.length;
                this.dispatcher.fireEvent({eventType: "START_BONUS_OUTRO", data: {amount: this.currentJackpotSpinsData.creditsWon || this.currentSpinData.creditsWon, isFreeSpin: this.isFreeSpinsActive}});
                
                this.isBonusActive = false;
                this.dispatcher.fireEvent({eventType: "SPIN_METER_VISIBLE"});
                this.dispatcher.fireEvent({eventType: "UPDATE_WINS_METER", data: {count:(this.initialFreeSpinWin || 0) +  this.currentFreeSpinsData.freeSpinList[this.currentFreeSpinNumber - 1][0].creditsWonAccumulated + this.currentFreeSpinsData.freeSpinList[this.currentFreeSpinNumber - 1][0].creditsWon || 0, isJackpot: false}});
            } else {
                this.dispatcher.fireEvent({eventType: "START_BONUS_OUTRO", data: {amount: this.currentJackpotSpinsData.creditsWon, isFreeSpin: this.isFreeSpinsActive}});
                this.isBonusActive = false;
                //this.dispatcher.fireEvent({eventType: "HIDE_SPIN_METER"});
            }
        } else {
            // means respin round is active and new respin round added
            if (this.isBonusActive) {
                this.dispatcher.fireEvent({eventType: "SHOW_RESPIN_MSG"});
            }
            
            this.updateCurrentState();
        }
    }

    showJackpotWheel() {
        if (this.isBonusActive && this.currentJackpotSpinsData.count && (this.currentJackpotSpinsData.freeSpinList[this.currentJackpotSpinsData.count -1][0].bonusInfo.find((bonus: any) => bonus.bonusName.includes("Wheel")))) {
            this.dispatcher.fireEvent({eventType: GameEvents.START_WHEEL_ROUND, data: this.currentJackpotSpinsData.freeSpinList[this.currentJackpotSpinsData.count -1][0].bonusInfo.find((bonus: any) => bonus.bonusName.includes("Wheel"))});
        } else {
            this.updateCurrentState();
        }
    }

    showBigWin() {
        if (this.isFreeSpinJustWon || this.isBonusJustWon) {
            this.updateCurrentState();
            return;
        }
        if (this.checkIsBigWin()) {
            if (this.isBonusJustEnded) {

                this.dispatcher.fireEvent({eventType: GameEvents.SHOW_BIG_WIN, data: {totalAmount: this.currentSpinData.creditsWon, level: this.checkIsBigWin(), bet: this.currentSpinData.totalBet}});
            } else if (!this.isBonusActive){
                this.dispatcher.fireEvent({eventType: GameEvents.SHOW_BIG_WIN, data: {totalAmount: this.isFreeSpinsJustEnded ? this.currentSpinData.creditsWon + this.currentSpinData.creditsWonAccumulated + this.initialFreeSpinWin : this.currentSpinData.creditsWon, level: this.checkIsBigWin(),  bet: this.currentSpinData.totalBet}});
            } else {
                this.updateCurrentState();
            }
        }
        else {
            this.updateCurrentState();
        }
        
    }

    showBigWinBonusAndFS() {
        if (this.isBonusJustEnded && this.isFreeSpinsJustEnded) {
            if (this.checkIsBigWin()) {
                // case where both big wins occur
                const amount = this.currentFreeSpinsData.freeSpinList[this.currentFreeSpinNumber - 1][0].creditsWon + this.initialFreeSpinWin + this.currentFreeSpinsData.freeSpinList[this.currentFreeSpinNumber - 1][0].creditsWonAccumulated;
                let level = 0;
                if (amount > 50 * this.currentSpinData.totalBet) {
                    level = 3;
                } else if (amount > 25 * this.currentSpinData.totalBet) {
                    level = 2;
                } else if (amount > 15 * this.currentSpinData.totalBet) {
                    level = 1;
                }
                setTimeout(() => {
                    this.dispatcher.fireEvent({eventType: GameEvents.SHOW_BIG_WIN, data: {totalAmount: amount, level: level, bet: this.currentSpinData.totalBet}});
                }, 900);
               
            }
        } else {
            this.updateCurrentState();
        }
    }
    checkIsBigWin() {
        
        if (this.isBonusJustEnded) {
            if (this.currentSpinData.creditsWon >= 50 * this.currentSpinData.totalBet) {
                return 3;
            }
            if (this.currentSpinData.creditsWon >= 25 * this.currentSpinData.totalBet) {
                return 2;
            }
            if (this.currentSpinData.creditsWon >= 15 * this.currentSpinData.totalBet) {
                return 1;
            } else {
                return 0;
            }
           
        }
        if ((this.isFreeSpinsJustEnded? this.currentSpinData.creditsWonAccumulated : this.currentSpinData.creditsWon) >= (50 * this.currentSpinData.totalBet)) {
            return 3;
        }
        if ((this.isFreeSpinsJustEnded? this.currentSpinData.creditsWonAccumulated : this.currentSpinData.creditsWon) >= (25 * this.currentSpinData.totalBet)) {
            return 2;
        }
        if ((this.isFreeSpinsJustEnded? this.currentSpinData.creditsWonAccumulated : this.currentSpinData.creditsWon) >= (15 * this.currentSpinData.totalBet)) {
            return 1;
        }
        return 0;
    }

    checkForBonusStart(bonus: any) {
        const bonusName = bonus.bonusName;
        if (bonusName === "BaseLockFeature") {
            return true;
        } else if (bonusName === "FsLockFeature") {
            return true;
        }
        return false;
    }

    createBonusSpinsArray() {
        if (this.isFreeSpinsActive) {
            let count = this.currentFreeSpinsData.count || 0;
            let jackpotsSpins: any = {};
            let freeSpinsList = [];
            let bonusSpinsList = this.currentSpinData.bonusInfo[0].freeSpinList;
            for (let i = 0; i < bonusSpinsList.length; i ++) {
                const data = bonusSpinsList[i];
                    freeSpinsList.push(data);
                }
            if (freeSpinsList.length > 1 || !checkEqualArrays(this.currentSpinData.reelLayout, freeSpinsList[0][0].reelLayout)) {
                const extraSpin = [...[...freeSpinsList][freeSpinsList.length - 1]];
                extraSpin[0] = {...extraSpin[0]};
                const bonusInfo = [...freeSpinsList[freeSpinsList.length - 1][0]["bonusInfo"]];
                extraSpin[0].bonusInfo = bonusInfo;
                
                freeSpinsList[freeSpinsList.length - 1][0].bonusInfo = [];
                freeSpinsList.push(extraSpin);
        }

            jackpotsSpins["freeSpinList"] = freeSpinsList;
            jackpotsSpins["count"] = jackpotsSpins.freeSpinList.length;
            //console.error(jackpotsSpins);
            return jackpotsSpins;
        } else {
            const data = this.currentSpinData.bonusInfo.find(this.checkForBonusStart);
           if (data.freeSpinList.length > 1 || !checkEqualArrays(this.currentSpinData.reelLayout, data.freeSpinList[0][0].reelLayout)) { 
                const extraSpin = [...[...data.freeSpinList][data.freeSpinList.length - 1]];
                extraSpin[0] = {...extraSpin[0]};
                const bonusInfo = [...data.freeSpinList[data.freeSpinList.length - 1][0]["bonusInfo"]];
                
                
                data.freeSpinList[data.freeSpinList.length - 1][0].bonusInfo = [];
                extraSpin[0].bonusInfo = bonusInfo;
                data.freeSpinList.push(extraSpin);
        }

            data.count = data.freeSpinList.length;
            //console.error(data);
            return this.currentSpinData.bonusInfo.find(this.checkForBonusStart);
        }
    }

    handleAutoPlay() {
        if (this.isAutoPlayActive && this.autoplayCount > 1) {
            setTimeout(() => {
                this.dispatcher.fireEvent({eventType: GameEvents.PLAY_DISABLE});
                this.dispatcher.fireEvent({eventType: "HANDLE_PLAY_CLICK"});
                this.autoplayCount -= 1;
            }, this.currentSpinData.creditsWon > 0 ? 250 : 1700);
        } else {
            this.dispatcher.fireEvent({eventType: GameEvents.UPDATE_GAME_STATE});
            this.isAutoPlayActive = false;
            this.dispatcher.fireEvent({eventType: "ENABLE_BUTTONS"})
        }
    }

}

const checkEqualArrays = (item1: number[], item2: number[]) => {
    
    if (item1.filter(i => i === 12).length === item2.filter(i => i === 12).length) {
       return true
    } else {
        return false;
    }
}