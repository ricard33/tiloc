import React, { useState } from "react";
import { makeStyles } from "@mui/styles";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { ContractTemplatesTable, ContractTemplatesToolbar } from "./components";
import { useNavigate } from "react-router-dom";
import { useListContractTemplatesQuery } from "../../../services/api";
import Page from "../../../layouts/Main/Page";

const useStyles = makeStyles(theme => ({
  content: {
    marginTop: theme.spacing(2)
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff"
  }
}));

const ContractTemplateList = () => {
  const classes = useStyles();
  const { data: allTemplates, isLoading } = useListContractTemplatesQuery();
  const [selected, setSelected] = useState([]);
  const numSelected = selected.length;
  const navigate = useNavigate();

  const onSelectionChange = (newSelection) => {
    setSelected(newSelection);
  };

  const onEditTemplate = (template) => {
    navigate("/settings/contract-templates/" + template.id);
  };

  return (
    <Page>
      <ContractTemplatesToolbar numSelected={numSelected} />
      <div className={classes.content}>
        <ContractTemplatesTable
          templates={allTemplates || []}
          onEdit={onEditTemplate}
          onSelectionChange={onSelectionChange}
        />
        <Backdrop className={classes.backdrop} open={isLoading} timeout={0}>
          <CircularProgress color="inherit" />
        </Backdrop>
      </div>
    </Page>
  );
};

export default ContractTemplateList;
