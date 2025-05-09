import type { Node } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';

import { getSelectedChanges } from '../fiduswriter/state_plugins/track';
import type { TrackAttribute, TrackType } from '../fiduswriter/track/interfaces';

type TrackAttribute2 = {
  type: TrackAttribute['type'];
  data: Omit<TrackAttribute, 'type'>;
};

type GetTracksProps = {
  node: Node;
  lastNode: Node;
  lastNodeTracks: TrackAttribute2[];
};

export type TrackedEvent = TrackAttribute2 & { node: Node; pos: number; active: boolean };

export function getEventsFromDoc({ state }: { state: EditorState }) {
  const selectedChanges = getSelectedChanges(state);

  let lastNode = state.doc;
  let lastNodeTracks: TrackAttribute2[] = [];

  const trackMarks: TrackedEvent[] = [];

  const topChildren: { node: Node; pos: number }[] = [];

  state.doc.descendants((node, pos, parent) => {
    if (parent === state.doc) {
      topChildren.push({ node, pos });
    }

    lastNodeTracks = getEventsFromNode({
      node,
      lastNode,
      lastNodeTracks
    });

    lastNodeTracks.forEach((track) => {
      trackMarks.push({
        node,
        pos,
        active: selectedChanges[track.type] && selectedChanges[track.type].from === pos,
        ...track
      });
    });
    lastNode = node;
  });

  const result = topChildren
    .map(({ node, pos }) => {
      const from = pos;
      const to = pos + node.nodeSize;
      const marks = trackMarks.filter(({ pos: markPos }) => markPos >= from && markPos < to);
      return { node, pos, marks };
    })
    .filter(({ marks }) => marks.length > 0);

  return result;
}

function getEventsFromNode({ node, lastNode, lastNodeTracks }: GetTracksProps) {
  const trackAttr: TrackAttribute[] | undefined = node.attrs.track;
  const nodeTracks: TrackAttribute2[] = trackAttr
    ? trackAttr.map((track) => {
        const nodeTrack: TrackAttribute2 = {
          type: track.type,
          data: { user: track.user, username: track.username, date: track.date }
        };
        if (track.type === 'block_change') {
          nodeTrack.data.before = track.before;
        }
        return nodeTrack;
      })
    : node.marks
        .filter(
          (mark) =>
            ['deletion', 'format_change'].includes(mark.type.name) ||
            (mark.type.name === 'insertion' && !mark.attrs.approved)
        )
        .map((mark): TrackAttribute2 => ({ type: mark.type.name as TrackType, data: mark.attrs as any }));

  // Filter out trackmarks already present in the last node (if it's an inline node).
  // Without skipping over the emoji and mention nodes they are inserted in the document rather than as suggestion
  const tracks =
    node.isInline === lastNode.isInline && !['emoji', ' mention'].includes(node.type.name)
      ? nodeTracks.filter(
          (track) =>
            !lastNodeTracks.find(
              (lastTrack) =>
                track.type === lastTrack.type &&
                track.data.user === lastTrack.data.user &&
                track.data.date === lastTrack.data.date &&
                (node.isInline || // block level changes almost always need new boxes
                  (node.type.name === 'paragraph' &&
                    (lastNode.type.name === 'listItem' || lastNode.type.name === 'list_item') &&
                    lastTrack.type === 'insertion')) && // Don't show first paragraphs in list items.
                (['insertion', 'deletion'].includes(track.type) ||
                  (track.type === 'format_change' &&
                    track.data.before instanceof Array &&
                    track.data.after instanceof Array &&
                    lastTrack.data.before instanceof Array &&
                    lastTrack.data.after instanceof Array &&
                    track.data.before.length === lastTrack.data.before.length &&
                    track.data.after.length === lastTrack.data.after.length &&
                    track.data.before.every((markName) => (lastTrack.data.before as string[]).includes(markName)) &&
                    track.data.after.every((markName) => (lastTrack.data.after as string[]).includes(markName))) ||
                  (track.type === 'block_change' &&
                    // @ts-ignore
                    track.data.before.type === lastTrack.data.before.type &&
                    // @ts-ignore
                    track.data.before.attrs.level === lastTrack.data.before.attrs.level))
            )
        )
      : nodeTracks;

  return tracks;
}
