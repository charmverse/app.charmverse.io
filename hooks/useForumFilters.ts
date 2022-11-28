import { useRouter } from 'next/router';
import useSWR from 'swr';

import charmClient from 'charmClient';

import { useCurrentSpace } from './useCurrentSpace';

const sortList = ['Most Popular', 'Newest post', 'Latest Activity'];

export function useForumFilters() {
  const { push, query } = useRouter();
  const currentSpace = useCurrentSpace();

  const {
    data: categories,
    error,
    isValidating
  } = useSWR(currentSpace ? '/forum/categories' : null, () => charmClient.forum.listPostCategories(currentSpace!.id));

  const getLinkUrl = (value: string) => {
    const isValidSort = value && sortList.some((btn) => btn === value);
    const isValidCategory = value && categories?.some((btn) => btn === value);

    if (isValidSort) {
      return `/${query.domain}/forum/?sort=${value}`;
    }
    if (isValidCategory) {
      return `/${query.domain}/forum/?category=${value}`;
    }

    return `${query.domain}/forum/`;
  };

  return { categories, sortList, error, getLinkUrl, disabled: isValidating };
}
