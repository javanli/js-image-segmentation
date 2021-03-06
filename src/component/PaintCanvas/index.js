import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import { ACTION_CHOOSE_DEL, ACTION_CHOOSE_ADD, ACTION_RUBBER, data2gray } from '../../common/common'
import { ACTION_CLEAR } from "../../common/common";
import SegmentationWorker from 'worker-loader!../../common/graphcut/worker.js';// eslint-disable-line import/no-webpack-loader-syntax
import sigma from 'sigma';
@inject('paintStore')
@observer
class PaintCanvas extends Component {
  static defaultProps = {
    disabled: false
  };

  constructor(props) {
    super(props);
    this.bindEvent();
    window.requestAnimationFrame(this.redraw);
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCtx = this.offscreenCanvas.getContext('2d');
  }
  /**
   * 工具函数
   */
  bindEvent = () => {
    window.addEventListener("wheel", this.onMouseWheel);
  }
  getMousePos = e => {
    const rect = this.canvas.getBoundingClientRect();

    // use cursor pos as default
    let clientX = e.clientX;
    let clientY = e.clientY;

    // use first touch if available
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    // return mouse/touch position inside canvas
    return {
      x: clientX - rect.left + 8,
      y: clientY - rect.top + 8
    };
  };
  getPinchDiff = e => {
    if (e.touches && e.touches.length === 2) {
      let x1 = e.touches[0].clientX;
      let y1 = e.touches[0].clientY;
      let x2 = e.touches[1].clientX;
      let y2 = e.touches[1].clientY;
      var a = x1 - x2;
      var b = y1 - y2;
      return Math.sqrt(a * a + b * b);
    }
    return 0;
  }
  /**
   * 绘制相关
   */
  clear = () => {
    let { paintStore } = this.props;
    if (this.ctx) {
      this.ctx.clearRect(0, 0, paintStore.canvasWidth, paintStore.canvasHeight);
    }
    this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
  }
  redraw = () => {
    let { paintStore } = this.props;
    let img = paintStore.imgAction.img;
    if (paintStore.needRedraw && img) {
      // console.log('redraw', paintStore)
      paintStore.onRedraw();
      this.clear();
      this.drawImg(paintStore.imgAction);
      this.offscreenCanvas.width = img.width;
      this.offscreenCanvas.height = img.height;
      paintStore.actions.forEach((action, idx) => {
        if (idx <= paintStore.actionIndex) {
          this.applyAction(action);
        }
      });
      let { width, height } = paintStore.imgAction;
      let { x, y } = paintStore.getImgOrigin();
      this.ctx.globalAlpha = 0.4;
      this.ctx.drawImage(this.offscreenCanvas, x, y, width, height);
      this.ctx.globalAlpha = 1.0;

    }
    if (paintStore.needMatting && paintStore.imgAction.img) {
      console.log('needMatting')
      paintStore.setNeedMatting(false);
      // TODO : do matting
      let imgData = new ImageData(paintStore.data.slice(),img.width,img.height);
      let triData = this.offscreenCtx.getImageData(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
      console.log(triData)
      const worker = new SegmentationWorker();
			worker.postMessage( { imgData, triData} );
			worker.addEventListener('message', (e) => {
        console.log('on cut end')
				let imgData = e.data.imgData;
        paintStore.alphaCanvas.width = img.width;
        paintStore.alphaCanvas.height = img.height;
        paintStore.alphaCtx.putImageData(imgData,0,0);
  
        let { width, height } = paintStore.imgAction;
        let { x, y } = this.props.paintStore.getImgOrigin();
        this.resultCtx.clearRect(0,0,this.resultCanvas.width,this.resultCanvas.height);
        this.resultCtx.drawImage(paintStore.alphaCanvas, x, y, width, height);
			});
    }
    window.requestAnimationFrame(this.redraw);
  };
  applyAction = (action) => {
    let { paintStore } = this.props;
    if (action.type === ACTION_CHOOSE_ADD) {
      this.drawLine(action, paintStore.addColor, this.offscreenCtx);
    }
    else if (action.type === ACTION_CHOOSE_DEL) {
      this.drawLine(action, paintStore.delColor, this.offscreenCtx);
    }
    else if (action.type === ACTION_RUBBER) {
      this.offscreenCtx.globalCompositeOperation = "destination-out";
      this.drawLine(action, '#fff', this.offscreenCtx);
      this.offscreenCtx.globalCompositeOperation = "source-over";
    }
    else if (action.type === ACTION_CLEAR) {
      this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height);
    }

  }
  drawLine = (lineAction, color, ctx) => {
    let { paintStore } = this.props;
    let { points, size } = lineAction;
    points = paintStore.points2imgPoints(points);
    ctx.lineWidth = size * paintStore.scale;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    var prev = points[0],
      prevprev = null, curr = prev, len = points.length;
    for (var i = 1, l = len; i < l; ++i) {
      curr = points[i];

      if (prevprev && (prevprev.x === curr.x || prevprev.y === curr.y)) {
        // hack to avoid weird linejoins cutting the line
        curr.x += 0.1;
        curr.y += 0.1;
      }
      var mid = { x: (prev.x + curr.x) / 2, y: (prev.y + curr.y) / 2 };
      ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
      prevprev = prev;
      prev = points[i];
    }
    ctx.quadraticCurveTo(prev.x, prev.y, curr.x, curr.y);
    ctx.stroke();
  }
  drawImg = (imgAction) => {
    if (!this.ctx) return;
    let { img, width, height } = imgAction;
    let { x, y } = this.props.paintStore.getImgOrigin();
    this.ctx.drawImage(img, x, y, width, height);
    // if (this.props.paintStore.split) {
    //   this.resultCtx.drawImage(img, 0, 0, img.width, img.height);
    //   let imgData = this.resultCtx.getImageData(0, 0, img.width, img.height);
    // }
  }

