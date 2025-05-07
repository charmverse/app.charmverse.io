import { Plugin, PluginKey } from 'prosemirror-state';

export type UserDataPluginState = { userId: string | null; spaceId: string | null; pageId: string | null };
export const UserDataPluginKey = new PluginKey<UserDataPluginState>('charm-state');

export function userDataPlugin({ userId, spaceId, pageId }: UserDataPluginState) {
  return new Plugin<UserDataPluginState>({
    key: UserDataPluginKey,
    state: {
      init() {
        return {
          userId,
          spaceId,
          pageId
        };
      },
      apply(_, pluginState) {
        return pluginState;
      }
    }
  });
}
