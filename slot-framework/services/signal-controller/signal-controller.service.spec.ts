import { TestBed } from '@angular/core/testing';

import { SignalControllerService } from './signal-controller.service';

describe('SignalControllerService', () => {
  let service: SignalControllerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SignalControllerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
