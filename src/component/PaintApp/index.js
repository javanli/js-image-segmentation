import React, { Component } from "react";
import { Radio, Button } from 'antd';
import PaintCanvas from "../PaintCanvas";
import { ACTION_DRAG, ACTION_CHOOSE_DEL, ACTION_CHOOSE_ADD, ACTION_RUBBER } from '../../common/common'
import { inject, observer } from "mobx-react";
import './index.less'
@inject('paintStore')
@observer
class PaintApp extends Component {
  render() {
    let { paintStore } = this.props;
    let canvasWidth = Math.floor(paintStore.windowSize.x / 2) - 1;
    let canvasHeight = paintStore.windowSize.y;
    return (
      <div className="paint-app">
        <div className="tool-bar">
          <Radio.Group value={paintStore.type} onChange={(e) => { paintStore.setActionType(e.target.value) }}>
            <Radio.Button
              className="tool-item"
              style={{ backgroundColor: '#0f0' }}
              value={ACTION_CHOOSE_ADD}
            ></Radio.Button>
            <Radio.Button
              className="tool-item"
              style={{ backgroundColor: '#f00' }}
              value={ACTION_CHOOSE_DEL}
            ></Radio.Button>
            <Radio.Button className="tool-item" value={ACTION_RUBBER}>橡皮</Radio.Button>
            <Radio.Button className="tool-item" value={ACTION_DRAG}>拖拽</Radio.Button>
          </Radio.Group>
          <Button.Group>
            <Button className="tool-item" onClick={() => { paintStore.redo() }}>前进</Button>
            <Button className="tool-item" onClick={() => { paintStore.undo() }}>后退</Button>
            <Button className="tool-item" onClick={() => { paintStore.clear() }}>清除</Button>
          </Button.Group>
          <Button.Group>
            <Button onClick={() => { paintStore.zoomIn() }}>放大</Button>
            <Button onClick={() => { paintStore.zoomOut() }}>缩小</Button>
            <Button onClick={() => { paintStore.resetImgSize() }}>最佳比例</Button>
          </Button.Group>
          <Button.Group>
            <Button
              className="tool-item"
              onClick={paintStore.sizeUp}
            >+</Button>
            <Button
              className="tool-item"
              onClick={paintStore.sizeDown}
            >-</Button>
          </Button.Group>
          <input className="tool-item" type="file" style={{ width: 200 }}
            onChange={(e) => {
              let files = e.target.files;
              let reader = new FileReader();
              reader.readAsDataURL(files[0])
              reader.onload = () => {
                let img = new Image();
                img.src = reader.result;
                img.onload = () => {
                  paintStore.insertImg(img);
                }
              }
            }} />
        </div>
        <div className="paint-canvas-wrapper">
          <PaintCanvas
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          ></PaintCanvas>
        </div>
      </div>
    );
  }
}

export default PaintApp;