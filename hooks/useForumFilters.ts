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
    charmClient.forum.listPostCategories(currentSpace!.id)
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

  const handleClick = (value: string) => {
    const isValidSort = value && sortList.some((sort) => sort === value);
    const isValidCategory = value && categories?.some((category) => category.name === value);

    push(
      {
        pathname: `/${query.domain}/forum`,
        ...(isValidSort && {
          query: { sort: value }
        }),
        ...(isValidCategory && {
          query: { category: value }
        })
      },
      undefined,
      { shallow: true }
    );
  };

  return { categories, sortList, error, getLinkUrl, handleClick, disabled: isValidating };
}
