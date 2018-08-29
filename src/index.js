import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import PaintApp from './component/PaintApp';
import PaintStore from './store/PaintStore'
let paintStore = new PaintStore()
let stores = {
  paintStore
}
ReactDOM.render((
  <Provider {...stores}>
    <PaintApp />
  </Provider>), document.getElementById('root'));
