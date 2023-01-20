import type { ReactNode } from 'react';
import React, { forwardRef, useEffect, useRef } from 'react';

import type { EditableProps, Focusable } from './editable';
import { useEditable } from './editable';

function getBorderWidth(style: CSSStyleDeclaration): number {
  return parseInt(style.borderTopWidth || '0', 10) + parseInt(style.borderBottomWidth || '0', 10);
}

// Max rows feature is used only in the context where we list multiple items (such as a table view)
function EditableArea(
  props: EditableProps & { maxRows?: number; children?: ReactNode; readOnly?: boolean },
  ref: React.Ref<Focusable>
): JSX.Element {
  const elementRef = useRef<HTMLTextAreaElement>(null);
  const referenceRef = useRef<HTMLTextAreaElement>(null);
  const heightRef = useRef(0);
  const elementProps = useEditable(props, ref, elementRef);

  useEffect(() => {
    if (!elementRef.current || !referenceRef.current) {
      return;
    }

    const height = referenceRef.current.scrollHeight;
    const textarea = elementRef.current;

    if (height > 0 && height !== heightRef.current) {
      const style = getComputedStyle(textarea);
      const borderWidth = getBorderWidth(style);

      if (!props.maxRows) {
        // Directly change the height to avoid circular rerenders
        textarea.style.height = `${String(height + borderWidth)}px`;

        heightRef.current = height;
      }
    }

    // Next 4 lines are needed so that the textarea looks aligned with other table items
    if (!textarea.value) {
      textarea.rows = 1;
    }
    textarea.style.lineHeight = '24px';

    if (props.autoExpand && elementRef.current) {
      elementRef.current.style.width = '100%';
    }

    //    elementRef.current?.style.setProperty('word-break', '');
  });

  const heightProps = {
    height: heightRef.current,
    rows: props.maxRows ?? 1
  };

  return (
    <div className='EditableAreaWrap'>
      <div style={{ display: 'inline-flex', minHeight: '50px', width: '100%' }}>
        <textarea
          style={{ alignSelf: 'center' }}
          readOnly={!!props.readOnly}
          contentEditable={!props.readOnly}
          {...elementProps}
          {...heightProps}
          ref={elementRef}
          className={`EditableArea ${elementProps.className}`}
        />
        {props.children && props.children}
      </div>
      <div className='EditableAreaContainer'>
        <textarea
          ref={referenceRef}
          className={`EditableAreaReference ${elementProps.className}`}
          dir='auto'
          disabled={true}
          rows={1}
          value={elementProps.value}
          aria-hidden={true}
          readOnly={!!props.readOnly}
          contentEditable={!props.readOnly}
        />
      </div>
    </div>
  );
}

export default forwardRef(EditableArea);
