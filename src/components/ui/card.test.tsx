import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with default styles', () => {
      render(<Card>Test Content</Card>);
      const card = screen.getByText('Test Content');
      expect(card).toHaveClass('rounded-lg border bg-card text-card-foreground shadow-sm');
    });

    it('applies custom className', () => {
      render(<Card className="custom-class">Test Content</Card>);
      const card = screen.getByText('Test Content');
      expect(card).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Test Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardHeader', () => {
    it('renders with default styles', () => {
      render(<CardHeader>Header Content</CardHeader>);
      const header = screen.getByText('Header Content');
      expect(header).toHaveClass('flex flex-col space-y-1.5 p-6');
    });

    it('applies custom className', () => {
      render(<CardHeader className="custom-header">Header Content</CardHeader>);
      const header = screen.getByText('Header Content');
      expect(header).toHaveClass('custom-header');
    });
  });

  describe('CardTitle', () => {
    it('renders with default styles', () => {
      render(<CardTitle>Title Content</CardTitle>);
      const title = screen.getByText('Title Content');
      expect(title).toHaveClass('text-2xl font-semibold leading-none tracking-tight');
    });

    it('applies custom className', () => {
      render(<CardTitle className="custom-title">Title Content</CardTitle>);
      const title = screen.getByText('Title Content');
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('CardDescription', () => {
    it('renders with default styles', () => {
      render(<CardDescription>Description Content</CardDescription>);
      const description = screen.getByText('Description Content');
      expect(description).toHaveClass('text-sm text-muted-foreground');
    });

    it('applies custom className', () => {
      render(<CardDescription className="custom-desc">Description Content</CardDescription>);
      const description = screen.getByText('Description Content');
      expect(description).toHaveClass('custom-desc');
    });
  });

  describe('CardContent', () => {
    it('renders with default styles', () => {
      render(<CardContent>Content</CardContent>);
      const content = screen.getByText('Content');
      expect(content).toHaveClass('p-6 pt-0');
    });

    it('applies custom className', () => {
      render(<CardContent className="custom-content">Content</CardContent>);
      const content = screen.getByText('Content');
      expect(content).toHaveClass('custom-content');
    });
  });

  describe('CardFooter', () => {
    it('renders with default styles', () => {
      render(<CardFooter>Footer Content</CardFooter>);
      const footer = screen.getByText('Footer Content');
      expect(footer).toHaveClass('flex items-center p-6 pt-0');
    });

    it('applies custom className', () => {
      render(<CardFooter className="custom-footer">Footer Content</CardFooter>);
      const footer = screen.getByText('Footer Content');
      expect(footer).toHaveClass('custom-footer');
    });
  });

  describe('Card Composition', () => {
    it('renders a complete card with all subcomponents', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Card Content</CardContent>
          <CardFooter>Card Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card Description')).toBeInTheDocument();
      expect(screen.getByText('Card Content')).toBeInTheDocument();
      expect(screen.getByText('Card Footer')).toBeInTheDocument();
    });
  });
}); 