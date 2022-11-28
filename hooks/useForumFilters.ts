import { useRouter } from 'next/router';
import useSWR from 'swr';

import charmClient from 'charmClient';

import { useCurrentSpace } from './useCurrentSpace';

const sortList = ['Most Popular', 'Newest post', 'Latest Activity'];

export function useForumFilters () {
  const { push, query } = useRouter();
  const currentSpace = useCurrentSpace();

  const { data: categories, error, isValidating } = useSWR(currentSpace ? '/forum/categories' : null, () => charmClient.forum.listPostCategories(currentSpace!.id));

  const handleClick = (value: string) => {
    const isValidSort = value && sortList.some(btn => btn === value);
    const isValidCategory = value && categories?.some(btn => btn === value);

    push({
      pathname: `/${query.domain}/forum`,
      ...(isValidSort && ({
        query: { sort: value }
      })),
      ...(isValidCategory && ({
        query: { category: value }
      }))
    }, undefined, { shallow: true });
  };

  return { categories, sortList, error, handleClick, disabled: isValidating };
}
