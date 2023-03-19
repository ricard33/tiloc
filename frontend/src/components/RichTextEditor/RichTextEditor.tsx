import React, { useCallback, useEffect, useRef } from "react";
import ReactQuill from "react-quill-v2.0";
import "react-quill-v2.0/dist/quill.snow.css";
import "quill-better-table/dist/quill-better-table.css";
import Quill from "quill";
import PageBreak from "./modules/PageBreak";
// @ts-ignore
import QuillBetterTable from "quill-better-table";
import "./RichTextEditor.scss";

Quill.register(PageBreak);
Quill.register("modules/better-table", QuillBetterTable);


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
  // const [value, setValue] = useState(content);
  let quill: Quill | null = null; // Quill instance
  const reactQuillRef = useRef<ReactQuill>(null); // ReactQuill component

  useEffect(() => {
    if (reactQuillRef.current === null || typeof reactQuillRef.current.getEditor !== "function") return;
    quill = reactQuillRef.current.getEditor();
  }, [reactQuillRef.current]);

  const insertPageBreak = () => {
    if (reactQuillRef.current === null || typeof reactQuillRef.current.getEditor !== "function") return;
    const quill = reactQuillRef.current.getEditor();
    if (quill === null) return;
    let range = quill.getSelection(true);
    quill.insertText(range.index, "\n", "user");
    quill.insertEmbed(range.index + 1, "page-break", true, "user");
    quill.setSelection(range.index + 2, range.length, "silent");
  };

  const insertTable = () => {
    if (reactQuillRef.current === null || typeof reactQuillRef.current.getEditor !== "function") return;
    const quill = reactQuillRef.current.getEditor();
    if (quill === null) return;
    let tableModule = quill.getModule("better-table");
    tableModule.insertTable(3, 3);
  };

  const toolbarOptions = {
    container: [
      ["bold", "italic", "underline", "strike"],        // toggled buttons
      ["blockquote", "code-block"
      ],

      [{ "header": 1 }, { "header": 2 }],               // custom button values
      [{ "list": "ordered" }, { "list": "bullet" }],
      [{ "script": "sub" }, { "script": "super" }],      // superscript/subscript
      [{ "indent": "-1" }, { "indent": "+1" }],          // outdent/indent
      [{ "direction": "rtl" }],                         // text direction

      [{ "size": ["small", false, "large", "huge"] }],  // custom dropdown
      [{ "header": [1, 2, 3, 4, 5, 6, false] }],

      [{ "color": [] }, { "background": [] }],          // dropdown with defaults from theme
      [{ "font": [] }],
      [{ "align": [] }],
      [{
        "better-table": []
      }],
      ["page-break"],

      ["clean"]                                         // remove formatting button
    ],
    handlers: {
      "table": useCallback(insertTable, []),
      "page-break": useCallback(insertPageBreak, [])
      // pagebreak(value: any) {
      //   alert("click" + value);
      // }
    }
  };

  return (
    <ReactQuill
      ref={reactQuillRef}
      theme="better-table-snow" value={content} onChange={onChange}
      modules={{
        toolbar: toolbarOptions,
        table: false, // disable table module
        "better-table": {
          operationMenu: {
            //   items: {
            //     unmergeCells: {
            //       text: "Another unmerge cells name"
            //     }
            //   }
          }
        },
        keyboard: {
          bindings: QuillBetterTable.keyboardBindings
        }
      }}
      {...props}
    />
  );
};


export default RichTextEditor;
