import React from "react";
import { Table, TableBody, TableCell, Theme } from "@mui/material";
import TableRow from "@mui/material/TableRow";
import { formatDate } from "../common/dateUtils";
import { DecimalPrecision } from "../common/priceUtils";
import IconButton from "@mui/material/IconButton";
import { DeleteForever as DeleteIcon } from "@mui/icons-material";
import { makeStyles } from "@mui/styles";
import { parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import { Payment, paymentMethods } from "../types";


const useStyles = makeStyles((theme: Theme) => ({
  table: {},
  deleteButton: {
    color: "red",
    margin: theme.spacing(1)
  }
}));

type PaymentListProps = {
  payments: Payment[];
  onDelete: (payment: Payment) => void;
};

const PaymentList: React.FunctionComponent<PaymentListProps> = ({ payments, onDelete }: PaymentListProps) => {
  const classes = useStyles();
  const { t } = useTranslation();

  function ccyFormat(num: number) {
    return `${DecimalPrecision.round(num)}`;
  }

  function total(items: Payment[]) {
    return items.map(({ amount }) => amount).reduce((sum, i) => sum + i, 0);
  }

  const paymentsTotal = total(payments);
  const paymentLabels = paymentMethods(t).reduce<Record<string, string>>((obj, cur) => ({...obj, [cur[0]]: cur[1]}), {});

  return (
    <Table className={classes.table} aria-label="simple table">
      <TableBody>
        {payments && payments.map(p => (
          <TableRow key={p.id}>
            <TableCell>{formatDate(parseISO(p.date))}</TableCell>
            <TableCell>{p.description}</TableCell>
            <TableCell>{paymentLabels[p.method]}</TableCell>
            <TableCell>{DecimalPrecision.round(Number(p.amount))} &euro;</TableCell>
            <TableCell>
              <IconButton
                edge="end"
                aria-label="delete"
                className={classes.deleteButton}
                onClick={() => onDelete(p)}
                size="large">
                <DeleteIcon />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell rowSpan={2} />
          <TableCell colSpan={2}>{t("Total")}</TableCell>
          <TableCell align="right">{ccyFormat(paymentsTotal)} &euro;</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default PaymentList;

