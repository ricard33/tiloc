import React, { Suspense } from "react";
import { Path, useFormContext } from "react-hook-form";
import { FieldValues } from "react-hook-form/dist/types/fields";
import { useTranslation } from "react-i18next";

import RichTextEditor from "../Editor";
// const RichTextEditor = React.lazy(() => import("../Editor"));

type RichTextEditorElementProps<T extends FieldValues = FieldValues> = {
  name: Path<T>,
  readOnly?: boolean,
  placeholder?: string;
  onChange?: (content: string) => void,
};

const RichTextEditorElement: React.FC<RichTextEditorElementProps> = <TFieldValues extends FieldValues = FieldValues>({
  name, readOnly = false, placeholder, onChange, ...props
}: RichTextEditorElementProps<TFieldValues>) => {
  const { t } = useTranslation();
  const { setValue, getValues } = useFormContext();
  const initialValue = getValues(name);


  return (
    <Suspense fallback={<div>{t("Loading...")}</div>}>
      <RichTextEditor
        {...props}
        content={initialValue}
        onChange={(content: string) => {
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
        // placeholder={placeholder}
      />
    </Suspense>
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
