import React, { useEffect, useState, Suspense } from "react";
import { makeStyles } from "@mui/styles";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@mui/material/Button";
import {
  DeleteForever as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Save as SaveIcon
} from "@mui/icons-material";
import { Grid, TextField } from "@mui/material";
import Typography from "@mui/material/Typography";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import {
  useCreateContractTemplateMutation, useDeleteContractTemplateMutation,
  useGetContractTemplateQuery,
  useListLodgingsQuery, useUpdateContractTemplateMutation
} from "../../services/api";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { formatDistanceToNow } from "../../common/dateUtils";
import { parseISO } from "date-fns";

const Editor = React.lazy(() => import("../../components/Editor"));

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
  deleteButton: {
    color: "red",
    margin: theme.spacing(1)
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff"
  }
}));

const ContractTemplateEdit = (/*props*/) => {
  let { templateId } = useParams();
  templateId = Number(templateId);
  const classes = useStyles();
  const { t } = useTranslation();
  const {
    data: template,
    isLoading
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
          navigate(`/settings/contract-templates/${templateId}`, {replace: true});
        }
        showSuccess(t("Template saved"));
        if (callback) callback(submittedTemplate);
      }
    });
  }


  return (
    <div className={classes.root}>
      <Backdrop className={classes.backdrop} open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Typography variant="h1">
        {t("Rental agreement template")}
      </Typography>
      {/*<Alert severity="info">*/}
      {/*  {t("The model contract is provided as an example only and does not replace legal advice or professional assistance. " +*/}
      {/*    "No legal or other liability is accepted by the software publisher.")}*/}
      {/*</Alert>*/}
      <Grid
        container
        spacing={1}
      >
        <Grid item xs={12}>
          <TextField
            id="template-name" name="templateName" label={t("Template name")}
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          {template &&
          <Typography variant="caption" display="block" gutterBottom>
            {t("Template saved {{modified_date}}.",
              { modified_date: formatDistanceToNow(parseISO(template.modified)) })}
          </Typography>
          }
        </Grid>
        <Grid item xs={12}>
          <Suspense fallback={<div>{t("Loading...")}</div>}>
            {!isLoading &&
            <Editor
              content={content}
              onChange={onChange}
            />}
          </Suspense>
        </Grid>
        <Grid item container xs={12} justifyContent="space-between" alignItems="flex-start">
          <Grid item>
            {template && template.id &&
            <Button
              type="button"
              className={classes.deleteButton}
              color="secondary"
              startIcon={<DeleteIcon />}
              onClick={onDelete}
            >{t("Delete")}</Button>}
          </Grid>
          <Grid item>
            <FormControl className={classes.formControl} variant="outlined">
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
              className={classes.button}
              startIcon={<PdfIcon />}
              onClick={makePDF}
              disabled={!lodgingId}
              title={t("PDF")}
            >{t("PDF")}</Button>
            <Button
              type="button"
              className={classes.button}
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
              className={classes.button}
              startIcon={<SaveIcon />}
              onClick={onSave}
            >{t("Save")}</Button>
            <Button
              type="submit"
              color="primary"
              className={classes.button}
              startIcon={<SaveIcon />}
              onClick={onSaveAndClose}
            >{t("Save and Close")}</Button>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

ContractTemplateEdit.propTypes = {};

export default ContractTemplateEdit;
