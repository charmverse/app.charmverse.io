# Changes

This folder was created to customize packages under the [@bangle.dev](https://github.com/bangle-io/bangle.dev) monorepo to meet our use cases. We are aware that all `@bangle.dev` packages are available as npm packages. Below we have provided the reasons for each specific package.

## `react-emoji-suggest@0.28.4-alpha.2`

1. `EmojiSuggest` component was copied over to met our design guidelines (using styled components rather than plain css for custom/dynamic theming)
2. `emoji-suggest`: We needed customize the default behavior in order to trigger emoji-suggest component on clicking the emoji of a callout.

## `tooltip@0.28.4-alpha.2`

1. `suggest-tooltip`: Needed to update `pluginsFactory` function to not look for mark inside a callout rather trigger the callout emoji suggest palette by positioning it relative to the callout block.

## `react@0.28.4-alpha.2`

1. `ReactEditor`: We ended up having to swizzle `@bangle.dev/react/ReactEditor.tsx` component. Previously it used to render the children below the actual editor. In our case since the children were supposed to be placed above the editor, we had to resort to hacky fixes to place them in the right order including using position relative and top all over the place. I managed to fix it by sizzling the component so that the children are placed on top of the editor. This resulted in much cleaner code and less use of dynamic styles for positioning elements.

## `emoji@0.28.4-alpha.2`

1. `emoji`: We needed our own custom implementation of the emoji spec, with different attributes of the node and arguments for initializing the plugin
