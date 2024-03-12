// See https://gitlab.com/mpapp-public/prosemirror-recreate-steps/blob/master/src/recreate.js
// We only need this file from the prosemirror-recreate-steps (apache) project, so it's copied
// in here.

import { diffWordsWithSpace, diffChars } from 'diff';
import type { Node, Schema } from 'prosemirror-model';
import type { Step } from 'prosemirror-transform';
import { Transform, ReplaceStep } from 'prosemirror-transform';
import type { Operation, TestOperation } from 'rfc6902';
import { applyPatch, createPatch } from 'rfc6902';

function getReplaceStep(fromDoc: Node, toDoc: Node) {
  let start = toDoc.content.findDiffStart(fromDoc.content);
  if (!start) {
    return false;
  }
  let { a: endA, b: endB } = toDoc.content.findDiffEnd(fromDoc.content) as { a: number; b: number };
  const overlap = start - Math.min(endA, endB);
  if (overlap > 0) {
    if (
      // If there is an overlap, there is some freedom of choise in how to calculate the start/end boundary.
      // for an inserted/removed slice. We choose the extreme with the lowest depth value.
      fromDoc.resolve(start - overlap).depth < toDoc.resolve(endA + overlap).depth
    ) {
      start -= overlap;
    } else {
      endA += overlap;
      endB += overlap;
    }
  }
  return new ReplaceStep(start, endB, toDoc.slice(start, endA));
}

class RecreateTransform {
  fromDoc: Node;

  toDoc: Node;

  currentJSON: any;

  finalJSON: any;

  // @ts-ignore defined in init()
  ops: Operation[];

  complexSteps: boolean;

  wordDiffs: boolean;

  schema: Schema;

  tr: Transform;

  constructor(fromDoc: Node, toDoc: Node, complexSteps: boolean, wordDiffs: boolean) {
    this.fromDoc = fromDoc;
    this.toDoc = toDoc;
    this.complexSteps = complexSteps; // Whether to return steps other than ReplaceSteps
    this.wordDiffs = wordDiffs; // Whether to make text diffs cover entire words
    this.schema = fromDoc.type.schema;
    this.tr = new Transform(fromDoc);
  }

  init() {
    if (this.complexSteps) {
      // For First steps: we create versions of the documents without marks as
      // these will only confuse the diffing mechanism and marks won't cause
      // any mapping changes anyway.
      this.currentJSON = this.marklessDoc(this.fromDoc).toJSON();
      this.finalJSON = this.marklessDoc(this.toDoc).toJSON();
      this.ops = createPatch(this.currentJSON, this.finalJSON);
      this.recreateChangeContentSteps();
      this.recreateChangeMarkSteps();
    } else {
      // We don't differentiate between mark changes and other changes.
      this.currentJSON = this.fromDoc.toJSON();
      this.finalJSON = this.toDoc.toJSON();
      this.ops = createPatch(this.currentJSON, this.finalJSON);
      this.recreateChangeContentSteps();
    }

    this.simplifyTr();

    return this.tr;
  }

  recreateChangeContentSteps() {
    // First step: find content changing steps.
    let ops = [];
    let afterStepJSON = JSON.parse(JSON.stringify(this.currentJSON));
    while (this.ops.length) {
      let op = this.ops.shift()!;
      let toDoc: Node | false = false;
      const pathParts = op.path.split('/');
      ops.push(op);
      while (!toDoc) {
        applyPatch(afterStepJSON, [op]);
        try {
          toDoc = this.schema.nodeFromJSON(afterStepJSON);
          toDoc.check();
        } catch (error) {
          toDoc = false;
          if (this.ops.length) {
            op = this.ops.shift()!;
            ops.push(op);
          } else {
            throw error;
          }
        }
      }

      if (this.complexSteps && ops.length === 1 && (pathParts.includes('attrs') || pathParts.includes('type'))) {
        // Node markup is changing
        this.addSetNodeMarkup();
        ops = [];
        afterStepJSON = JSON.parse(JSON.stringify(this.currentJSON));
      } else if (ops.length === 1 && op.op === 'replace' && pathParts[pathParts.length - 1] === 'text') {
        // Text is being replaced, we apply text diffing to find the smallest possible diffs.
        this.addReplaceTextSteps(op, afterStepJSON);
        ops = [];
        afterStepJSON = JSON.parse(JSON.stringify(this.currentJSON));
      } else if (this.addReplaceStep(toDoc, afterStepJSON)) {
        ops = [];
        afterStepJSON = JSON.parse(JSON.stringify(this.currentJSON));
      }
    }
  }

  recreateChangeMarkSteps() {
    // Now the documents should be the same, except their marks, so everything should map 1:1.
    // Second step: Iterate through the toDoc and make sure all marks are the same in tr.doc
    this.toDoc.descendants((tNode, tPos) => {
      if (!tNode.isInline) {
        return true;
      }

      this.tr.doc.nodesBetween(tPos, tPos + tNode.nodeSize, (fNode, fPos) => {
        if (!fNode.isInline) {
          return true;
        }
        const from = Math.max(tPos, fPos);
        const to = Math.min(tPos + tNode.nodeSize, fPos + fNode.nodeSize);
        fNode.marks.forEach((nodeMark) => {
          if (!nodeMark.isInSet(tNode.marks)) {
            this.tr.removeMark(from, to, nodeMark);
          }
        });
        tNode.marks.forEach((nodeMark) => {
          if (!nodeMark.isInSet(fNode.marks)) {
            this.tr.addMark(from, to, nodeMark);
          }
        });
      });
    });
  }

