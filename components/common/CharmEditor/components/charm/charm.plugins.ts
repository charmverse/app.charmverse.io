import { Plugin, PluginKey } from 'prosemirror-state';

export type CharmPluginState = {userId: string | null, spaceId: string | null, pageId: string | null}
export const CharmPluginKey = new PluginKey<CharmPluginState>('charm-state');

export function charmPlugin ({ userId, spaceId, pageId }: CharmPluginState) {
  return new Plugin<CharmPluginState>({
    key: CharmPluginKey,
    state: {
      init () {
        return {
          userId,
          spaceId,
          pageId
        };
      },
      apply (_, pluginState) {
        return pluginState;
      }
    }
  });
}
