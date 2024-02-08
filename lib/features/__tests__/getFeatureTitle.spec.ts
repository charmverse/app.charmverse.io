import type { FeatureJson } from '../constants';
import { constructFeaturesRecord } from '../constructFeaturesRecord';
import type { FeatureTitleVariation } from '../getFeatureTitle';
import { getFeatureTitle as _getFeatureTitle } from '../getFeatureTitle';

function getFeatureTitle(featureTitle: FeatureTitleVariation, features?: FeatureJson[]) {
  const { mappedFeatures } = constructFeaturesRecord(features || []);
  return _getFeatureTitle({ featureTitle, mappedFeatures });
}

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
});
