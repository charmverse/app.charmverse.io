import React, { forwardRef, useEffect, useRef } from 'react';

import type { EditableProps, Focusable } from './editable';
import { useEditable } from './editable';

function getBorderWidth(style: CSSStyleDeclaration): number {
  return parseInt(style.borderTopWidth || '0', 10) + parseInt(style.borderBottomWidth || '0', 10);
}

// Max rows feature is used only in the context where we list multiple items (such as a table view)
function EditableArea(props: EditableProps & { maxRows?: number }, ref: React.Ref<Focusable>): JSX.Element {
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
      <textarea
        readOnly
        contentEditable={false}
        {...elementProps}
        {...heightProps}
        ref={elementRef}
        className={`EditableArea ${elementProps.className}`}
      />
      <div className='EditableAreaContainer'>
        <textarea
          readOnly
          contentEditable={false}
          ref={referenceRef}
          className={`EditableAreaReference ${elementProps.className}`}
          dir='auto'
          disabled={true}
          rows={1}
          value={elementProps.value}
          aria-hidden={true}
        />
      </div>
    </div>
  );
}

export default forwardRef(EditableArea);
