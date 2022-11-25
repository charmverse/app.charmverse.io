import Alert from '@mui/material/Alert';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import FilterList from '../FilterList';
import FilterSelect from '../FilterSelect';

const sortList = ['Most Popular', 'Newest post', 'Latest Activity'];

interface ForumFiltersProps {
  type: 'list' | 'select';
}

export default function ForumFilters ({ type }: ForumFiltersProps) {
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

  if (error) {
    return <Alert severity='error'>An error occured while loading the categories</Alert>;
  }

  if (!categories) {
    return null;
  }

  if (type === 'list') {
    return <FilterList disabled={isValidating} handleClick={handleClick} categories={categories} sortList={sortList} />;
  }

  if (type === 'select') {
    return <FilterSelect disabled={isValidating} handleClick={handleClick} categories={categories} sortList={sortList} />;
  }

  return null;
}
