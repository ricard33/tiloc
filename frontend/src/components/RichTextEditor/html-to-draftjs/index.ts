/* @flow */

import { CharacterMetadata, ContentBlock, genKey, Entity, DraftInlineStyle, RawDraftEntity } from "draft-js";
import { Map, List, OrderedMap, OrderedSet } from 'immutable';
import getSafeBodyFromHTML from './getSafeBodyFromHTML';
import {
  createTextChunk,
  getSoftNewlineChunk,
  getEmptyChunk,
  getBlockDividerChunk,
  getFirstBlockChunk,
  getAtomicBlockChunk,
  joinChunks, Chunk
} from "./chunkBuilder";
import getBlockTypeForTag from './getBlockTypeForTag';
import processInlineTag from './processInlineTag';
import getBlockData from './getBlockData';
import getEntityId from './getEntityId';

const SPACE = ' ';
const REGEX_NBSP = new RegExp('&nbsp;', 'g');

let firstBlock = true;

type CustomChunkGenerator = (nodeName: string, node: HTMLElement) => { data: {}, mutability: string, type: string } | undefined;

function genFragment(
  node: HTMLElement,
  inlineStyle: OrderedSet<string>,
  depth: number,
  lastList: string,
  inEntity: string | undefined,
  customChunkGenerator?: CustomChunkGenerator,
): { chunk: Chunk } {
  const nodeName = node.nodeName.toLowerCase();

  if (customChunkGenerator) {
    const value = customChunkGenerator(nodeName, node);
    if (value) {
      // @ts-ignore
      const entityId = Entity.__create(
        value.type,
        value.mutability,
        value.data || {},
      );
      const atomicChunk = getAtomicBlockChunk(entityId);
      if(firstBlock) {
        atomicChunk.text = " ";  // no \r at beginning
        firstBlock = false;
      }
      return { chunk: atomicChunk };
    }
  }

  if (nodeName === '#text' && node.textContent !== '\n') {
    return createTextChunk(node, inlineStyle, inEntity);
  }

  if (nodeName === 'br') {
    return { chunk: getSoftNewlineChunk() };
  }

  if (
    nodeName === 'img' &&
    node instanceof HTMLImageElement
  ) {
    const entityConfig: Record<string, any> = {};
    entityConfig.src = node.getAttribute ? node.getAttribute('src') || node.src : node.src;
    entityConfig.alt = node.alt;
    entityConfig.height = node.style.height;
    entityConfig.width = node.style.width;
    if (node.style.float) {
      entityConfig.alignment = node.style.float;
    }
    // @ts-ignore
    const entityId = Entity.__create(
      'IMAGE',
      'MUTABLE',
      entityConfig,
    );
    return { chunk: getAtomicBlockChunk(entityId) };
  }

  if (
    nodeName === 'video' &&
    node instanceof HTMLVideoElement
  ) {
    const entityConfig: Record<string, any> = {};
    entityConfig.src = node.getAttribute ? node.getAttribute('src') || node.src : node.src;
    // entityConfig.alt = node.alt;
    entityConfig.height = node.style.height;
    entityConfig.width = node.style.width;
    if (node.style.float) {
      entityConfig.alignment = node.style.float;
    }
    // @ts-ignore
    const entityId = Entity.__create(
      'VIDEO',
      'MUTABLE',
      entityConfig,
    );
    return { chunk: getAtomicBlockChunk(entityId) };
  }

  if (
    nodeName === 'iframe' &&
    node instanceof HTMLIFrameElement
  ) {
    const entityConfig: Record<string, any> = {};
    entityConfig.src = node.getAttribute ? node.getAttribute('src') || node.src : node.src;
    entityConfig.height = node.height;
    entityConfig.width = node.width;
    // @ts-ignore
    const entityId = Entity.__create(
      'EMBEDDED_LINK',
      'MUTABLE',
      entityConfig,
    );
    return { chunk: getAtomicBlockChunk(entityId) };
  }

  const blockType = getBlockTypeForTag(nodeName, lastList);

  let chunk;
  if (blockType) {
    if (nodeName === 'ul' || nodeName === 'ol') {
      lastList = nodeName;
      depth += 1;
    } else {
      if (
        blockType !== 'unordered-list-item' &&
         blockType !== 'ordered-list-item'
      ) {
        lastList = '';
        depth = -1;
      }
      if (!firstBlock) {
        chunk = getBlockDividerChunk(
          blockType,
          depth,
          getBlockData(node)
        );
      } else {
        chunk = getFirstBlockChunk(
          blockType,
          getBlockData(node)
        );
        firstBlock = false;
      }
    }
  }
  if (!chunk) {
    chunk = getEmptyChunk();
  }

  // @ts-ignore
  inlineStyle = processInlineTag(nodeName, node, inlineStyle);

  let child = node.firstChild as HTMLElement;
  while (child) {
    const entityId = getEntityId(child);
    const { chunk: generatedChunk } = genFragment(child, inlineStyle, depth, lastList, (entityId || inEntity), customChunkGenerator);
    chunk = joinChunks(chunk, generatedChunk);
    const sibling = child.nextSibling;
    child = sibling as HTMLElement;
  }
  return { chunk };
}

function getChunkForHTML(html: string, customChunkGenerator?: CustomChunkGenerator): { chunk: Chunk } | null {
  const sanitizedHtml = html.trim().replace(REGEX_NBSP, SPACE);
  const safeBody = getSafeBodyFromHTML(sanitizedHtml);
  if (!safeBody) {
    return null;
  }
  firstBlock = true;
  const { chunk } = genFragment(safeBody, OrderedSet(), -1, '', undefined, customChunkGenerator);
  return { chunk };
}

export default function htmlToDraft(html: string, customChunkGenerator?: CustomChunkGenerator): {
  contentBlocks: ContentBlock[],
  entityMap: OrderedMap<string, RawDraftEntity>
} {
  const chunkData = getChunkForHTML(html, customChunkGenerator);
  if (chunkData) {
    const { chunk } = chunkData;
    let entityMap = OrderedMap<string, RawDraftEntity>({});
    chunk.entities && chunk.entities.forEach(entity => {
      if (entity) {
        // @ts-ignore
        entityMap = entityMap.set(entity, Entity.__get(entity));
      }
    });
    let start = 0;
    return {
      contentBlocks: chunk.text.split('\r')
        .map(
          (textBlock, ii) => {
            const end = start + textBlock.length;
            const inlines = chunk && chunk.inlines.slice(start, end);
            const entities = chunk && chunk.entities.slice(start, end);
            const characterList = List(
              inlines.map((style, index) => {
                const data: {
                  style?: DraftInlineStyle | undefined;
                  entity?: string | null;
                } = { style, entity: null };
                if (entities[index]) {
                  data.entity = entities[index];
                }
                // @ts-ignore
                return CharacterMetadata.create(data);
              }),
            );
            start = end;
            return new ContentBlock({
              key: genKey(),
              type: (chunk && chunk.blocks[ii] && chunk.blocks[ii].type) || 'unstyled',
              depth: chunk && chunk.blocks[ii] && chunk.blocks[ii].depth,
              data: (chunk && chunk.blocks[ii] && chunk.blocks[ii].data) || Map({}),
              text: textBlock,
              characterList,
            });
          },
        ).filter(contentBlock => {
          return !(contentBlock.getType() === "atomic" && contentBlock.getText() === "" && contentBlock.getCharacterList().size === 0);
        }),
      entityMap
    };
  }
  return { contentBlocks: [], entityMap: OrderedMap({}) };
}
