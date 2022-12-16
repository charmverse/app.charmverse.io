import type { RawSpecs } from '@bangle.dev/core';
import type { Node } from '@bangle.dev/pm';
import type { supportedChainIds } from 'connectors';

import { name } from './config';

export type NodeAttrs = {
  chain: typeof supportedChainIds[number];
  contract: string;
  token: string;
};

export function spec(): RawSpecs {
  return {
    type: 'node',
    name,
    markdown: {
      toMarkdown: (state, node) => {
        const { chain, contract, token } = node.attrs as NodeAttrs;

        const toRender = `Embedded NFT: ${contract} #${token}`;

        // Ensure markdown html will be separated by newlines
        state.ensureNewLine();
        state.text(toRender);
        state.ensureNewLine();
      }
    },
    schema: {
      attrs: {
        chain: {
          default: 1
        },
        contract: {
          default: ''
        },
        token: {
          default: ''
        },
        track: {
          default: []
        }
      },
      group: 'block',
      inline: false,
      draggable: false,
      isolating: true, // dont allow backspace to delete
      parseDOM: [
        {
          tag: 'nft-embed',
          getAttrs: (dom: any) => {
            return {
              chain: parseInt(dom.getAttribute('data-chain'), 10),
              contract: dom.getAttribute('data-contract'),
              token: dom.getAttribute('data-token')
            };
          }
        }
      ],
      toDOM: (node: Node) => {
        return [
          'nft-embed',
          { 'data-chain': node.attrs.chain, 'data-token': node.attrs.token, 'data-contract': node.attrs.contract }
        ];
      }
    }
  };
}
