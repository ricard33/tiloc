import React from "react";
import { useTranslation } from "react-i18next";
import PageBreak from "./PageBreak";
import { ContentBlock } from "react-draft-wysiwyg";
import { ContentState } from "draft-js";

type AtomicBlockProps = {
  block: ContentBlock,
  contentState: ContentState,
};

const AtomicBlock: React.FunctionComponent<AtomicBlockProps> = ({
  ...props
}: AtomicBlockProps) => {
  const { t } = useTranslation();

  const { block, contentState } = props;
  // const { foo } = props.blockProps;
  const entity = contentState.getEntity(block.getEntityAt(0));
  const data = entity.getData();
  const type = entity.getType();

  switch (type) {
    case "PAGE_BREAK":
      return <PageBreak />;
    default:
      return <></>
  }
};

export default AtomicBlock;
