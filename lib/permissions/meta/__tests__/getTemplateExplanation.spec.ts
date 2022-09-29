import { getTemplateExplanation } from '../preset-templates';

describe('getTemplateExplanation', () => {

  it('should return an empty explanation for when the custom mode type is provided', () => {
    const [can, cannot] = getTemplateExplanation('custom');
    expect(can.length).toBe(0);
    expect(cannot.length).toBe(0);
  });
  it('should return the correct explanation for the read-only template', () => {

    const can = [
      'Workspace members can view new top-level pages by default.'
    ];
    const cannot = [
      'Workspace members cannot create new bounties.',
      'Workspace members cannot create new pages.',
      'Workspace members cannot create new proposals.',
      'Workspace members cannot comment on, edit, share or delete new top-level pages by default.',
      'Anyone outside the workspace cannot see new top-level pages by default.',
      'Anyone outside the workspace cannot see bounties and bounty suggestions.'
    ];

    const [canExplained, cannotExplained] = getTemplateExplanation('readOnly');

    expect(canExplained.length).toBe(can.length);
    for (let i = 0; i < can.length; i++) {
      expect(canExplained[i]).toEqual(can[i]);
    }

    expect(cannotExplained.length).toBe(cannot.length);
    for (let i = 0; i < cannot.length; i++) {
      expect(cannotExplained[i]).toEqual(cannot[i]);
    }
  });

  it('should return the correct explanation for the collaborative template', () => {
    const can = [
      'Workspace members can create new pages.',
      'Workspace members can create new bounties.',
      'Workspace members can create new proposals.',
      'Workspace members can view, edit, comment on, share and delete new top-level pages by default.'
    ];
    const cannot = [
      'Anyone outside the workspace cannot see new top-level pages by default.',
      'Anyone outside the workspace cannot see bounties and bounty suggestions.'
    ];

    const [canExplained, cannotExplained] = getTemplateExplanation('collaborative');

    expect(canExplained.length).toBe(can.length);
    for (let i = 0; i < can.length; i++) {
      expect(canExplained[i]).toEqual(can[i]);
    }

    expect(cannotExplained.length).toBe(cannot.length);
    for (let i = 0; i < cannot.length; i++) {
      expect(cannotExplained[i]).toEqual(cannot[i]);
    }
  });

  it('should return the correct explanation for the public template', () => {
    const can = [
      'Workspace members can create new pages.',
      'Workspace members can create new bounties.',
      'Workspace members can create new proposals.',
      'Workspace members can view, edit, comment on, share and delete new top-level pages by default.',
      'Anyone can see new top-level pages by default.',
      'Anyone can see bounties and bounty suggestions visible to workspace members.'
    ];

    const cannot: string[] = [];

    const [canExplained, cannotExplained] = getTemplateExplanation('open');

    expect(canExplained.length).toBe(can.length);
    for (let i = 0; i < can.length; i++) {
      expect(canExplained[i]).toEqual(can[i]);
    }

    expect(cannotExplained.length).toBe(cannot.length);
  });
});
