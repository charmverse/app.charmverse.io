import { rest } from 'msw';
import { GlobalContext } from 'stories/lib/GlobalContext';

import { MemberDirectoryPage as MemberDirectoryComponent } from 'components/members/MemberDirectoryPage';

import { memberProperties } from '../lib/mockData';

export function MemberDirectoryPage() {
  return (
    <GlobalContext>
      <MemberDirectoryComponent title='Member Directory' />
    </GlobalContext>
  );
}

MemberDirectoryPage.parameters = {
  msw: {
    handlers: {
      getMemberProperties: rest.get('/api/spaces/:spaceId/members/properties', (req, res, ctx) => {
        return res(ctx.json(memberProperties));
      })
    }
  }
};

export default {
  title: 'Members/Views',
  component: MemberDirectoryPage
};
