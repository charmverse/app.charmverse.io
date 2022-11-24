import ButtonGroup from '@mui/material/ButtonGroup';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import { useRouter } from 'next/router';

import Button from 'components/common/Button';

import CategoryList from '../CategoryList';

interface SidebarForumProps {
  disabled: boolean;
}

const filterButtons = [
  { value: 'new', label: 'Newest post' },
  { value: 'latest', label: 'Latest Activity' },
  { value: 'popular', label: 'Most Popular' }
];

export default function SidebarForum (props: SidebarForumProps) {
  const { disabled = false } = props;

  const router = useRouter();

  const handleClick = (id: string) => {
    router.push({
      pathname: `/${router.query.domain}/forum`,
      query: { filter: id }
    }, undefined, { shallow: true });
  };

  return (
    <Card variant='outlined'>
      <CardContent>
        <ButtonGroup orientation='vertical' sx={{ alignItems: 'flex-start' }} color='inherit' disabled={disabled}>
          {filterButtons.map(btn => (
            <Button key={btn.value} variant='text' onClick={() => handleClick(btn.value)}>{btn.label}</Button>
          ))}
        </ButtonGroup>
        <Divider sx={{ pt: '10px', mb: '10px' }} />
        <CategoryList disabled={disabled} />
      </CardContent>
    </Card>
  );
}
