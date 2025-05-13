import { render, waitFor } from '@testing-library/react';

import { Button } from 'components/common/Button';
import { mockCurrentSpaceContext } from 'lib/testing/mocks/useCurrentSpace';

jest.mock('hooks/useCurrentSpace', () => ({
  useCurrentSpace: jest.fn(() => mockCurrentSpaceContext())
}));

describe('Atomic Button component', () => {
  it('should render the button with text', async () => {
    const renderedButton = render(<Button>test label</Button>);

    const button = renderedButton.getByText('test label');

    expect(button?.getAttribute('type')).toBe('button');
    expect(button?.getAttribute('disabled')).toBe(null);
  });

  it('should render disabled button', async () => {
    const renderedButton = render(<Button disabled>test label</Button>);

    const button = renderedButton.getByText('test label');
    expect(button?.getAttribute('disabled')).toBeDefined();

    renderedButton.rerender(<Button disabled={false}>test label</Button>);

    const button2 = renderedButton.getByText('test label');
    expect(button2?.getAttribute('disabled')).toBe(null);
  });

  it('should render loading button', async () => {
    const renderedButton = render(<Button loading>test label</Button>);

    const button = renderedButton.getByText('test label');
    expect(button?.getAttribute('disabled')).toBeDefined();

    renderedButton.rerender(
      <Button disabled={false} loading>
        test label
      </Button>
    );

    const button2 = renderedButton.getByText('test label');
    // Loading state should always disable the button
    expect(button2?.getAttribute('disabled')).toBeDefined();

    // should render loading message
    renderedButton.rerender(
      <Button disabled={false} loading loadingMessage='loading...'>
        test label
      </Button>
    );
    await waitFor(() => {
      expect(renderedButton.getByText('loading...')).toBeDefined();
    });

    // loading state indicator
    expect(renderedButton.getByRole('progressbar')).toBeDefined();
  });
});
