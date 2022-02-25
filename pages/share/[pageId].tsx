import BlocksEditorPage from 'pages/[domain]/[pageId]';
import router from 'next/router';

export default function PublicPage () {

  return <BlocksEditorPage publicShare={true} />;
}
