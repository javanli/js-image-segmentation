import { message } from 'antd';
import { observable, action, computed } from 'mobx'
import { ACTION_DRAG, ACTION_CHOOSE_DEL, ACTION_CHOOSE_ADD, ACTION_RUBBER, ClearAction, RubberAction, DrawAction, ACTION_TARGET, isMobile, data2gray } from '../common/common'
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
  @observable targetSquare = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 }; // 框选目标区域
  @observable isMouseDown = false; // 鼠标按下态
  @observable lastDragPoint = null; // 拖拽相关
  @observable needRedraw = false; // 是否需要重绘
  @observable split = false; // 是否拆分成两栏
  @observable isPinch = false; // 两指拖拽
  @observable lastPinchDiff = 0; // 两指距离
  @observable needMatting = false;

  // UI相关
  @observable windowSize = { x: 0, y: 0 };
  @observable showUploadModal = false;
  @action
  updateWindowSize = () => {
    let x = document.documentElement.clientWidth || document.body.clientWidth;
    let y = document.documentElement.clientHeight || document.body.clientHeight;
    if(isMobile){
      if(x > y){
        y = window.screen.width;
        x = window.screen.height;
      }
      else{
        x = window.screen.width;
        y = window.screen.height;
      }
    }
    console.log('resize',x,y)
    this.split = x > 700 && !isMobile;
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
    message.config({ maxCount: 1 })
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
    if(this.imgAction.img){
      let {width,height} = this.imgAction.img;
      let x = Math.floor(point.x * width);
      let y = Math.floor(point.y * height);
      return {x,y};
    }
    return {x:0,y:0};
  }
  points2imgPoints = (points) => {
    return points.map(this.point2imgPoint)
  }
  getImgOrigin = () => {
    let x = this.imgAction.x * this.canvasWidth - this.imgAction.width / 2;
    let y = this.imgAction.y * this.canvasHeight - this.imgAction.height / 2;
    return { x, y };
  }
  @action
  setNeedMatting = (isNeed) => {
    this.needMatting = isNeed;
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
    let { img } = this.imgAction;
    if (!img) {
      message.error('请先插入图片', 1);
      return;
    }
    this.imgAction.width *= 1.1;
    this.imgAction.height *= 1.1;
    this.needRedraw = true;
  }
  @action
  zoomOut = () => {
    let { img } = this.imgAction;
    if (!img) {
      message.error('请先插入图片', 1);
      return;
    }
    this.imgAction.width *= 0.9;
    this.imgAction.height *= 0.9;
    this.needRedraw = true;
  }
  @action
  resetImgSize = () => {
    let { img } = this.imgAction;
    if (!img) {
      message.error('请先插入图片', 1);
      return;
    }
    if (img.width < this.canvasWidth - 160 && img.height < this.canvasHeight - 160) {
      this.imgAction.width = this.imgAction.img.width;
      this.imgAction.height = this.imgAction.img.height;
    }
    else if (img.width / img.height > (this.canvasWidth - 160) / (this.canvasHeight - 160)) {
      this.imgAction.width = this.canvasWidth - 160;
      this.imgAction.height = this.imgAction.width / img.width * img.height;
    }
    else {
      this.imgAction.height = this.canvasHeight - 160;
      this.imgAction.width = this.imgAction.height / img.height * img.width;
    }
    this.imgAction.x = 0.5;
    this.imgAction.y = 0.5;
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
    this.resetImgSize();
    this.actions = [];
    this.actionIndex = -1;
    this.needRedraw = true;
    this.updateImgData();
  }
  updateImgData = () => {
    let img = this.imgAction.img;
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    this.data = ctx.getImageData(0, 0, img.width, img.height).data;
    this.grayData = data2gray(this.data, img.width, img.height);
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
    if(this.type === ACTION_TARGET){
      this.lastDragPoint = point;
      return;
    }
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
    if (!this.isMouseDown) {
      return;
    }
    if (this.type === ACTION_TARGET){
      let vx = point.x - this.lastDragPoint.x;
      let vy = point.y - this.lastDragPoint.y;
      let { x, y, width, height } = this.targetSquare;
      x += vx / this.imgAction.width;
      y += vy / this.imgAction.height;
      if (x < 0) x = 0;
      if (x + width > 1) x = 1 - width;
      if (y < 0) y = 0;
      if (y + height > 1) y = 1 - height;
      this.setTargetSquare({ x, y, width, height });
      this.lastDragPoint = point;
      return;
    }
    let relativePoint = this.point2relativePoint(point);
    let currentAction = this.actions[this.actionIndex];
    if (this.type === ACTION_CHOOSE_ADD || this.type === ACTION_CHOOSE_DEL || this.type === ACTION_RUBBER) {
      currentAction.addPoint(relativePoint);
    }
    else if (this.type === ACTION_DRAG) {
      let vx = point.x - this.lastDragPoint.x;
      let vy = point.y - this.lastDragPoint.y;
      if(vx < 0 || this.imgAction.x * this.canvasWidth + vx - this.imgAction.width/2 < this.canvasWidth - 5){
        this.imgAction.x += vx / this.canvasWidth;
      }
      if(vy < 0 || this.imgAction.y * this.canvasHeight + vy - this.imgAction.height/2 < this.canvasHeight - 5){
        this.imgAction.y += vy / this.canvasHeight;
      }
      this.lastDragPoint = point;
    }
    this.needRedraw = true;
  }
  @action
  onPinchStart = (diff) => {
    this.isPinch = true;
    this.lastPinchDiff = diff;
  }
  @action
  onPinchWithDiff = (diff) => {
    if (this.lastPinchDiff !== 0 && this.isPinch && diff !== this.lastPinchDiff) {
      let scale = diff > this.lastPinchDiff ? 1.05 : 0.95;
      if(this.type === ACTION_TARGET){
        let {x,y,width,height} = this.targetSquare;
        let centerx = x + width/2;
        let centery = y + height/2;
        let minx = centerx > 0.5 ? 1 - centerx : centerx;
        let miny = centery > 0.5 ? 1 - centery : centery;
        let scalex = minx/width*2;
        let scaley = miny/height*2;
        let maxScale = Math.min(scalex,scaley);
        if(scale > maxScale){
          scale = maxScale;
        }
        width*=scale;
        height*=scale;
        x-=(scale - 1)*width/2;
        y-=(scale - 1)*height/2;
        this.targetSquare = {x,y,width,height};
      }
      else{
        this.imgAction.width *= scale;
        this.imgAction.height *= scale;
        this.needRedraw = true;
      }
    }
    this.lastPinchDiff = diff;
  }
  @action
  onPinchEnd = () => {
    this.isPinch = false;
    this.lastPinchDiff = 0;
  }
  @action
  onMouseUp = () => {
    this.isMouseDown = false;
  }
  @action
  setTargetSquare = (square) => {
    this.targetSquare = square;
  }
}
