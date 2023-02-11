import React from "react";
import { ContentBlock, Editor, RawDraftContentState } from "react-draft-wysiwyg";
import { ContentState, convertToRaw, RawDraftEntity } from "draft-js";
import "../../../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import draftToHtml from "draftjs-to-html";
import htmlToDraft from "./html-to-draftjs";
import AtomicBlock from "./components/AtomicBlock";
import PageBreakOption from "./components/PageBreakOption";


function myBlockRenderer(contentBlock: ContentBlock) {
  const type = contentBlock.getType();
  // console.log("type=", type);
  if (type === "atomic") {
    return {
      component: AtomicBlock,
      editable: false,
      props: {
        // foo: "bar"
      }
    };
  }
}

function uploadImageCallBack(file: string) {
  return new Promise(
    (resolve, reject) => {
      const xhr = new XMLHttpRequest(); // eslint-disable-line no-undef
      xhr.open("POST", "https://api.imgur.com/3/image");
      xhr.setRequestHeader("Authorization", "Client-ID 8d26ccd12712fca");
      const data = new FormData(); // eslint-disable-line no-undef
      data.append("image", file);
      xhr.send(data);
      xhr.addEventListener("load", () => {
        const response = JSON.parse(xhr.responseText);
        resolve(response);
      });
      xhr.addEventListener("error", () => {
        const error = JSON.parse(xhr.responseText);
        reject(error);
      });
    }
  );
}

export function customChunkRenderer(nodeName: string, node: HTMLElement): RawDraftEntity | undefined {
  console.log(nodeName, node.className);
  if (nodeName === "div" && node.className === "page-break") {
    return {
      "type": "PAGE_BREAK",
      "mutability": "IMMUTABLE",
      "data": {}
    };
  }
  return undefined;
}

export function customEntityTransform(entity: RawDraftEntity, text: string): string | undefined {
  if (entity.type === "PAGE_BREAK") {
    return "<div\n" +
      "    class=\"page-break\"\n" +
      "    style={{ pageBreakAfter:\"always\" }}\n" +
      "  > </div>";
  }
}

type RichTextEditorProps = {
  content: string,
  readOnly?: boolean,
  placeholder?: string;
  onChange: (content: string) => void,
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content, readOnly = false, placeholder, onChange, ...props
}: RichTextEditorProps) => {
  // const { t } = useTranslation();
  let initialContentState: RawDraftContentState;
  try {
    // const contentBlock = htmlToDraft(content);
    const { contentBlocks, entityMap } = htmlToDraft(content, customChunkRenderer);
    initialContentState = convertToRaw(ContentState.createFromBlockArray(contentBlocks, entityMap));
    console.log("Converted to", initialContentState);
  } catch (ex) {
    console.error(ex);
    initialContentState = convertToRaw(ContentState.createFromText("Loading content error..."));
  }

  return (
    <Editor
      {...props}
      toolbarCustomButtons={[
        <PageBreakOption />
      ]}
      toolbar={{
        image: {
          uploadCallback: uploadImageCallBack,
          alt: { present: true, mandatory: false }
        }
      }}
      defaultContentState={initialContentState}
      onContentStateChange={(contentState) => {
        // console.log(contentState);
        const newContent = draftToHtml(contentState, undefined, undefined, customEntityTransform);
        if (newContent !== content) {
          if (typeof onChange === "function") {
            onChange(newContent);
          }
        }
      }}
      customBlockRenderFunc={myBlockRenderer}
    />
  );
};


export default RichTextEditor;
