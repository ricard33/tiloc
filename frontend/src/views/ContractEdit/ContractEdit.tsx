import React, { Suspense, useEffect, useState } from "react";
import { makeStyles } from "@mui/styles";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import {
  DeleteForever as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon
} from "@mui/icons-material";
import { Alert, Backdrop, Button, CircularProgress, Grid, Theme, Typography } from "@mui/material";
import {
  useDeleteContractMutation,
  useGetOrGenerateContractMutation,
  useUpdateContractMutation
} from "../../services/api";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { formatDistanceToNow } from "../../common/dateUtils";
import Page from "../../layouts/Main/Page";
import { makePDF } from "../../common/pdf-tools";
import { Contract } from "../../types";

const RichTextEditor = React.lazy(() => import("../../components/Editor"));


const useStyles = makeStyles((theme: Theme) => ({
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
    color: "red",
    margin: theme.spacing(1)
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff"
  }
}));

const ContractEdit = () => {
  let { bookingId } = useParams();
  const classes = useStyles();
  const { t } = useTranslation();
  const navigate = useNavigate();
  // const [loading, setLoading] = useState(true);
  const [getOrGenerateContract, {data: contract, isLoading}] = useGetOrGenerateContractMutation();
  const [ updateContract ] = useUpdateContractMutation();
  const [ deleteContract ] = useDeleteContractMutation();
  const [content, setContent] = useState(contract ? contract.content : undefined);
  const { showError, showSuccess } = useAlert();

  console.assert(!!bookingId, "Booking not initialized");
  // if (typeof bookingId === "undefined") {
  //   navigate(-1);
  //   return <div>No booking</div>;
  // }

  useEffect(() => {
    if (bookingId) getOrGenerateContract({bookingId: Number(bookingId)});
  }, [bookingId, getOrGenerateContract]);

  useEffect(() => {
    if (contract)
      setContent(contract.content);
  }, [contract]);

  function onChange(newContent: string) {
    setContent(newContent);
  }

  function regenerateContract() {
    getOrGenerateContract({ bookingId: Number(bookingId), regenerate: true });
  }

  function onClose() {
    navigate(-1);
  }

  function onCancel() {
    onClose();
  }

  function onDelete() {
    if (contract && contract.id)
      deleteContract(contract).then((result) => {
        const {error} = result as any;
        if (error) {
          console.error("Error deleting contract", error);
          showError(t("Impossible to delete contract: ") + fetchErrorDecode(error));
        } else {
          onClose();
          showSuccess(t("Contract deleted"));
        }
      });
  }

  function onSave() {
    _onSave(onClose);
  }

  function onSaveAndMakePDF() {
    _onSave((contract: Contract) => makePDF("/api/contract/" + contract.id + "/pdf/", "contract.pdf"));
  }

  function _onSave(callback: (contract: Contract) => void) {
    const submittedContract = {
      id: contract?.id,
      content: content
    };
    updateContract(submittedContract).then((result) => {
      const {error} = result as any;
      if (error) {
        console.error("Error during contract saving", error);
        showError(t("Impossible to save contract: ") + fetchErrorDecode(error));
      } else {
        showSuccess(t("Contract saved"));
        const data = (result as any).data as Contract;
        if(callback) callback(data);
      }
    });
  }


  return (
    <Page>
      <Backdrop className={classes.backdrop} open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Typography variant="h1">
        {t("Rental agreement")}
      </Typography>
      <Alert severity="info">
        {t("The model contract is provided as an example only and does not replace legal advice or professional assistance. " +
          "No legal or other liability is accepted by the software publisher.")}
      </Alert>
      <Grid
        container
        spacing={1}
      >
        <Grid item xs={12}>
          {contract &&
          <Typography variant="caption" display="block" gutterBottom>
            {t("Contract saved {{modified_date}}. Click on 'Regenerate' to update it.",
              { modified_date: formatDistanceToNow(contract.modified) })}
          </Typography>
          }
        </Grid>
        <Grid item xs={12}>
          <Suspense fallback={<div>{t("Loading...")}</div>}>
            {typeof content !== "undefined" &&
            <RichTextEditor
              content={content}
              onChange={onChange}
            />}
          </Suspense>
        </Grid>
        <Grid item container xs={12} justifyContent="space-between" alignItems="flex-start">
          <Grid item>
            {contract && contract.id &&
            <Button
              type="button"
              className={classes.deleteButton}
              color="secondary"
              startIcon={<DeleteIcon />}
              onClick={onDelete}
            >{t("Delete")}</Button>}
          </Grid>
          <Grid item>
            <Button
              type="button"
              className={classes.button}
              startIcon={<RefreshIcon />}
              onClick={regenerateContract}
            >{t("Regenerate")}</Button>
            <Button
              type="button"
              className={classes.button}
              startIcon={<PdfIcon />}
              onClick={() => makePDF("/api/contract/" + contract!.id + "/pdf/", "contract.pdf")}
              title={t("PDF")}
            >{t("PDF")}</Button>
            <Button
              type="button"
              className={classes.button}
              startIcon={<PdfIcon />}
              onClick={onSaveAndMakePDF}
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
          </Grid>
        </Grid>
      </Grid>
    </Page>
  );
};

export default ContractEdit;
