import React from "react";
import { Path, useFormContext } from "react-hook-form";
import { FieldValues } from "react-hook-form/dist/types/fields";
import RichTextEditor from "../RichTextEditor/RichTextEditor";


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


  return (
    <RichTextEditor
      {...props}
      content={initialValue}
      onChange={(content) => {
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
      readOnly={readOnly}
      placeholder={placeholder}
    />
    // <Editor
    //   {...props}
    //   toolbarCustomButtons={[
    //     <PageBreakOption />
    //   ]}
    //   toolbar={{
    //     image: {
    //       uploadCallback: uploadImageCallBack,
    //       alt: { present: true, mandatory: false },
    //     },
    //   }}
    //   defaultContentState={initialContentState}
    //   onContentStateChange={(contentState) => {
    //     const content = draftToHtml(contentState);
    //     if (initialValue !== content) {
    //       setValue(name as string, content, {
    //         shouldDirty: true
    //         // shouldTouch: true
    //       });
    //       if (typeof onChange === "function") {
    //         onChange(content);
    //       }
    //     }
    //   }}
    //   customBlockRenderFunc={myBlockRenderer}
    // />
  );
};


export default RichTextEditorElement;
