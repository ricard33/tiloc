import React, { useEffect, useState, Suspense } from "react";
import { makeStyles } from "@mui/styles";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { bookingType } from "../../common/propTypesUtils";
import {
  DeleteForever as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon
} from "@mui/icons-material";
import axios from "axios";
import {
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import useWindowDimensions from "../../common/windowDimensions";
import {
  useGetOrGenerateContractMutation,
  useUpdateContractMutation,
  useDeleteContractMutation,
} from "../../services/api";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { formatDistanceToNow } from "../../common/dateUtils";
import { parseISO } from "date-fns";
import { makePDF } from "../../common/pdf-tools";

const RichTextEditor = React.lazy(() => import("../Editor"));

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
  statusItem: {
    width: "-webkit-fill-available"
    // width: "stretch",
    // padding: theme.spacing(1)
    // height: "1em",
    // marginRight: "5px"
  },
  deleteButton: {
    color: "red"
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff"
  }
}));

const ContractDialog = props => {
  const { booking, onClose } = props;
  const classes = useStyles();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const [getOrGenerateContract, {data: contract, isLoading}] = useGetOrGenerateContractMutation();
  const [ updateContract ] = useUpdateContractMutation();
  const [ deleteContract ] = useDeleteContractMutation();
  const [content, setContent] = useState(contract ? contract.content : undefined);
  const { showError, showSuccess } = useAlert();

  console.assert(!!booking, "Booking not initialized");

  useEffect(() => {
    getOrGenerateContract({bookingId: booking.id});
  }, [booking.id, getOrGenerateContract]);

  useEffect(() => {
    if (contract)
      setContent(contract.content);
  }, [contract]);

  function onChange(newContent) {
    setContent(newContent);
  }

  function regenerateContract() {
    setContent(undefined);
    getOrGenerateContract({bookingId: booking.id, regenerate: true});
  }

  function onCancel() {
    onClose();
  }

  function onDelete() {
    if (contract.id)
      deleteContract(contract.id).then(() => {
        console.debug("Closing...");
        onClose();
      });
  }

  function onSave() {
    const submittedContract = {
      id: contract.id,
      content: content
    };
    updateContract(submittedContract).then((result) => {
      const {error} = result;
      if (error) {
        console.error("Error during contract saving", error);
        showError(t("Impossible to save contract: ") + fetchErrorDecode(error));
      } else {
        showSuccess(t("Contract saved"));
        onClose(submittedContract);
      }
    });
  }

  return (
    <Dialog
      className={classes.root}
      onClose={onClose}
      aria-labelledby="simple-dialog-title"
      open={!!contract}
      maxWidth="md"
      fullScreen={width <= 600}
      disableEnforceFocus
      disablePortal
      disableAutoFocus
    >
      <Backdrop className={classes.backdrop} open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <DialogTitle id="simple-dialog-title">
        {t("Rental agreement")}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t("The model contract is provided as an example only and does not replace legal advice or professional assistance. " +
            "No legal or other liability is accepted by the software publisher.")}
        </DialogContentText>
        {contract &&
        <Grid
          container
          spacing={1}
        >
          <Grid item xs={12}>
            <Typography>{t("Contract saved {{modified_date}}. Click on 'Regenerate' to update it.",
              { modified_date: formatDistanceToNow(parseISO(contract.modified)) })}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Suspense fallback={<div>{t("Loading...")}</div>}>
              {content &&
              <RichTextEditor
                content={content}
                onChange={onChange}
              />}
            </Suspense>
          </Grid>
        </Grid>
        }
      </DialogContent>
      <DialogActions>
        {contract && contract.id &&
        <Button
          type="button"
          className={classes.deleteButton}
          color="secondary"
          startIcon={<DeleteIcon />}
          onClick={onDelete}
        >{t("Delete")}</Button>}
        <div style={{ flex: "1 0 0" }} />
        <Button
          type="button"
          className={classes.button}
          startIcon={<RefreshIcon />}
          onClick={regenerateContract}
        >{t("Regenerate")}</Button>
        {/*<Button*/}
        {/*  type="button"*/}
        {/*  color="default"*/}
        {/*  className={classes.button}*/}
        {/*  startIcon={<PrintIcon/>}*/}
        {/*  onClick={printContract}*/}
        {/*  title={t("Print")}*/}
        {/*/>*/}
        <Button
          type="button"
          className={classes.button}
          startIcon={<PdfIcon />}
          onClick={() => makePDF("/api/contract/" + contract.id + "/pdf/", "contract.pdf")}
          title={t("PDF")}
        >{t("PDF")}</Button>
        <div style={{ flex: "1 0 0" }} />
        <Button type="button" onClick={onCancel}>{t("Cancel")}</Button>
        <Button
          type="submit"
          color="primary"
          className={classes.button}
          startIcon={<SaveIcon />}
          onClick={onSave}
        >{t("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
};

ContractDialog.propTypes = {
  booking: bookingType,
  onClose: PropTypes.func.isRequired
};

export default ContractDialog;
