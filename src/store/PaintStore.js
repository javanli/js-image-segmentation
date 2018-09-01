import { message } from 'antd';
import { observable, action, computed } from 'mobx'
import { ACTION_DRAG, ACTION_CHOOSE_DEL, ACTION_CHOOSE_ADD, ACTION_RUBBER, ClearAction, AddAction, DelAction, RubberAction, DrawAction } from '../common/common'
export default class PaintStore {
  // 绘制相关
  @observable type = ACTION_CHOOSE_ADD;// 当前操作类型
  @observable brushSize = 10; // 画笔粗细
  @observable addColor = '#0f0'; // 正标注画笔的颜色
  @observable delColor = '#f00'; // 负标注画笔的颜色
  @observable rubberSize = 12; // 橡皮的大小
  @observable imgAction = {}; // 图片
  @observable actions = []; // 画笔、橡皮的绘制历史，坐标范围[0,1]，以img为参照
  @observable actionIndex = -1; // 当前索引，用于前进后退
  @observable targetSquare = {}; // 框选目标区域，TODO
  @observable isMouseDown = false; // 鼠标按下态
  @observable lastDragPoint = null; // 拖拽相关
  @observable needRedraw = false; // 是否需要重绘
  @observable split = false; // 是否拆分成两栏

  // UI相关
  @observable windowSize = { x: 0, y: 0 };
  @observable showUploadModal = false;
  @action
  updateWindowSize = () => {
    let x = window.innerWidth;
    let y = window.innerHeight;
    this.split = x > 700;
    this.windowSize = { x, y };
    this.needRedraw = true;
  }
  @action
  setShowUploadModal = (isShow) => {
    this.showUploadModal = isShow;
  }
  constructor() {
    window.onresize = this.updateWindowSize;
    window.onload = this.updateWindowSize;
  }
  @computed get canUndo() {
    return this.actionIndex >= 0
  }
  @computed get canRedo() {
    return this.actionIndex < this.actions.length - 1;
  }
  @computed get scale() {
    if (this.imgAction.img) {
      return this.imgAction.width / this.imgAction.img.width;
    }
    return 1;
  }
  @computed get canvasWidth() {
    return this.split ? Math.floor(this.windowSize.x / 2) - 1 : this.windowSize.x;
  }
  @computed get canvasHeight() {
    return this.windowSize.y;
  }
  point2relativePoint = (point) => {
    let imgOrigin = this.getImgOrigin();
    let x = (point.x - imgOrigin.x) / this.imgAction.width;
    let y = (point.y - imgOrigin.y) / this.imgAction.height;
    return { x, y };
  }
  point2imgPoint = (point) => {
    let x = Math.floor(point.x * this.imgAction.width);
    let y = Math.floor(point.y * this.imgAction.height);
    return { x, y }
  }
  points2imgPoints = (points) => {
    return points.map(this.point2imgPoint)
  }
  getImgOrigin = () => {
    let x = this.imgAction.x * this.canvasWidth - this.imgAction.width/2;
    let y = this.imgAction.y * this.canvasHeight - this.imgAction.height/2;
    return {x,y};
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
  @action
  resetImgSize = () => {
    this.imgAction.width = this.imgAction.img.width;
    this.imgAction.height = this.imgAction.img.height;
    this.needRedraw = true;
  }
  @action
  insertImg = (img) => {
    this.imgAction = {
      img,
      x: 0.5,
      y: 0.5,
      width: img.width,
      height: img.height
    }
    this.actions = []
    this.actionIndex = -1;
    this.needRedraw = true;
  }
  @action
  onRedraw = () => {
    this.needRedraw = false;
  }
  @action
  setSize = (value) => {
    if (this.type === ACTION_CHOOSE_ADD || this.type === ACTION_CHOOSE_DEL) {
      this.brushSize = value;
    }
    else if (this.type === ACTION_RUBBER) {
      this.rubberSize = value;
    }
  }
  @action
  sizeUp = () => {
    if (this.type === ACTION_CHOOSE_ADD || this.type === ACTION_CHOOSE_DEL) {
      this.brushSize++;
    }
    else if (this.type === ACTION_RUBBER) {
      this.rubberSize++;
    }
  }
  @action
  sizeDown = () => {
    if (this.type === ACTION_CHOOSE_ADD || this.type === ACTION_CHOOSE_DEL) {
      if (this.brushSize > 1) {
        this.brushSize--;
      }
    }
    else if (this.type === ACTION_RUBBER) {
      if (this.rubberSize > 1) {
        this.rubberSize--;
      }
    }
  }
  @action
  onMouseDownAtPoint = (point) => {
    if (!this.imgAction.img) {
      message.error('请先插入图片', 1);
    }
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
      this.imgAction.x += vx/this.canvasWidth;
      this.imgAction.y += vy/this.canvasHeight;
      this.lastDragPoint = point;
    }
    this.needRedraw = true;
  }
  @action
  onMouseUp = () => {
    this.isMouseDown = false;
  }
}
