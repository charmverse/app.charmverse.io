/**
 * Visit the node and its parents for X amount of ancestors
 *
 * Returns the node if it has the target class for links
 *
 * Used as sometimes we are in a span which is inside a link
 */
export function getLinkElement({
  htmlElement,
  ancestors = 2
}: {
  htmlElement: HTMLElement;
  ancestors?: number;
}): HTMLElement | null {
  if (!htmlElement) {
    return null;
  }

  const linkClass = 'charm-link';

  if (htmlElement.classList.contains(linkClass)) {
    return htmlElement;
  }

  if (ancestors > 0 && htmlElement.parentElement) {
    return getLinkElement({ htmlElement: htmlElement.parentElement, ancestors: ancestors - 1 });
  }

  return null;
}
