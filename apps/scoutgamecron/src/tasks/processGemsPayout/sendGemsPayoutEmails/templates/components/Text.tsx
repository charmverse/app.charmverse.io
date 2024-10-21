import type { TextProps } from '@react-email/text';
import { Text as ReactEmailText } from '@react-email/text';
import type { CSSProperties, ReactNode } from 'react';
import React from 'react';

// Defining the primary color directly here as the following error occurs when importing from theme/colors
// Error: Attempted to call darken() from the server but darken is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.
export const primaryTextColor = '#37352f';

// copied from theme/fonts.ts because next/fonts doesnt play well with tsx or ts-node. TODO: maybe remove next/fonts?
const defaultFont =
  'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';

type TextVariant = 'body1' | 'h3' | 'subtitle1';

const TextStyleConfig: Record<TextVariant, CSSProperties> = {
  body1: {
    fontSize: 18
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  subtitle1: {
    fontSize: 16,
    opacity: 0.65
  }
};

export default function Text({
  children,
  variant = 'body1',
  hideOverflow = false,
  style = {},
  bold = false,
  ...props
}: {
  bold?: boolean;
  primaryColor?: string;
  hideOverflow?: boolean;
  variant?: TextVariant;
  children: ReactNode;
} & TextProps) {
  return (
    <ReactEmailText
      {...props}
      style={{
        fontFamily: defaultFont,
        color: primaryTextColor,
        padding: 0,
        lineHeight: 1.5,
        ...TextStyleConfig[variant],
        ...(bold ? { fontWeight: 'bold' } : {}),
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
