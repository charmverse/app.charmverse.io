import { useEffect, useState } from 'react';

export function useDOMElement(selector?: string | null) {
  const [element, setElement] = useState<Element | null>(null);
  useEffect(() => {
    const findElement = async () => {
      if (selector) {
        const el = await waitForElement(selector);
        setElement(el);
      }
    };

    findElement();
  }, [selector]);

  return element;
}

export function waitForElement(selector: string): Promise<Element | null> {
  return new Promise((resolve) => {
    if (window.document.querySelector(selector)) {
      resolve(document.querySelector(selector));

      return;
    }

    const observer = new MutationObserver(() => {
      if (window.document.querySelector(selector)) {
        resolve(window.document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}
