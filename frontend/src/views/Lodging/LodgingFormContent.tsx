import React, { useEffect } from "react";

import { Alert, InputAdornment, Unstable_Grid2 as Grid2 } from "@mui/material";
import { useTranslation } from "react-i18next";
import { MultiSelectElement, SelectElement, SwitchElement, TextFieldElement } from "react-hook-form-mui";
import { Lodging, User } from "../../types";
import { useFormContext } from "react-hook-form";
import { useListContractTemplatesQuery, useListServicesQuery } from "../../services/api";
import HelpTooltip from "../../components/Fields/HelpTooltip";
import HouseOutlinedIcon from "@mui/icons-material/HouseOutlined";
import RoomServiceOutlinedIcon from "@mui/icons-material/RoomServiceOutlined";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import EuroOutlinedIcon from "@mui/icons-material/EuroOutlined";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { Section } from "../../components/Section";


type Props = {
  lodging?: Lodging;
  users: User[];
  isSetupWizard?: boolean;
};

export const LodgingFormContent: React.FC<Props> = ({ lodging, users, isSetupWizard }) => {
  const { t } = useTranslation();
  const formContext = useFormContext();
  const { watch, getValues, setValue } = formContext;
  const isFlatRateTourismTax = watch("is_flat_rate_tourist_tax", getValues("is_flat_rate_tourist_tax"));
  const { data: services } = useListServicesQuery();
  const { data: templates } = useListContractTemplatesQuery();
  const template = watch("contract_template", lodging?.contract_template);
  // const [expanded, setExpanded] = React.useState<string | false>("description");

  useEffect(() => {
    if (!template && templates)
      setValue("contract_template", templates[0].id, { shouldDirty: true });
  }, [setValue, template, templates]);

  const usersOptions: { label: string, id: number }[] = users ? users.map((user) => {
    return { label: user.full_name, id: user.id };
  }) : [];

  // const handleChangeExpanded =
  //   (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
  //     setExpanded(isExpanded ? panel : false);
  //   };

  return (
    <>
      <input type="hidden" name={"id"} value={lodging ? lodging.id : undefined} />
      <input type="hidden" name={"rank"} value={lodging ? lodging.rank : 0} />

      <Section header={t("Description")} icon={<HouseOutlinedIcon />}>
        <Grid2 container spacing={4}>
          <Grid2 xs={12}>
            <HelpTooltip
              helpContent={t("Choose an evocative name to designate your accommodation. This name will also appear in contracts.")}
              fullWidth
            >
              <TextFieldElement name={"name"} label={t("Name")} fullWidth required />
            </HelpTooltip>
          </Grid2>
          <Grid2 sm={6} xs={12}>
            <TextFieldElement name={"address"} label={t("Address")} multiline rows={3} fullWidth required />
          </Grid2>
          <Grid2 sm={6} xs={12}>
            {!isSetupWizard &&
              <>
                <HelpTooltip
                  helpContent={t("If you are not the owner of the accommodation but only the intermediary, you can link each property to an owner in order to have detailed activity monitoring and create a private co-management space for them. You remain the main user of the Tiloc account.")}
                  fullWidth
                >
                  <SelectElement name={"owner_id"} label={t("Owner")} options={usersOptions} fullWidth />
                </HelpTooltip>
                <SwitchElement name={"active"} label={t("Active ?")} />
                <SwitchElement name={"shown"} label={t("Shown ?")} />
              </>
            }
          </Grid2>
          <Grid2 sm={6} xs={12}>
            <HelpTooltip helpContent={t("Number of people who can sleep in the accommodation.")} fullWidth>
              <TextFieldElement label={t("Capacity")} name={"capacity"} required type={"number"} fullWidth />
            </HelpTooltip>
          </Grid2>
        </Grid2>
      </Section>
      <Section header={t("Options")} icon={<RoomServiceOutlinedIcon />}>
        <HelpTooltip
          helpContent={t("Indicate here the options you want to automatically add when making a new reservation. You can always modify the list of options for each reservation.")}
          fullWidth
        >
          <MultiSelectElement
            label={t("Automatic options")}
            name="default_services"
            options={services ? services.map(l => {
              return { id: l.reference, label: `[${l.reference}] ${l.designation}` };
            }) : []}
            fullWidth
            style={{ minWidth: "300px" }}
            showChips
          />
        </HelpTooltip>
      </Section >
      <Section header={t("Payments")} icon={<PaymentOutlinedIcon />}>
        <Grid2 container spacing={4}>
          <Grid2 sm={6} xs={12}>
            <HelpTooltip
              helpContent={t("You can take a deposit or deposit when booking the tenant.")}
              fullWidth
            >
              <SelectElement
                name={"deposit_label"} label={t("Down payment / Deposit")} type={"number"}
                required fullWidth
                options={[
                  { id: "deposit", label: t("Deposit") },
                  { id: "down_payment", label: t("Down payment") }
                ]}

              />
            </HelpTooltip>
          </Grid2>
          <Grid2 sm={6} xs={12}>
            <TextFieldElement
              name={"deposit_percent"} label={t("Down payment / Deposit percentage")} type={"number"}
              required fullWidth
              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            />
          </Grid2>
          <Grid2 sm={6} xs={12}>
            <HelpTooltip
              helpContent={t("Amount of the security deposit, often called a 'surety'. You can take a security deposit when booking the tenant.")}
              fullWidth
            >
              <TextFieldElement
                name={"guaranty"} label={t("Security deposit amount")} type={"number"}
                required fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
              />
            </HelpTooltip>
          </Grid2>
          <Grid2 sm={6} xs={12}/>
          <Grid2 sm={6} xs={12}>
            <HelpTooltip helpContent={t("When the balance should be paid?")} fullWidth>
              <SelectElement
                name={"balance_due_date"}
                label={t("The balance must be paid")}
                options={[
                  { id: 0, label: t("At the arrival") },
                  ...[1, 2, 3, 5, 7, 14, 30, 60, 90].map(d => {
                    return { id: d, label: t("{{count}} days before", { count: d }) };
                  })
                ]}
                fullWidth
              />
            </HelpTooltip>
          </Grid2>
        </Grid2>
      </Section>
      <Section header={t("Prices")} icon={<EuroOutlinedIcon />}>
        <Grid2 container spacing={4}>
          <Grid2 sm={6} xs={12}>
            <HelpTooltip helpContent={t("Specify the normal rate per night here.")}>
              <TextFieldElement
                name={"daily_rate"} label={t("Daily rate")} type={"number"}
                required fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
              />
            </HelpTooltip>
          </Grid2>
        </Grid2>
      </Section>
      <Section header={t("Taxes and legislation")} icon={<AccountBalanceIcon />}>
        <Grid2 container spacing={4}>
          <Grid2 xs={12}>
            <Alert
              severity="info"
            >{t("If you have a registration number from your municipality for your host activity, you must indicate it to appear on your ad.")}</Alert>
          </Grid2>
          <Grid2 xs={12}>
            <HelpTooltip helpContent={t("The registration number is 13 characters long.")} fullWidth>
              <TextFieldElement name={"registration_number"} label={t("Registration number")} fullWidth />
            </HelpTooltip>
          </Grid2>
          <Grid2 xs={12}>
            <Alert
              severity="info"
            >{t("You can automatically calculate your tourist tax so that your tenants pay it directly to you when booking. You must enter your rates/daily rates below.")}</Alert>
          </Grid2>
          <Grid2 xs={12} container>
            <Grid2 xs={12}>
              <HelpTooltip
                helpContent={t("If you activate this option, the tourist tax will be automatically calculated and added when tenants book. You will have access to a monthly statement to declare your taxes to your municipality.")}
              >
                <SwitchElement
                  name={"tourist_tax_included_in_payment"} label={t("Would you like to calculate the tourist tax?")}
                />
              </HelpTooltip>
            </Grid2>
            <Grid2 xs={12}>
              <HelpTooltip
                helpContent={t("If you activate this option, the tax amount will be a fixed amount per adult per night.")}
              >
                <SwitchElement name={"is_flat_rate_tourist_tax"} label={t("Flat rate tax?")} />
              </HelpTooltip>
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <TextFieldElement
                name={"tourist_tax_rate"} label={t("Rate of your daily tax")} type={"number"}
                fullWidth disabled={isFlatRateTourismTax}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <HelpTooltip
                helpContent={t("Per night and per person. If existing. Otherwise leave the field empty.")} fullWidth
              >
                <TextFieldElement
                  name={"max_daily_tourist_tax"}
                  label={isFlatRateTourismTax ? t("Daily tourist tax") : t("Ceiling of your daily tax")}
                  type={"number"} fullWidth
                  InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                />
              </HelpTooltip>
            </Grid2>
          </Grid2>
        </Grid2>
      </Section>

      {/*<hr style={{ margin: "16px" }} />*/}
      <Grid2 container spacing={4}>
        {/*<Grid2 xs={12}>*/}
        {/*  <HelpTooltip*/}
        {/*    helpContent={t("Private personal notes are only visible to you and allow you to retain information.")}*/}
        {/*  >*/}
        {/*    <TextFieldElement*/}
        {/*      name={"information"} label={t("Private personal notes")} multiline*/}
        {/*      fullWidth*/}
        {/*    />*/}
        {/*  </HelpTooltip>*/}
        {/*</Grid2>*/}
        {/*<Grid2 xs={12}>*/}
        {/*  {*/}
        {/*    templates ?*/}
        {/*      <SelectElement*/}
        {/*        label={t("Contract template")}*/}
        {/*        name="contract_template"*/}
        {/*        options={templates.map(l => {*/}
        {/*          return { id: l.id, label: l.name };*/}
        {/*        })}*/}
        {/*        fullWidth*/}
        {/*        style={{ minWidth: "300px" }}*/}
        {/*        defaultValue={templates[0].id}*/}
        {/*      />*/}
        {/*      :*/}
        {/*      <Skeleton variant="rectangular" width={210} height={24} />*/}
        {/*  }*/}
        {/*</Grid2>*/}

        {/*<Grid2 xs={12}>*/}
        {/*  <Typography variant="h6">{t("Lodging description (annexed to contracts)")}</Typography>*/}
        {/*</Grid2>*/}
        {/*<Grid2 xs={12}>*/}
        {/*  <RichTextEditorElement placeholder="Start typing..." name="description" />*/}
        {/*</Grid2>*/}
      </Grid2>
    </>
  );
};
