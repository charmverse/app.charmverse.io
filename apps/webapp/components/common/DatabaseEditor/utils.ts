/* eslint-disable no-plusplus */
import { log } from '@charmverse/core/log';
import type { IntlShape } from 'react-intl';
import { v4 as uuid } from 'uuid';

import type { UIBlockWithDetails } from '@packages/databases/block';
import { createBoard } from '@packages/databases/board';
import { createBoardView } from '@packages/databases/boardView';
import { createCard } from '@packages/databases/card';

import type { IAppWindow } from './types';

declare let window: IAppWindow;

const IconClass = 'octo-icon';
const OpenButtonClass = 'open-button';
const SpacerClass = 'octo-spacer';
const HorizontalGripClass = 'HorizontalGrip';

class Utils {
  static createGuid(): string {
    return uuid();
  }

  // re-use canvas object for better performance
  static canvas: HTMLCanvasElement | undefined;

  static getTextWidth(displayText: string, fontDescriptor: string): number {
    if (displayText !== '') {
      if (!Utils.canvas) {
        Utils.canvas = document.createElement('canvas') as HTMLCanvasElement;
      }
      const context = Utils.canvas.getContext('2d');
      if (context) {
        context.font = fontDescriptor;
        const metrics = context.measureText(displayText);
        return Math.ceil(metrics.width);
      }
    }
    return 0;
  }

  static getFontAndPaddingFromCell = (cell: Element): { fontDescriptor: string; padding: number } => {
    const style = getComputedStyle(cell);
    const padding = Utils.getTotalHorizontalPadding(style);
    return Utils.getFontAndPaddingFromChildren(cell.children, padding);
  };

  // recursive routine to determine the padding and font from its children
  // specifically for the table view
  static getFontAndPaddingFromChildren = (
    children: HTMLCollection,
    pad: number
  ): { fontDescriptor: string; padding: number } => {
    const myResults = {
      fontDescriptor: '',
      padding: pad
    };
    Array.from(children).forEach((element) => {
      const style = getComputedStyle(element);
      if (element.tagName === 'svg') {
        // clientWidth already includes padding
        myResults.padding += element.clientWidth;
        myResults.padding += Utils.getHorizontalBorder(style);
        myResults.padding += Utils.getHorizontalMargin(style);
        myResults.fontDescriptor = Utils.getFontString(style);
      } else {
        switch (element.className) {
          case IconClass:
          case HorizontalGripClass:
            myResults.padding += element.clientWidth;
            break;
          case SpacerClass:
          case OpenButtonClass:
            break;
          default: {
            myResults.fontDescriptor = Utils.getFontString(style);
            myResults.padding += Utils.getTotalHorizontalPadding(style);
            const childResults = Utils.getFontAndPaddingFromChildren(element.children, myResults.padding);
            if (childResults.fontDescriptor !== '') {
              myResults.fontDescriptor = childResults.fontDescriptor;
              myResults.padding = childResults.padding;
            }
          }
        }
      }
    });
    return myResults;
  };

  private static getFontString(style: CSSStyleDeclaration): string {
    if (style.font) {
      return style.font;
    }
    const { fontStyle, fontVariant, fontWeight, fontSize, lineHeight, fontFamily } = style;
    const props = [fontStyle, fontVariant, fontWeight];
    if (fontSize) {
      props.push(lineHeight ? `${fontSize} / ${lineHeight}` : fontSize);
    }
    props.push(fontFamily);
    return props.join(' ');
  }

  private static getHorizontalMargin(style: CSSStyleDeclaration): number {
    return parseInt(style.marginLeft, 10) + parseInt(style.marginRight, 10);
  }

  private static getHorizontalBorder(style: CSSStyleDeclaration): number {
    return parseInt(style.borderLeftWidth, 10) + parseInt(style.borderRightWidth, 10);
  }

  private static getHorizontalPadding(style: CSSStyleDeclaration): number {
    return parseInt(style.paddingLeft, 10) + parseInt(style.paddingRight, 10);
  }

