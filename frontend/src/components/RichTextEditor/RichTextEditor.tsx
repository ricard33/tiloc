import React from "react";
import { ContentBlock, Editor } from "react-draft-wysiwyg";
import { ContentState, convertToRaw } from "draft-js";
import "../../../node_modules/react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import draftToHtml from "draftjs-to-html";
import htmlToDraft from "html-to-draftjs";
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
      xhr.open('POST', 'https://api.imgur.com/3/image');
      xhr.setRequestHeader('Authorization', 'Client-ID 8d26ccd12712fca');
      const data = new FormData(); // eslint-disable-line no-undef
      data.append('image', file);
      xhr.send(data);
      xhr.addEventListener('load', () => {
        const response = JSON.parse(xhr.responseText);
        resolve(response);
      });
      xhr.addEventListener('error', () => {
        const error = JSON.parse(xhr.responseText);
        reject(error);
      });
    },
  );
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
  const contentBlock = htmlToDraft(content);
  const initialContentState = convertToRaw(ContentState.createFromBlockArray(contentBlock.contentBlocks));


  return (
    <Editor
      {...props}
      toolbarCustomButtons={[
        <PageBreakOption />
      ]}
      toolbar={{
        image: {
          uploadCallback: uploadImageCallBack,
          alt: { present: true, mandatory: false },
        },
      }}
      defaultContentState={initialContentState}
      onContentStateChange={(contentState) => {
        const newContent = draftToHtml(contentState);
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
