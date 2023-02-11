import { Map, OrderedSet } from "immutable";

const SPACE = " ";
const MAX_DEPTH = 4;


export type Chunk = {
  text: string,
  inlines: OrderedSet<string>[],
  entities: (string | undefined)[],
  blocks: { type: string, depth: number, data: any }[],
};

export const getWhitespaceChunk = (entityId: string | undefined): Chunk => {
  const entities = new Array(1);
  if (entityId) {
    entities[0] = entityId;
  }
  return {
    text: SPACE,
    inlines: [OrderedSet()],
    entities,
    blocks: []
  };
};

export const createTextChunk = (node: HTMLElement, inlineStyle: OrderedSet<string> | undefined, entityId: string | undefined): { chunk: Chunk } => {
  const text = node.textContent;
  if (text && text.trim() === "") {
    return { chunk: getWhitespaceChunk(entityId) };
  }
  return {
    chunk: {
      text: text ?? "",
      inlines: Array(text?.length || 0).fill(inlineStyle),
      entities: Array(text?.length || 0).fill(entityId),
      blocks: []
    }
  };
};

export const getSoftNewlineChunk = (): Chunk => {
  return {
    text: "\n",
    inlines: [OrderedSet()],
    entities: new Array(1),
    blocks: []
  };
};

export const getEmptyChunk = (): Chunk => {
  return {
    text: "",
    inlines: [],
    entities: [],
    blocks: []
  };
};

export const getFirstBlockChunk = (blockType: string, data?: Object): Chunk => {
  return {
    text: "",
    inlines: [],
    entities: [],
    blocks: [{
      type: blockType,
      depth: 0,
      data: data || Map({})
    }]
  };
};

export const getBlockDividerChunk = (blockType: string, depth: number, data?: Object): Chunk => {
  return {
    text: "\r",
    inlines: [],
    entities: [],
    blocks: [{
      type: blockType,
      depth: Math.max(0, Math.min(MAX_DEPTH, depth)),
      data: data || Map({})
    }]
  };
};

export const getAtomicBlockChunk = (entityId: string): Chunk => {
  return {
    text: "\r ",
    inlines: [OrderedSet()],
    entities: [entityId],
    blocks: [{
      type: "atomic",
      depth: 0,
      data: Map({})
    }]
  };
};

export const joinChunks = (A: Chunk, B: Chunk): Chunk => {
  return {
    text: A.text + B.text,
    inlines: A.inlines.concat(B.inlines),
    entities: A.entities.concat(B.entities),
    blocks: A.blocks.concat(B.blocks)
  };
};
