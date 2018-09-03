import React, { Component } from "react";
import { inject, observer } from "mobx-react";
import { ACTION_TARGET, isMobile } from '../../common/common'
import './index.less'
@inject('paintStore')
@observer
class DragSquare extends Component {
  onMouseDown = (e, type) => {
    console.log('on mouseDown')
    this.type = type;
    window.addEventListener('mousemove', this.onMouseMove)
    window.addEventListener('mouseup', this.onMouseUp)
  }
  onMouseMove = (e) => {
    // console.log('on mouseMove')
    let { x, y, width, height } = this.getRealSquare();
    let { paintStore } = this.props;
    let imgW = paintStore.imgAction.width;
    let imgH = paintStore.imgAction.height;
    let imgOrigin = paintStore.getImgOrigin();
    if (this.type === 'nw') {
      let xdiff = e.clientX - x;
      let ydiff = e.clientY - y;
      if (xdiff < imgOrigin.x - x) xdiff = imgOrigin.x - x;
      if (xdiff > width - 10) xdiff = width - 10;
      if (ydiff < imgOrigin.y - y) ydiff = imgOrigin.y - y;
      if (ydiff > height - 10) ydiff = height - 10;
      x += xdiff;
      y += ydiff;
      width -= xdiff;
      height -= ydiff;
    }
    else if (this.type === 'sw') {
      let xdiff = e.clientX - x;
      let ydiff = e.clientY - y - height;
      if (xdiff < imgOrigin.x - x) xdiff = imgOrigin.x - x;
      if (xdiff > width - 10) xdiff = width - 10;
      if (ydiff < 10 - height) ydiff = 10 - height;
      if (ydiff > imgOrigin.y + imgH - y - height) ydiff = imgOrigin.y + imgH - y - height;
      x += xdiff;
      width -= xdiff;
      height += ydiff;
    }
    else if (this.type === 'ne') {
      let xdiff = e.clientX - x - width;
      let ydiff = e.clientY - y;
      if (xdiff < 10 - width) xdiff = 10 - width;
      if (xdiff > imgOrigin.x + imgW - x - width) xdiff = imgOrigin.x + imgW - x - width;
      if (ydiff < imgOrigin.y - y) ydiff = imgOrigin.y - y;
      if (ydiff > height - 10) ydiff = height - 10;
      console.log(xdiff, ydiff)
      width += xdiff;
      y += ydiff;
      height -= ydiff;
    }
    else if (this.type === 'se') {
      let xdiff = e.clientX - x - width;
      let ydiff = e.clientY - y - height;
      if (xdiff < 10 - width) xdiff = 10 - width;
      if (xdiff > imgOrigin.x + imgW - x - width) xdiff = imgOrigin.x + imgW - x - width;
      if (ydiff < 10 - height) ydiff = 10 - height;
      if (ydiff > imgOrigin.y + imgH - y - height) ydiff = imgOrigin.y + imgH - y - height;
      width += xdiff;
      height += ydiff;
    }
    let square = {
      x: (x - imgOrigin.x) / imgW,
      y: (y - imgOrigin.y) / imgH,
      width: width / imgW,
      height: height / imgH
    }
    paintStore.setTargetSquare(square);
  }
  onMouseUp = (e) => {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp)
  }
  onParentMouseDown = (e) => {
    console.log('on parentmousedown')
    let x = e.clientX;
    let y = e.clientY;
    if (e.touches && e.touches.length > 0) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    }
    this.lastDragPoint = {x,y};
    window.addEventListener('mousemove', this.onParentMouseMove,{passive:false})
    window.addEventListener('mouseup', this.onParentMouseUp,{passive:false})
  }
  onParentMouseMove = (e) => {
    console.log('on parent mouseMove')
    let { paintStore } = this.props;
    let point = {x:e.clientX,y:e.clientY};
    if (e.touches && e.touches.length > 0) {
      point = {x: e.touches[0].clientX,y:e.touches[0].clientY};
    }
    let vx = point.x - this.lastDragPoint.x;
    let vy = point.y - this.lastDragPoint.y;
    let { x, y, width, height } = paintStore.targetSquare;
    x += vx / paintStore.imgAction.width;
    y += vy / paintStore.imgAction.height;
    if (x < 0) x = 0;
    if (x + width > 1) x = 1 - width;
    if (y < 0) y = 0;
    if (y + height > 1) y = 1 - height;
    paintStore.setTargetSquare({ x, y, width, height });
    this.lastDragPoint = point;
  }
  onParentMouseUp = (e) => {
    console.log('on parent mouse up')
    window.removeEventListener('mousemove', this.onParentMouseMove)
    window.removeEventListener('mouseup', this.onParentMouseUp)
  }
  getRealSquare = () => {
    let { paintStore } = this.props;
    let { targetSquare } = paintStore;
    let imgW = paintStore.imgAction.width;
    let imgH = paintStore.imgAction.height;
    let imgOrigin = paintStore.getImgOrigin();
    let x = imgOrigin.x + imgW * targetSquare.x;
    let y = imgOrigin.y + imgH * targetSquare.y;
    let width = imgW * targetSquare.width;
    let height = imgH * targetSquare.height;
    return { x, y, width, height };
  }
  render() {
    let { paintStore } = this.props;
    if (!paintStore.imgAction.img) {
      return <div style={{ display: 'none' }}></div>;
    }
    let enabled = paintStore.type === ACTION_TARGET;
    let className = (enabled ? 'enable' : 'disable') + (isMobile ? ' mobile' : '');
    let { x, y, width, height } = this.getRealSquare();
    return (
      <div
        id="drag-square"
        className={className}
        style={{ left: x, top: y, width, height }}
        onMouseDown={(e) => {
          this.onParentMouseDown(e);
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
      >
        <div className="nw square"//左上
          onMouseDown={(e) => {
            this.onMouseDown(e, 'nw');
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
        ></div>
        <div className="sw square"//左下
          onMouseDown={(e) => {
            this.onMouseDown(e, 'sw');
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}></div>
        <div className="ne square"//右上
          onMouseDown={(e) => {
            this.onMouseDown(e, 'ne');
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}></div>
        <div className="se square"//右下
          onMouseDown={(e) => {
            this.onMouseDown(e, 'se');
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}></div>
      </div>)
  }
}
export default DragSquare