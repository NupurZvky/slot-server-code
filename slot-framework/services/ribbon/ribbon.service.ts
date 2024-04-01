import { EventEmitter, Injectable } from '@angular/core';
import { usePointsEnabled } from '../currency/constant';

@Injectable({
  providedIn: 'root',
})
export class RibbonService {
  constructor() {}

  isSettingModalOpen: boolean = false;
  paytableMenuOn: boolean = true;
  helpMenuOn: boolean = false;
  autospinMenuOn: boolean = false;
  isAutoSpinEnbled: boolean = true;
  gameSettingsMenuOn: boolean;
  currencyModeOn: boolean = !usePointsEnabled;

  allStakes: Array<number> = [];
  minCoinBet: number;

  // TODO: Understand coinMultipliers logic and define coinMultiplierIndex dynamically
  coinMultipliers: Array<number> = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2];
  // ? this is hard-coded index, need to changes once the coinMultipliers logic gets clear
  coinMultiplierIndex: number = 0;

  // TODO: Understand minimalCoinBets logic and define minimalBetIndex dynamically
  minimalCoinBets: Array<number> = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  // ? this is hard-coded index, need to changes once the minimalCoinBets logic gets clear
  minimalBetIndex: number = 2;

  paytableOpenedEvent = new EventEmitter();
  helpOpenedEvent = new EventEmitter();

  openSettingModal() {
    this.isSettingModalOpen = true;
  }

  closeSettingModal() {
    this.isSettingModalOpen = false;
  }

  private round(val: number): number {
    return Math.round(val * 100) / 100;
  }

  convertFromCoinsToCurrency(amount: number): number {
    return this.round(amount * this.coinMultipliers[this.coinMultiplierIndex]);
  }

  paytableMenuClick() {
    this.isSettingModalOpen = true;
    if (!this.paytableMenuOn) {
      this.paytableMenuOn = true;
      this.helpMenuOn = false;
      this.autospinMenuOn = false;
      this.gameSettingsMenuOn = false;
      this.paytableOpenedEvent.emit();
    }
  }

  helpMenuToggle() {
    this.isSettingModalOpen = true;
    if (!this.helpMenuOn) {
      this.paytableMenuOn = false;
      this.helpMenuOn = true;
      this.autospinMenuOn = false;
      this.gameSettingsMenuOn = false;
      this.helpOpenedEvent.emit();
    }
  }

  gameSettingsMenuToggle() {
    this.isSettingModalOpen = true;
    if (!this.gameSettingsMenuOn) {
      this.paytableMenuOn = false;
      this.helpMenuOn = false;
      this.autospinMenuOn = false;
      this.gameSettingsMenuOn = true;
    }
  }

  getBetInCurrency(): number {
    return this.convertFromCoinsToCurrency(
      this.minimalCoinBets[this.minimalBetIndex]
    );
  }

  convertFromCurrencyToCoins(amount: number): number {
    return amount / this.coinMultipliers[this.coinMultiplierIndex];
  }
}
