import { PluginKey } from '@bangle.dev/pm';
import { makeSafeForCSS } from '../../lib/utils/utility';

export const extensionName = '@bangle.io/inline-command-palette';
export const paletteMarkName = makeSafeForCSS(extensionName + '/paletteMark');
export const palettePluginKey = new PluginKey(extensionName + '-key');