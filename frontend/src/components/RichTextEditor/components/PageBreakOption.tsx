import React from "react";
import { useTranslation } from "react-i18next";
import { AtomicBlockUtils, EditorState, Modifier } from "draft-js";
import { SvgIcon } from "@mui/material";

type PageBreakOptionProps = {
  onChange?: (editorState: EditorState) => void,
  editorState?: EditorState,

};

const PageBreakOption: React.FunctionComponent<PageBreakOptionProps> = ({
  ...props
}: PageBreakOptionProps) => {
  const { t } = useTranslation();
  const { editorState, onChange } = props;

  const addPageBreak = (): void => {
    const contentState = editorState!.getCurrentContent();
    const contentStateWithEntity = contentState.createEntity("PAGE_BREAK", "IMMUTABLE", ' ');
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
    const contentStateWithPageBreak = Modifier.applyEntity(
      contentStateWithEntity,
      editorState!.getSelection(),
      entityKey
    );
    const newEditorState = EditorState.push(editorState!, contentStateWithPageBreak, "insert-fragment");
    onChange!(AtomicBlockUtils.insertAtomicBlock(newEditorState, entityKey, " "));
  };

  return (
    <div onClick={addPageBreak} title={t("Page break")} className={"rdw-option-wrapper"}>
      <SvgIcon className="" viewBox="0 0 20 20">
        <path d="M3.598.687h1.5v5h-1.5zm14.5 0h1.5v5h-1.5z" />
        <path d="M19.598 4.187v1.5h-16v-1.5zm-16 14.569h1.5v-5h-1.5zm14.5 0h1.5v-5h-1.5z" />
        <path d="M19.598 15.256v-1.5h-16v1.5zM5.081 9h6v2h-6zm8 0h6v2h-6zm-9.483 1L0 12.5v-5z" />
      </SvgIcon>
    </div>
  );
};

export default PageBreakOption;
