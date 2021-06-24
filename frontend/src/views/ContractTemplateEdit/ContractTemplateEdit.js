import React, { useCallback, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/styles";
import { useTranslation } from "react-i18next";
import { useHistory, useParams } from "react-router-dom";
import Button from "@material-ui/core/Button";
import {
  DeleteForever as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon
} from "@material-ui/icons";
import * as actions from "../../actions";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import * as selectors from "../../selectors";
import { Grid, TextField } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import moment from "moment";
import Editor from "../../components/Editor";
import Alert from "@material-ui/lab/Alert";
import Backdrop from "@material-ui/core/Backdrop";
import CircularProgress from "@material-ui/core/CircularProgress";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import { Controller } from "react-hook-form";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

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

const ContractTemplateEdit = (props) => {
  let { templateId } = useParams();
  templateId = Number(templateId);
  const classes = useStyles();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const template = useSelector(store => selectors.contractTemplates(store, templateId));
  const lodgings = useSelector(store => selectors.lodgings(store));
  const history = useHistory();
  const [content, setContent] = useState(template ? template.content : undefined);
  const [name, setName] = useState(template ? template.name : undefined);
  const [loading, setLoading] = useState(true);
  const [lodgingId, setLodgingId] = useState(0);

  // console.assert(!!templateId, "Template id not initialized");

  const loaded = useCallback(
    () => {
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    // dispatch(actions.fetchBookings());
    if (templateId)
      dispatch(actions.getContractTemplate(templateId, loaded));
    else
      loaded()
  }, [templateId, loaded, dispatch]);

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
    window.open("/api/lodging/" + lodgingId + "/empty_contract_pdf/?template_id=" + template.id, '_blank');
  }

  function onClose() {
    history.goBack();
  }

  function onCancel() {
    onClose();
  }

  function onDelete() {
    if (template.id)
      dispatch(actions.deleteContractTemplate(template.id, () => {
        console.debug("Closing...");
        onClose();
      }));
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

  function _onSave(callback: (template) => void) {
    const submittedTemplate = {
      id: template ? template.id : undefined,
      name: name,
      content: content
    };
    const action = template && template.id ? actions.updateContractTemplate : actions.createContractTemplate;
    dispatch(action(submittedTemplate, (data) => {
      if (!template || !template.id) {
        console.debug('change url')
        templateId = data.id;
        history.replace({ pathname: `/settings/contract-templates/${templateId}`})
      }
      callback(submittedTemplate);
    }));
  }


  return (
    <div className={classes.root}>
      <Backdrop className={classes.backdrop} open={loading}>
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
              { modified_date: moment(template.modified).fromNow() })}
          </Typography>
          }
        </Grid>
        <Grid item xs={12}>
          {!loading &&
          <Editor
            content={content}
            onChange={onChange}
          />}
        </Grid>
        <Grid item container xs={12} justify="space-between" alignItems="flex-start">
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
                {lodgings.map(lodging => (
                  <MenuItem key={lodging.id} value={lodging.id}>{lodging.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              type="button"
              color="default"
              className={classes.button}
              startIcon={<PdfIcon />}
              onClick={makePDF}
              disabled={!lodgingId}
              title={t("PDF")}
            >{t("PDF")}</Button>
            <Button
              type="button"
              color="default"
              className={classes.button}
              startIcon={<PdfIcon />}
              onClick={onSaveAndMakePDF}
              disabled={!lodgingId}
              title={t("PDF")}
            >{t("Save and make PDF")}</Button>
          </Grid>
          <Grid item>
            <Button type="button" color="default" onClick={onCancel}>{t("Cancel")}</Button>
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
