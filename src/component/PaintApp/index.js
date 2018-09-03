import React, { Component } from "react";
import { Radio, Button, Modal, Upload, Icon, message, Slider, Tooltip } from 'antd';
import PaintCanvas from "../PaintCanvas";
import DragSquare from '../DragSquare'
import { ACTION_DRAG, ACTION_CHOOSE_DEL, ACTION_CHOOSE_ADD, ACTION_RUBBER, ACTION_TARGET, isMobile } from '../../common/common'
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
      <div className="slider-wrapper" style={{ height: size + 4 }}>
        <div className="indicator-wrapper">
          <div className="indicator" style={style}></div>
        </div>
        <Slider min={1} max={30} onChange={(value) => { console.log(value); paintStore.setSize(value); }} value={size} />
      </div> : null);
    return slider;
  }
  render() {
    let { paintStore } = this.props;
    let slider = this.getSlider();
    return (
      <div className={"paint-app" + (isMobile ? ' mobile' : '')}>
        <div className="tool-bar">
          {isMobile ?
            <Upload
              name='file'
              multiple={false}
              accept="image/*"
              beforeUpload={this.handleImgUpload}
              fileList={null}>
              <Button type="primary">
                <Icon type="upload" /> 导入
              </Button>
            </Upload>
            : <Button
              type="primary"
              onClick={() => { paintStore.setShowUploadModal(true) }}>
              <Icon type="upload" />导入</Button>}
          <Radio.Group
            className="tool-group"
            value={paintStore.type}
            onChange={(e) => { paintStore.setActionType(e.target.value) }}>
            <Tooltip trigger={isMobile ? 'contextMenu' : 'hover'} placement="bottom" title="绿色画笔">
              <Radio.Button
                className="tool-item add"
                value={ACTION_CHOOSE_ADD}
              ></Radio.Button>
            </Tooltip>
            <Tooltip trigger={isMobile ? 'contextMenu' : 'hover'} placement="bottom" title="红色画笔">
              <Radio.Button
                className="tool-item minus"
                value={ACTION_CHOOSE_DEL}
              ></Radio.Button>
            </Tooltip>
            <Tooltip trigger={isMobile ? 'contextMenu' : 'hover'} placement="bottom" title="橡皮">
              <Radio.Button
                className="tool-item rubber"
                value={ACTION_RUBBER}></Radio.Button></Tooltip>
            <Tooltip trigger={isMobile ? 'contextMenu' : 'hover'} placement="bottom" title="拖拽">
              <Radio.Button
                className="tool-item hand"
                value={ACTION_DRAG}></Radio.Button>
            </Tooltip>
            <Tooltip trigger={isMobile ? 'contextMenu' : 'hover'} placement="bottom" title="选择目标区域">
              <Radio.Button
                className="tool-item target"
                value={ACTION_TARGET}></Radio.Button>
            </Tooltip>
          </Radio.Group>
          <Button.Group className="tool-group">
            <Tooltip trigger={isMobile ? 'contextMenu' : 'hover'} placement="bottom" title="后退">
              <Button
                className="tool-item"
                disabled={!paintStore.canUndo}
                onClick={() => { paintStore.undo() }}>
                <div className="icon backward"></div></Button>
            </Tooltip>
            <Tooltip trigger={isMobile ? 'contextMenu' : 'hover'} placement="bottom" title="前进">
              <Button
                className="tool-item"
                disabled={!paintStore.canRedo}
                onClick={() => { paintStore.redo() }}>
                <div className="icon forward"></div></Button></Tooltip>
            <Tooltip trigger={isMobile ? 'contextMenu' : 'hover'} placement="bottom" title="清除">
              <Button
                className="tool-item clear"
                onClick={() => { paintStore.clear() }}></Button></Tooltip>
          </Button.Group>
          <Button.Group className="tool-group" id="size-control">
            <Tooltip trigger={isMobile ? 'contextMenu' : 'hover'} placement="bottom" title="放大">
              <Button className="zoomin" onClick={() => { paintStore.zoomIn() }}></Button></Tooltip>
            <Tooltip trigger={isMobile ? 'contextMenu' : 'hover'} placement="bottom" title="缩小">
              <Button className="zoomout" onClick={() => { paintStore.zoomOut() }}></Button></Tooltip>
            <Tooltip trigger={isMobile ? 'contextMenu' : 'hover'} placement="bottom" title="最佳比例">
              <Button className="fit" onClick={() => { paintStore.resetImgSize() }}></Button></Tooltip>
          </Button.Group>
        </div>
        {slider}
        <PaintCanvas></PaintCanvas>
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
            <Button type="primary" style={{ marginTop: 20 }}>
              <Icon type="upload" /> 选择
            </Button>
          </Upload>
        </Modal>
        <DragSquare></DragSquare>
      </div>
    );
  }
}

export default PaintApp;