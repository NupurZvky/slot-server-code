import { Injectable } from '@angular/core';
import { ErrorHandleInterface } from '../../interfaces/ErrorHanlde';

@Injectable({
  providedIn: 'root'
})
export class HandleErrorService {

  constructor() { }

  displayError(response: ErrorHandleInterface){
    if(response.code){
        alert(response.code+" : "+response.description);
        return false;
    }
    else{
      return true;
    }
  }
}
