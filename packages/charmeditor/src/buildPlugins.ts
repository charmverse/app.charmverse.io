import { log } from '@packages/core/log';
import { baseKeymap as pmBaseKeymap } from 'prosemirror-commands';
import { InputRule, inputRules as pmInputRules, undoInputRule as pmUndoInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import type { Schema } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';

export type PluginPayload<T = any> = {
  schema: Schema;
  // specRegistry: SpecRegistry;
  metadata: T;
};

type BaseRawPlugins = undefined | false | null | Plugin | InputRule | BaseRawPlugins[];

export type RawPlugins<T = any> =
  | BaseRawPlugins
  | ((payLoad: PluginPayload<T>) => BaseRawPlugins)
  | RawPlugins[]
  | ((payLoad: PluginPayload<T>) => RawPlugins[]);

export function buildPlugins<T = any>(
  schema: Schema,
  plugins: RawPlugins<T>,
  {
    metadata,
    // dropCursorOpts,
    transformPlugins = (p) => p
  }: {
    metadata?: T;
    defaultPlugins?: boolean;
    // dropCursorOpts?: Parameters<typeof dropCursor>[0];
    transformPlugins?: (plugins: Plugin[]) => Plugin[];
  } = {}
): Plugin[] {
  const pluginPayload = {
    schema,
    metadata
  };

  // eslint-disable-next-line prefer-const
  let flatPlugins = flatten(plugins, pluginPayload);

  flatPlugins = processInputRules(flatPlugins);

  // flatPlugins.push(keymap(pmBaseKeymap), dropCursor(dropCursorOpts), pmGapCursor());
  flatPlugins.push(keymap(pmBaseKeymap));

  flatPlugins = flatPlugins.filter(Boolean);
  flatPlugins = transformPlugins(flatPlugins);

  if (flatPlugins.some((p: any) => !(p instanceof Plugin))) {
    log.warn(
      'You are either using multiple versions of the library or not returning a Plugin class in your plugins. Investigate :',
      flatPlugins.find((p: any) => !(p instanceof Plugin))
    );
    throw new Error('Invalid plugin');
  }

  validateNodeViews(flatPlugins, schema);
  return flatPlugins;
}

// extract the InputRules from regular prosemiror plugins
function processInputRules(plugins: Plugin[]) {
  const newPlugins: any[] = [];
  const match: InputRule[] = [];
  plugins.forEach((plugin) => {
    if (plugin instanceof InputRule) {
      match.push(plugin);
      return;
    }
    newPlugins.push(plugin);
  });

  plugins = [
    ...newPlugins,
    pmInputRules({
      rules: match
    }),
    // Allow undoing an input rule by hitting backspace. For example, typing "# " will create a heading, but backspace can be used to just have a plain #
    keymap({
      Backspace: pmUndoInputRule
    })
  ];

  return plugins;
}

function validateNodeViews(plugins: Plugin[], schema: Schema) {
  const nodeViewPlugins = plugins.filter((p: any) => p.props && p.props.nodeViews);
  const nodeViewNames = new Map();
  for (const plugin of nodeViewPlugins) {
    for (const name of Object.keys(plugin.props.nodeViews as any)) {
      if (!schema.nodes[name]) {
        log.warn(
          `When loading your plugins, we found nodeView implementation for the node '${name}' did not have a corresponding spec. Check the plugin: ${plugin} and your specRegistry`,
          schema
        );

        throw new Error(`NodeView validation failed. Spec for '${name}' not found.`);
      }

      if (nodeViewNames.has(name)) {
        log.warn(
          `When loading your plugins, we found more than one nodeView implementation for the node '${name}'. Bangle can only have a single nodeView implementation, please check the following two plugins ${plugin} ${nodeViewNames.get(
            name
          )}`
        );
        throw new Error(`NodeView validation failed. Duplicate nodeViews for '${name}' found.`);
      }
      nodeViewNames.set(name, plugin);
    }
  }
}

function flatten<T>(rawPlugins: RawPlugins, callbackPayload: PluginPayload<T>): Plugin[] {
  const recurse = (plugins: RawPlugins): any => {
    if (Array.isArray(plugins)) {
      return plugins.flatMap((p: any) => recurse(p)).filter(Boolean);
    }

    if (typeof plugins === 'function') {
      if (!callbackPayload) {
        throw new Error('Found a function but no payload');
      }
      return recurse(plugins(callbackPayload));
    }

    return plugins;
  };

  return recurse(rawPlugins);
}
