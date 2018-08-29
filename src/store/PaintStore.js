import { observable, action, computed} from 'mobx'
import { ACTION_DRAG, ACTION_CHOOSE_DEL, ACTION_CHOOSE_ADD, ACTION_RUBBER, ClearAction} from '../common/common'
export default class PaintStore {
  @observable type = ACTION_CHOOSE_ADD;
  @observable brushSize = 10;
  @observable addColor = '#f005';
  @observable delColor = '#0f05';
  @observable rubberSize = 12;
  @observable img = {};
  @observable actions = [];
  @observable targetSquare = {};
  @observable actionIndex = -1;
  @computed get canUndo() {
    return this.actionIndex > 0
  }
  @computed get canRedo() {
    return this.actionIndex < this.actions.length - 1;
  }
  @action
  setActionType = (actionType) => {
    this.type = actionType;
  }
  @action
  undo = () => {
    if(this.canUndo){
      this.actionIndex --;
    }
  }
  @action
  redo = () => {
    if(this.canRedo){
      this.actionIndex ++;
    }
  }
  @action
  clear = () => {
    this.actions.push(new ClearAction())
  }
  @action
  insertImg = (img) => {
    this.img = {
      img,
      x:0,
      y:0,
      width:img.width,
      height:img.height
    }
  }
}
