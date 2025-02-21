import { mockCurrentSpaceContext } from '@packages/testing/mocks/useCurrentSpace';
import { createMockUser } from '@packages/testing/mocks/user';
import { render } from '@testing-library/react';
import { createElement } from 'react';
import { v4 as uuid } from 'uuid';

// Import hooks to mock
import { useMemberProperties } from 'hooks/useMemberProperties';
import type { Member, MemberPropertyWithPermissions, PropertyValueWithDetails } from 'lib/members/interfaces';

import { MemberDirectoryGalleryView } from '../MemberDirectoryGalleryView';

jest.mock('@emotion/styled', () => {
  // A function to create a mock styled component
  const createMockStyledComponent = (tag: any) => {
    // Return a functional component
    function MockStyledComponent({ children, ...props }: any) {
      return createElement(tag, props, children);
    }
    return MockStyledComponent;
  };

  const mockStyledImplementation = jest.fn().mockImplementation((tag) => {
    return jest.fn().mockImplementation(() => createMockStyledComponent(tag));
  });

  // Handle specific HTML tags
  const tags = ['a', 'body', 'div', 'span', 'button', 'input']; // Extend this list as needed
  tags.forEach((tag) => {
    // @ts-nocheck
    (mockStyledImplementation as any)[tag] = createMockStyledComponent(tag);
  });

  return {
    __esModule: true,
    default: mockStyledImplementation
  };
});
jest.mock('charmClient/hooks/proposals', () => ({
  useGetProposalDetails: jest.fn(() => ({
    proposal: null
  }))
}));
jest.mock('hooks/usePage', () => ({
  usePage: jest.fn(() => ({
    page: {
      type: 'page'
    }
  }))
}));
jest.mock('hooks/useCurrentSpace', () => ({
  useCurrentSpace: jest.fn(() => mockCurrentSpaceContext())
}));
jest.mock('hooks/useMemberProperties', () => ({
  useMemberProperties: jest.fn(() => ({ getDisplayProperties: jest.fn(() => []) }))
}));
jest.mock('hooks/useUser', () => ({
  useUser: jest.fn(() => ({ user: createMockUser() }))
}));

afterAll(() => {
  jest.resetModules();
});

const spaceId = uuid();

const adminId = uuid();

const textProperty: MemberPropertyWithPermissions = {
  createdAt: new Date(),
  createdBy: adminId,
  enabledViews: ['gallery'],
  id: uuid(),
  index: 0,
  name: 'Location',
  required: false,
  options: [],
  spaceId,
  type: 'text',
  permissions: [],
  updatedAt: new Date(),
  updatedBy: adminId
};

const selectProperty: MemberPropertyWithPermissions = {
  createdAt: new Date(),
  createdBy: adminId,
  enabledViews: ['gallery'],
  id: uuid(),
  index: 0,
  name: 'Select',
  required: false,
  options: [
    {
      id: uuid(),
      name: 'single-1',
      color: 'blue',
      index: 0
    },
    {
      id: uuid(),
      name: 'single-2',
      color: 'blue',
      index: 1
    }
  ],
  spaceId,
  type: 'select',
  permissions: [],
  updatedAt: new Date(),
  updatedBy: adminId
};

const multiSelectProperty: MemberPropertyWithPermissions = {
  createdAt: new Date(),
  createdBy: adminId,
  enabledViews: ['gallery'],
  id: uuid(),
  index: 0,
  name: 'Multiselect',
  required: false,
  options: [
    {
      id: uuid(),
      name: 'multi-1',
      color: 'blue',
      index: 0
    },
    {
      id: uuid(),
      name: 'multi-2',
      color: 'blue',
      index: 1
    }
  ],
  spaceId,
  type: 'multiselect',
  permissions: [],
  updatedAt: new Date(),
  updatedBy: adminId
};

const spaceProperties: MemberPropertyWithPermissions[] = [textProperty, selectProperty, multiSelectProperty];

const textPropertyValue: PropertyValueWithDetails = {
  enabledViews: ['gallery'],
  memberPropertyId: textProperty.id,
  name: 'Location',
  required: false,
  spaceId,
  type: textProperty.type,
  value: 'New York'
};

const selectPropertyValue: PropertyValueWithDetails = {
  enabledViews: ['gallery'],
  memberPropertyId: selectProperty.id,
  name: 'Select',
  required: false,
  spaceId,
  type: selectProperty.type,
  value: (selectProperty.options as any[])[0].id
};

