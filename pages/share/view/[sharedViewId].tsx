import BlocksEditorPage from 'pages/[domain]/[pageId]';
import { useRouter } from 'next/router';

export default function PublicBoardView () {
  const router = useRouter();

  const { sharedViewId } = router.query;

  return <BlocksEditorPage publicShare={true} viewId={sharedViewId as string} />;
}
