import type { SyntheticEvent } from 'react';
import React from 'react';

import preventEventDefault from './preventEventDefault';

export type PointerSurfaceProps = {
  active?: boolean | null;
  children?: any;
  className?: string | null;
  disabled?: boolean | null;
  id?: string;
  onClick?: ((val: any, e: SyntheticEvent) => void) | null;
  onMouseEnter?: ((val: any, e: SyntheticEvent) => void) | null;
  style?: object;
  title?: string;
  value?: any;
};

class PointerSurface extends React.PureComponent<PointerSurfaceProps> {
  _clicked = false;

  _mul = false;

  _pressedTarget: Element | null = null;

  _unmounted = false;

  state = { pressed: false };

  componentWillUnmount(): void {
    this._unmounted = true;
    if (this._mul) {
      this._mul = false;
      document.removeEventListener('mouseup', this._onMouseUpCapture, true);
    }
  }

  _onMouseEnter = (e: SyntheticEvent): void => {
    this._pressedTarget = null;
    e.preventDefault();
    const { onMouseEnter, value } = this.props;
    onMouseEnter && onMouseEnter(value, e);
  };

  _onMouseLeave = (e: SyntheticEvent): void => {
    this._pressedTarget = null;
    const mouseUpEvent: any = e;
    this._onMouseUpCapture(mouseUpEvent);
  };

  _onMouseDown = (e: SyntheticEvent): void => {
    e.preventDefault();

    this._pressedTarget = null;
    this._clicked = false;

    // @ts-ignore
    if (e.which === 3 || e.button == 2) {
      // right click.
      return;
    }

    this.setState({ pressed: true });
    this._pressedTarget = e.currentTarget;
    this._clicked = false;

    if (!this._mul) {
      document.addEventListener('mouseup', this._onMouseUpCapture, true);
      this._mul = true;
    }
    console.log('complte on mousedown');
  };

  _onMouseUp = (e: SyntheticEvent): void => {
    e.preventDefault();
    console.log('onMouseUp', this);
    if (this._clicked || e.type === 'keypress') {
      const { onClick, value, disabled } = this.props;
      !disabled && onClick && onClick(value, e);
    }

    this._pressedTarget = null;
    this._clicked = false;
  };

  _onMouseUpCapture = (e: MouseEvent): void => {
    if (this._mul) {
      this._mul = false;
      document.removeEventListener('mouseup', this._onMouseUpCapture, true);
    }
    const target = e.target;
    console.log('_onMouseUpCapture 1', this._clicked, e.target, this._pressedTarget);
    this._clicked =
      this._pressedTarget instanceof HTMLElement &&
      target instanceof HTMLElement &&
      (target === this._pressedTarget || target.contains(this._pressedTarget) || this._pressedTarget.contains(target));
    this.setState({ pressed: false });
    console.log('_onMouseUpCapture 2', this._clicked);
  };

  render() {
    const { className, disabled, active, id, style, title, children } = this.props;
    const { pressed } = this.state;

    let buttonClassName = className || '';
    if (active) buttonClassName += ' active';
    if (disabled) buttonClassName += ' disabled';
    if (pressed) buttonClassName += ' pressed';

    return (
      <span
        //aria-disabled={disabled}
        aria-pressed={pressed}
        className={buttonClassName}
        // disabled={disabled}
        id={id}
        onKeyPress={disabled ? preventEventDefault : this._onMouseUp}
        onMouseDown={disabled ? preventEventDefault : this._onMouseDown}
        onMouseEnter={disabled ? preventEventDefault : this._onMouseEnter}
        onMouseLeave={disabled ? undefined : this._onMouseLeave}
        onMouseUp={disabled ? preventEventDefault : this._onMouseUp}
        role='button'
        style={style}
        tabIndex={disabled ? undefined : 0}
        title={title}
      >
        {children}
      </span>
    );
  }
}

export default PointerSurface;
