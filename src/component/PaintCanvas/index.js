import React, { Component } from "react";
const ACTION_LINE = 'ACTION_LINE';
const ACTION_RUBBER = 'ACTION_RUBBER';
const ACTION_IMG = 'ACTION_IMG';
let LineAction = (points, color, size) => {
  return {
    type: ACTION_LINE,
    points: points,
    color,
    size
  }
}
let ImgAction = (img, x, y, width, height) => {
  return {
    type: ACTION_IMG,
    img, x, y, width, height
  }
}
export default class extends Component {
  static defaultProps = {
    loadTimeOffset: 5,
    brushSize: 6,
    brushColor: "#444",
    canvasWidth: 400,
    canvasHeight: 400,
    disabled: false,
    rubberSize: 8,
    type: ACTION_LINE
  };

  constructor(props) {
    super(props);

    this.isMouseDown = false;
    this.actions = [];
    this.currentActionIdx = -1;
    this.bindEvent();
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
  redraw = () => {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.props.canvasWidth, this.props.canvasHeight);
    }
    if (this.ctx2) {
      this.ctx2.clearRect(0, 0, this.props.canvasWidth, this.props.canvasHeight);
    }
    this.actions.forEach((action, idx) => {
      if (idx <= this.currentActionIdx) {
        this.applyAction(action);
      }
    });
  };
  applyAction = (action) => {
    if (action.type === ACTION_LINE) {
      this.drawLine(action);
    }
    else if (action.type === ACTION_IMG) {
      this.drawImg(action);
    }
  }
  drawLine = (lineAction) => {
    if (!this.ctx) return;
    let ctx = this.ctx;
    let { points, color, size } = lineAction;
    ctx.lineWidth = size;
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
  drawStart = e => {
    this.isMouseDown = true;
    if (this.currentActionIdx < this.actions.length - 1) {
      this.actions.splice(this.currentActionIdx + 1, this.actions.length - this.currentActionIdx);
    }

    let point = this.getMousePos(e);
    if (this.props.type === ACTION_LINE) {
      let lineAction = new LineAction([point], this.props.brushColor, this.props.brushSize);
      this.actions.push(lineAction);
    }
    else if (this.props.type === ACTION_RUBBER) {
      let rubberAction = new LineAction([point], '#fff', this.props.rubberSize);
      this.actions.push(rubberAction);
    }
    else if (this.props.type === ACTION_IMG) {
      let action = this.actions[this.actions.length - 1];
      if (action.type === ACTION_IMG) {
        this.lastDragPoint = point;
      }
    }
    this.currentActionIdx = this.actions.length - 1;
    this.redraw();

    window.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('mouseup', this.drawEnd)
  };
  onMouseMove = e => {
    if (!this.isMouseDown || this.props.disabled) return;

    // calculate the current x, y coords
    let point = this.getMousePos(e);

    let currentAction = this.actions[this.currentActionIdx];

    if (currentAction.type === ACTION_LINE) {
      currentAction.points.push(point);
    }
    else if (currentAction.type === ACTION_IMG) {
      let vx = point.x - this.lastDragPoint.x;
      let vy = point.y - this.lastDragPoint.y;
      currentAction.x += vx;
      currentAction.y += vy;
      this.lastDragPoint = point;
    }
    this.redraw();
  };
  drawEnd = () => {
    this.isMouseDown = false;
  };
  onMouseWheel = (e) => {
    let action = this.actions[this.actions.length - 1];
    if (this.props.type === ACTION_IMG && action.type === ACTION_IMG) {
      let factor = e.wheelDelta > 0 ? 1.1 : 0.9;
      action.width *= factor;
      action.height *= factor;
      this.redraw();
    }
  }
  /**
   * 操作
   */
  clear = () => {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.props.canvasWidth, this.props.canvasHeight);
    }
    if (this.ctx2) {
      this.ctx2.clearRect(0, 0, this.props.canvasWidth, this.props.canvasHeight);
    }
    this.actions = [];
  };

  undo = () => {
    if (this.actions.length > 0) {
      this.currentActionIdx--;
      this.redraw();
      return true;
    }
    return false;
  };
  redo = () => {
    if (this.currentActionIdx < this.actions.length - 1) {
      this.currentActionIdx++;
      this.redraw();
    }
  }
  insertImg = (img) => {
    console.log(img.width)
    let imgAction = new ImgAction(img, 0, 0, img.width, img.height);
    this.actions.push(imgAction);
    this.currentActionIdx = this.actions.length - 1;
    this.redraw();
  }
  render() {
    let cursor = 'pointer'
    if(this.props.type === ACTION_LINE){
      cursor = 'url(./pencil.png),auto';
    }
    else if(this.props.type === ACTION_RUBBER) {
      cursor = 'url(./rubber.png),auto';
    }
    else{
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
          onMouseDown={this.drawStart}
          onTouchStart={this.drawStart}
          onTouchMove={this.onMouseMove}
          onTouchEnd={this.drawEnd}
          onTouchCancel={this.drawEnd}
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
