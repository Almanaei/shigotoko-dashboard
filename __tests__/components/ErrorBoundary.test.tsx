import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../../components/dashboard/ErrorBoundary';

// Create problematic component that throws an error when rendered
const ProblemComponent = () => {
  throw new Error('Test error');
};

// Create a component that throws an error on button click
const ThrowOnClickComponent = ({ throwError }: { throwError: boolean }) => {
  if (throwError) {
    throw new Error('Click error');
  }
  return <button>Click to throw</button>;
};

// Spy on console.error to prevent test output pollution
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('ErrorBoundary', () => {
  // Test error catching
  it('should catch errors and display the default fallback UI', () => {
    // Suppress React's error logging for this test
    const spy = jest.spyOn(console, 'error');
    spy.mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ProblemComponent />
      </ErrorBoundary>
    );
    
    // Check if fallback UI is rendered
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('The application encountered an error and couldn\'t continue.')).toBeInTheDocument();
    
    // Check if error details are available
    const detailsElement = screen.getByText('Error details');
    expect(detailsElement).toBeInTheDocument();
    
    // Check if retry button is rendered
    expect(screen.getByText('Try again')).toBeInTheDocument();
    
    // Restore the original console.error
    spy.mockRestore();
  });
  
  // Test custom fallback
  it('should render custom fallback UI when provided', () => {
    const customFallback = <div>Custom error message</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ProblemComponent />
      </ErrorBoundary>
    );
    
    // Check if custom fallback is rendered
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    
    // Default fallback should NOT be rendered
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });
  
  // Test error handler callback
  it('should call onError callback when an error occurs', () => {
    const handleError = jest.fn();
    
    render(
      <ErrorBoundary onError={handleError}>
        <ProblemComponent />
      </ErrorBoundary>
    );
    
    // Check if error handler was called
    expect(handleError).toHaveBeenCalledTimes(1);
    expect(handleError.mock.calls[0][0].message).toBe('Test error');
  });
  
  // Test retry functionality
  it('should attempt to reload on retry button click', () => {
    // Mock window.location.reload
    const originalReload = window.location.reload;
    window.location.reload = jest.fn();
    
    render(
      <ErrorBoundary>
        <ProblemComponent />
      </ErrorBoundary>
    );
    
    // Click the retry button
    fireEvent.click(screen.getByText('Try again'));
    
    // Verify reload was called
    expect(window.location.reload).toHaveBeenCalledTimes(1);
    
    // Restore original reload
    window.location.reload = originalReload;
  });
  
  // Test normal rendering when no errors
  it('should render children when no errors occur', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );
    
    // Check if children are rendered
    expect(screen.getByText('Normal content')).toBeInTheDocument();
    
    // Fallback UI should not be present
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });
}); 