
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import EditorPage from 'components/[pageId]/EditorPage/EditorPage';
import Modal from 'components/common/Modal';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { MemberPropertiesPopupForm } from 'components/profile/components/SpacesMemberDetails/components/MemberPropertiesPopupForm';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMemberPropertyValues } from 'hooks/useMemberPropertyValues';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import type { PageMeta } from 'lib/pages';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

function MemberPropertiesOnBoardingModal ({ memberId, spaceId }: { spaceId: string, memberId: string }) {
  const router = useRouter();
  const memberDirectoryFormModal = usePopupState({ variant: 'popover', popupId: 'member-directory-onboarding' });
  const { updateSpaceValues } = useMemberPropertyValues(memberId);

  useEffect(() => {
    const onboarding = router.query.onboarding;
    if (onboarding === 'true') {
      memberDirectoryFormModal.open();
    }
  }, [router]);

  function close () {
    setUrlWithoutRerender(window.location.href, {});
    memberDirectoryFormModal.close();
  }

  return (
    <Modal size='large' open={memberDirectoryFormModal.isOpen} onClose={close}>
      <MemberPropertiesPopupForm
        onClose={close}
        memberId={memberId}
        spaceId={spaceId}
        updateMemberPropertyValues={updateSpaceValues}
      />
    </Modal>
  );
}

export default function BlocksEditorPage () {

  const { pages } = usePages();
  const router = useRouter();

  const pagePath = router.query.pageId as string;
  const pageIdList = Object.values(pages ?? {}) as PageMeta[];
  const pageId = pageIdList.find(p => p.path === pagePath)?.id;

  const { user } = useUser();
  const [space] = useCurrentSpace();

  return (
    <>
      {user && space && (
        <MemberPropertiesOnBoardingModal
          memberId={user.id}
          spaceId={space.id}
        />
      )}
      <EditorPage pageId={pageId ?? pagePath} />
    </>
  );
}

BlocksEditorPage.getLayout = getPageLayout;
