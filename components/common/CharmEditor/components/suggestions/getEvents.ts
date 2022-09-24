import type { EditorState, Node } from '@bangle.dev/pm';
import type { TrackAttribute, TrackType } from './track/interfaces';
import { getSelectedChanges } from './statePlugins/track';

interface TrackAttribute2 {
  type: TrackAttribute['type'];
  data: Omit<TrackAttribute, 'type'>;
}

interface GetTracksProps {
  node: Node;
  lastNode: Node;
  lastNodeTracks: TrackAttribute2[];
}

export function getEventsFromDoc ({ state }: { state: EditorState }) {

  const selectedChanges = getSelectedChanges(state);

  let lastNode = state.doc;
  let lastNodeTracks: TrackAttribute2[] = [];

  const trackEvents: (TrackAttribute2 & { node: Node, pos: number, active: boolean })[] = [];

  state.doc.descendants(
    (node, pos) => {

      lastNodeTracks = getEventsFromNode({
        node,
        lastNode,
        lastNodeTracks
      });

      lastNodeTracks.forEach(track => {
        trackEvents.push({
          node,
          pos,
          active: selectedChanges[track.type] && selectedChanges[track.type].from === pos,
          ...track
        });
      });
      lastNode = node;
    }
  );
  return trackEvents;
}

function getEventsFromNode ({ node, lastNode, lastNodeTracks }: GetTracksProps) {

  const trackAttr: TrackAttribute[] | undefined = node.attrs.track;

  const nodeTracks: TrackAttribute2[] = trackAttr
    ? trackAttr.map(track => {
      const nodeTrack: TrackAttribute2 = { type: track.type, data: { user: track.user, username: track.username, date: track.date } };
      if (track.type === 'block_change') {
        nodeTrack.data.before = track.before;
      }
      return nodeTrack;
    })
    : node.marks.filter(mark => ['deletion', 'format_change'].includes(mark.type.name)
      || (mark.type.name === 'insertion' && !mark.attrs.approved)).map((mark): TrackAttribute2 => ({ type: mark.type.name as TrackType, data: mark.attrs as any }));

  // Filter out trackmarks already present in the last node (if it's an inline node).
  const tracks = node.isInline === lastNode.isInline
    ? nodeTracks.filter(track => !lastNodeTracks.find(
      lastTrack => track.type === lastTrack.type
        && track.data.user === lastTrack.data.user
        && track.data.date === lastTrack.data.date
        && (
          node.isInline // block level changes almost always need new boxes
            || (node.type.name === 'paragraph' && lastNode.type.name === 'listItem' && lastTrack.type === 'insertion') // Don't show first paragraphs in list items.
        )
        && (
          ['insertion', 'deletion'].includes(track.type)
            || (
              track.type === 'format_change'
                && (track.data.before instanceof Array && track.data.after instanceof Array)
                && (lastTrack.data.before instanceof Array && lastTrack.data.after instanceof Array)
                && track.data.before.length === lastTrack.data.before.length
                && track.data.after.length === lastTrack.data.after.length
                && track.data.before.every(markName => (lastTrack.data.before as string[]).includes(markName))
                && track.data.after.every(markName => (lastTrack.data.after as string[]).includes(markName))
            )
            || (
              track.type === 'block_change'
                // @ts-ignore
                && track.data.before.type === lastTrack.data.before.type
                // @ts-ignore
                && track.data.before.attrs.level === lastTrack.data.before.attrs.level
            )
        )
    ))
    : nodeTracks;

  return tracks;
}
