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
  } = useSWR(currentSpace ? `spaces/${currentSpace.id}/post-categories` : null, () =>
    charmClient.forum.listPostCategories(currentSpace!.id).then((_categories) =>
      _categories.sort((catA, catB) => {
        const first = catA.name.toLowerCase();
        const second = catB.name.toLowerCase();
        if (first < second) {
          return -1;
        } else if (second < first) {
          return 1;
        } else {
          return 0;
        }
      })
    )
  );

  const getLinkUrl = (value: string) => {
    const isValidSort = value && sortList.some((sortOption) => sortOption === value);
    const isValidCategory = value && categories?.some((category) => category.name === value);

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
