export const ACTION_CHOOSE_ADD = 'ACTION_CHOOSE_ADD';
export const ACTION_CHOOSE_DEL = 'ACTION_CHOOSE_DEL';
export const ACTION_RUBBER = 'ACTION_RUBBER';
export const ACTION_DRAG = 'ACTION_DRAG';
export const ACTION_CLEAR = 'ACTION_CLEAR';
export const ACTION_TARGET = 'ACTION_TARGET';
export const isMobile = /(Mobile)/i.test(window.navigator.userAgent);
export class Action {
  constructor(type) {
    this.type = type;
  }
}
export class ClearAction extends Action {
  constructor() {
    super(ACTION_CLEAR);
  }
}
export class DrawAction extends Action {
  constructor(type, points, size) {
    super(type);
    this.points = points;
    this.size = size;
  }
  addPoint = (point) => {
    this.points.push(point);
  }
}
export class AddAction extends DrawAction {
  constructor(points, size) {
    super(ACTION_CHOOSE_ADD, points, size);
  }
}
export class DelAction extends DrawAction {
  constructor(points, size) {
    super(ACTION_CHOOSE_ADD, points, size);
  }
}
export class RubberAction extends DrawAction {
  constructor(points, size) {
    super(ACTION_RUBBER, points, size);
  }
}