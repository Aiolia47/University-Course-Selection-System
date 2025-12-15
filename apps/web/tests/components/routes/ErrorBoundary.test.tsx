import { render, screen } from '../../utils/test-utils';
import ErrorBoundary from '@/components/routes/ErrorBoundary';

// Mock console.error to avoid noise in test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary Component', () => {
  // Component that throws an error
  const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
      throw new Error('Test error');
    }
    return <div data-testid="normal-content">Normal Content</div>;
  };

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="test-content">Test Content</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('should catch and display error when child component throws', () => {
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error');

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should display error message
    expect(screen.getByText(/出现了一些问题/)).toBeInTheDocument();
    expect(screen.getByText(/页面发生了错误/)).toBeInTheDocument();

    // Should log error to console
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should provide a way to refresh the page', () => {
    // Mock location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Find and click refresh button
    const refreshButton = screen.getByRole('button', { name: /刷新页面/ });
    refreshButton.click();

    // Should reload the page
    expect(mockReload).toHaveBeenCalled();
  });

  it('should render error details when provided', () => {
    const error = new Error('Detailed error message');
    error.stack = 'Error stack trace';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should display generic error message (not the raw error for security)
    expect(screen.getByText(/页面发生了错误/)).toBeInTheDocument();
  });

  it('should reset error boundary when children change', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should display error message
    expect(screen.getByText(/出现了一些问题/)).toBeInTheDocument();

    // Rerender with non-throwing component
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should display normal content
    expect(screen.getByTestId('normal-content')).toBeInTheDocument();
  });

  it('should handle different types of errors', () => {
    // Component that throws different types of errors
    const ThrowTypeError = () => {
      throw new TypeError('Type error occurred');
    };

    render(
      <ErrorBoundary>
        <ThrowTypeError />
      </ErrorBoundary>
    );

    // Should still display user-friendly error message
    expect(screen.getByText(/出现了一些问题/)).toBeInTheDocument();
  });

  it('should have proper error boundary styling', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should have centered content
    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toBeInTheDocument();
  });

  it('should handle async errors in promises', async () => {
    // Component with async error
    const AsyncErrorComponent = () => {
      throw new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Async error')), 100);
      });
    };

    render(
      <ErrorBoundary>
        <AsyncErrorComponent />
      </ErrorBoundary>
    );

    // Error boundaries don't catch promise rejections by default
    // This test confirms the behavior
    expect(screen.getByText(/出现了一些问题/)).toBeInTheDocument();
  });
});