import React, { useEffect } from "react";
import { makeStyles } from "@material-ui/styles";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import CKEditor from "@ckeditor/ckeditor5-react";
import CustomeEditor from "./ckeditor5";
import "./Editor.css";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(1)
  },
  content: {
    marginTop: theme.spacing(2)
  },
  formControl: {
    width: "100%"
  },
  flexBoxAlignLeft: {
    display: "flex",
    alignItems: "baseline"
    // justifyContent: "stretch"
  },
  flexBoxStretched: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between"
  },
  spacer: {
    flexBasis: "2em"
  },
  button: {
    margin: theme.spacing(1)
  },
  statusItem: {
    width: "-webkit-fill-available"
    // width: "stretch",
    // padding: theme.spacing(1)
    // height: "1em",
    // marginRight: "5px"
  },
  deleteButton: {
    color: "red"
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff"
  }
}));

const Editor = props => {
  const { content, onChange } = props;
  const classes = useStyles();
  const { t } = useTranslation();
  let editorInstance = null;

  useEffect(() => {
    if (editorInstance)
      editorInstance.setData(content);
  }, [content]);

  function _onChange(event, editor) {
    onChange && onChange(editor.getData());
  }

  return (
    <div className="document-editor">
      <div className="document-editor__toolbar"/>
      <div className="document-editor__editable-container">
        <CKEditor
          className="document-editor__editable"
          onInit={editor => {
            console.log("Editor is ready to use!", editor);
            editorInstance = editor;

            const toolbarContainer = document.querySelector(".document-editor__toolbar");
            toolbarContainer.appendChild(
              editor.ui.view.toolbar.element);
          }}
          onChange={_onChange}
          editor={CustomeEditor}
          data={content}
          config={{
            toolbar: {
              items: [
                "heading",
                "|",
                "fontSize",
                "fontFamily",
                "|",
                "bold",
                "italic",
                "underline",
                "strikethrough",
                "highlight",
                "|",
                "alignment",
                "|",
                "numberedList",
                "bulletedList",
                "|",
                "indent",
                "outdent",
                "|",
                "todoList",
                "link",
                "imageUpload",
                "insertTable",
                "|",
                "undo",
                "redo",
                "|",
                "horizontalLine",
                "pageBreak",
                "specialCharacters",
                "|",
                "exportPdf"
              ]
            },
            language: "fr",
            image: {
              toolbar: [
                "imageTextAlternative",
                "imageStyle:full",
                "imageStyle:side"
              ]
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