  marklessDoc(doc: Node) {
    const tr = new Transform(doc);
    tr.removeMark(0, doc.nodeSize - 2);
    return tr.doc;
  }

  // From http://prosemirror.net/examples/footnote/
  addReplaceStep(toDoc: Node, afterStepJSON: any) {
    const fromDoc = this.schema.nodeFromJSON(this.currentJSON);
    const step = getReplaceStep(fromDoc, toDoc);
    if (!step) {
      return false;
    } else if (!this.tr.maybeStep(step).failed) {
      this.currentJSON = afterStepJSON;
      return true;
    } else {
      throw new Error('No valid step found.');
    }
  }

  addSetNodeMarkup() {
    const fromDoc = this.schema.nodeFromJSON(this.currentJSON);
    const toDoc = this.schema.nodeFromJSON(this.finalJSON);
    const start = toDoc.content.findDiffStart(fromDoc.content);
    if (start) {
      const fromNode = fromDoc.nodeAt(start)!;
      const toNode = toDoc.nodeAt(start)!;
      try {
        this.tr.setNodeMarkup(
          start,
          fromNode.type === toNode.type ? undefined : toNode.type,
          toNode.attrs,
          toNode.marks
        );
      } catch (error) {
        return;
      }
      this.currentJSON = this.marklessDoc(this.tr.doc).toJSON();
      // Setting the node markup may have invalidated more ops, so we calculate them again.
      this.ops = createPatch(this.currentJSON, this.finalJSON);
    }
  }

  addReplaceTextSteps(op: Operation, afterStepJSON: any) {
    // We find the position number of the first character in the string
    const op1 = { ...op, value: 'xx' };
    const op2 = { ...op, value: 'yy' };

    const afterOP1JSON = JSON.parse(JSON.stringify(this.currentJSON));
    const afterOP2JSON = JSON.parse(JSON.stringify(this.currentJSON));
    const pathParts = op.path.split('/');

    let obj = this.currentJSON;

    applyPatch(afterOP1JSON, [op1]);
    applyPatch(afterOP2JSON, [op2]);

    const op1Doc = this.schema.nodeFromJSON(afterOP1JSON);
    const op2Doc = this.schema.nodeFromJSON(afterOP2JSON);

    let offset = op1Doc.content.findDiffStart(op2Doc.content)!;
    const marks = op1Doc.resolve(offset + 1).marks();

    pathParts.shift();

    while (pathParts.length) {
      const pathPart = pathParts.shift()!;
      obj = obj[pathPart];
    }

    const finalText = (op as TestOperation).value;
    const currentText = obj;

    const textDiffs = this.wordDiffs ? diffWordsWithSpace(currentText, finalText) : diffChars(currentText, finalText);

    while (textDiffs.length) {
      const diff = textDiffs.shift()!;
      if (diff.added) {
        if (textDiffs[0]?.removed) {
          const nextDiff = textDiffs.shift()!;
          this.tr.replaceWith(
            offset,
            offset + nextDiff.value.length,
            this.schema.nodeFromJSON({ type: 'text', text: diff.value }).mark(marks)
          );
        } else {
          this.tr.insert(offset, this.schema.nodeFromJSON({ type: 'text', text: diff.value }).mark(marks));
        }
        offset += diff.value.length;
      } else if (diff.removed) {
        if (textDiffs[0]?.added) {
          const nextDiff = textDiffs.shift()!;
          this.tr.replaceWith(
            offset,
            offset + diff.value.length,
            this.schema.nodeFromJSON({ type: 'text', text: nextDiff.value }).mark(marks)
          );
          offset += nextDiff.value.length;
        } else {
          this.tr.delete(offset, offset + diff.value.length);
        }
      } else {
        offset += diff.value.length;
      }
    }
    this.currentJSON = afterStepJSON;
  }

  // join adjacent ReplaceSteps
  simplifyTr() {
    if (!this.tr.steps.length) {
      return;
    }

    const newTr = new Transform(this.tr.docs[0]);
    const oldSteps = this.tr.steps.slice();
    while (oldSteps.length) {
      let step: Step | undefined | null = oldSteps.shift();
      while (oldSteps.length && step?.merge(oldSteps[0])) {
        const addedStep: Step = oldSteps.shift()!;
        if (step instanceof ReplaceStep && addedStep instanceof ReplaceStep) {
          step = getReplaceStep(newTr.doc, addedStep.apply(step.apply(newTr.doc).doc!).doc!) || step.merge(addedStep);
        } else {
          step = step.merge(addedStep);
        }
      }
      if (step) {
        newTr.step(step);
      }
    }
    this.tr = newTr;
  }
}

export function recreateTransform(fromDoc: Node, toDoc: Node, complexSteps = true, wordDiffs = true) {
  const recreator = new RecreateTransform(fromDoc, toDoc, complexSteps, wordDiffs);
  return recreator.init();
}
