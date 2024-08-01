import Color from 'color';
import { PureComponent, ReactNode } from 'react';
import clamp from './clamp';
import { Button } from 'components/common/Button';

function generateGreyColors(count: number): Color[] {
  let cc = 255;
  const interval = cc / count;
  const colors = [];
  while (cc > 0) {
    const color = Color({ r: cc, g: cc, b: cc });
    cc -= interval;
    cc = Math.floor(cc);
    colors.unshift(color);
  }
  return colors;
}

function generateRainbowColors(count: number, saturation: number, lightness: number): Color[] {
  const colors = [];
  const interval = 360 / count;
  const ss = clamp(0, saturation, 100);
  const ll = clamp(0, lightness, 100);
  let hue = 0;
  while (hue < 360) {
    const hsl = `hsl(${hue},${ss}%,${ll}%)`;
    const color = Color(hsl);
    colors.unshift(color);
    hue += interval;
  }
  return colors;
}

export class ColorEditor extends PureComponent<
  {
    close: ((val?: string) => void) | null;
    hex?: string | null;
  },
  any,
  any
> {
  _renderColor = (color: Color, index: number): ReactNode => {
    const selectedColor = this.props.hex;
    const hex = color.hex().toLowerCase();
    const active = selectedColor && selectedColor.toLowerCase() === hex;
    return <ColorOption active={!!active} value={hex} key={`${hex}-${index}`} onClick={this._onSelectColor} />;
  };

  _onSelectColor = (hex: string): void => {
    this.props.close?.(hex);
  };

  render() {
    const renderColor = this._renderColor;
    const selectedColor = this.props.hex;
    return (
      <div className='czi-color-editor'>
        <div className='czi-color-editor-section'>
          <Button
            variant='outlined'
            color='secondary'
            size='small'
            fullWidth
            onClick={() => this._onSelectColor('rgba(0,0,0,0)')}
          >
            Transparent
          </Button>
        </div>
        <div className='czi-color-editor-section'>{generateGreyColors(10).map(renderColor)}</div>
        <div className='czi-color-editor-section'>{generateRainbowColors(10, 90, 50).map(renderColor)}</div>
        <div className='czi-color-editor-section'>{generateRainbowColors(30, 70, 70).map(renderColor)}</div>
        <div className='czi-color-editor-section'>{generateRainbowColors(30, 90, 30).map(renderColor)}</div>
      </div>
    );
  }
}

function ColorOption({
  children,
  active,
  value,
  onClick
}: {
  children?: ReactNode;
  active: boolean;
  value: string;
  onClick: (val: string) => void;
}) {
  return (
    <span
      className='czi-color-option'
      style={{ backgroundColor: value }}
      //active={!!active}
      onClick={() => onClick(value)}
    >
      {children}
    </span>
  );
}
