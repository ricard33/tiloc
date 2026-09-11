import React, { Suspense, useState } from "react";
import { Grid } from "@mui/material";
import { addMonths, endOfMonth, startOfMonth, subYears } from "date-fns";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/Main/Page";
import DateRangeSelector, { DateRange } from "../../components/DateRangeSelector";
import { useAppSelector } from "../../app/hooks";
import { User } from "../../types";
import { useStatsEndpoint } from "./useStatsEndpoint";
import { ChannelRow, emptyBookingFunnelData, emptyPaymentsOverviewData, FillingRateRow, SeasonBreakdownData } from "./types";

const OccupancyAndRevenue = React.lazy(() => import("./components/OccupancyAndRevenue"));
const BookingFunnel = React.lazy(() => import("./components/BookingFunnel"));
const ConversionTiles = React.lazy(() => import("./components/ConversionTiles"));
const LengthOfStayDistribution = React.lazy(() => import("./components/LengthOfStayDistribution"));
const LeadTimeDistribution = React.lazy(() => import("./components/LeadTimeDistribution"));
const ChannelRevenue = React.lazy(() => import("./components/ChannelRevenue"));
const SeasonBreakdown = React.lazy(() => import("./components/SeasonBreakdown"));
const PaymentMethods = React.lazy(() => import("./components/PaymentMethods"));
const CollectedVsOutstanding = React.lazy(() => import("./components/CollectedVsOutstanding"));
const TouristTaxAndGuests = React.lazy(() => import("./components/TouristTaxAndGuests"));
const LodgingRanking = React.lazy(() => import("./components/LodgingRanking"));

const Stats = () => {
  const { t } = useTranslation();
  const user = useAppSelector(store => store.auth.user) as User;
  const canViewPrices = user.permissions.includes("core.view_prices");

  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: addMonths(startOfMonth(subYears(today, 1)), 1),
    endDate: endOfMonth(today),
  });
  const previousYearRange: DateRange = {
    startDate: subYears(dateRange.startDate, 1),
    endDate: subYears(dateRange.endDate, 1),
  };

  // one fetch per theme, shared by every card in that theme's section
  const { data: fillingRate } = useStatsEndpoint<FillingRateRow[]>("filling_rate", dateRange, []);
  const { data: previousYearFillingRate } = useStatsEndpoint<FillingRateRow[]>("filling_rate", previousYearRange, []);
  const { data: channelDistribution } = useStatsEndpoint<ChannelRow[]>("channel_distribution", dateRange, []);
  const { data: bookingFunnel } = useStatsEndpoint("booking_funnel", dateRange, emptyBookingFunnelData);
  const { data: seasonBreakdown } = useStatsEndpoint<SeasonBreakdownData>("season_breakdown", dateRange, {});
  const { data: paymentsOverview } = useStatsEndpoint(
    "payments_overview",
    dateRange,
    emptyPaymentsOverviewData,
    canViewPrices
  );

  const loading = <div>{t("Loading...")}</div>;

  return (
    <Page>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <DateRangeSelector startDate={dateRange.startDate} endDate={dateRange.endDate} onChange={setDateRange} />
        </Grid>

        <Grid item xs={12}>
          <Suspense fallback={loading}>
            <OccupancyAndRevenue data={fillingRate} previousYearData={previousYearFillingRate} />
          </Suspense>
        </Grid>

        <Grid item lg={8} xs={12}>
          <Suspense fallback={loading}>
            <BookingFunnel data={bookingFunnel} />
          </Suspense>
        </Grid>
        <Grid item lg={4} xs={12}>
          <Suspense fallback={loading}>
            <ConversionTiles data={bookingFunnel} />
          </Suspense>
        </Grid>
        <Grid item md={6} xs={12}>
          <Suspense fallback={loading}>
            <LengthOfStayDistribution data={bookingFunnel} />
          </Suspense>
        </Grid>
        <Grid item md={6} xs={12}>
          <Suspense fallback={loading}>
            <LeadTimeDistribution data={bookingFunnel} />
          </Suspense>
        </Grid>

        <Grid item md={6} xs={12}>
          <Suspense fallback={loading}>
            <ChannelRevenue data={channelDistribution} />
          </Suspense>
        </Grid>
        <Grid item md={6} xs={12}>
          <Suspense fallback={loading}>
            <SeasonBreakdown data={seasonBreakdown} />
          </Suspense>
        </Grid>

        {canViewPrices && (
          <>
            <Grid item md={6} xs={12}>
              <Suspense fallback={loading}>
                <PaymentMethods data={paymentsOverview} />
              </Suspense>
            </Grid>
            <Grid item md={6} xs={12}>
              <Grid container spacing={4} direction="column">
                <Grid item>
                  <Suspense fallback={loading}>
                    <CollectedVsOutstanding data={paymentsOverview} />
                  </Suspense>
                </Grid>
                <Grid item>
                  <Suspense fallback={loading}>
                    <TouristTaxAndGuests data={paymentsOverview} />
                  </Suspense>
                </Grid>
              </Grid>
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <Suspense fallback={loading}>
            <LodgingRanking data={fillingRate} />
          </Suspense>
        </Grid>
      </Grid>
    </Page>
  );
};

export default Stats;
