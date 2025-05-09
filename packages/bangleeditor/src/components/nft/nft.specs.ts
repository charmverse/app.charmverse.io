import type { SupportedChainId } from '@packages/lib/blockchain/getNFTs';
import type { Node } from 'prosemirror-model';

import type { RawSpecs } from '../@bangle.dev/core/specRegistry';

import { name } from './config';

export type NodeAttrs = {
  chain: SupportedChainId;
  contract: string;
  token: string;
};

export function spec(): RawSpecs {
  return {
    type: 'node',
    name,
    markdown: {
      toMarkdown: (state, node) => {
        const { contract, token } = node.attrs as NodeAttrs;

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
        },
        size: {
          // Making sure default size is middle of max and min range
          default: null
        }
      },
      group: 'block',
      inline: false,
      draggable: true,
      isolating: true, // dont allow backspace to delete
      parseDOM: [
        {
          tag: 'div.nft-embed',
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
          'div',
          {
            class: 'nft-embed',
            'data-chain': node.attrs.chain,
            'data-token': node.attrs.token,
            'data-contract': node.attrs.contract
          }
        ];
      }
    }
  };
}
