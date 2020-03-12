import React from 'react';
import { render } from '@testing-library/react';
import ReactDefault from './ReactDefault';

test('renders learn react link', () => {
  const { getByText } = render(<ReactDefault />);
  const linkElement = getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
