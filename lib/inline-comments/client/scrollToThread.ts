import { highlightDomElement } from 'lib/dom/client/highlight';

export function scrollToThread (threadId: string) {
  // Find the inline-comment with the threadId and scroll into view
  const threadDocument = document.getElementById(`inline-comment.${threadId}`);
  if (threadDocument) {
    let parentElement: HTMLElement | null = null;
    let element: HTMLElement | null = threadDocument;
    // Check for highest 5 levels of depth
    for (let i = 0; i < 5; i++) {
      element = threadDocument.parentElement;
      // Get the first paragraph parent element
      if (element?.classList.contains('bangle-nv-content')) {
        parentElement = element;
        break;
      }
    }

    requestAnimationFrame(() => {
      threadDocument.scrollIntoView({
        behavior: 'smooth'
      });
    });

    setTimeout(() => {
      if (parentElement) {
        // Need to create a custom element as adding styling to prosemirror-node isn't possible
        const highlightElement = document.createElement('div');
        document.body.appendChild(highlightElement);
        const boundingRect = parentElement.getBoundingClientRect();
        // Set the location of the custom element
        highlightElement.style.top = `${boundingRect.top}px`;
        highlightElement.style.left = `${boundingRect.left}px`;
        highlightElement.style.width = `${boundingRect.width}px`;
        highlightElement.style.height = `${boundingRect.height}px`;
        highlightElement.style.position = 'absolute';
        highlightDomElement(highlightElement, () => {
          // Remove the custom element after the highlighting is done
          document.body.removeChild(highlightElement);
        });
      }
    }, 500);
  }
}
