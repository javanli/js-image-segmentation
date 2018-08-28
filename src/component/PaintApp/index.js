import React, { Component } from "react";
import { Button } from 'antd';
import PaintCanvas from "../PaintCanvas";
import './index.css'
const ButtonGroup = Button.Group;
export default class extends Component {
  constructor(props) {
    super(props);

    this.state = {
      type: 'ACTION_LINE',
      brushSize: 10,
      brushColor: "#f005",
      rubberSize: 12,
    }
  }
  render() {
    return (
      <div className="paint-app">
        <ButtonGroup>
          <Button
            className="tool-item"
            style={{ width: 20, backgroundColor: '#0f0' }}
            onClick={() => { this.setState({ brushColor: '#0f05', type: 'ACTION_LINE' }) }}
          ></Button>
          <Button
            className="tool-item"
            style={{ width: 20, backgroundColor: '#f00' }}
            onClick={() => { this.setState({ brushColor: '#f005', type: 'ACTION_LINE' }) }}
          ></Button>
          <Button className="tool-item" onClick={() => { this.setState({ type: 'ACTION_RUBBER' }) }}>橡皮</Button>
          <Button>拖拽</Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button className="tool-item" onClick={() => { this.paintCanvas.redo() }}>前进</Button>
          <Button className="tool-item" onClick={() => { this.paintCanvas.undo() }}>后退</Button>
          <Button className="tool-item" onClick={() => { this.paintCanvas.clear() }}>清除</Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button>放大</Button>
          <Button>缩小</Button>
          <Button>最佳比例</Button>
        </ButtonGroup>
        <div className="tool-bar">
          <button
            className="tool-item"
            style={{ width: 20 }}
            onClick={() => {
              if (this.state.type === 'ACTION_LINE') {
                this.setState({ brushSize: this.state.brushSize + 1 })
              }
              else if (this.state.type === 'ACTION_RUBBER') {
                this.setState({ rubberSize: this.state.rubberSize + 1 })
              }
            }}
          >+</button>
          <button
            className="tool-item"
            style={{ width: 20 }}
            onClick={() => {
              if (this.state.type === 'ACTION_LINE') {
                this.setState({ brushSize: this.state.brushSize - 1 })
              }
              else if (this.state.type === 'ACTION_RUBBER') {
                this.setState({ rubberSize: this.state.rubberSize - 1 })
              }
            }}
          >-</button>
          
          <input className="tool-item" type="file" style={{ width: 200 }}
            onChange={(e) => {
              let files = e.target.files;
              let reader = new FileReader();
              reader.readAsDataURL(files[0])
              reader.onload = () => {
                let img = new Image();
                img.src = reader.result;
                this.setState({ type: 'ACTION_IMG' });
                img.onload = () => {
                  this.paintCanvas.insertImg(img);
                }
              }
            }} />
        </div>
        <div className="paint-canvas-wrapper">
          <PaintCanvas {...this.state} ref={canvasDraw => (this.paintCanvas = canvasDraw)}></PaintCanvas>
        </div>
      </div>
    );
  }
}
