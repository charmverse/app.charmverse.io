import { rest } from 'msw';

import MemberDirectoryPage from 'components/members/MemberDirectoryPage';

import { memberProperties } from '../../.storybook/lib/mockData';

export function MemberDirectoryPageStory() {
  return <MemberDirectoryPage title='Member Directory' />;
}

MemberDirectoryPageStory.parameters = {
  msw: {
    handlers: {
      getMemberProperties: rest.get('/api/spaces/:spaceId/members/properties', (req, res, ctx) => {
        return res(ctx.json(memberProperties));
      })
    }
  }
};
