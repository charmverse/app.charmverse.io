import type {
  Transaction
} from '@bangle.dev/pm';
import {
  Mapping
} from '@bangle.dev/pm';
import {
  ChangeSet as PMChangeSet
} from 'prosemirror-changeset';

export class ChangeSet {
  tr : Transaction;

  constructor (tr: Transaction) {
    this.tr = tr;
  }

  trDoc (tr: Transaction, index = 0) {
    return tr.docs.length > index ? tr.docs[index] : tr.doc;
  }

  findConflicts (tr1: Transaction, tr2: Transaction) {
    const conflicts: [any, string, any, string][] = [];
    const changes1 = this.findContentChanges(tr1);
    const changes2 = this.findContentChanges(tr2);
    changes1.deletedsteps.forEach(deleted => {
      changes2.insertedsteps.forEach(inserted => {
        if (inserted.pos >= deleted.from && inserted.pos <= deleted.to) {
          conflicts.push([deleted.data.step, 'deletion', inserted.data.step, 'insertion']);
        }
      });
    });

    changes2.deletedsteps.forEach(deleted => {
      changes1.insertedsteps.forEach(inserted => {
        if (inserted.pos >= deleted.from && inserted.pos <= deleted.to) {
          conflicts.push([inserted.data.step, 'insertion', deleted.data.step, 'deletion']);
        }
      });
    });
    return conflicts;
  }

  findContentChanges (tr: Transaction) {
    const doc = this.trDoc(tr);
    let changes = PMChangeSet.create(doc);
    tr.steps.forEach((step, index) => {
      const _doc = this.trDoc(tr, index + 1);
      changes = changes.addSteps(_doc, [tr.mapping.maps[index]], { step: index });
    });
    const invertedMapping = new Mapping();
    invertedMapping.appendMappingInverted(tr.mapping);

    const insertedsteps = [];
    const deletedsteps = [];
    const ins = [];
    const del = [];
    changes.changes.forEach(change => {
      change.inserted.forEach(inserted => {
        if (!ins.includes(inserted.data.step)) {
          insertedsteps.push({ pos: invertedMapping.map(change.fromB), data: inserted.data });
          ins.push(inserted.data.step);
        }
      });
      change.deleted.forEach(deleted => {
        if (!del.includes(deleted.data.step)) {
          del.push(deleted.data.step);
          deletedsteps.push({ from: change.fromA, to: change.toA, data: deleted.data });
        }
      });
    });
    return { insertedsteps, deletedsteps };
  }

  getChangeSet () {
    const tr = this.tr;
    const doc = this.trDoc(tr);
    let changes = PMChangeSet.create(doc);
    tr.steps.forEach((step, index) => {
      const _doc = this.trDoc(tr, index + 1);
      changes = changes.addSteps(_doc, [tr.mapping.maps[index]], { step: index });
    });
    return changes;
  }

}
