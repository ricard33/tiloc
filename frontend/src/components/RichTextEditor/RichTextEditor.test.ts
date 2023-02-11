import draftToHtml from "draftjs-to-html";
import htmlToDraft0 from "html-to-draftjs";
import htmlToDraft from "./html-to-draftjs";
import { ContentState, convertToRaw, RawDraftContentState } from "draft-js";
import { customChunkRenderer, customEntityTransform } from "./RichTextEditor";

describe("HTML conversions", () => {
  it("should load page break", () => {
    const htmlContent = "<p>Titre</p><div class=\"page-break\" style=\"page-break-after:always;\"> </div><p>footer</p>";
    const { contentBlocks, entityMap } = htmlToDraft(htmlContent, customChunkRenderer);
    expect(contentBlocks).toHaveLength(3);
    const newRawContentState = convertToRaw(ContentState.createFromBlockArray(contentBlocks, entityMap));
    expect(newRawContentState.blocks).toHaveLength(3);
    // expect(newRawContentState).toEqual({});
    expect(newRawContentState.blocks[1].type).toEqual("atomic");
    const entityKey = newRawContentState.blocks[1].entityRanges[0].key;
    expect(newRawContentState.entityMap[entityKey].type).toEqual("PAGE_BREAK");
  });

  it("should load page break at first position", () => {
    const htmlContent = "<div class=\"page-break\" style=\"page-break-after:always;\"> </div>";
    const { contentBlocks, entityMap } = htmlToDraft(htmlContent, customChunkRenderer);
    expect(contentBlocks).toHaveLength(1);
    expect(entityMap.size).toEqual(1);
    const newRawContentState = convertToRaw(ContentState.createFromBlockArray(contentBlocks, entityMap));
    expect(newRawContentState.blocks).toHaveLength(1);
    expect(newRawContentState.blocks[0].type).toEqual("atomic");
    const entityKey = newRawContentState.blocks[0].entityRanges[0].key;
    expect(newRawContentState.entityMap[entityKey].type).toEqual("PAGE_BREAK");
  });

  it("should keep page break", () => {
    const rawContentState: RawDraftContentState = {
      "blocks": [
        {
          "key": "4eosq",
          "text": "a",
          "type": "unstyled",
          "depth": 0,
          "inlineStyleRanges": [],
          "entityRanges": [],
          "data": {}
        },
        {
          "key": "6bn7c",
          "text": " ",
          "type": "atomic",
          "depth": 0,
          "inlineStyleRanges": [],
          "entityRanges": [
            {
              "offset": 0,
              "length": 1,
              "key": 0
            }
          ],
          "data": {}
        },
        {
          "key": "erb14",
          "text": "b",
          "type": "unstyled",
          "depth": 0,
          "inlineStyleRanges": [],
          "entityRanges": [],
          "data": {}
        }
      ],
      "entityMap": {
        "0": {
          "type": "PAGE_BREAK",
          "mutability": "IMMUTABLE",
          "data": {}
        }
      }
    };
    // let editorState = EditorState.createEmpty();
    // let contentState = editorState.getCurrentContent();
    // contentState = Modifier.insertText(contentState, contentState.getSelectionAfter(), "a")
    //
    // // const contentState = editorState!.getCurrentContent();
    // const contentStateWithEntity = contentState.createEntity("PAGE_BREAK", "IMMUTABLE", { });
    // const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    // const contentStateWithPageBreak = Modifier.applyEntity(
    //   contentStateWithEntity,
    //   editorState!.getSelection(),
    //   entityKey
    // );
    // const newEditorState = EditorState.push(editorState!, contentStateWithPageBreak, "insert-fragment");
    // editorState = AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, " ");
    // const rawContentState = convertToRaw(editorState.getCurrentContent());
    console.log(rawContentState);

    const htmlContent = draftToHtml(rawContentState, undefined, undefined, customEntityTransform);
    console.log(htmlContent);
    const { contentBlocks, entityMap } = htmlToDraft0(htmlContent, customChunkRenderer);
    const newRawContentState = convertToRaw(ContentState.createFromBlockArray(contentBlocks, entityMap));
    console.log(newRawContentState);
    // console.log(draftContent.contentBlocks[1]);
    expect(contentBlocks).toHaveLength(3);
    expect(contentBlocks[0].getType()).toEqual("unstyled");
    expect(contentBlocks[1].getType()).toEqual("atomic");
    expect(contentBlocks[2].getType()).toEqual("unstyled");
  });

  it("should load images inside figure tag", () => {
    const htmlContent = "<p>Contrat</p><figure class=\"image\"><img src=\"{{ url_server }}{{ owner.signature.url }}\" alt=\"Signature\"></figure><p>toto</p>";
    // const htmlContent = "<figure class=\"image\"><img src=\"{{ url_server }}{{ owner.signature.url }}\" alt=\"Signature\"></figure>";
    // const htmlContent = "<p>Contrat</p><figure class=\"image\"><img src=\"{{ url_server }}{{ owner.signature.url }}\" alt=\"Signature\"></figure>";
    const { contentBlocks: contentBlocks0, entityMap: entityMap0 } = htmlToDraft0(htmlContent, customChunkRenderer);
    const newRawContentState0 = convertToRaw(ContentState.createFromBlockArray(contentBlocks0, entityMap0));
    const { contentBlocks, entityMap } = htmlToDraft(htmlContent, customChunkRenderer);
    const newRawContentState = convertToRaw(ContentState.createFromBlockArray(contentBlocks, entityMap));

    expect(newRawContentState).toEqual(newRawContentState0);
    expect(newRawContentState).toHaveLength(3);

  });

});
