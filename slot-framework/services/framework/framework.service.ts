import { Injectable } from '@angular/core';
import { RibbonService } from '../ribbon/ribbon.service';
import { CurrencyService } from '../currency/currency.service';
import { LanguageService } from '../language/language.service';

@Injectable({
  providedIn: 'root',
})
export class FrameworkService {
  constructor(
    public ribbonService: RibbonService,
    public currencyService: CurrencyService,
    public languageService: LanguageService
  ) {}

  /**
   * Formats number into currency string (e.g. 1000.50 -> £1,000.50)
   * @param amountInCurrency
   * @param bitmap If a bitmap font will be used when the amount is displayed.
   * @param round If the value should be rounded (e.g. 10.02 -> 10$)
   * @param withoutCurrencySymbol If there shouldn't be currency symbol.
   */
  formatNumberAsCurrency(
    amountInCurrency: number,
    bitmap = false,
    round = false,
    withoutCurrencySymbol = false
  ): string {
    return this.currencyService.transform(
      amountInCurrency,
      bitmap,
      round,
      withoutCurrencySymbol
    );
  }

  get isInCurrencyMode(): boolean {
    return this.ribbonService.currencyModeOn;
  }

  get betInCurrency(): number {
    return this.ribbonService.getBetInCurrency();
  }

  get betInCoins(): number {
    const convertFromCurrencyToCoins =
      this.ribbonService.convertFromCurrencyToCoins(
        this.ribbonService.getBetInCurrency()
      );
    return convertFromCurrencyToCoins;
  }

  get canShowBetInfo() {
    // ! need to implement actual logic based on use case
    return true;
  }

  /** The minimal total bet that the user can bet in currency. */
  get minTotalBet(): number {
    return this.ribbonService.allStakes[0] * this.ribbonService.minCoinBet;
  }

  get maxTotalBet(): number {
    return (
      this.ribbonService.allStakes[this.ribbonService.allStakes.length - 1] *
      this.ribbonService.minCoinBet
    );
  }

  get languageKey(): string {
    return this.languageService.languageKey;
  }

  get canShowMaxWinProbability(): boolean {
    return this.languageKey === 'de';
  }

  get isAutoSpinAvailable(): boolean {
    return this.ribbonService.isAutoSpinEnbled;
  }

  get isHideCoins(): boolean {
    return false;
  }

  get isInRegulationWithStopSpeedUpSettings(): boolean {
    return false;
  }
}
