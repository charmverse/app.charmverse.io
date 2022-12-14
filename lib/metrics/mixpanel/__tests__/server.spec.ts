import { eventNameToHumanFormat, paramsToHumanFormat } from '../utils';

describe('mixpanel/eventNameToHumanFormat', () => {
  it('Should return event name in human readable format (capitalize, with spaces)', async () => {
    expect(eventNameToHumanFormat('sign_in')).toBe('Sign in');
    expect(eventNameToHumanFormat('create_new_workspace')).toBe('Create new workspace');
  });

  it('Should return params oject with human readable props', async () => {
    expect(paramsToHumanFormat({ someParam: 1 })).toEqual({ 'Some Param': 1 });
    expect(paramsToHumanFormat({ someParam: 1, paramBName: 2, ParamCName: 3 })).toEqual({
      'Some Param': 1,
      'Param B Name': 2,
      'Param C Name': 3
    });
  });
});
