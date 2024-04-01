import { TestBed } from '@angular/core/testing';

import { LeanderGmApiService } from './leander-gm-api.service';

describe('LeanderGmApiService', () => {
  let service: LeanderGmApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeanderGmApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
