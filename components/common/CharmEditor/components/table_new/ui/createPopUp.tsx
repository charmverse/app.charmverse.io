import React from 'react';

import { v1 as uuid } from 'uuid';
import { createRoot } from 'react-dom/client';
import { ClickAwayListener, Popper } from '@mui/material';

export type PopUpParams = {
  anchor?: any;
  container?: Element | null;
  modal?: boolean | null;
  onClose?: ((val: any) => void) | null;
  placement?: 'top-end' | 'right';
};

export type PopUpHandle<T> = {
  close: (val?: any) => void;
  update: (props: T) => void;
};

let modalsCount = 0;
let popUpsCount = 0;

const Z_INDEX_BASE = 9999;
const MODAL_MASK_ID = `pop-up-modal-mask-${uuid()}`;

function showModalMask(): void {
  const root: any = document.body || document.documentElement;
  let element = document.getElementById(MODAL_MASK_ID);
  if (!element) {
    element = document.createElement('div');
    element.id = MODAL_MASK_ID;
    element.className = 'czi-pop-up-modal-mask';
    element.setAttribute('data-mask-type', 'czi-pop-up-modal-mask');
    element.setAttribute('role', 'dialog');
    element.setAttribute('aria-modal', 'true');
  }

  if (root && !element.parentElement) {
    root.appendChild(element);
  }
  const style: any = element.style;

  const selector = '.czi-pop-up-element[data-pop-up-modal]';
  const zIndex = Array.from(document.querySelectorAll(selector)).reduce(
    (zz, el) => Math.max(zz, Number((el as HTMLElement).style.zIndex)),
    0
  );

  style.zIndex = zIndex - 1;
}

function hideModalMask(): void {
  const element = document.getElementById(MODAL_MASK_ID);
  if (element && element.parentElement) {
    element.parentElement.removeChild(element);
  }
}

function getRootElement(id: string, forceCreation: boolean, popUpParams?: PopUpParams | null): HTMLElement | null {
  const root: any = (popUpParams && popUpParams.container) || document.body || document.documentElement;
  let element = document.getElementById(id);
  if (!element && forceCreation) {
    element = document.createElement('div');
  }

  if (!element) {
    return null;
  }

  if (popUpParams && popUpParams.modal) {
    element.setAttribute('data-pop-up-modal', 'y');
  }

  element.className = 'czi-pop-up-element czi-vars';
  element.id = id;

  const style: any = element.style;
  const modalZIndexOffset = popUpParams && popUpParams.modal ? 1 : 0;
  if (!(popUpParams && popUpParams.container)) {
    style.zIndex = Z_INDEX_BASE + popUpsCount * 3 + modalZIndexOffset;
  }

  // Populates the default ARIA attributes here.
  // http://accessibility.athena-ict.com/aria/examples/dialog.shtml
  element.setAttribute('role', 'dialog');
  element.setAttribute('aria-modal', 'true');
  if (root && !element.parentElement) {
    root.appendChild(element);
  }
  return element;
}

function renderPopUp<T>(
  rootId: string,
  close: VoidFunction,
  View: (props: T) => React.ReactNode,
  viewProps: T,
  popUpParams: PopUpParams
): void {
  const rootNode = getRootElement(rootId, true, popUpParams);
  if (rootNode) {
    // @ts-ignore - save a reference for later
    rootNode._reactContainer ||= createRoot(rootNode);
    // @ts-ignore
    const reactRoot = rootNode._reactContainer;
    const component = (
      // <ClickAwayListener onClickAway={close}>
      <Popper open anchorEl={popUpParams.anchor} placement={popUpParams.placement}>
        <View {...viewProps} close={close} />
      </Popper>
      // </ClickAwayListener>
    );
    reactRoot.render(component);
  }

  if (modalsCount > 0) {
    showModalMask();
  } else {
    hideModalMask();
  }
}

function unrenderPopUp(rootId: string): void {
  const rootNode = getRootElement(rootId, false);
  if (rootNode) {
    setTimeout(() => {
      // @ts-ignore
      rootNode._reactContainer?.unmount();
      // @ts-ignore
      rootNode._reactContainer = null;
      rootNode.parentElement && rootNode.parentElement.removeChild(rootNode);
    });
  }

  if (modalsCount === 0) {
    hideModalMask();
  }
}

export default function createPopUp<T>(
  View: (props: T) => React.ReactNode,
  viewProps?: T | null,
  popUpParams?: PopUpParams | null
): PopUpHandle<T> {
  const rootId = uuid();

  let handle: PopUpHandle<T> | null = null;
  let currentViewProps = viewProps;

  viewProps = viewProps || ({} as T);
  popUpParams = popUpParams || {};

  const modal = popUpParams.modal || !popUpParams.anchor;
  popUpParams.modal = modal;

  popUpsCount++;
  if (modal) {
    modalsCount++;
  }

  const closePopUp = (value?: any) => {
    if (!handle) {
      return;
    }

    if (modal) {
      modalsCount--;
    }
    popUpsCount--;

    handle = null;
    unrenderPopUp(rootId);

    const onClose = popUpParams && popUpParams.onClose;
    onClose && onClose(value);
  };

  const typedRenderPopUp = renderPopUp as (
    rootId: string,
    close: VoidFunction,
    View: (props: T) => React.ReactNode,
    viewProps: T,
    popUpParams: PopUpParams
  ) => void;
  const render = typedRenderPopUp.bind(null, rootId, closePopUp, View);
  const emptyObj = {} as T;

  handle = {
    close: closePopUp,
    update: (nextViewProps) => {
      currentViewProps = nextViewProps;
      render(currentViewProps || emptyObj, popUpParams || emptyObj);
    }
  };

  render(currentViewProps || emptyObj, popUpParams || emptyObj);
  return handle;
}
