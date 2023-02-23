import { getTemplateExplanation } from '../preset-templates';

describe('getTemplateExplanation', () => {
  it('should return an empty explanation for when the custom mode type is provided', () => {
    const [can, cannot] = getTemplateExplanation('custom');
    expect(can.length).toBe(0);
    expect(cannot.length).toBe(0);
  });
  it('should return the correct explanation for the read-only template', () => {
    const can = ['Space members can view new top-level pages by default.'];
    const cannot = [
      'Space members cannot create new bounties.',
      'Space members cannot create new pages.',
      'Space members cannot create new forum categories.',
      'Space members cannot be a proposal reviewer.',
      'Space members cannot comment on, edit, share or delete new top-level pages by default.',
      'Anyone outside the space cannot see new top-level pages by default.',
      'Anyone outside the space cannot see bounties and bounty suggestions.'
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
      'Space members can create new pages.',
      'Space members can create new bounties.',
      'Space members can be a proposal reviewer.',
      'Space members can view, edit, comment on, share and delete new top-level pages by default.'
    ];
    const cannot = [
      'Space members cannot create new forum categories.',
      'Anyone outside the space cannot see new top-level pages by default.',
      'Anyone outside the space cannot see bounties and bounty suggestions.'
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
      'Space members can create new pages.',
      'Space members can create new bounties.',
      'Space members can be a proposal reviewer.',
      'Space members can view, edit, comment on, share and delete new top-level pages by default.',
      'Anyone can see new top-level pages by default.',
      'Anyone can see bounties and bounty suggestions visible to space members.'
    ];

    const cannot: string[] = ['Space members cannot create new forum categories.'];

    const [canExplained, cannotExplained] = getTemplateExplanation('open');

    expect(canExplained.length).toBe(can.length);
    for (let i = 0; i < can.length; i++) {
      expect(canExplained[i]).toEqual(can[i]);
    }

    expect(cannotExplained.length).toBe(cannot.length);
  });
});
