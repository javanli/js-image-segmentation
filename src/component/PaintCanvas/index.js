import React, { Component } from "react";
import { message } from 'antd';
import { inject, observer } from "mobx-react";
import { ACTION_CHOOSE_DEL, ACTION_CHOOSE_ADD, ACTION_RUBBER } from '../../common/common'
import { ACTION_CLEAR } from "../../common/common";
import Hammer from "hammerjs"
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
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };
  /**
   * 绘制相关
   */
  clear = () => {
    let { paintStore } = this.props;
    if (this.ctx) {
      this.ctx.clearRect(0, 0, paintStore.canvasWidth, paintStore.canvasHeight);
    }
    if (paintStore.split && this.ctx2) {
      this.ctx2.clearRect(0, 0, paintStore.canvasWidth, paintStore.canvasHeight);
    }
    this.offscreenCtx.clearRect(0,0,this.offscreenCanvas.width,this.offscreenCanvas.height);
  }
  redraw = () => {
    let { paintStore } = this.props;
    if (paintStore.needRedraw && paintStore.imgAction.img) {
      console.log('redraw',paintStore)
      paintStore.onRedraw();
      this.clear();
      this.drawImg(paintStore.imgAction);
      this.offscreenCanvas.width = paintStore.imgAction.width;
      this.offscreenCanvas.height = paintStore.imgAction.height;
      paintStore.actions.forEach((action, idx) => {
        if (idx <= paintStore.actionIndex) {
          this.applyAction(action);
        }
      });
      let {width, height } = paintStore.imgAction;
      let {x,y} = paintStore.getImgOrigin();
      this.ctx.globalAlpha = 0.4;
      this.ctx.drawImage(this.offscreenCanvas,x,y,width,height);
      this.ctx.globalAlpha = 1.0;
    }
    window.requestAnimationFrame(this.redraw);
  };
  applyAction = (action) => {
    let { paintStore } = this.props;
    if (action.type === ACTION_CHOOSE_ADD) {
      this.drawLine(action, paintStore.addColor);
    }
    else if (action.type === ACTION_CHOOSE_DEL) {
      this.drawLine(action, paintStore.delColor);
    }
    else if (action.type === ACTION_RUBBER) {
      this.offscreenCtx.globalCompositeOperation = "destination-out";
      this.drawLine(action, '#fff');
      this.offscreenCtx.globalCompositeOperation = "source-over";
    }
    else if (action.type === ACTION_CLEAR) {
      this.offscreenCtx.clearRect(0,0,this.offscreenCanvas.width,this.offscreenCanvas.height);
    }

  }
  drawLine = (lineAction, color) => {
    let { paintStore } = this.props;
    let ctx = this.offscreenCtx;
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
    let {x,y} = this.props.paintStore.getImgOrigin();
    this.ctx.drawImage(img, x, y, width, height);
    if(this.props.paintStore.split){
      this.ctx2.drawImage(img, x, y, width, height);
    }
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
    this.isMouseDown = false;
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('mouseup', this.onMouseUp)
  };
  onMouseWheel = (e) => {
    let { paintStore } = this.props;
    if (e.wheelDelta > 0) {
      paintStore.zoomIn();
    }
    else {
      paintStore.zoomOut();
    }
  }
  render() {
    let cursor = 'pointer'
    let { paintStore } = this.props;
    if (paintStore.type === ACTION_CHOOSE_ADD) {
      cursor = 'url(./add.png),auto';
    }
    else if (paintStore.type === ACTION_CHOOSE_DEL) {
      cursor = 'url(./minus.png),auto';
    }
    else if (paintStore.type === ACTION_RUBBER) {
      cursor = 'url(./rubber.png),auto';
    }
    else {
      cursor = 'pointer';
    }
    return (
      <div className="paint-canvas-wrapper" style={{background: "url(./bg.png) left center"}}>
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
              let hm = new Hammer(canvas);
              console.log(hm)
              hm.on('pinch',() => {
                console.log('pinch');
                message.info('pinch',1);
              })
              hm.on('pan',() => {
                console.log('pan')
                message.info('pan',1);
              })
            }
          }}
          onMouseDown={this.onMouseDown}

          // onTouchStart={this.onMouseDown}
          // onTouchMove={this.onMouseMove}
          // onTouchEnd={this.onMouseUp}
          // onTouchCancel={this.onMouseUp}
        />
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
              this.ctx2 = canvas.getContext("2d");
            }
          }}></canvas>}
      </div>
    );
  }
}
export default PaintCanvas;