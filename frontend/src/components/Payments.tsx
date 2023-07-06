import React, { useState } from "react";
import PaymentList from "./PaymentList";
import { useConfirm } from "../libs/MuiConfirm";
import { useTranslation } from "react-i18next";
import { formatDate } from "../common/dateUtils";
import { parseISO } from "date-fns";
import { AddCircle as AddIcon } from "@mui/icons-material";
import PaymentDialog from "./PaymentDialog";
import { Payment, User } from "../types";
import {
  useCreatePaymentMutation,
  useDeletePaymentMutation,
  useGetPaymentsForBookingQuery,
  useUpdatePaymentMutation
} from "../services/api";
import { useAlert } from "../common/alertUtils";
import { fetchErrorDecode } from "../common/apiUtils";
import { shiftUTCDateToLocalDate } from "../common/tzUtils";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { IconButton } from '@mui/material';

type PaymentListProps = {
  bookingId: number;
  onPaymentsUpdate?: (newTotal: number) => void;
};

const Payments: React.FunctionComponent<PaymentListProps> = ({
  bookingId,
  onPaymentsUpdate
}: PaymentListProps) => {
  const [edited, setEdited] = useState<Omit<Payment, 'booking'> | null>(null);
  const confirm = useConfirm();
  const { t } = useTranslation();
  const { data } = useGetPaymentsForBookingQuery(bookingId);
  const [createPayment] = useCreatePaymentMutation();
  const [updatePayment] = useUpdatePaymentMutation();
  const [deletePayment] = useDeletePaymentMutation();
  const { showError, showSuccess } = useAlert();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const showPayments = user.permissions.includes('core.view_payment')

  let totalPaid = 0;
  if (data) {
    data.results.forEach(p => {
      totalPaid += Number(p.amount);
    });
  }

  function onAddPayment() {
    setEdited({
      booking_id: bookingId,
      date: shiftUTCDateToLocalDate(new Date()),
      description: "",
      method: "",
      amount: 0,
    });
  }

  function onCreateorModifyPayment(payment: Payment) {
    if(!edited || !edited.id) {
      createPayment(payment).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during payment creation", error);
          showError(t("Impossible to create payment: ") + fetchErrorDecode(error));
        } else {
          totalPaid += payment.amount;
          if (onPaymentsUpdate) onPaymentsUpdate(totalPaid);
          setEdited(null);
          showSuccess(t("Payment added"));
        }
      });
    } else {
      updatePayment({...edited, ...payment}).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during payment change", error);
          showError(t("Impossible to modify payment: ") + fetchErrorDecode(error));
        } else {
          totalPaid += payment.amount - edited.amount;
          if (onPaymentsUpdate) onPaymentsUpdate(totalPaid);
          setEdited(null);
          showSuccess(t("Payment changed"));
        }
      });
    }
  }

  function onEditPayment(payment: Payment) {
    setEdited(payment);
  }

  function onDeletePayment(payment: Payment) {
    confirm({
      title: t("Delete payment: {{ amount }} € on {{ date }}", {
        amount: payment.amount,
        date: formatDate(payment.date)
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
    setEdited(null);
  }

  return (
    <div>
      {showPayments && <>
        <PaymentList payments={data ? data.results : []} onModify={onEditPayment} onDelete={onDeletePayment} />
        <IconButton
          edge="end"
          aria-label="delete"
          color="primary"
          onClick={onAddPayment}
          size="large"
        >
          <AddIcon />{t("Add payment")}
        </IconButton>
        {edited !== null &&
        <PaymentDialog payment={edited} bookingId={bookingId} onValidate={onCreateorModifyPayment} onClose={onClose} />}
      </>}</div>
  );
};

export default Payments;

