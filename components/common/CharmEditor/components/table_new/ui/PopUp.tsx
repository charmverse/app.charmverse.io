// @flow

import React from 'react';

import PopUpManager from './PopUpManager';
import type { PopUpDetails } from './PopUpManager';
import { atAnchorBottomLeft, atViewportCenter } from './PopUpPosition';
import type { Rect } from './rects';
import uuid from './uuid';

type PositionHandler = (anchorRect?: Rect, bodyRect?: Rect) => Rect;

export type ViewProps = object;

export type PopUpParams = {
  anchor?: any;
  autoDismiss?: boolean | null;
  container?: Element | null;
  modal?: boolean | null;
  onClose?: ((val: any) => void) | null;
  position?: PositionHandler | null;
};

export type PopUpProps = {
  View: React.ComponentType<ViewProps>;
  close: VoidFunction;
  popUpParams: PopUpParams;
  viewProps: any;
};

export type PopUpHandle = {
  close: (val: any) => void;
  update: (props: any) => void;
};

class PopUp extends React.PureComponent<PopUpProps> {
  _bridge: { getDetails: () => PopUpDetails } | null = null;

  _id = uuid();

  componentDidMount(): void {
    this._bridge = { getDetails: this._getDetails };
    this._bridge && PopUpManager.register(this._bridge);
  }

  componentWillUnmount(): void {
    this._bridge && PopUpManager.unregister(this._bridge);
  }

  _getDetails = (): PopUpDetails => {
    const { close, popUpParams } = this.props;
    const { anchor, autoDismiss, position, modal } = popUpParams;
    return {
      anchor,
      autoDismiss: autoDismiss !== false,
      body: document.getElementById(this._id),
      close,
      modal: modal === true,
      position: position || (modal ? atViewportCenter : atAnchorBottomLeft) || null
    };
  };

  render() {
    const dummy = {};
    const { View, viewProps, close } = this.props;
    return (
      <div data-pop-up-id={this._id} id={this._id}>
        <View {...(viewProps || dummy)} close={close} />
      </div>
    );
  }
}

export default PopUp;
