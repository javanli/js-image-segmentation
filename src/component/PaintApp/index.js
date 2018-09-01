import React, { Component } from "react";
import { Radio, Button, Modal, Upload, Icon, message, Row, Col, Slider, InputNumber } from 'antd';
import PaintCanvas from "../PaintCanvas";
import { ACTION_DRAG, ACTION_CHOOSE_DEL, ACTION_CHOOSE_ADD, ACTION_RUBBER } from '../../common/common'
import { inject, observer } from "mobx-react";
import './index.less'
@inject('paintStore')
@observer
class PaintApp extends Component {
  handleImgUpload = (file) => {
    let { paintStore } = this.props;
    if (paintStore.imgAction.img) {
      Modal.confirm({
        onOk: () => {
          this.useImgFile(file);
        },
        title: '提示',
        content: '插入新图片将会清空当前内容，是否确认？',
        okText: '确认',
        cancelText: '取消'
      })
    }
    else {
      this.useImgFile(file);
    }
    return false;
  }
  useImgFile = (file) => {
    let { paintStore } = this.props;
    let reader = new FileReader();
    reader.readAsDataURL(file)
    reader.onload = () => {
      let img = new Image();
      img.src = reader.result;
      img.onload = () => {
        paintStore.insertImg(img);
        paintStore.setShowUploadModal(false);
        paintStore.setActionType(ACTION_DRAG);
      }
      img.onerror = () => {
        message.error('请选择图片文件！', 1);
      }
    }
  }
  getSlider = () => {
    let { paintStore } = this.props;
    let isShowSizeSlider = paintStore.type === ACTION_CHOOSE_ADD || paintStore.type === ACTION_CHOOSE_DEL || paintStore.type === ACTION_RUBBER;
    let style, size;
    if (paintStore.type === ACTION_CHOOSE_ADD) {
      size = paintStore.brushSize;
      style = {
        width: size,
        height: size,
        backgroundColor: paintStore.addColor,
        borderRadius: size / 2
      }
    }
    else if (paintStore.type === ACTION_CHOOSE_DEL) {
      size = paintStore.brushSize;
      style = {
        width: size,
        height: size,
        backgroundColor: paintStore.delColor,
        borderRadius: size / 2
      }
    }
    else if (paintStore.type === ACTION_RUBBER) {
      size = paintStore.rubberSize;
      style = {
        width: size,
        height: size,
        border: '1px solid black'
      }
    }
    let slider = (isShowSizeSlider ?
      <div className="slider-wrapper" style={{height:size+4}}>
        <div className="indicator-wrapper">
          <div className="indicator" style={style}></div>
        </div>
        <Slider min={1} max={40} onChange={(value) => { console.log(value); paintStore.setSize(value); }} value={size} />
        {/* size:
        <InputNumber
          min={1}
          max={20}
          value={size}
          onChange={()=>{}}
        /> */}
      </div> : null);
    return slider;
  }
  render() {
    let { paintStore } = this.props;
    let canvasWidth = Math.floor(paintStore.windowSize.x / 2) - 1;
    let canvasHeight = paintStore.windowSize.y;
    let slider = this.getSlider();
    return (
      <div className="paint-app">
        <div className="tool-bar">
          <Button
            type="primary"
            onClick={() => { paintStore.setShowUploadModal(true) }}>
            <Icon type="upload" />导入</Button>
          <Radio.Group
            className="tool-group"
            value={paintStore.type}
            onChange={(e) => { paintStore.setActionType(e.target.value) }}>
            <Radio.Button
              className="tool-item"
              style={{ background: "white url(/add.png) no-repeat center center" }}
              value={ACTION_CHOOSE_ADD}
            ></Radio.Button>
            <Radio.Button
              className="tool-item"
              style={{ background: "white url(/minus.png) no-repeat center center" }}
              value={ACTION_CHOOSE_DEL}
            ></Radio.Button>
            <Radio.Button
              className="tool-item"
              style={{ background: "white url(/rubber.png) no-repeat center center" }}
              value={ACTION_RUBBER}></Radio.Button>
            <Radio.Button
              className="tool-item"
              style={{ background: "white url(/hand.png) no-repeat center center" }}
              value={ACTION_DRAG}></Radio.Button>
          </Radio.Group>
          <Button.Group className="tool-group">
            <Button
              className="tool-item"
              disabled={!paintStore.canUndo}
              onClick={() => { paintStore.undo() }}>
              <div className="icon" style={{ background: "url(/backward.png) no-repeat center center transparent" }}></div></Button>
            <Button
              className="tool-item"
              disabled={!paintStore.canRedo}
              onClick={() => { paintStore.redo() }}>
              <div className="icon" style={{ background: "url(/forward.png) no-repeat center center transparent" }}></div></Button>
            <Button
              className="tool-item"
              style={{ background: "white url(/clear.png) no-repeat center center" }}
              onClick={() => { paintStore.clear() }}></Button>
          </Button.Group>
          <Button.Group className="tool-group">
            <Button style={{ background: "white url(/zoomin.png) no-repeat center center" }} onClick={() => { paintStore.zoomIn() }}></Button>
            <Button style={{ background: "white url(/zoomout.png) no-repeat center center" }} onClick={() => { paintStore.zoomOut() }}></Button>
            <Button style={{ background: "white url(/fit.png) no-repeat center center" }} onClick={() => { paintStore.resetImgSize() }}></Button>
          </Button.Group>
          {slider}
        </div>
        <div className="paint-canvas-wrapper">
          <PaintCanvas
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          ></PaintCanvas>
        </div>
        <Modal
          title="选择图片"
          visible={paintStore.showUploadModal}
          footer={null}
          onOk={() => {
            paintStore.setShowUploadModal(false);
          }}
          onCancel={() => {
            paintStore.setShowUploadModal(false);
          }}
        >
          <Upload.Dragger
            name='file'
            multiple={false}
            accept="image/*"
            beforeUpload={this.handleImgUpload}
            fileList={null}>
            <p className="ant-upload-drag-icon">
              <Icon type="inbox" />
            </p>
            <p className="ant-upload-text">拖拽文件到这里</p>
          </Upload.Dragger>
          <Upload
            name='file'
            multiple={false}
            accept="image/*"
            beforeUpload={this.handleImgUpload}
            fileList={null}>
            <Button type="primary">
              <Icon type="upload" /> 选择
            </Button>
          </Upload>
        </Modal>
      </div>
    );
  }
}

export default PaintApp;