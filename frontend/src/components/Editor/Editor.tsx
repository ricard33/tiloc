import React, { useEffect } from "react";
// @ts-ignore
import { CKEditor } from "@ckeditor/ckeditor5-react";
// @ts-ignore
import CustomEditor from "@ti-gecko/tiloc-ckeditor5/build/ckeditor";  // import symbol ClassicEditor
// import DocumentEditor from "@ckeditor/ckeditor5-build-decoupled-document";
// import CustomFigureAttributes from 'tiloc-ckeditor5/plugins/custom-figure-attributes';
// import AllowImageWidth from 'tiloc-ckeditor5/plugins/image_width_and_height';
import "./Editor.css";

type Props = {
  content: string;
  onChange: (content: string) => void;
  readOnly: boolean;
};

const Editor: React.FunctionComponent<Props> = (props) => {
  const { content, onChange, readOnly } = props;
  let editorInstance: any = null;

  useEffect(() => {
    if (editorInstance)
      editorInstance.setData(content);
  }, [content, editorInstance]);

  // @ts-ignore
  function _onChange(event, editor) {
    onChange && onChange(editor.getData());
  }

  return (
    <div className="document-editor">
      <div className="document-editor__toolbar" />
      <div className="document-editor__editable-container">
        <CKEditor
          className="document-editor__editable"
          onReady={(editor: any) => {
            console.log("Editor is ready to use!", editor);
            editorInstance = editor;

            const toolbarContainer = document.querySelector(".document-editor__toolbar");
            if (toolbarContainer)
              toolbarContainer.appendChild(
                editor.ui.view.toolbar.element);
          }}
          readOnly={readOnly}
          onChange={_onChange}
          // eslint-disable-next-line no-undef
          editor={CustomEditor}
          data={content}
          config={{
            // extraPlugins: [CustomFigureAttributes,],
            // extraPlugins: [AllowImageWidth],
            // removePlugins: ["ImageResize"],
            toolbar: {
              items: [
                "heading",
                "|",
                "bold",
                "italic",
                "underline",
                "link",
                "bulletedList",
                "numberedList",
                "alignment",
                "fontFamily",
                "fontSize",
                "fontColor",
                // "removeFormat",
                "|",
                "indent",
                "outdent",
                "|",
                // "imageUpload",
                // "blockQuote",
                "insertTable",
                "undo",
                "redo",
                "|",
                "horizontalLine",
                "pageBreak",
                "|",
                "specialCharacters"
                // "|",
                // "insertSignature"
              ]
            },
            language: "fr",
            fontSize: {
              options: [
                9,
                10,
                11,
                12,
                13,
                "default",
                17,
                19,
                21
              ]
            },
            image: {
              resizeUnit: "px",

              // Configure the available styles.
              styles: [
                "alignLeft", "alignCenter", "alignRight"
              ],

              // Configure the available image resize options.
              resizeOptions: [
                {
                  name: "imageResize:original",
                  label: "Original",
                  value: null
                },
                {
                  name: "imageResize:50",
                  label: "50%",
                  value: "50"
                },
                {
                  name: "imageResize:75",
                  label: "75%",
                  value: "75"
                }
              ],
              toolbar: [
                "imageTextAlternative",
                "imageStyle:alignLeft", "imageStyle:alignCenter", "imageStyle:alignRight",
                "|",
                "imageResize"
              ]
            },
            simpleUpload: {
              // The URL that the images are uploaded to.
              uploadUrl: "/upload/",

              // Enable the XMLHttpRequest.withCredentials property.
              withCredentials: true,

              // Headers sent along with the XMLHttpRequest to the upload server.
              headers: {
                // "X-CSRF-TOKEN": "CSRF-Token",
                Authorization: "Token " + localStorage.getItem("token")
              }
            },
            table: {
              contentToolbar: [
                "tableColumn",
                "tableRow",
                "mergeTableCells",
                "tableCellProperties",
                "tableProperties"
              ]
            }
          }}
        />
      </div>
    </div>

  );
};

export default Editor;