  // 交互事件处理
  onTouchStart = e => {
    console.log('canvas touch start')
    if (e.touches.length === 1) {
      this.onMouseDown(e);
    }
    else if (e.touches.length === 2) {
      this.onMouseUp(e);
      let diff = this.getPinchDiff(e);
      this.props.paintStore.onPinchStart(diff);
    }

    e.preventDefault();
    return false;
  }
  onTouchMove = e => {
    if (e.touches.length === 1) {
      this.onMouseMove(e);
    }
    else if (e.touches.length === 2) {
      this.onMouseUp(e);
      let diff = this.getPinchDiff(e);
      this.props.paintStore.onPinchWithDiff(diff);
    }
    e.preventDefault();
    return false;
  }
  onTouchEnd = e => {
    this.onMouseUp();
    this.props.paintStore.onPinchEnd();
    e.preventDefault();
    return false;
  }
  onMouseDown = e => {
    let point = this.getMousePos(e);
    let { paintStore } = this.props;
    paintStore.onMouseDownAtPoint(point);
    window.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('mouseup', this.onMouseUp)
  };
  onMouseMove = e => {
    let { paintStore } = this.props;
    let point = this.getMousePos(e);
    paintStore.onMouseMoveAtPoint(point);
    e.preventDefault();
    return false;
  };
  onMouseUp = () => {
    this.props.paintStore.onMouseUp();
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)
  };
  onMouseWheel = (e) => {
    let { paintStore } = this.props;
    let delta = e.deltaY ? -e.deltaY : e.wheelDelta;
    if (delta > 0) {
      paintStore.zoomIn();
    }
    else {
      paintStore.zoomOut();
    }
  }
  render() {
    let cursor = 'pointer'
    let { paintStore } = this.props;
    let img = paintStore.imgAction.img;
    if (paintStore.type === ACTION_CHOOSE_ADD) {
      cursor = `url(${process.env.PUBLIC_URL}/add.png),auto`;
    }
    else if (paintStore.type === ACTION_CHOOSE_DEL) {
      cursor = `url(${process.env.PUBLIC_URL}/minus.png),auto`;
    }
    else if (paintStore.type === ACTION_RUBBER) {
      cursor = `url(${process.env.PUBLIC_URL}/rubber.png),auto`;
    }
    else {
      cursor = 'pointer';
    }
    return (
      <div className="paint-canvas-wrapper" style={{ background: `url(${process.env.PUBLIC_URL}/bg.png) left center` }}>
        <div style={{
          display: "block",
          touchAction: "none",
          cursor: cursor,
          width: paintStore.canvasWidth,
          height: paintStore.canvasHeight,
          overflow: 'hidden',
          position: 'relative',
          zIndex: 0
        }}>
          <canvas
            width={paintStore.canvasWidth}
            height={paintStore.canvasHeight}
            style={{
              display: "block",
              touchAction: "none",
              cursor: cursor
            }}
            ref={canvas => {
              if (canvas) {
                this.canvas = canvas;
                this.ctx = canvas.getContext("2d");
              }
            }}
            onMouseDown={this.onMouseDown}

            onTouchStart={this.onTouchStart}
            onTouchMove={this.onTouchMove}
            onTouchEnd={this.onTouchEnd}
            onTouchCancel={this.onTouchEnd}
          />
        </div>
        {paintStore.split && <div className="middle-line"></div>}
        {paintStore.split && <canvas
          width={paintStore.canvasWidth}
          height={paintStore.canvasHeight}
          style={{
            display: "block",
            touchAction: "none"
          }}
          ref={canvas => {
            if (canvas) {
              this.resultCanvas = canvas;
              this.resultCtx = canvas.getContext('2d');
            }
          }}></canvas>}
      </div>
    );
  }
}
export default PaintCanvas;