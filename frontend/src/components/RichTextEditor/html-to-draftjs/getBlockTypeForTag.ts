import { Map } from 'immutable';

type BlockType =
  "header-one" | "header-two" | "header-three" | "header-four" | "header-five" | "header-six" | "unordered-list-item"
  | "ordered-list-item" | "blockquote" | "code" | "atomic" | "unstyled";


type DraftBlock = { element: string, wrapper?: string, aliasedElements?: string[] };

const blockRenderMap = Map<BlockType, DraftBlock>({
  'header-one': {
    element: 'h1',
  },
  'header-two': {
    element: 'h2',
  },
  'header-three': {
    element: 'h3',
  },
  'header-four': {
    element: 'h4',
  },
  'header-five': {
    element: 'h5',
  },
  'header-six': {
    element: 'h6',
  },
  'unordered-list-item': {
    element: 'li',
    wrapper: 'ul',
  },
  'ordered-list-item': {
    element: 'li',
    wrapper: 'ol',
  },
  blockquote: {
    element: 'blockquote',
  },
  code: {
    element: 'pre',
  },
  atomic: {
    element: 'figure',
  },
  unstyled: {
    element: 'p',
    aliasedElements: ['div']
  },
});

export default function getBlockTypeForTag(
  tag: string,
  lastList?: string
): BlockType|undefined {
  const matchedTypes = blockRenderMap
    .filter((draftBlock?: DraftBlock) => {
      return (
        typeof draftBlock !== "undefined" &&
        ((draftBlock.element === tag &&
          (!draftBlock.wrapper || draftBlock.wrapper === lastList)) ||
        draftBlock.wrapper === tag ||
        (typeof draftBlock.aliasedElements !== "undefined" && draftBlock.aliasedElements.indexOf(tag) > -1))
      );
    })
    .keySeq()
    .toSet()
    .toArray();

  if (matchedTypes.length === 1) {
    return matchedTypes[0];
  }
  return undefined;
}
