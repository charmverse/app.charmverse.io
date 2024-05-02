import type { NodeType, Builder } from 'lib/prosemirror/builders';
import { builders as _, jsonDoc } from 'lib/prosemirror/builders';

import { updateEntityIds, _updateNode, _getExtractedPollsMap } from '../updateEntityIds';

describe('updateEntityIds', () => {
  it('Should update a nested node', () => {
    const oldId = 'old-id';
    const newId = 'new-id';
    const content = (pageId: string) => _.bullet_list({ indent: 1 }, _.list_item(_.page({ id: pageId })));
    const original = jsonDoc(content(oldId));
    const updated = jsonDoc(content(newId));
    updateEntityIds({
      pages: [{ id: 'some-id', content: original }],
      oldNewRecordIdHashMap: { [oldId]: newId }
    });
    expect(original).toEqual(updated);
  });
});

describe('_updateNode', () => {
  it('Should update a page type node', () => {
    const oldId = 'old-id';
    const newId = 'new-id';
    const original = _.page({ id: oldId }).toJSON();
    const updated = _.page({ id: newId }).toJSON();
    _updateNode(original, {
      pollPageId: '',
      extractedPolls: _getExtractedPollsMap(),
      oldNewRecordIdHashMap: { [oldId]: newId }
    });
    expect(original).toEqual(updated);
  });

  it('Should update a linked page type node', () => {
    const oldId = 'old-id';
    const newId = 'new-id';
    const original = _.linkedPage({ id: oldId }).toJSON();
    const updated = _.linkedPage({ id: newId }).toJSON();
    _updateNode(original, {
      pollPageId: '',
      extractedPolls: _getExtractedPollsMap(),
      oldNewRecordIdHashMap: { [oldId]: newId }
    });
    expect(original).toEqual(updated);
  });

  it('Should update a page mention node', () => {
    const oldId = 'old-id';
    const newId = 'new-id';
    const original = _.mention({ type: 'page', value: oldId }).toJSON();
    const updated = _.mention({ type: 'page', value: newId }).toJSON();
    _updateNode(original, {
      pollPageId: '',
      extractedPolls: _getExtractedPollsMap(),
      oldNewRecordIdHashMap: { [oldId]: newId }
    });
    expect(original).toEqual(updated);
  });

  it('Should update an inline db page node', () => {
    const oldId = 'old-id';
    const newId = 'new-id';
    const original = _.inlineDatabase({ pageId: oldId }).toJSON();
    const updated = _.inlineDatabase({ pageId: newId }).toJSON();
    _updateNode(original, {
      pollPageId: '',
      extractedPolls: _getExtractedPollsMap(),
      oldNewRecordIdHashMap: { [oldId]: newId }
    });
    expect(original).toEqual(updated);
  });

  it('Should create a new id for an embedded poll node', () => {
    const oldId = 'old-id';
    const pollPageId = 'new-id';
    const original = _.poll({ pollId: oldId }).toJSON();
    const extractedPolls = _getExtractedPollsMap();
    _updateNode(original, {
      pollPageId,
      extractedPolls,
      oldNewRecordIdHashMap: {}
    });
    expect(original.attrs.pollId).not.toEqual(oldId); // _updateNode mutates the original object
    const extracted = extractedPolls.get(oldId);
    expect(extracted).toEqual({
      pageId: pollPageId,
      newPollId: expect.any(String),
      originalId: oldId
    });
  });
});
