import { observable, action, computed } from 'mobx'
import { ACTION_DRAG, ACTION_CHOOSE_DEL, ACTION_CHOOSE_ADD, ACTION_RUBBER, ClearAction, AddAction, DelAction, RubberAction, DrawAction } from '../common/common'
export default class PaintStore {
  @observable type = ACTION_CHOOSE_ADD;
  @observable brushSize = 10;
  @observable addColor = '#0f05';
  @observable delColor = '#f005';
  @observable rubberSize = 12;
  @observable imgAction = {};
  @observable actions = [];
  @observable targetSquare = {};
  @observable actionIndex = -1;
  @observable isMouseDown = false;
  @observable lastDragPoint = null;
  @observable needRedraw = false;
  @computed get canUndo() {
    return this.actionIndex > 0
  }
  @computed get canRedo() {
    return this.actionIndex < this.actions.length - 1;
  }
  @computed get scale() {
    if(this.imgAction.img){
      return this.imgAction.width / this.imgAction.img.width;
    }
    return 1;
  }
  point2relativePoint = (point) => {
    let x = (point.x - this.imgAction.x)/this.imgAction.width;
    let y = (point.y - this.imgAction.y)/this.imgAction.height;
    return {x,y};
  }
  point2realPoint = (point) => {
    let x = Math.floor(this.imgAction.x + point.x * this.imgAction.width);
    let y = Math.floor(this.imgAction.y + point.y * this.imgAction.height);
    return {x,y}
  }
  points2realPoints = (points) => {
    return points.map(this.point2realPoint)
  }
  @action
  setActionType = (actionType) => {
    this.type = actionType;
  }
  @action
  undo = () => {
    if (this.canUndo) {
      this.actionIndex--;
      this.needRedraw = true;
    }
  }
  @action
  redo = () => {
    if (this.canRedo) {
      this.actionIndex++;
      this.needRedraw = true;
    }
  }
  @action
  clear = () => {
    if (this.canRedo) {
      this.actions.splice(this.actionIndex + 1, this.actions.length - this.actionIndex);
    }
    this.actions.push(new ClearAction())
    this.actionIndex++;
    this.needRedraw = true;
  }
  @action
  onRedraw = () => {
    this.needRedraw = false;
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
    this.needRedraw = true;
  }
  @action
  onMouseDownAtPoint = (point) => {
    let relativePoint = this.point2relativePoint(point);
    this.isMouseDown = true;
    if (this.canRedo) {
      this.actions.splice(this.actionIndex + 1, this.actions.length - this.actionIndex);
    }
    if (this.type === ACTION_CHOOSE_ADD || this.type === ACTION_CHOOSE_DEL) {
      let action = new DrawAction(this.type, [relativePoint], this.brushSize / this.scale);
      this.actions.push(action);
    }
    else if (this.type === ACTION_RUBBER) {
      let rubberAction = new RubberAction([relativePoint], this.rubberSize / this.scale);
      this.actions.push(rubberAction);
    }
    else if (this.type === ACTION_DRAG) {
      this.lastDragPoint = point;
    }
    this.actionIndex = this.actions.length - 1;
    this.needRedraw = true;
  }
  @action
  onMouseMoveAtPoint = (point) => {
    let relativePoint = this.point2relativePoint(point);
    let currentAction = this.actions[this.actionIndex];
    if (this.type === ACTION_CHOOSE_ADD || this.type === ACTION_CHOOSE_DEL || this.type === ACTION_RUBBER) {
      currentAction.addPoint(relativePoint);
    }
    else if (this.type === ACTION_DRAG) {
      let vx = point.x - this.lastDragPoint.x;
      let vy = point.y - this.lastDragPoint.y;
      this.imgAction.x += vx;
      this.imgAction.y += vy;
      this.lastDragPoint = point;
    }
    this.needRedraw = true;
  }
  @action
  onMouseUp = () => {
    this.isMouseDown = false;
  }
  @action
  zoomIn = () => {
    this.imgAction.width *= 1.1;
    this.imgAction.height *= 1.1;
    this.needRedraw = true;
  }
  @action
  zoomOut = () => {
    this.imgAction.width *= 0.9;
    this.imgAction.height *= 0.9;
    this.needRedraw = true;
  }
}
