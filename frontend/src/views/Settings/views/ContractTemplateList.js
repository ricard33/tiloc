import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/styles";
import Backdrop from "@material-ui/core/Backdrop";
import CircularProgress from "@material-ui/core/CircularProgress";
import * as actions from "../../../actions";
import { useDispatch, useSelector } from "react-redux";
import orm from "orm";
import { useTranslation } from "react-i18next";
import { ContractTemplatesTable, ContractTemplatesToolbar } from "./components";
import { useHistory } from "react-router-dom";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3)
  },
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
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const allTemplates = useSelector(store => orm.session(store.entities).ContractTemplate.all());
  const loading = useSelector(store => store.fetching.contract_templates.loading);
  const [selected, setSelected] = useState([]);
  const numSelected = selected.length;
  const history = useHistory();

  useEffect(() => {
    dispatch(actions.fetchContractTemplates());
    dispatch(actions.fetchLodgings());
  }, [dispatch]);

  const onSelectionChange = (newSelection) => {
    setSelected(newSelection);
  };

  const onEditTemplate = (template) => {
    history.push("/settings/contract-templates/" + template.id);
  };

  return (
    <div className={classes.root}>
      <ContractTemplatesToolbar numSelected={numSelected}/>
      <div className={classes.content}>
        <ContractTemplatesTable
          templates={allTemplates.toModelArray() || []}
          onEdit={onEditTemplate}
          onSelectionChange={onSelectionChange}
        />
        <Backdrop className={classes.backdrop} open={loading} timeout={0}>
          <CircularProgress color="inherit"/>
        </Backdrop>
      </div>
    </div>
  );
};

export default ContractTemplateList;