const multiSelectPropertyValue: PropertyValueWithDetails = {
  enabledViews: ['gallery'],
  memberPropertyId: multiSelectProperty.id,
  name: 'Multiselect',
  required: false,
  spaceId,
  type: multiSelectProperty.type,
  value: (multiSelectProperty.options as any[])[0].id
};

const propertyValues: PropertyValueWithDetails[] = [textPropertyValue, selectPropertyValue, multiSelectPropertyValue];

const mockMember: Member = {
  ...createMockUser(),
  farcasterUser: undefined,
  avatar: 'https://example.com/avatar.png',
  isBot: false,
  deletedAt: undefined,
  avatarTokenId: undefined,
  profile: {
    description: 'user description',
    id: uuid(),
    locale: 'en-US',
    timezone: 'UTC',
    social: {
      discordUsername: 'test-discord',
      githubURL: 'github.com/testuser1',
      linkedinURL: 'linkedin.com/testuser1',
      twitterURL: 'x.com/testuser1'
    }
  },
  roles: [],
  onboarded: true,
  searchValue: 'test',
  joinDate: new Date().toISOString(),
  path: 'member-path',
  createdAt: new Date(),
  updatedAt: new Date(),
  username: 'Test user',
  id: uuid(),
  properties: propertyValues
};

describe('PaidShareToWeb', () => {
  it('should render the visible properties along with their values', async () => {
    (useMemberProperties as jest.Mock<Partial<ReturnType<typeof useMemberProperties>>>).mockReturnValueOnce({
      getDisplayProperties: jest.fn(() => spaceProperties)
    });

    const rendered = render(<MemberDirectoryGalleryView members={[mockMember]} />);

    const textFieldName = rendered.getByTestId(`member-property-name-${textProperty.id}`);
    const textFieldValue = rendered.getByTestId(`member-property-value-${textProperty.id}`);
    expect(textFieldName?.textContent).toBe(textProperty.name);
    expect(textFieldValue?.textContent).toBe(textPropertyValue.value);

    const [selectFieldName, multiSelectFieldName] = rendered.getAllByTestId(`select-preview-name`);

    expect(selectFieldName?.textContent).toBe(selectProperty.name);
    expect(multiSelectFieldName?.textContent).toBe(multiSelectProperty.name);

    const selectFieldValue = rendered.getByTestId(`select-preview-value-${selectPropertyValue.value}`);

    expect(selectFieldValue?.textContent).toBe(
      (selectProperty.options as any).find((o: any) => o.id === selectPropertyValue.value)?.name
    );

    const multiSelectFieldValue = rendered.getByTestId(`select-preview-value-${multiSelectPropertyValue.value}`);

    expect(multiSelectFieldValue?.textContent).toBe(
      (multiSelectProperty.options as any).find((o: any) => o.id === multiSelectPropertyValue.value)?.name
    );
  });

  it('should not render the visible properties if the value is empty', async () => {
    (useMemberProperties as jest.Mock<Partial<ReturnType<typeof useMemberProperties>>>).mockReturnValueOnce({
      getDisplayProperties: jest.fn(() => spaceProperties)
    });

    const rendered = render(
      <MemberDirectoryGalleryView
        members={[
          {
            ...mockMember,
            properties: [
              {
                ...textPropertyValue,
                value: ''
              },
              {
                ...selectPropertyValue,
                value: ''
              },
              {
                ...multiSelectPropertyValue,
                value: []
              }
            ]
          }
        ]}
      />
    );

    const textFieldName = rendered.queryByTestId(`member-property-name-${textProperty.id}`);
    const textFieldValue = rendered.queryByTestId(`member-property-value-${textProperty.id}`);
    expect(textFieldName).toBeNull();
    expect(textFieldValue).toBeNull();

    const [selectFieldName, multiSelectFieldName] = rendered.queryAllByTestId(`select-preview-name`);

    expect(selectFieldName).toBeUndefined();
    expect(multiSelectFieldName).toBeUndefined();

    const selectFieldValue = rendered.queryByTestId(`select-preview-value-${selectPropertyValue.value}`);

    expect(selectFieldValue).toBeNull();

    const multiSelectFieldValue = rendered.queryByTestId(`select-preview-value-${multiSelectPropertyValue.value}`);

    expect(multiSelectFieldValue).toBeNull();
  });
});
