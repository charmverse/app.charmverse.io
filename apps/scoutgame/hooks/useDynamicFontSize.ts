import { useState, useRef, useLayoutEffect } from 'react';

export function useDynamicFontSize(text: string, minFontSize: number, maxFontSize: number) {
  const [fontSize, setFontSize] = useState(maxFontSize);
  const spanRef = useRef<HTMLSpanElement>(null);
  const maxWidth = spanRef?.current?.offsetWidth ?? 100;

  useLayoutEffect(() => {
    const span = spanRef.current;
    if (!span) return;

    let currentFontSize = maxFontSize;
    span.style.fontSize = `${currentFontSize}px`;

    while (span.offsetWidth > maxWidth && currentFontSize > minFontSize) {
      currentFontSize -= 0.5;
      span.style.fontSize = `${currentFontSize}px`;
    }

    setFontSize(currentFontSize);
  }, [text, maxWidth, minFontSize, maxFontSize]);

  return { fontSize, spanRef };
}
