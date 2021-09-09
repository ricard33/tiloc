import React, { useEffect, useState, Suspense } from "react";
import { makeStyles } from "@mui/styles";
import { useTranslation } from "react-i18next";
import { useHistory, useParams } from "react-router-dom";
import Button from "@mui/material/Button";
import {
  DeleteForever as DeleteIcon,
  PictureAsPdf as PdfIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon
} from "@mui/icons-material";
import axios from "axios";
import { Grid } from "@mui/material";
import Typography from "@mui/material/Typography";
import Alert from '@mui/material/Alert';
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import {
  useDeleteContractMutation,
  useGetOrGenerateContractMutation,
  useUpdateContractMutation
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
  const history = useHistory();
  // const [loading, setLoading] = useState(true);
  const [getOrGenerateContract, {data: contract, isLoading}] = useGetOrGenerateContractMutation();
  const [ updateContract ] = useUpdateContractMutation();
  const [ deleteContract ] = useDeleteContractMutation();
  const [content, setContent] = useState(contract ? contract.content : undefined);
  const { showError, showSuccess } = useAlert();

  console.assert(!!bookingId, "Booking not initialized");

  useEffect(() => {
    getOrGenerateContract({bookingId});
  }, [bookingId, getOrGenerateContract]);

  useEffect(() => {
    if (contract)
      setContent(contract.content);
  }, [contract]);

  function onChange(newContent) {
    setContent(newContent);
  }

  function regenerateContract() {
    getOrGenerateContract({ bookingId, regenerate: true });
  }

  function makePDF() {
    const fileDownload = require("js-file-download");
    axios.get("/api/contract/" + contract.id + "/pdf/",
      {
        responseType: "blob" // important
      })
      .then((response) => {
        const contentDisposition = response.headers["content-disposition"];
        let fileName = "contract.pdf";
        if (contentDisposition) {
          fileName = contentDisposition.split("filename=")[1];
        }

        fileDownload(response.data, fileName);
      });

  }

  function onClose() {
    history.goBack();
  }

  function onCancel() {
    onClose();
  }

  function onDelete() {
    if (contract.id)
      deleteContract(contract.id).then((result) => {
        const {error} = result;
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
    _onSave(makePDF);
  }

  function _onSave(callback/*: (contract) => void*/) {
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
        if(callback) callback(submittedContract);
      }
    });
  }


  return (
    <div className={classes.root}>
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
              { modified_date: formatDistanceToNow(parseISO(contract.modified)) })}
          </Typography>
          }
        </Grid>
        <Grid item xs={12}>
          <Suspense fallback={<div>{t("Loading...")}</div>}>
            {content &&
            <Editor
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
              onClick={makePDF}
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
    </div>
  );
};

ContractEdit.propTypes = {};

export default ContractEdit;
