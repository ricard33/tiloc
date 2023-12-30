import React, { Suspense, useEffect, useState } from "react";
import { Alert, Box, Card, CardContent, CardHeader, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { FormContainer } from "react-hook-form-mui";
import { ContractTemplate } from "../../types";
import { WizardFooter } from "./WizardFooter";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useListContractTemplatesQuery, useUpdateContractTemplateMutation } from "../../services/api";
import { useAlert } from "../../common/alertUtils";

const RichTextEditor = React.lazy(() => import("../../components/Editor"));

type Props = {
  onNext: () => void;
};

export const ContractWizardStep: React.FC<Props> = ({ onNext }) => {
  const { t } = useTranslation();
  const {
    data: templates,
    isLoading: isLoadingTemplates
  } = useListContractTemplatesQuery({}, { refetchOnMountOrArgChange: 20 });
  const [updateContractTemplate] = useUpdateContractTemplateMutation();
  const { showError, showSuccess } = useAlert();

  const template = templates && templates.length > 0 ? templates[0] : undefined;
  const [content, setContent] = useState(template ? template.content : "");

  useEffect(() => {
    if (template) {
      setContent(template.content);
    }
  }, [template]);

  function onChange(newContent: string) {
    setContent(newContent);
  }

  const onSubmitHandler = (data: ContractTemplate) => {
    // console.log(data);
    updateContractTemplate(data).then((result) => {
      if ((result as any).error) {
        const error = (result as any).error;
        console.error("Error during template saving", error);
        showError(t("Impossible to save template: ") + fetchErrorDecode(error));
      } else {
        const data = (result as any).data as ContractTemplate;
        showSuccess(t("Template saved"));
      }
    });
  };

  if (isLoadingTemplates) return <div>{t("Loading...")}</div>;
  return (
    <FormContainer
      defaultValues={template ?? {}}
      onSuccess={onSubmitHandler}
    >
      <Card sx={{ maxWidth: "none" }}>
        <CardHeader title={t("Rental agreement template")} />
        <CardContent sx={{}}>
          <Stack>
            <Alert severity="info" variant="standard">
              {t("This section allows you to modify the rental contract model that we offer you. With each new reservation, a new contract will be generated and updated automatically. You can use the “variables” button in the menu to automatically personalize the contract. They will be replaced by the data when the document is generated.")}
            </Alert>
            <span
              style={{ fontWeight: "bold", fontSize: "smaller" }}
            >{t("ATTENTION ! It is essential to read and complete the proposed template with your own conditions at least the first time. In fact, certain passages must be adapted to your situation.")}</span>
            <Box sx={{ flex: 1, background: "white", maxHeight: "400px", marginTop: 1 }}>
              <Suspense fallback={<div>{t("Loading...")}</div>}>
                {typeof content !== "undefined" &&
                  <RichTextEditor
                    content={content}
                    onChange={onChange}
                    withPlaceholders
                  />}
              </Suspense>
            </Box>

          </Stack>
        </CardContent>
      </Card>
      <WizardFooter />
    </FormContainer>
  );
};
