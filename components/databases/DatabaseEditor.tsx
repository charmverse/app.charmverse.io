import { Page } from 'models';
import BoardPage from './focalboard/src/pages/boardPage';

export function DatabaseEditor ({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return (
    <BoardPage />
  );
}
