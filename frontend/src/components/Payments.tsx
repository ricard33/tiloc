import React, { useEffect, useState } from "react";
import axios from "axios";
import PaymentList from "./PaymentList";
import { Pagination, Payment } from "../types/models";
import { useConfirm } from "material-ui-confirm";
import { useTranslation } from "react-i18next";
import { formatDate } from "../common/dateUtils";
import { parseISO } from "date-fns";
import IconButton from "@material-ui/core/IconButton";
import { AddCircle as AddIcon } from "@material-ui/icons";
import PaymentDialog from "./PaymentDialog";

type PaymentListProps = {
  bookingId: number;
};

const Payments: React.FunctionComponent<PaymentListProps> = ({ bookingId, ...props }: PaymentListProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [open, setOpen] = useState(false);
  const confirm = useConfirm();
  const { t } = useTranslation();

  function onAddPayment(payment: Payment) {
    axios.post<Payment>(`/api/payment/`, payment)
      .then(response => {
        setPayments([
          ...payments,
          response.data
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
        axios.delete(`/api/payment/${payment.id}/`)
          .then(response => {
            setPayments(payments.filter(p => p.id !== payment.id));
          });
      })
      .catch(() => {
        console.error("can't delete payment ", payment);
      });
  }

  useEffect(() => {
    axios.get<Pagination<Payment>>(`/api/payment/?booking_id=${bookingId}`)
      .then(response => {
        console.log(response.data);
        setPayments(response.data.results);
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

