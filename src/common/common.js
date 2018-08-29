export const ACTION_CHOOSE_ADD = 'ACTION_CHOOSE_ADD';
export const ACTION_CHOOSE_DEL = 'ACTION_CHOOSE_DEL';
export const ACTION_RUBBER = 'ACTION_RUBBER';
export const ACTION_DRAG = 'ACTION_DRAG';
export const ACTION_CLEAR = 'ACTION_CLEAR';
export class Action {
  constructor(type) {
    this.type = type;
  }
}
export class ClearAction extends Action {
  constructor(){
    super(ACTION_CLEAR);
  }
}
export class AddAction extends Action {
  constructor(points,size){
    super(ACTION_CHOOSE_ADD);
    this.points = points;
    this.size = size;
  }
  addPoint = (point) => {
    this.points.push(point);
  }
}
export class DelAction extends Action {
  constructor(points,size){
    super(ACTION_CHOOSE_ADD);
    this.points = points;
    this.size = size;
  }
  addPoint = (point) => {
    this.points.push(point);
  }
}
export class RubberAction extends Action {
  constructor(points,size){
    super(ACTION_RUBBER);
    this.points = points;
    this.size = size;
  }
  addPoint = (point) => {
    this.points.push(point);
  }
}