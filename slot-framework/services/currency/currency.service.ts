import { EventEmitter, Injectable } from '@angular/core';
import { ICurrency } from './types';
import { BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { currenciesUrl, defaultCurrency, usePointsEnabled } from './constant';
import { ServerCommunicationService } from '../server-communication/server-communication.service';
import { InitializeGameResponseData } from '../interfaces/InitializeGame';

const POINTS_CURRENCY: ICurrency = {
  title: 'Points',
  symbol: 'PT',
  bitmapSymbol: 'PT',
  majorSeparator: ',',
  minorSeparator: '.',
};

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  public usePoints = usePointsEnabled;

  private currentCurrency: BehaviorSubject<ICurrency> =
    new BehaviorSubject<ICurrency>({
      title: 'USD',
      symbol: '$',
      bitmapSymbol: '$',
    });

  constructor(private http: HttpClient) {
    
  }

  setCurrentCurrency(key: string = defaultCurrency): EventEmitter<any> {
    const currencyInitializationFinished = new EventEmitter();
    key = key || '';
    const keyToUpper = key.toUpperCase();

    this.getCurrencies().subscribe((currencies: Array<ICurrency>) => {
      let currentCurrency: ICurrency = this.getCurrencyByKey(
        currencies,
        keyToUpper
      );
      currentCurrency = this.configureCurrency(currentCurrency);
      this.currentCurrency.next(currentCurrency);
      currencyInitializationFinished.emit();
    });
    return currencyInitializationFinished;
  }

  transform(
    value: number,
    bitmap = false,
    round = false,
    withoutCurrencySymbol = false
  ): string {
    const currency: ICurrency = this.getCurrency();
    if (!value) {
      return currency.symbol + ' 0';
    }
    let result: string = this.roundValue(value, round);

    if (currency) {
      result = this.addSeparators(result, currency);
      if (!withoutCurrencySymbol) {
        result = this.addCurrencySymbol(bitmap, currency, result);
      }
    }
    return result;
  }

  private configureCurrency(currentCurrency: ICurrency): ICurrency {
    currentCurrency.majorSeparator = currentCurrency.majorSeparator || ',';
    currentCurrency.minorSeparator = currentCurrency.minorSeparator || '.';
    return currentCurrency;
  }

  private getCurrencies(): EventEmitter<Array<ICurrency>> {
    const currenciesEvent = new EventEmitter<Array<ICurrency>>();
    this.http.get<{ currencies: Array<ICurrency> }>(currenciesUrl).subscribe(
      (value: { currencies: Array<ICurrency> }) => {
        currenciesEvent.emit(value.currencies);
      },
      (error) => {
        console.log('Cannot read currencies file!');
      }
    );
    return currenciesEvent;
  }

  private getCurrencyByKey(
    currencies: ICurrency[],
    keyToUpper: any
  ): ICurrency {
    let selectedCurrency: ICurrency | undefined;
    currencies.forEach((currency: ICurrency) => {
      if (currency.title === keyToUpper) {
        selectedCurrency = currency;
      }
    });
    if (!selectedCurrency) {
      selectedCurrency = currencies[0];
    }
    return selectedCurrency as ICurrency;
  }

  private getCurrency(): ICurrency {
    let currentCurrency: ICurrency = this.currentCurrency.getValue();
    if (this.usePoints) {
      currentCurrency = POINTS_CURRENCY;
    }
    if (!currentCurrency) {
      console.log('Could not load currency in pipe!');
    }
    return currentCurrency;
  }

  private roundValue(value: number, round: boolean): string {
    let result: string = value.toFixed(2).toString();
    if (round && !(value % 1)) {
      result = value.toFixed(0).toString();
    }
    return result;
  }

  private addSeparators(result: string, currentCurrency: ICurrency): string {
    result = result.replace('.', currentCurrency.minorSeparator as string);
    let index = result.indexOf(currentCurrency.minorSeparator as string);
    if (index === -1) {
      index = result.length;
    }
    for (let i = index - 3; i > 0; i -= 3) {
      result =
        result.slice(0, i) + currentCurrency.majorSeparator + result.slice(i);
    }
    return result;
  }

  private addCurrencySymbol(
    bitmap: boolean,
    currentCurrency: ICurrency,
    result: string
  ): string {
    const symbol = bitmap
      ? currentCurrency.bitmapSymbol
      : currentCurrency.symbol;
    if (currentCurrency.positionRight) {
      result += ' ' + symbol;
    } else {
      result = symbol + ' ' + result;
    }
    return result;
  }
}
