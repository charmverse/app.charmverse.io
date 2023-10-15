import type { TextProps } from '@react-email/text';
import { Text as ReactEmailText } from '@react-email/text';
import type { ReactNode } from 'react';

import { primaryTextColor } from 'theme/colors';

// copied from theme/fonts.ts because next/fonts doesnt play well with tsx or ts-node. TODO: maybe remove next/fonts?
const defaultFont =
  'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"';

export default function Text({ children, ...props }: { children: ReactNode } & TextProps) {
  return (
    <ReactEmailText
      {...props}
      style={{
        fontFamily: defaultFont,
        color: primaryTextColor,
        fontSize: 18,
        lineHeight: 1.75,
        ...(props.style ?? {})
      }}
    >
      {children}
    </ReactEmailText>
  );
}
