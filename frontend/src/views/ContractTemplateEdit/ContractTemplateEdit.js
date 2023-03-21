import React, { Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { DeleteForever as DeleteIcon, PictureAsPdf as PdfIcon, Save as SaveIcon } from "@mui/icons-material";
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import {
  useCreateContractTemplateMutation,
  useDeleteContractTemplateMutation,
  useGetContractTemplateQuery,
  useListLodgingsQuery,
  useUpdateContractTemplateMutation
} from "../../services/api";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { formatDistanceToNow } from "../../common/dateUtils";
import { parseISO } from "date-fns";
import Page from "../../layouts/Main/Page";

const RichTextEditor = React.lazy(() => import("../../components/Editor"));

const ContractTemplateEdit = (/*props*/) => {
  let { templateId } = useParams();
  templateId = Number(templateId);
  const { t } = useTranslation();
  const {
    data: template,
  } = useGetContractTemplateQuery(templateId, { skip: typeof templateId === "undefined" });
  const { data: lodgings } = useListLodgingsQuery({ shown: true });
  const [createContractTemplate] = useCreateContractTemplateMutation();
  const [updateContractTemplate] = useUpdateContractTemplateMutation();
  const [deleteContractTemplate] = useDeleteContractTemplateMutation();
  const navigate = useNavigate();
  const [content, setContent] = useState(template ? template.content : undefined);
  const [name, setName] = useState(template ? template.name : "");
  const [lodgingId, setLodgingId] = useState(0);
  const { showError, showSuccess } = useAlert();

  // console.assert(!!templateId, "Template id not initialized");

  // console.log(isLoading, content);
  useEffect(() => {
    if (template) {
      setName(template.name);
      setContent(template.content);
    }
  }, [template]);

  function onChange(newContent) {
    setContent(newContent);
  }

  function onLodgingChange(event) {
    const value = event.target.value;
    console.debug(value);
    setLodgingId(value);
  }

  function makePDF() {
    window.open("/api/lodging/" + lodgingId + "/empty_contract_pdf/?template_id=" + template.id, "_blank");
  }

  function onClose() {
    navigate(-1);
  }

  function onCancel() {
    onClose();
  }

  function onDelete() {
    if (template.id)
      deleteContractTemplate(template.id).then(() => {
        console.debug("Closing...");
        onClose();
      });
  }

  function onSave() {
    _onSave();
  }

  function onSaveAndClose() {
    _onSave(onClose);
  }

  function onSaveAndMakePDF() {
    _onSave(makePDF);
  }

  function _onSave(callback/*: (template) => void*/) {
    const submittedTemplate = {
      id: template ? template.id : undefined,
      name: name,
      content: content
    };
    const action = template && template.id ? updateContractTemplate : createContractTemplate;
    action(submittedTemplate).then((result) => {
      const { data, error } = result;
      if (error) {
        console.error("Error during template saving", error);
        showError(t("Impossible to save template: ") + fetchErrorDecode(error));
      } else {
        if (!template || !template.id) {
          console.debug("change url");
          templateId = data.id;
          navigate(`/settings/contract-templates/${templateId}`, { replace: true });
        }
        showSuccess(t("Template saved"));
        if (callback) callback(submittedTemplate);
      }
    });
  }


  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <Backdrop sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, color: "#fff" }} open={typeof content === "undefined"}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Typography variant="h1">
        {t("Rental agreement template")}
      </Typography>
      {/*<Alert severity="info">*/}
      {/*  {t("The model contract is provided as an example only and does not replace legal advice or professional assistance. " +*/}
      {/*    "No legal or other liability is accepted by the software publisher.")}*/}
      {/*</Alert>*/}
      <Stack
        style={{ flex: "1 1 auto" }}
        spacing={1}
      >
        <Box>
          <TextField
            id="template-name" name="templateName" label={t("Template name")}
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
          />
        </Box>
        <Box>
          {template &&
            <Typography variant="caption" display="block" gutterBottom>
              {t("Template saved {{modified_date}}.",
                { modified_date: formatDistanceToNow(parseISO(template.modified)) })}
            </Typography>
          }
        </Box>
        <Box sx={{ flex: 1, background: "white", maxHeight: "400px" }}>
          <Suspense fallback={<div>{t("Loading...")}</div>}>
            {typeof content !== "undefined" &&
              <RichTextEditor
                content={content}
                onChange={onChange}
              />}
          </Suspense>
        </Box>
        <Grid container justifyContent="space-between" alignItems="flex-start" style={{ flex: 0 }}>
          <Grid item>
            {template && template.id &&
              <Button
                type="button"
                sx={{ color: "red", margin: (theme) => theme.spacing(1) }}
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={onDelete}
              >{t("Delete")}</Button>}
          </Grid>
          <Grid item>
            <FormControl sx={{ width: "100%" }} variant="outlined">
              <InputLabel htmlFor="booking-lodging">{t("Lodging")}</InputLabel>
              <Select
                name="lodging_id"
                label={t("Lodging")}
                margin="dense"
                // native
                value={lodgingId}
                onChange={onLodgingChange}
              >
                <MenuItem key={0} value={0}>{t("--- select a lodging ---")}</MenuItem>
                {lodgings && lodgings.map(lodging => (
                  <MenuItem key={lodging.id} value={lodging.id}>{lodging.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              type="button"
              sx={{ margin: (theme) => theme.spacing(1) }}
              startIcon={<PdfIcon />}
              onClick={makePDF}
              disabled={!lodgingId}
              title={t("PDF")}
            >{t("PDF")}</Button>
            <Button
              type="button"
              sx={{ margin: (theme) => theme.spacing(1) }}
              startIcon={<PdfIcon />}
              onClick={onSaveAndMakePDF}
              disabled={!lodgingId}
              title={t("PDF")}
            >{t("Save and make PDF")}</Button>
          </Grid>
          <Grid item>
            <Button type="button" onClick={onCancel}>{t("Cancel")}</Button>
            <Button
              type="submit"
              color="primary"
              sx={{ margin: (theme) => theme.spacing(1) }}
              startIcon={<SaveIcon />}
              onClick={onSave}
            >{t("Save")}</Button>
            <Button
              type="submit"
              color="primary"
              sx={{ margin: (theme) => theme.spacing(1) }}
              startIcon={<SaveIcon />}
              onClick={onSaveAndClose}
            >{t("Save and Close")}</Button>
          </Grid>
        </Grid>
      </Stack>
    </Page>
  );
};

ContractTemplateEdit.propTypes = {};

export default ContractTemplateEdit;
