import { PluginKey } from '@bangle.dev/pm';
import { makeSafeForCSS } from '../@bangle.io/lib/utils/utility';

export const extensionName = '@bangle.io/inline-command-palette';
export const paletteMarkName = makeSafeForCSS(`${extensionName}/paletteMark`);
export const palettePluginKey = new PluginKey(`${extensionName}-key`);
export const trigger = '/';
