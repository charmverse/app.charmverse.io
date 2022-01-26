export const SPLIT_SCREEN_MIN_WIDTH =
  typeof document === 'undefined'
    ? 500
    : parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--window-widescreen-minWidth',
        ),
        10,
      );

export * from './is-mac';
export * from './keybindings';

export const FILE_PALETTE_MAX_RECENT_FILES = 15;
export const FILE_PALETTE_MAX_FILES = 200;

function randomStr(len = 10) {
  return Math.random().toString(36).substring(2, 15).slice(0, len);
}
