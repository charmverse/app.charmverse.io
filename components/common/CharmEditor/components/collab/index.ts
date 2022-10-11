import { removeCollaboratorSelection } from '../state_plugins';

import { ModCollabColors } from './colors';
import { ModCollabDoc } from './doc';

type Participant = {
  id: string;
  session_id: string | undefined;
  sessionIds: string[];
};

export class ModCollab {
  constructor (editor) {
    editor.mod.collab = this;
    this.editor = editor;
    this.participants = [];
    this.pastParticipants = []; // Participants who have left comments or tracked changes.
    this.sessionIds = false;
    this.collaborativeMode = false;

    // eslint-disable-next-line no-new
    new ModCollabDoc(this);
    // eslint-disable-next-line no-new
    new ModCollabChat(this);
    // eslint-disable-next-line no-new
    new ModCollabColors(this);
  }

  updateParticipantList (participantArray: Participant[]) {
    const allSessionIds: string[] = [];
    const participantObj: Record<string, Participant> = {};

    participantArray.forEach(participant => {
      const entry = participantObj[participant.id];
      allSessionIds.push(participant.session_id);
      if (entry) {
        entry.sessionIds.push(participant.session_id);
      }
      else {
        participant.sessionIds = [participant.session_id];
        delete participant.session_id;
        participantObj[participant.id] = participant;
      }
    });

    this.participants = Object.values(participantObj);
    if (!this.sessionIds) {
      if (allSessionIds.length === 1) {
        // We just connected to the editor and we are the only connected
        // party. This is a good time to clean up the databases, removing
        // unused images and bibliography items.
        if (this.editor.mod.db) {
          this.editor.mod.db.clean();
        }
      }
      this.sessionIds = [];
    }
    // Check if each of the old session IDs is still present in last update.
    // If not, remove the corresponding carets if any.
    this.sessionIds.forEach(sessionId => {
      if (!allSessionIds.includes(sessionId)) {
        const tr = removeCollaboratorSelection(
          this.editor.view.state,
          { session_id: sessionId }
        );
        if (tr) {
          this.editor.view.dispatch(tr);
        }
      }
    });
    this.sessionIds = allSessionIds;
    if (participantArray.length > 1) {
      this.collaborativeMode = true;
    }
    else if (participantArray.length === 1) {
      this.collaborativeMode = false;
    }
    this.participants.forEach(participant => {
      this.colors.ensureUserColor(participant.id);
    });
    if (this.editor.menu.headerView) {
      this.editor.menu.headerView.update();
    }
  }
}
