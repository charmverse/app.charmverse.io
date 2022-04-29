export function highlightDomElement (domElement: HTMLElement, postHighlight?: () => void) {
  domElement.scrollIntoView({
    behavior: 'smooth'
  });
  domElement.style.backgroundColor = 'rgba(46, 170, 220, 0.2)';
  domElement.style.transition = 'background-color 250ms ease-in-out';
  // Remove the highlight after 500 ms
  setTimeout(() => {
    domElement.style.removeProperty('background-color');
    postHighlight?.();
  }, 500);
}
