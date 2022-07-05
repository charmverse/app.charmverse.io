
import PublicPageComponent from 'components/share/PublicPage';
import PublicBountiesComponent from 'components/share/PublicBounties';
import { useRouter } from 'next/router';
import LoadingComponent from 'components/common/LoadingComponent';

export default function PublicPage () {

  const router = useRouter();

  if (!router.query) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  const isBountiesPage = router.query.pageId?.[1] === 'bounties';

  // Make sure we have time to evaluate query before rendering anything
  if (isBountiesPage) {
    return <PublicBountiesComponent />;
  }

  return <PublicPageComponent />;
}
