const css = `
  /* inside card shadow DOM */
  .card {
    background: var(--background-paper);
    width: 100% !important;
  }

  /* inside card content shadow DOM */
  .card-front {
    background: var(--background-paper);
  }
  .asset-link {
    color: var(--primary-text);
  }
  info-button {
    display: none;
  }
  .asset-image-container {
    border-color: var(--bg-gray);
  }

  /* inside action pill shadow DOM */
  .pill {
    border-color: var(--bg-gray) !important;
  }
`;
// override css to support dark mode
export function setCSSOverrides(container: HTMLDivElement) {
  try {
    // main card
    adjustShadowRootStyles(container, ['nft-card'], css);
    // card contents
    adjustShadowRootStyles(container, ['nft-card', 'nft-card-front'], css);
    // status pill
    adjustShadowRootStyles(container, ['nft-card', 'nft-card-front', 'pill-element'], css);
  } catch (error) {
    // silently fail
    // console.log('Could not inject CSS', error);
  }
}

// main function - https://stackoverflow.com/questions/47625017/override-styles-in-a-shadow-root-element
function adjustShadowRootStyles(container: HTMLElement, hostsSelectorList: readonly string[], styles: string): void {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(styles);

  queryShadowRootDeep(container, hostsSelectorList, 40, (error, shadowRoot) => {
    if (shadowRoot) {
      shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, sheet];
    }
  });
}

// A helper function
function queryShadowRootDeep(
  container: HTMLElement,
  hostsSelectorList: readonly string[],
  triesLeft: number,
  callback: (err: Error | null, elm?: ShadowRoot) => void
): void {
  let element: ShadowRoot | null | undefined;

  hostsSelectorList.forEach((selector: string) => {
    const root = element ?? container;
    element = root.querySelector(selector)?.shadowRoot;
  });

  if (element) {
    callback(null, element);
  } else if (triesLeft === 0) {
    callback(new Error(`Cannot find a shadowRoot of this chain: ${hostsSelectorList.join(', ')}`));
  } else {
    setTimeout(() => queryShadowRootDeep(container, hostsSelectorList, triesLeft - 1, callback), 50);
  }
}
