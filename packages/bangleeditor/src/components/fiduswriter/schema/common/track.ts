import type { Mark, Node, ParseRule } from 'prosemirror-model';

import type { BaseRawMarkSpec } from '../../../@bangle.dev/core/specRegistry';

// for implementations of parseDOM by other components
export function parseTracks(str: string) {
  if (!str) {
    return [];
  }
  let tracks: { user?: string; username?: string; date?: string }[];
  try {
    tracks = JSON.parse(str);
  } catch (error) {
    return [];
  }
  if (!Array.isArray(tracks)) {
    return [];
  }
  // ensure required fields are present
  return tracks.filter(
    (track) => track.hasOwnProperty('user') && track.hasOwnProperty('username') && track.hasOwnProperty('date')
  );
}

// for implementations of toDOM by other components
export function addTracks(node: Node, attrs: { 'data-track'?: string }) {
  if (node.attrs.track?.length) {
    attrs['data-track'] = JSON.stringify(node.attrs.track);
  }
}

export const deletion: BaseRawMarkSpec = {
  name: 'deletion',
  type: 'mark',
  schema: {
    attrs: {
      user: {
        default: ''
      },
      username: {
        default: ''
      },
      date: {
        default: ''
      }
    },
    inclusive: false,
    group: 'track',
    parseDOM: [
      {
        tag: 'span.deletion',
        getAttrs(dom) {
          const dataset = (dom as HTMLElement).dataset;
          return {
            user: dataset.user ?? '',
            username: dataset.username,
            date: dataset.date ?? ''
          };
        }
      }
    ] as ParseRule[],
    toDOM(node: Mark) {
      return [
        'span',
        {
          class: `deletion user-${node.attrs.user}`,
          'data-user': node.attrs.user,
          'data-username': node.attrs.username,
          'data-date': node.attrs.date
        }
      ];
    }
  },
  markdown: {
    toMarkdown: {
      open: '',
      close: '',
      mixable: true,
      expelEnclosingWhitespace: true
    }
  }
} as const;

function parseFormatList(str: string | undefined) {
  if (!str) {
    return [];
  }
  let formatList: string[];
  try {
    formatList = JSON.parse(str);
  } catch (error) {
    return [];
  }
  if (!Array.isArray(formatList)) {
    return [];
  }
  return formatList.filter((format) => typeof format === 'string'); // ensure there are only strings in list
}

export const formatChange: BaseRawMarkSpec = {
  name: 'format_change',
  type: 'mark',
  schema: {
    attrs: {
      user: {
        default: ''
      },
      username: {
        default: ''
      },
      date: {
        default: ''
      },
      before: {
        default: []
      },
      after: {
        default: []
      }
    },
    inclusive: false,
    group: 'track',
    parseDOM: [
      {
        tag: 'span.format-change',
        getAttrs(dom) {
          const dataset = (dom as HTMLElement).dataset;
          return {
            user: dataset.user ?? '',
            username: dataset.username,
            date: dataset.date ?? '',
            before: parseFormatList(dataset.before),
            after: parseFormatList(dataset.after)
          };
        }
      }
    ] as ParseRule[],
    toDOM(node: Mark) {
      return [
        'span',
        {
          class: `format-change user-${node.attrs.user}`,
          'data-user': node.attrs.user,
          'data-username': node.attrs.username,
          'data-date': node.attrs.date,
          'data-before': JSON.stringify(node.attrs.before),
          'data-after': JSON.stringify(node.attrs.after)
        }
      ];
    }
  },
  markdown: {
    toMarkdown: {
      open: '',
      close: '',
      mixable: true,
      expelEnclosingWhitespace: true
    }
  }
} as const;

export const insertion: BaseRawMarkSpec = {
  name: 'insertion',
  type: 'mark',
  schema: {
    attrs: {
      user: {
        default: ''
      },
      username: {
        default: ''
      },
      date: {
        default: ''
      },
      approved: {
        default: true
      }
    },
    inclusive: false,
    group: 'track',
    parseDOM: [
      {
        tag: 'span.insertion',
        getAttrs(dom) {
          const dataset = (dom as HTMLElement).dataset;
          return {
            user: dataset.user ?? '',
            username: dataset.username,
            date: dataset.date ?? '',
            inline: true,
            approved: false
          };
        }
      },
      {
        tag: 'span.approved-insertion',
        getAttrs(dom) {
          const dataset = (dom as HTMLElement).dataset;
          return {
            user: dataset.user ?? '',
            username: dataset.username,
            date: dataset.date ?? '',
            inline: true,
            approved: true
          };
        }
      }
    ] as ParseRule[],
    toDOM(node: Mark) {
      return [
        'span',
        {
          class: node.attrs.approved ? 'approved-insertion' : `insertion user-${node.attrs.user}`,
          'data-user': node.attrs.user,
          'data-username': node.attrs.username,
          'data-date': node.attrs.date
        }
      ];
    }
  },
  markdown: {
    toMarkdown: {
      open: '',
      close: '',
      mixable: true,
      expelEnclosingWhitespace: true
    }
  }
} as const;
