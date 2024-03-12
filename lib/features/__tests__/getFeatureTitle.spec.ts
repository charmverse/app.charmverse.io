import type { FeatureJson } from '../constants';
import { getFeatureTitle } from '../getFeatureTitle';

describe('getFeatureTitle', () => {
  it('Maintains normal feature titles', () => {
    expect(getFeatureTitle('proposal')).toBe('proposal');
    expect(getFeatureTitle('Proposal')).toBe('Proposal');
    expect(getFeatureTitle('proposals')).toBe('proposals');
    expect(getFeatureTitle('Proposals')).toBe('Proposals');
  });
  it('Translates custom title for proposals', () => {
    const customFeatures: FeatureJson[] = [
      {
        id: 'proposals',
        title: 'Grants',
        isHidden: false
      }
    ];
    expect(getFeatureTitle('proposal', customFeatures)).toBe('grant');
    expect(getFeatureTitle('Proposal', customFeatures)).toBe('Grant');
    expect(getFeatureTitle('proposals', customFeatures)).toBe('grants');
    expect(getFeatureTitle('Proposals', customFeatures)).toBe('Grants');
  });

  it('Handles plurals that end in ies', () => {
    const customFeatures: FeatureJson[] = [
      {
        id: 'rewards',
        title: 'Bounties',
        isHidden: false
      }
    ];
    expect(getFeatureTitle('reward', customFeatures)).toBe('bounty');
  });

  it('Handles plurals that do not end in s', () => {
    const customFeatures: FeatureJson[] = [
      {
        id: 'proposals',
        title: 'Moose',
        isHidden: false
      }
    ];
    expect(getFeatureTitle('proposal', customFeatures)).toBe('moose');
  });
});
