import React, { useState } from "react";
import PaymentList from "./PaymentList";
import { useConfirm } from "material-ui-confirm";
import { useTranslation } from "react-i18next";
import { formatDate } from "../common/dateUtils";
import { parseISO } from "date-fns";
import IconButton from "@material-ui/core/IconButton";
import { AddCircle as AddIcon } from "@material-ui/icons";
import PaymentDialog from "./PaymentDialog";
import { Payment } from "../types";
import { useCreatePaymentMutation, useDeletePaymentMutation, useGetPaymentsForBookingQuery } from "../services/api";
import { useAlert } from "../common/alertUtils";
import { fetchErrorDecode } from "../common/apiUtils";

type PaymentListProps = {
  bookingId: number;
  onPaymentsUpdate?: (newTotal: number) => void;
};

const Payments: React.FunctionComponent<PaymentListProps> = ({
  bookingId,
  onPaymentsUpdate,
  ...props
}: PaymentListProps) => {
  const [open, setOpen] = useState(false);
  const confirm = useConfirm();
  const { t } = useTranslation();
  const { data } = useGetPaymentsForBookingQuery(bookingId);
  const [createPayment] = useCreatePaymentMutation();
  const [deletePayment] = useDeletePaymentMutation();
  const { showError, showSuccess } = useAlert();

  let totalPaid = 0;
  if (data) {
    data.results.forEach(p => {
      totalPaid += Number(p.amount);
    });
  }

  function onCreatePayment(payment: Payment) {
    createPayment(payment).then((result) => {
      if ((result as any).error) {
        const error = (result as any).error;
        console.error("Error during payment creation", error);
        showError(t("Impossible to create payment: ") + fetchErrorDecode(error));
      } else {
        totalPaid += payment.amount;
        if (onPaymentsUpdate) onPaymentsUpdate(totalPaid);
        setOpen(false);
        showSuccess(t("Payment added"));
      }
    });
  }

  function onDeletePayment(payment: Payment) {
    confirm({
      title: t("Delete payment: {{ amount }} € on {{ date }}", {
        amount: payment.amount,
        date: formatDate(parseISO(payment.date))
      }),
      description: t("Do you really want to permanently delete this payment?")
    })
      .then(() => {
        deletePayment(payment.id ?? 0).then((result) => {
          if ((result as any).error) {
            const error = (result as any).error;
            console.error("Error deleting payment", error);
            showError(t("Impossible to delete the payment: ") + fetchErrorDecode(error));
          } else {
            showSuccess(t("Payment deleted"));
            totalPaid -= Number(payment.amount);
            // setPayments(payments.filter(p => p.id !== payment.id));
            if (onPaymentsUpdate) onPaymentsUpdate(totalPaid);
          }
        });
      });
  }

  function onClose() {
    setOpen(false);
  }

  return (
    <div>
      <PaymentList payments={data ? data.results : []} onDelete={onDeletePayment} />
      <IconButton edge="end" aria-label="delete" color="primary" onClick={() => setOpen(true)}>
        <AddIcon />{t("Add payment")}
      </IconButton>
      {open && <PaymentDialog open={open} bookingId={bookingId} onAdd={onCreatePayment} onClose={onClose} />}
    </div>

  );
};

export default Payments;

