import React, { Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { DeleteForever as DeleteIcon, Save as SaveIcon } from "@mui/icons-material";
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
import Page from "../../layouts/Main/Page";
import { ContractTemplate, User } from "../../types";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useConfirm } from "../../libs/MuiConfirm";
import { getCookie } from "../../common/cookies";

const RichTextEditor = React.lazy(() => import("../../components/Editor"));

const ContractTemplateEdit = (/*props*/) => {
  let { templateId } = useParams();
  const { t } = useTranslation();
  const {
    data: template, isLoading
  } = useGetContractTemplateQuery(Number(templateId), { skip: typeof templateId === "undefined" });
  const { data: lodgings } = useListLodgingsQuery({ shown: true });
  const [createContractTemplate] = useCreateContractTemplateMutation();
  const [updateContractTemplate] = useUpdateContractTemplateMutation();
  const [deleteContractTemplate] = useDeleteContractTemplateMutation();
  const navigate = useNavigate();
  const [content, setContent] = useState(template ? template.content : "");
  const [name, setName] = useState(template ? template.name : "");
  const [lodgingId, setLodgingId] = useState(0);
  const { showError, showSuccess } = useAlert();
  const confirm = useConfirm();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canChange = user.permissions.includes("core.change_contracttemplate");
  const canDelete = user.permissions.includes("core.delete_contracttemplate");

  // console.assert(!!templateId, "Template id not initialized");

  // console.log(isLoading, content);
  useEffect(() => {
    if (template) {
      setName(template.name);
      setContent(template.content);
    }
  }, [template]);

  useEffect(() => {
    if (lodgings && lodgings.length > 0) setLodgingId(lodgings[0].id);
  }, [lodgings]);

  function onChange(newContent: string) {
    if (canChange)
      setContent(newContent);
  }

  function onLodgingChange(value: string | number) {
    // console.debug(value);
    setLodgingId(value as number);
  }

  function onClose() {
    navigate(-1);
  }

  function onCancel() {
    onClose();
  }

  const onDelete = async (template: ContractTemplate) => {
    if (template && template.id) {
      if (!canDelete) return await Promise.resolve();
      return confirm({
        title: t("Delete contract template: {{ name }}", {
          name: template.name
        }),
        description: t("Do you really want to permanently delete this contract template?")
      })
        .then(() => {
          deleteContractTemplate(template).then((result) => {
            if ((result as any).error) {
              const error = (result as any).error;
              console.error("Error deleting contract template", error);
              showError(t("Impossible to delete the contract template: ") + fetchErrorDecode(error));
            } else {
              showSuccess(t("Contract template deleted"));
              onClose();
            }
          });
        })
        .catch(() => { /* ... */
        });
    }
  };

  function onSave() {
    _onSave();
  }

  function onSaveAndClose() {
    _onSave(onClose);
  }

  function _onSave(callback?: (template: ContractTemplate) => void) {
    const submittedTemplate = {
      id: template ? template.id : undefined,
      name: name,
      content: content
    };
    const action = template && template.id ? updateContractTemplate : createContractTemplate;
    action(submittedTemplate).then((result) => {
      if ((result as any).error) {
        const error = (result as any).error;
        console.error("Error during template saving", error);
        showError(t("Impossible to save template: ") + fetchErrorDecode(error));
      } else {
        const data = (result as any).data as ContractTemplate;
        if (!template || !template.id) {
          console.debug("change url");
          navigate(`/settings/contract-templates/${data.id}`, { replace: true });
        }
        showSuccess(t("Template saved"));
        if (callback) callback(data);
      }
    });
  }


  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <Backdrop sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, color: "#fff" }} open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Typography variant="h1">
        {t("Rental agreement template")}
      </Typography>
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
                { modified_date: formatDistanceToNow(template.modified) })}
            </Typography>
          }
        </Box>
        <Box sx={{ flex: 1, background: "white", maxHeight: "400px" }}>
          <Suspense fallback={<div>{t("Loading...")}</div>}>
            {typeof content !== "undefined" &&
              <RichTextEditor
                content={content}
                onChange={onChange}
                readOnly={!canChange}
                withPlaceholders
              />}
          </Suspense>
        </Box>
        {
          lodgings &&
          <Stack direction={"row"} justifyContent={"center"}>
            <Stack direction={"row"} spacing={2}>
              <form
                method="post" action={`${window.location.origin}/api/contract_template/${template!.id}/preview_pdf/`}
                target="_blank"
              >
                <input type="hidden" name="template" value={content} />
                <input type="hidden" name="lodging_id" value={lodgingId} />
                <input type="hidden" name="csrfmiddlewaretoken" value={getCookie("csrftoken") ?? ""} />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={!template}
                >{t("Preview")}</Button>
              </form>
              <FormControl sx={{ width: "100%" }} variant="outlined">
                <InputLabel htmlFor="booking-lodging">{t("Using lodging")}</InputLabel>
                <Select
                  name="lodging_id"
                  label={t("Using lodging")}
                  margin="dense"
                  value={lodgingId}
                  onChange={(event) => onLodgingChange(event.target.value)}
                >
                  {lodgings.map(lodging => (
                    <MenuItem key={lodging.id} value={lodging.id}>{lodging.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        }
        <Grid container justifyContent="space-between" alignItems="flex-start" style={{ flex: 0 }}>
          <Grid item>
            {template && template.id &&
              <Button
                type="button"
                sx={{ margin: (theme) => theme.spacing(1) }}
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => onDelete(template)}
                disabled={!canDelete}
              >{t("Delete")}</Button>}
          </Grid>
          <Grid item>
            <Button type="button" color="secondary" onClick={onCancel}>{t("Cancel")}</Button>
            <Button
              type="submit"
              color="primary"
              sx={{ margin: (theme) => theme.spacing(1) }}
              startIcon={<SaveIcon />}
              onClick={onSave}
              disabled={!canChange}
            >{t("Save")}</Button>
            <Button
              type="submit"
              color="primary"
              sx={{ margin: (theme) => theme.spacing(1) }}
              startIcon={<SaveIcon />}
              onClick={onSaveAndClose}
              disabled={!canChange}
            >{t("Save and Close")}</Button>
          </Grid>
        </Grid>
      </Stack>
    </Page>
  );
};

ContractTemplateEdit.propTypes = {};

export default ContractTemplateEdit;
