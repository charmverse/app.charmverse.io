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
export function setCSSOverrides() {
  try {
    // main card
    adjustShadowRootStyles(['nft-card'], css);
    // card contents
    adjustShadowRootStyles(['nft-card', 'nft-card-front'], css);
    // status pill
    adjustShadowRootStyles(['nft-card', 'nft-card-front', 'pill-element'], css);
  } catch (error) {
    // silently fail
  }
}

// main function - https://stackoverflow.com/questions/47625017/override-styles-in-a-shadow-root-element
function adjustShadowRootStyles(hostsSelectorList: readonly string[], styles: string): void {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(styles);

  queryShadowRootDeep(hostsSelectorList, 20, (error, shadowRoot) => {
    if (shadowRoot) {
      shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, sheet];
    }
  });
}

// A helper function
function queryShadowRootDeep(
  hostsSelectorList: readonly string[],
  triesLeft: number,
  callback: (err: Error | null, elm?: ShadowRoot) => void
): void {
  let element: ShadowRoot | null | undefined;

  hostsSelectorList.forEach((selector: string) => {
    const root = element ?? document;
    element = root.querySelector(selector)?.shadowRoot;
  });

  if (element) {
    callback(null, element);
  } else if (triesLeft === 0) {
    callback(new Error(`Cannot find a shadowRoot of this chain: ${hostsSelectorList.join(', ')}`));
  } else {
    setTimeout(() => queryShadowRootDeep(hostsSelectorList, triesLeft - 1, callback), 50);
  }
}
