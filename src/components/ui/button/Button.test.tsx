import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Click me' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeDisabled();
  });

  it('should render with different variants', () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    expect(screen.getByRole('button', { name: 'Default' })).toHaveClass('bg-primary');

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole('button', { name: 'Destructive' })).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button', { name: 'Outline' })).toHaveClass('border');
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<Button size="default">Default</Button>);
    expect(screen.getByRole('button', { name: 'Default' })).toHaveClass('h-10');

    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button', { name: 'Small' })).toHaveClass('h-9');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button', { name: 'Large' })).toHaveClass('h-11');
  });

  it('should render with loading state', () => {
    render(<Button loading>Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50');
    expect(button.querySelector('span')).toHaveClass('animate-spin');
  });
}); 