import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import { ACTION_DRAG, ACTION_CHOOSE_DEL, ACTION_CHOOSE_ADD, ACTION_RUBBER } from '../../common/common'
import { ACTION_CLEAR } from "../../common/common";
@inject('paintStore')
@observer
class PaintCanvas extends Component {
  static defaultProps = {
    canvasWidth: 400,
    canvasHeight: 400,
    disabled: false
  };

  constructor(props) {
    super(props);
    this.bindEvent();
    window.requestAnimationFrame(this.redraw);
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
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.props.canvasWidth, this.props.canvasHeight);
    }
    if (this.ctx2) {
      this.ctx2.clearRect(0, 0, this.props.canvasWidth, this.props.canvasHeight);
    }
  }
  redraw = () => {
    let { paintStore } = this.props;
    if (paintStore.needRedraw) {
      console.log('redraw',paintStore)
      paintStore.onRedraw();
      this.clear();
      if (paintStore.imgAction.img) {
        this.drawImg(paintStore.imgAction);
      }
      paintStore.actions.forEach((action, idx) => {
        if (idx <= paintStore.actionIndex) {
          this.applyAction(action);
        }
      });
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
      this.drawLine(action, '#fff');
    }
    else if (action.type === ACTION_CLEAR) {
      this.clear();
    }

  }
  drawLine = (lineAction, color) => {
    if (!this.ctx) return;
    let { paintStore } = this.props;
    let ctx = this.ctx;
    let { points, size } = lineAction;
    points = paintStore.points2realPoints(points);
    ctx.lineWidth = size * paintStore.scale;
    ctx.strokeStyle = color;
    this.ctx.lineCap = "round";
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
    let { img, x, y, width, height } = imgAction;
    this.ctx.drawImage(img, x, y, width, height);
    this.ctx2.drawImage(img, x, y, width, height);
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
    if (paintStore.type === ACTION_CHOOSE_ADD || paintStore.type === ACTION_CHOOSE_DEL) {
      cursor = 'url(./pencil.png),auto';
    }
    else if (paintStore.type === ACTION_RUBBER) {
      cursor = 'url(./rubber.png),auto';
    }
    else {
      cursor = 'pointer';
    }
    return (
      <div className="paint-canvas-wrapper">
        <canvas
          width={this.props.canvasWidth}
          height={this.props.canvasHeight}
          style={{
            display: "block",
            background: "#fff",
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
          onTouchStart={this.onMouseDown}
          onTouchMove={this.onMouseMove}
          onTouchEnd={this.onMouseUp}
          onTouchCancel={this.onMouseUp}
        />
        <canvas
          width={this.props.canvasWidth}
          height={this.props.canvasHeight}
          style={{
            display: "block",
            background: "#fff",
            touchAction: "none"
          }}
          ref={canvas => {
            if (canvas) {
              this.ctx2 = canvas.getContext("2d");
            }
          }}></canvas>
      </div>
    );
  }
}
export default PaintCanvas;