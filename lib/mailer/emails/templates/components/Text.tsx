import type { TextProps } from '@react-email/text';
import { Text as ReactEmailText } from '@react-email/text';
import type { CSSProperties, ReactNode } from 'react';

import { blueColor, greyColor2, primaryTextColor } from 'theme/colors';

// copied from theme/fonts.ts because next/fonts doesnt play well with tsx or ts-node. TODO: maybe remove next/fonts?
const defaultFont =
  'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';

type TextVariant = 'body1' | 'h1' | 'h2' | 'subtitle1' | 'caption';

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
  subtitle1: {
    fontSize: 16,
    opacity: 0.65
  },
  caption: {
    fontSize: 12,
    color: greyColor2
  }
};

export default function Text({
  primary = false,
  children,
  variant = 'body1',
  bold = false,
  hideOverflow = false,
  style = {},
  ...props
}: {
  hideOverflow?: boolean;
  variant?: TextVariant;
  bold?: boolean;
  primary?: boolean;
  children: ReactNode;
} & TextProps) {
  return (
    <ReactEmailText
      {...props}
      style={{
        fontFamily: defaultFont,
        color: primary ? blueColor : primaryTextColor,
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
