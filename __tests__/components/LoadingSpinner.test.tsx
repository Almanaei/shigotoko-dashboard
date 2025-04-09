import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  // Test basic rendering
  it('should render correctly with default props', () => {
    render(<LoadingSpinner />);
    
    // Check if spinner element exists
    const spinner = screen.getByRole('status', { name: /loading/i });
    expect(spinner).toBeInTheDocument();
    
    // Should have medium size classes by default
    expect(spinner).toHaveClass('h-8', 'w-8');
    
    // Should have default color classes
    expect(spinner).toHaveClass('border-gray-300', 'border-t-blue-500');
  });
  
  // Test size variants
  it('should render with the correct size classes', () => {
    // Test small size
    const { unmount } = render(<LoadingSpinner size="sm" />);
    let spinner = screen.getByRole('status', { name: /loading/i });
    expect(spinner).toHaveClass('h-4', 'w-4', 'border-2');
    unmount();
    
    // Test medium size
    render(<LoadingSpinner size="md" />);
    spinner = screen.getByRole('status', { name: /loading/i });
    expect(spinner).toHaveClass('h-8', 'w-8', 'border-3');
    unmount();
    
    // Test large size
    render(<LoadingSpinner size="lg" />);
    spinner = screen.getByRole('status', { name: /loading/i });
    expect(spinner).toHaveClass('h-12', 'w-12', 'border-4');
  });
  
  // Test color variants
  it('should render with the correct color classes', () => {
    // Test primary variant
    const { unmount } = render(<LoadingSpinner variant="primary" />);
    let spinner = screen.getByRole('status', { name: /loading/i });
    expect(spinner).toHaveClass('border-blue-600', 'border-t-transparent');
    unmount();
    
    // Test light variant
    render(<LoadingSpinner variant="light" />);
    spinner = screen.getByRole('status', { name: /loading/i });
    expect(spinner).toHaveClass('border-gray-200', 'border-t-gray-600');
  });
  
  // Test loading text
  it('should render with loading text when provided', () => {
    const loadingText = 'Loading data...';
    render(<LoadingSpinner text={loadingText} />);
    
    const textElement = screen.getByText(loadingText);
    expect(textElement).toBeInTheDocument();
    expect(textElement).toHaveClass('ml-3'); // Horizontal layout by default
  });
  
  // Test fullScreen mode
  it('should render in fullscreen mode when enabled', () => {
    render(<LoadingSpinner fullScreen text="Loading" />);
    
    // Should have fixed positioning and backdrop classes
    const wrapper = screen.getByText('Loading').parentElement?.parentElement;
    expect(wrapper).toHaveClass('fixed', 'inset-0', 'backdrop-blur-sm');
    
    // Text should have vertical margin in fullscreen mode
    const textElement = screen.getByText('Loading');
    expect(textElement).toHaveClass('mt-4');
  });
  
  // Test custom class name
  it('should apply custom class names', () => {
    render(<LoadingSpinner className="custom-test-class" />);
    
    const wrapper = screen.getByRole('status', { name: /loading/i }).parentElement;
    expect(wrapper).toHaveClass('custom-test-class');
  });
}); 