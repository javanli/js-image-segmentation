# canvas-paint
canvas 画笔项目，对标[clippingMagic](https://clippingmagic.com/)。仅实现基本交互与绘制，不包括抠图部分。

# 相关说明
本项目使用React最常用的框架creat-react-app开发，UI组件使用了Antd。

```
目录结构
src
├─common //定义一些公用方法与全局变量
├─component
│  ├─DragSquare //用于拖拽的矩形框
│  ├─PaintApp //项目主入口，工具栏写在这里
│  └─PaintCanvas //canvas绘图，主要负责渲染
├─res //一些图片资源
└─store //全局状态管理，基本上所有数据都在这里管理
```
# build
1. 环境准备
  * 安装node,npm
  * 安装依赖
    * `npm i`
2. 本地调试
  * `npm run start`将在本地`http://localhost:3000/`运行
3. 打包
  * `npm run build`将打包到`./build`目录下

# 部署
本项目作为一个纯H5应用，将build目录下的文件作为静态资源部署即可。

如果部署网址非网站根目录，需配置`package.json`中`homepage`字段，如`"homepage": "http://demos.javanli.cn/paint",`
