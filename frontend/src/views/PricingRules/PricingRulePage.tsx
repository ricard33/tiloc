import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import Page from "../../layouts/Main/Page";
import { RootState } from "../../store";
import { PricingAdjustment, User } from "../../types";
import { useAlert } from "../../common/alertUtils";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useConfirm } from "../../libs/MuiConfirm";
import {
  useCreatePricingAdjustmentMutation,
  useDeletePricingAdjustmentMutation,
  useGetPricingAdjustmentQuery,
  useListLodgingsQuery,
  useUpdatePricingAdjustmentMutation
} from "../../services/api";
import { PricingRuleForm } from "./PricingRuleForm";

export function PricingRulePage() {
  const { t } = useTranslation();
  const { ruleId } = useParams();
  const { data: rule, isLoading } = useGetPricingAdjustmentQuery(Number(ruleId), {
    skip: typeof ruleId === "undefined"
  });
  const { data: lodgings, isLoading: isLoadingLodgings } = useListLodgingsQuery();
  const [createRule] = useCreatePricingAdjustmentMutation();
  const [updateRule] = useUpdatePricingAdjustmentMutation();
  const [deleteRule] = useDeletePricingAdjustmentMutation();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canChange = user.permissions.includes("core.change_pricingadjustment");
  const canDelete = user.permissions.includes("core.delete_pricingadjustment");
  const { showError, showSuccess } = useAlert();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const onCancel = () => navigate(-1);

  const onDelete = async (rule: PricingAdjustment) => {
    if (!canDelete) return;
    return confirm({
      title: t("Delete pricing rule: {{ name }}", { name: rule.name }),
      description: t("Do you really want to permanently delete this pricing rule?")
    })
      .then(() =>
        deleteRule(rule).then((result) => {
          if ((result as any).error) {
            showError(t("Impossible to delete: ") + fetchErrorDecode((result as any).error));
          } else {
            showSuccess(t("Pricing rule deleted"));
            navigate(-1);
          }
        })
      )
      .catch(() => { /* dismissed */ });
  };

  const onSubmit = (data: PricingAdjustment) => {
    const mutation = rule && rule.id ? updateRule({ ...rule, ...data }) : createRule(data);
    mutation.then((result) => {
      if ((result as any).error) {
        showError(t("Impossible to save: ") + fetchErrorDecode((result as any).error));
      } else {
        showSuccess(rule && rule.id ? t("Pricing rule changed") : t("Pricing rule added"));
        navigate(-1);
      }
    });
  };

  if (isLoading || isLoadingLodgings) return <div>{t("Loading...")}</div>;
  return (
    <Page>
      <PricingRuleForm
        rule={rule}
        lodgings={lodgings ?? []}
        onSubmit={canChange ? onSubmit : undefined}
        onCancel={onCancel}
        onDelete={canDelete ? onDelete : undefined}
      />
    </Page>
  );
}
