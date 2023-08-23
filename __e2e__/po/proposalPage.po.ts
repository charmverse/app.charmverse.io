import { DocumentPage } from './document.po';

export class ProposalPage extends DocumentPage {
  gotoNextStatus() {
    return this.page.click('data-test=next-status-button');
  }

  clickSaveDraft() {
    return this.page.click('data-test=create-proposal-button');
  }
}
