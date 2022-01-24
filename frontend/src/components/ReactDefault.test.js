import React from 'react';
import { render, screen } from '@testing-library/react';
import ReactDefault from './ReactDefault';

test('renders learn react link', () => {
  render(<ReactDefault />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
