import { Injectable } from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
    providedIn: 'root'
  })
export class GameEventsManager {
    constructor () {}

    public eventSubject = new Subject<IGameEvent>();

    public fireEvent(event: IGameEvent) {
        this.eventSubject.next(event);
    }

    public addListener(event: string, listener: Function, context?: any) {
        return this.eventSubject.subscribe((value) => {
            // call the listener only if event type matches
            if (event === value.eventType) {
                listener.bind(context)(value);
            }
        })
    }
}

export interface IGameEvent {
    eventType: string,
    data?: any
}
