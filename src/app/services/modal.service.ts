import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable()
export class ModalService {
  public modalVisible = new BehaviorSubject<boolean>(false);
  public modalContent = new BehaviorSubject<string>(null);
  public modalTitle = new BehaviorSubject<string>(null);

  constructor() {
  }

}
