import React from "react";
import { Table, TableBody, TableCell, TableRow, IconButton } from "@mui/material";
import { formatDate } from "../common/dateUtils";
import { DecimalPrecision } from "../common/priceUtils";
import DeleteIcon from "@mui/icons-material/DeleteForever";
import EditIcon from "@mui/icons-material/Edit";
import { useTranslation } from "react-i18next";
import { Payment, paymentMethods } from "../types";


type PaymentListProps = {
  payments: Payment[];
  onModify?: (payment: Payment) => void;
  onDelete?: (payment: Payment) => void;
};

const PaymentList: React.FunctionComponent<PaymentListProps> = ({ payments, onModify, onDelete }: PaymentListProps) => {
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
    <Table aria-label="simple table">
      <TableBody>
        {payments && payments.map(p => (
          <TableRow key={p.id}>
            <TableCell>{formatDate(p.date)}</TableCell>
            <TableCell>{p.description}</TableCell>
            <TableCell>{paymentLabels[p.method]}</TableCell>
            <TableCell align="right">{DecimalPrecision.round(Number(p.amount))} &euro;</TableCell>
            <TableCell>
              {onModify &&
                <IconButton
                  edge="end"
                  aria-label="edit"
                  sx={{
                    color: "blue",
                    margin: 0
                  }}
                  onClick={() => onModify(p)}
                  size="large"
                >
                  <EditIcon />
                </IconButton>}
              {onDelete &&
                <IconButton
                  edge="end"
                  aria-label="delete"
                  sx={{
                    color: "red",
                    margin: 0
                  }}
                  onClick={() => onDelete(p)}
                  size="large"
                >
                  <DeleteIcon />
                </IconButton>}
            </TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell rowSpan={2} />
          <TableCell colSpan={2} sx={{fontWeight: "bold"}}>{t("Total")}</TableCell>
          <TableCell align="right" sx={{fontWeight: "bold"}}>{ccyFormat(paymentsTotal)} &euro;</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default PaymentList;

