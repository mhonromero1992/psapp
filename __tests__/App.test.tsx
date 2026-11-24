/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.useFakeTimers();

/** All the text a rendered tree shows, joined, to look for words a member would see. */
function textOf(node: ReactTestRenderer.ReactTestRendererJSON | ReactTestRenderer.ReactTestRendererJSON[] | null): string {
  if (!node) {return '';}
  if (Array.isArray(node)) {return node.map(textOf).join(' ');}
  return (node.children ?? []).map(c => (typeof c === 'string' ? c : textOf(c))).join(' ');
}

test('opens on the welcome screen with sign-in and enrolment', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  // Stored data is read first (AsyncStorage mock), then the first screen appears.
  await ReactTestRenderer.act(async () => {
    jest.runOnlyPendingTimers();
  });
  const text = textOf(tree!.toJSON());
  expect(text).toContain('Sign in');
  expect(text).toContain('enrol as a member');
  expect(text).toContain('Make the words bigger');
  await ReactTestRenderer.act(async () => {
    tree!.unmount();
    jest.runOnlyPendingTimers();
  });
});