  private static getTotalHorizontalPadding(style: CSSStyleDeclaration): number {
    return Utils.getHorizontalPadding(style) + Utils.getHorizontalMargin(style) + Utils.getHorizontalBorder(style);
  }

  // Date and Time
  private static yearOption(date: Date) {
    const isCurrentYear = date.getFullYear() === new Date().getFullYear();
    return isCurrentYear ? undefined : 'numeric';
  }

  static displayDate(date: Date, intl: IntlShape): string {
    return intl.formatDate(date, {
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    });
  }

  static inputDate(date: Date, intl: IntlShape): string {
    return intl.formatDate(date, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  static displayDateTime(date: Date, intl: IntlShape): string {
    return intl.formatDate(date, {
      year: Utils.yearOption(date),
      month: 'long',
      day: '2-digit',
      hour: 'numeric',
      minute: 'numeric'
    });
  }

  // Errors

  static assert(condition: any, tag = ''): void {
    /// #!if ENV !== "production"
    if (!condition) {
      log.error(`ASSERT [${tag ?? new Error().stack}]`);
    }

    /// #!endif
  }

  static assertFailure(tag = ''): void {
    /// #!if ENV !== "production"
    Utils.assert(false, tag);

    /// #!endif
  }

  static log(message: string): void {
    /// #!if ENV !== "production"
    const timestamp = (Date.now() / 1000).toFixed(2);
    // eslint-disable-next-line no-console
    console.log(`[${timestamp}] ${message}`);

    /// #!endif
  }

  static logError(message: string): void {
    /// #!if ENV !== "production"
    // eslint-disable-next-line no-console
    log.error(message);

    /// #!endif
  }

  // URL

  // static replaceUrlQueryParam(paramName: string, value?: string): void {
  //   const queryString = new URLSearchParams(window.location.search);
  //   const currentValue = queryString.get(paramName) || '';
  //   if (currentValue !== value) {
  //     const newUrl = new URL(window.location.toString());
  //     if (value) {
  //       newUrl.searchParams.set(paramName, value);
  //     } else {
  //       newUrl.searchParams.delete(paramName);
  //     }
  //     window.history.pushState({}, document.title, newUrl.toString());
  //   }
  // }

  static ensureProtocol(url: string): string {
    return url.match(/^.+:\/\//) ? url : `https://${url}`;
  }

  // File names

  static sanitizeFilename(filename: string): string {
    // TODO: Use an industrial-strength sanitizer
    let sanitizedFilename = filename;
    const illegalCharacters = ['\\', '/', '?', ':', '<', '>', '*', '|', '"', '.'];
    illegalCharacters.forEach((character) => {
      sanitizedFilename = sanitizedFilename.replace(character, '');
    });
    return sanitizedFilename;
  }

  static getBaseURL(absolute?: boolean): string {
    let baseURL = window.baseURL || '';
    baseURL = baseURL.replace(/\/+$/, '');
    if (baseURL.indexOf('/') === 0) {
      baseURL = baseURL.slice(1);
    }
    if (absolute) {
      return `${window.location.origin}/${baseURL}`;
    }
    return baseURL;
  }

  static roundTo(num: number, decimalPlaces: number): number {
    return Math.round(num * 10 ** decimalPlaces) / 10 ** decimalPlaces;
  }

  static fixBlock(block: UIBlockWithDetails): UIBlockWithDetails {
    switch (block.type) {
      case 'board':
        return createBoard({ block });
      case 'view':
        return createBoardView(block);
      case 'card':
        return createCard(block);
      default:
        return block;
    }
  }

  static userAgent(): string {
    return window.navigator.userAgent;
  }

  static generateClassName(conditions: Record<string, boolean>): string {
    return Object.entries(conditions)
      .map(([className, condition]) => (condition ? className : ''))
      .filter((className) => className !== '')
      .join(' ');
  }
}

export { Utils };
