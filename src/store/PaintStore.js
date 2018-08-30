import { observable, action, computed } from 'mobx'
import { ACTION_DRAG, ACTION_CHOOSE_DEL, ACTION_CHOOSE_ADD, ACTION_RUBBER, ClearAction, AddAction, DelAction, RubberAction, DrawAction } from '../common/common'
export default class PaintStore {
  @observable type = ACTION_CHOOSE_ADD;
  @observable brushSize = 10;
  @observable addColor = '#f005';
  @observable delColor = '#0f05';
  @observable rubberSize = 12;
  @observable imgAction = {};
  @observable actions = [];
  @observable targetSquare = {};
  @observable actionIndex = -1;
  @observable isMouseDown = false;
  @observable lastDragPoint = null;
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
    if (this.canUndo) {
      this.actionIndex--;
    }
  }
  @action
  redo = () => {
    if (this.canRedo) {
      this.actionIndex++;
    }
  }
  @action
  clear = () => {
    this.actions.push(new ClearAction())
  }
  @action
  insertImg = (img) => {
    this.imgAction = {
      img,
      x: 0,
      y: 0,
      width: img.width,
      height: img.height
    }
  }
  @action
  onMouseDownAtPoint = (point) => {
    this.isMouseDown = true;
    if (this.canRedo) {
      this.actions.splice(this.actionIndex + 1, this.actions.length - this.actionIndex);
    }
    if (this.type === ACTION_CHOOSE_ADD || this.type === ACTION_CHOOSE_DEL) {
      let action = new DrawAction(this.type, [point], this.brushSize);
      this.actions.push(action);
    }
    else if (this.type === ACTION_RUBBER) {
      let rubberAction = new RubberAction([point], this.rubberSize);
      this.actions.push(rubberAction);
    }
    else if (this.props.type === ACTION_DRAG) {
      this.lastDragPoint = point;
    }
    this.actionIndex = this.actions.length - 1;
  }
  @action
  onMouseMoveAtPoint = (point) => {
    let currentAction = this.actions[this.actionIndex];
    if (this.type === ACTION_CHOOSE_ADD || this.type === ACTION_CHOOSE_DEL || this.type === ACTION_RUBBER) {
      currentAction.addPoint(point);
    }
    else if (this.type === ACTION_DRAG) {
      let vx = point.x - this.lastDragPoint.x;
      let vy = point.y - this.lastDragPoint.y;
      this.imgAction.x += vx;
      this.imgAction.y += vy;
      this.lastDragPoint = point;
    }
  }
  @action
  onMouseUp = () => {
    this.isMouseDown = false;
  }
  @action
  zoomIn = () => {
    this.imgAction.width *= 1.1;
    this.imgAction.height *= 1.1;
  }
  @action
  zoomOut = () => {
    this.imgAction.width *= 0.9;
    this.imgAction.height *= 0.9;
  }
}
