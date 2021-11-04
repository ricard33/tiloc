import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "tiloc-ckeditor5/build/ckeditor";  // import symbol ClassicEditor
import CustomFigureAttributes from 'tiloc-ckeditor5/plugins/custom-figure-attributes';
// import AllowImageWidth from 'tiloc-ckeditor5/plugins/image_width_and_height';
import "./Editor.css";

const Editor = props => {
  const { content, onChange } = props;
  let editorInstance = null;

  useEffect(() => {
    if (editorInstance)
      editorInstance.setData(content);
  }, [editorInstance, content]);

  function _onChange(event, editor) {
    onChange && onChange(editor.getData());
  }

  return (
    <div className="document-editor">
      <div className="document-editor__toolbar" />
      <div className="document-editor__editable-container">
        <CKEditor
          className="document-editor__editable"
          onReady={editor => {
            console.log("Editor is ready to use!", editor);
            editorInstance = editor;

            const toolbarContainer = document.querySelector(".document-editor__toolbar");
            toolbarContainer.appendChild(
              editor.ui.view.toolbar.element);
          }}
          onChange={_onChange}
          // eslint-disable-next-line no-undef
          editor={ClassicEditor}
          data={content}
          config={{
            extraPlugins: [CustomFigureAttributes,],
            // extraPlugins: [AllowImageWidth],
            removePlugins: ["ImageResize"],
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
                "removeFormat",
                "|",
                "indent",
                "outdent",
                "|",
                // "imageUpload",
                "blockQuote",
                "insertTable",
                "undo",
                "redo",
                "|",
                "horizontalLine",
                "pageBreak",
                "|",
                "specialCharacters",
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
                'default',
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
                Authorization: 'Token ' + localStorage.getItem("token")
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

Editor.propTypes = {
  content: PropTypes.string,
  onChange: PropTypes.func
};

export default Editor;
