import { test as base } from '@playwright/test';

import { BountyBoardPage } from './po/bountyBoard.po';
import { BountyPage } from './po/bountyPage.po';
import { DatabasePage } from './po/databasePage.po';
import { DocumentPage } from './po/document.po';
import { FormField } from './po/formField.po';
import { ForumHomePage } from './po/forumHome.po';
import { ForumPostPage } from './po/forumPost.po';
import { GlobalPage } from './po/global.po';
import { AcceptInvitePage } from './po/inviteLink.po';
import { LoggedInPage } from './po/loggedIn.po';
import { LoginPage } from './po/login.po';
import { PageHeader } from './po/pageHeader.po';
import { PagePermissionsDialog } from './po/pagePermissions.po';
import { PagesSidebarPage } from './po/pagesSidebar.po';
import { ProposalPage } from './po/proposalPage.po';
import { ProposalsListPage } from './po/proposalsList.po';
import { RewardPage } from './po/rewardPage.po';
import { ProjectSettings } from './po/settings/projectSettings.po';
import { SettingsModal } from './po/settings/settings.po';
import { ApiSettings } from './po/settings/spaceApiSettings.po';
import { PermissionSettings } from './po/settings/spacePermissionSettings.po';
import { SpaceProfileSettings } from './po/settings/spaceProfileSettings.po';
import { SignUpPage } from './po/signup.po';
import { SpacesDropdown } from './po/spacesDropdown.po';
import { TokenGatePage } from './po/tokenGate.po';

type Fixtures = {
  bountyBoardPage: BountyBoardPage;
  bountyPage: BountyPage;
  databasePage: DatabasePage;
  documentPage: DocumentPage;
  dialogDocumentPage: DocumentPage;
  rewardPage: RewardPage;
  dialogRewardPage: RewardPage;
  forumHomePage: ForumHomePage;
  forumPostPage: ForumPostPage;
  globalPage: GlobalPage;
  acceptInvitePage: AcceptInvitePage;
  loggedInPage: LoggedInPage;
  loginPage: LoginPage;
  pageHeader: PageHeader;
  pagePermissionsDialog: PagePermissionsDialog;
  pagesSidebar: PagesSidebarPage;
  proposalPage: ProposalPage;
  proposalFormFieldPage: FormField;
  proposalsListPage: ProposalsListPage;
  settingsModal: SettingsModal;
  apiSettings: ApiSettings;
  permissionSettings: PermissionSettings;
  spaceProfileSettings: SpaceProfileSettings;
  signUpPage: SignUpPage;
  spacesDropdown: SpacesDropdown;
  tokenGatePage: TokenGatePage;
  projectSettings: ProjectSettings;
};

// Used for reusing a Page Object Model, but scoped to a part of the screen
// Example case: Dealing with main document page and popup document page
const dialogSelector = `data-test=dialog`;

export const test = base.extend<Fixtures>({
  bountyBoardPage: async ({ page }, use) => use(new BountyBoardPage(page)),
  bountyPage: async ({ page }, use) => use(new BountyPage(page)),
  databasePage: async ({ page }, use) => use(new DatabasePage(page)),
  documentPage: async ({ page }, use) => use(new DocumentPage(page)),
  dialogDocumentPage: async ({ page }, use) => use(new DocumentPage(page, dialogSelector)),
  rewardPage: async ({ page }, use) => use(new RewardPage(page)),
  dialogRewardPage: async ({ page }, use) => use(new RewardPage(page, dialogSelector)),
  forumHomePage: async ({ page }, use) => use(new ForumHomePage(page)),
  forumPostPage: async ({ page }, use) => use(new ForumPostPage(page)),
  globalPage: async ({ page }, use) => use(new GlobalPage(page)),
  acceptInvitePage: async ({ page }, use) => use(new AcceptInvitePage(page)),
  loggedInPage: async ({ page }, use) => use(new LoggedInPage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  pageHeader: async ({ page }, use) => use(new PageHeader(page)),
  pagePermissionsDialog: async ({ page }, use) => use(new PagePermissionsDialog(page)),
  pagesSidebar: async ({ page }, use) => use(new PagesSidebarPage(page)),
  proposalPage: async ({ page }, use) => use(new ProposalPage(page)),
  proposalFormFieldPage: async ({ page }, use) => use(new FormField(page)),
  proposalsListPage: async ({ page }, use) => use(new ProposalsListPage(page)),
  settingsModal: async ({ page }, use) => use(new SettingsModal(page)),
  apiSettings: async ({ page }, use) => use(new ApiSettings(page)),
  permissionSettings: async ({ page }, use) => use(new PermissionSettings(page)),
  spaceProfileSettings: async ({ page }, use) => use(new SpaceProfileSettings(page)),
  signUpPage: async ({ page }, use) => use(new SignUpPage(page)),
  spacesDropdown: async ({ page }, use) => use(new SpacesDropdown(page)),
  tokenGatePage: async ({ page }, use) => use(new TokenGatePage(page)),
  projectSettings: async ({ page }, use) => use(new ProjectSettings(page))
});
export { chromium, expect } from '@playwright/test';
