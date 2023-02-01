import React from "react";
import { Path, useFormContext } from "react-hook-form";
import { FieldValues } from "react-hook-form/dist/types/fields";
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

type RichTextEditorElementProps<T extends FieldValues = FieldValues> = {
  name: Path<T>,
  readOnly?: boolean,
  placeholder?: string;
  onChange?: (content: string) => void,
};

const RichTextEditorElement: React.FC<RichTextEditorElementProps> = <TFieldValues extends FieldValues = FieldValues>({
  name, readOnly = false, placeholder, onChange, ...props
}: RichTextEditorElementProps<TFieldValues>) => {
  // const { t } = useTranslation();
  const { setValue, getValues } = useFormContext();
  const initialValue = getValues(name);
  const contentBlock = htmlToDraft(initialValue);
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
        const content = draftToHtml(contentState);
        if (initialValue !== content) {
          setValue(name as string, content, {
            shouldDirty: true
            // shouldTouch: true
          });
          if (typeof onChange === "function") {
            onChange(content);
          }
        }
      }}
      customBlockRenderFunc={myBlockRenderer}
    />
  );
};


export default RichTextEditorElement;
