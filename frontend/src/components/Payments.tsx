import React, { useEffect, useState } from "react";
import PaymentList from "./PaymentList";
import { useConfirm } from "material-ui-confirm";
import { useTranslation } from "react-i18next";
import { formatDate } from "../common/dateUtils";
import { parseISO } from "date-fns";
import IconButton from "@material-ui/core/IconButton";
import { AddCircle as AddIcon } from "@material-ui/icons";
import PaymentDialog from "./PaymentDialog";
import { getForBooking, Payment, paymentApi } from "../types/payment";

type PaymentListProps = {
  bookingId: number;
};

const Payments: React.FunctionComponent<PaymentListProps> = ({ bookingId, ...props }: PaymentListProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [open, setOpen] = useState(false);
  const confirm = useConfirm();
  const { t } = useTranslation();

  function onAddPayment(payment: Payment) {
    paymentApi.create(payment)
      .then(data => {
        setPayments([
          ...payments,
          data
        ]);
        setOpen(false)
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
        paymentApi.delete(payment.id ?? 0)
          .then(response => {
            setPayments(payments.filter(p => p.id !== payment.id));
          });
      })
      .catch(() => {
        console.error("can't delete payment ", payment);
      });
  }

  useEffect(() => {
    getForBooking(bookingId)
      .then(data => {
        console.log(data);
        setPayments(data.results);
      });
  }, [bookingId]);

  function onClose() {
    setOpen(false)
  }

  return (
    <div>
      <PaymentList payments={payments} onDelete={onDeletePayment} />
      <IconButton edge="end" aria-label="delete" color="primary" onClick={() => setOpen(true)}>
        <AddIcon />{t("Add payment")}
      </IconButton>
      {open && <PaymentDialog open={open} bookingId={bookingId} onAdd={onAddPayment} onClose={onClose} />}
    </div>

  )
  ;
};

export default Payments;

