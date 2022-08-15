import { EditorState, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, Plugin } from '@bangle.dev/pm';
import { Commit, GenericSpan } from '@manuscripts/track-changes';

export interface Span {
  from: number
  to: number
  commit: string
}

export enum CLASSES {
  blame = 'blame',
  blameUncommitted = 'blame-uncommitted',
  blamePoint = 'blame-point',
  diffReplaced = 'replaced',
  annotation = 'annotation',
  focused = 'focused',
  control = 'control',
  annotationControl = 'annotation-control',
}

export const doSpansOverlap = <A extends GenericSpan, B extends GenericSpan>(
  a: A,
  b: B
) => {
  return !(a.from > b.to || a.to < b.from);
};

function createBlameDecoration (
  spans: Span[],
  isUncommitted: boolean,
  isFocused: boolean
) {
  return spans.map((span) => {
    const { from, to, commit } = span;
    if (from === to) {
      return Decoration.widget(
        from,
        () => {
          const el = document.createElement('span');
          el.classList.add('track-changes--blame-point');
          el.dataset.changeid = span.commit;
          return el;
        },
        { side: -1 }
      );
    }

    const classNames = [CLASSES.blame];

    if (isUncommitted) {
      classNames.push(CLASSES.blameUncommitted);
    }

    if (isFocused) {
      classNames.push(CLASSES.focused);
    }

    return Decoration.inline(
      from,
      to,
      {
        class: classNames.join(' '),
        'data-changeid': commit
      },
      {
        inclusiveEnd: true
      }
    );
  });
}

const splitSpanByBlocks = (span: Span, state: EditorState): Span[] => {
  const ends: number[] = [span.to];
  state.doc.nodesBetween(span.from, span.to, (node, pos) => {
    if (node.type.isBlock) {
      const end = pos + node.nodeSize - 1;
      if (end < span.to) {
        ends.push(end);
      }
    }
  });
  return ends.sort().map((end, i) => i === 0
    ? {
      from: span.from,
      to: end,
      commit: span.commit
    }
    : {
      from: ends[i - 1],
      to: end,
      commit: span.commit
    });
};

function decorateBlame (state: EditorState, commit: Commit) {
  const { blame } = commit;

  return blame.reduce((decorations, span) => {
    if (span.commit === null) {
      return decorations;
    }
    const isUncommitted = span.commit === commit.changeID;
    const isFocused = doSpansOverlap(span, state.selection);
    if (isUncommitted) {
      return [
        ...decorations,
        ...createBlameDecoration([span], isUncommitted, isFocused)
      ];
    }

    const subspans = splitSpanByBlocks(span, state);

    return [
      ...decorations,
      ...createBlameDecoration(subspans, isUncommitted, isFocused)
    ];
  }, [] as Decoration[]);
}

export function blameDecorationPlugin ({ commit }: {
  commit: Commit
}) {
  return () => {
    const blameDecorationsKey = new PluginKey('blame-decoration-key');
    return [
      new Plugin({
        key: blameDecorationsKey,
        props: {
          decorations (state) {
            return DecorationSet.create(state.doc, [
              ...decorateBlame(state, commit)
            ]);
          }
        }
      })
    ];
  };
}
