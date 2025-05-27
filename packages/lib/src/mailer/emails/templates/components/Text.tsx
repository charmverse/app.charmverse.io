import { charmBlue as blueColor } from '@packages/config/colors';
import type { TextProps } from '@react-email/text';
import { Text as ReactEmailText } from '@react-email/text';
import type { CSSProperties, ReactNode } from 'react';
import * as React from 'react';

// taken from theme/colors.ts
const primaryTextColor = '#37352f';
const secondaryTextColor = '#888';

// copied from theme/fonts.ts because next/fonts doesnt play well with tsx or ts-node. TODO: maybe remove next/fonts?
const defaultFont =
  'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';

type TextVariant = 'body1' | 'h1' | 'h2' | 'h3' | 'subtitle1' | 'caption';

const TextStyleConfig: Record<TextVariant, CSSProperties> = {
  body1: {
    fontSize: 18
  },
  h1: {
    fontSize: 28,
    fontWeight: 'bold'
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  subtitle1: {
    fontSize: 16,
    opacity: 0.65
  },
  caption: {
    fontSize: 14,
    color: secondaryTextColor
  }
};

export default function Text({
  primary = false,
  primaryColor = blueColor,
  children,
  variant = 'body1',
  bold = false,
  hideOverflow = false,
  style = {},
  ...props
}: {
  primaryColor?: string;
  hideOverflow?: boolean;
  variant?: TextVariant;
  bold?: boolean;
  primary?: boolean;
  children?: ReactNode;
} & TextProps) {
  return (
    <ReactEmailText
      {...props}
      style={{
        fontFamily: defaultFont,
        color: primary ? primaryColor : primaryTextColor,
        fontWeight: bold ? 'bold' : 'normal',
        padding: 0,
        lineHeight: 1.5,
        ...TextStyleConfig[variant],
        ...(hideOverflow
          ? {
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }
          : {}),
        ...style
      }}
    >
      {children}
    </ReactEmailText>
  );
}
