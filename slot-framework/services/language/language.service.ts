import { Injectable } from '@angular/core';
import { defaultLanguage, supportedLanguage } from './constant';
import { TranslocoService } from '@ngneat/transloco';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  constructor(private translocoService: TranslocoService) {}

  languageKey: string = defaultLanguage;
  availableLanguage: string[] = supportedLanguage;

  setLanguage(language: string) {
    const lan = language || '';
    const keyToLower = lan.toLocaleLowerCase();
    if (this.availableLanguage.includes(keyToLower)) {
      this.languageKey = language;
      this.translocoService.setActiveLang(this.languageKey);
    }
  }
}
