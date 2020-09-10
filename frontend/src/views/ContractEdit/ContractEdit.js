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
import { Grid } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import moment from "moment";
import Editor from "../../components/Editor";
import Alert from "@material-ui/lab/Alert";
import Backdrop from "@material-ui/core/Backdrop";
import CircularProgress from "@material-ui/core/CircularProgress";

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

const ContractEdit = props => {
  let { bookingId } = useParams();
  const classes = useStyles();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const contract = useSelector(store => selectors.contracts(store, bookingId));
  const history = useHistory();
  const [content, setContent] = useState(contract ? contract.content : undefined);
  const [loading, setLoading] = useState(true);

  console.assert(!!bookingId, "Booking not initialized");

  const loaded = useCallback(
    () => {
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    dispatch(actions.fetchBookings());
    dispatch(actions.getOrCreateContract(bookingId, loaded));
  }, [bookingId, loaded, dispatch]);

  useEffect(() => {
    if (contract)
      setContent(contract.content);
  }, [contract]);

  function onChange(newContent) {
    setContent(newContent);
  }

  function regenerateContract() {
    setContent(undefined);
    setLoading(true);
    dispatch(actions.generateContract(bookingId, loaded));
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
      dispatch(actions.deleteContract(contract.id, () => {
        console.debug("Closing...");
        onClose();
      }));
  }

  function onSave() {
    const submittedContract = {
      id: contract.id,
      content: content
    };
    const action = actions.updateContract;
    dispatch(action(submittedContract, () => {
      onClose(submittedContract);
    }));
  }

  return (
    <div className={classes.root}>
      <Backdrop className={classes.backdrop} open={loading}>
        <CircularProgress color="inherit"/>
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
              { modified_date: moment(contract.modified).fromNow() })}
          </Typography>
          }
        </Grid>
        <Grid item xs={12}>
          {content &&
          <Editor
            content={content}
            onChange={onChange}
          />}
        </Grid>
        <Grid item container xs={12} justify="space-between" alignItems="flex-start">
          <Grid item>
            {contract && contract.id &&
            <Button
              type="button"
              className={classes.deleteButton}
              color="secondary"
              startIcon={<DeleteIcon/>}
              onClick={onDelete}
            >{t("Delete")}</Button>}
          </Grid>
          <Grid item>
            <Button
              type="button"
              color="default"
              className={classes.button}
              startIcon={<RefreshIcon/>}
              onClick={regenerateContract}
            >{t("Regenerate")}</Button>
            <Button
              type="button"
              color="default"
              className={classes.button}
              startIcon={<PdfIcon/>}
              onClick={makePDF}
              title={t("PDF")}
            >{t("PDF")}</Button>
          </Grid>
          <Grid item>
            <Button type="button" color="default" onClick={onCancel}>{t("Cancel")}</Button>
            <Button
              type="submit"
              color="primary"
              className={classes.button}
              startIcon={<SaveIcon/>}
              onClick={onSave}
            >{t("Save")}</Button>
          </Grid>
        </Grid>
      </Grid>
    </div>

  );
};

ContractEdit.propTypes = {
};

export default ContractEdit;
