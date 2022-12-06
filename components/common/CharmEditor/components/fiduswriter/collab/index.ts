import type { Participant } from 'lib/websockets/documentEvents/interfaces';

import type { FidusEditor } from '../fiduseditor';
import { removeCollaboratorSelection } from '../state_plugins';

import { ModCollabColors } from './colors';
import { ModCollabDoc } from './doc';

export type FrontendParticipant = Participant & {
  sessionIds: string[];
};

export class ModCollab {
  // @ts-ignore set inside constructor of ModCollabColors
  colors: ModCollabColors;

  // @ts-ignore set inside constructor of ModCollabDoc
  doc: ModCollabDoc;

  editor: FidusEditor;

  participants: FrontendParticipant[] = [];

  pastParticipants: Participant[] = []; // Participants who have left comments or tracked changes.

  sessionIds: string[] | false = false;

  collaborativeMode: boolean = false;

  constructor(editor: FidusEditor) {
    editor.mod.collab = this;
    this.editor = editor;

    // eslint-disable-next-line no-new
    new ModCollabDoc(this);
    // eslint-disable-next-line no-new
    new ModCollabColors(this);
  }

  updateParticipantList(participantArray: (Participant & { sessionIds?: string[] })[]): FrontendParticipant[] {
    const allSessionIds: string[] = [];
    const participantObj: Record<string, FrontendParticipant> = {};

    participantArray.forEach((participant) => {
      if (participant.session_id) {
        const entry = participantObj[participant.id];
        allSessionIds.push(participant.session_id);
        if (entry) {
          entry.sessionIds.push(participant.session_id);
        } else {
          participant.sessionIds = [participant.session_id];
          delete participant.session_id;
          participantObj[participant.id] = participant as FrontendParticipant;
        }
      }
    });

    this.participants = Object.values(participantObj);
    if (!this.sessionIds) {
      this.sessionIds = [];
    }
    // Check if each of the old session IDs is still present in last update.
    // If not, remove the corresponding carets if any.
    this.sessionIds.forEach((sessionId) => {
      if (!allSessionIds.includes(sessionId)) {
        const tr = removeCollaboratorSelection(this.editor.view.state, { session_id: sessionId });
        if (tr) {
          this.editor.view.dispatch(tr);
        }
      }
    });
    this.sessionIds = allSessionIds;
    if (participantArray.length > 1) {
      this.collaborativeMode = true;
    } else if (participantArray.length === 1) {
      this.collaborativeMode = false;
    }
    this.participants.forEach((participant) => {
      this.colors.ensureUserColor(participant.id, participant.name);
    });

    return this.participants;
  }
}
