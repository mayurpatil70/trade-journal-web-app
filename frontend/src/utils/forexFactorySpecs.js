// frontend/src/utils/forexFactorySpecs.js
// Specifications & Analysis dictionary matching Forex Factory detail drawers

const SPECS_DATABASE = {
  fomc: {
    source: "Federal Reserve",
    measures:
      "Interest rate at which depository institutions lend balances held at the Federal Reserve to other depository institutions overnight.",
    usualEffect: "'Actual' greater than 'Forecast' is good for currency (Bullish USD);",
    frequency: "Scheduled 8 times per year;",
    ffNotes:
      "The rate decision is usually priced into the market, so it tends to be overshadowed by the FOMC Statement, which is focused on the future direction of monetary policy.",
    whyTradersCare:
      "Short term interest rates are the paramount factor in currency valuation - traders look at most other indicators merely to predict how rates will change in the future.",
    derivedVia: "FOMC members vote on where to set the target rate. The individual votes are published in the FOMC statement.",
    alsoCalled: "Interest Rates, Fed Funds Rate, Fed Rate Decision",
    acroExpand: "Federal Open Market Committee (FOMC)",
    pairs: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "USDCAD", "AUDUSD"],
  },
  boc: {
    source: "Bank of Canada (BOC)",
    measures: "Interest rate at which major financial institutions borrow and lend one-day (or 'overnight') funds among themselves.",
    usualEffect: "'Actual' greater than 'Forecast' is good for currency (Bullish CAD);",
    frequency: "Scheduled 8 times per year;",
    ffNotes:
      "The rate decision is accompanied by the Rate Statement and the quarterly Monetary Policy Report, providing forward guidance on inflation and growth projections.",
    whyTradersCare:
      "Governing Council uses interest rate adjustments to steer inflation toward its 1-3% target band. A hike boosts capital inflows into CAD assets.",
    derivedVia: "Decided by the Bank of Canada Governing Council by consensus.",
    alsoCalled: "BOC Interest Rate Decision, Target for the Overnight Rate",
    acroExpand: "Bank of Canada (BOC)",
    pairs: ["USDCAD", "CADJPY", "EURCAD", "GBPCAD"],
  },
  budget: {
    source: "HM Treasury (UK Government)",
    measures: "Annual national budget outlining government tax revenues, borrowing targets, and public spending plans.",
    usualEffect:
      "Expansionary spending and fiscal discipline strengthen investor confidence; excessive borrowing or debt raises gilt yields and volatility for GBP.",
    frequency: "Delivered annually (usually in Autumn or Spring);",
    ffNotes:
      "Accompanied by the Office for Budget Responsibility (OBR) economic and fiscal outlook forecasts for UK GDP and public debt.",
    whyTradersCare:
      "Fiscal policy sets the macroeconomic trajectory for the UK economy, impacting Bank of England monetary policy expectations, gilt yields, and sterling valuation.",
    derivedVia: "Chancellor of the Exchequer presents the budget speech to Parliament.",
    alsoCalled: "UK Autumn Statement, Chancellor's Budget, Spring Statement",
    acroExpand: "Office for Budget Responsibility (OBR)",
    pairs: ["GBPUSD", "EURGBP", "GBPJPY", "GBPAUD"],
  },
  cpi: {
    source: "National Statistics Agency (e.g. BLS, ONS, StatCan, ABS)",
    measures: "Change in the price of a basket of goods and services purchased by consumers.",
    usualEffect: "'Actual' greater than 'Forecast' is good for currency (leads to central bank rate hikes);",
    frequency: "Monthly, released ~14 to 20 days after reference month ends;",
    ffNotes:
      "Core CPI (excluding food and energy) is scrutinized more closely by central bankers due to its signal on underlying structural inflation.",
    whyTradersCare:
      "Consumer prices account for the majority of overall inflation. Central banks adjust interest rates primarily to achieve price stability.",
    derivedVia: "Survey of thousands of consumer goods and service prices across representative metro areas.",
    alsoCalled: "Headline CPI, Consumer Price Index, Cost of Living",
    acroExpand: "Consumer Price Index (CPI)",
    pairs: ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD"],
  },
  nfp: {
    source: "U.S. Bureau of Labor Statistics (BLS)",
    measures: "Change in the number of employed people during the previous month, excluding the farming industry.",
    usualEffect: "'Actual' greater than 'Forecast' is good for currency (Bullish USD);",
    frequency: "Monthly, usually on the first Friday after the month ends;",
    ffNotes:
      "Released concurrently with the Unemployment Rate and Average Hourly Earnings, which dictates wage-push inflationary pressure.",
    whyTradersCare:
      "Job creation is the leading indicator of consumer spending, which accounts for approximately 70% of total economic activity.",
    derivedVia: "Establishment survey of ~122,000 businesses and government agencies.",
    alsoCalled: "Non-Farm Payrolls, Employment Situation, Jobs Report",
    acroExpand: "Non-Farm Employment Change (NFP)",
    pairs: ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"],
  },
  oil: {
    source: "U.S. Energy Information Administration (EIA)",
    measures: "Change in the number of barrels of commercial crude oil held by US firms over the past week.",
    usualEffect:
      "'Actual' less than 'Forecast' is good for crude prices (Bullish WTI/Oil, Bullish CAD);",
    frequency: "Weekly, usually on Wednesdays at 10:30 AM EST (8:00 PM IST);",
    ffNotes:
      "Inventories fluctuate seasonally with refinery maintenance runs and driving demand. Draws in stockpiles indicate strong demand or constrained supply.",
    whyTradersCare:
      "Petroleum prices influence headline inflation worldwide. As a net energy exporter, the Canadian Dollar (CAD) correlates heavily with crude prices.",
    derivedVia: "Weekly survey of crude oil producers, refiners, and pipeline companies.",
    alsoCalled: "EIA Crude Oil Storage Report, Petroleum Status Report",
    acroExpand: "Energy Information Administration (EIA)",
    pairs: ["USOIL", "UKOIL", "USDCAD"],
  },
  trade: {
    source: "U.S. Census Bureau / Bureau of Economic Analysis",
    measures: "Difference in value between imported and exported goods and services during the reported month.",
    usualEffect: "'Actual' greater than 'Forecast' is good for currency;",
    frequency: "Monthly, ~35 days after the reference month ends;",
    ffNotes:
      "A surplus indicates foreign buyers are purchasing domestic currency to pay for exports; a deficit indicates outward capital flow.",
    whyTradersCare:
      "Export demand directly reflects industrial competitiveness and foreign exchange demand for the domestic currency.",
    derivedVia: "Compiled from official customs import/export declarations.",
    alsoCalled: "Balance of Trade, Net Exports",
    acroExpand: "International Trade in Goods and Services",
    pairs: ["EURUSD", "USDCAD", "USDJPY"],
  },
};

export function getEventSpecs(ev) {
  if (!ev) return null;
  const title = (ev.title || "").toLowerCase();
  const country = (ev.country || "USD").toUpperCase();

  let spec = null;
  if (title.includes("fomc") || title.includes("federal funds") || title.includes("fed rate")) {
    spec = SPECS_DATABASE.fomc;
  } else if (title.includes("boc") || title.includes("overnight rate")) {
    spec = SPECS_DATABASE.boc;
  } else if (title.includes("budget") || title.includes("autumn forecast") || title.includes("autumn statement")) {
    spec = SPECS_DATABASE.budget;
  } else if (title.includes("cpi") || title.includes("inflation")) {
    spec = SPECS_DATABASE.cpi;
  } else if (title.includes("payroll") || title.includes("nfp") || title.includes("employment")) {
    spec = SPECS_DATABASE.nfp;
  } else if (title.includes("crude") || title.includes("oil")) {
    spec = SPECS_DATABASE.oil;
  } else if (title.includes("trade balance") || title.includes("goods trade")) {
    spec = SPECS_DATABASE.trade;
  }

  // Dynamic fallback for any other release
  if (!spec) {
    spec = {
      source: `${country} Central Bank or National Statistics Bureau`,
      measures: `Measures key macroeconomic developments and ${country} economic activity related to ${ev.title}.`,
      usualEffect: "'Actual' greater than 'Forecast' is generally favorable (bullish) for " + country + ";",
      frequency: "Scheduled periodically (Monthly or Quarterly);",
      ffNotes:
        "High-impact releases introduce rapid spread widening and liquidity gaps. Institutional algorithms adjust positions within seconds of release.",
      whyTradersCare: `Traders evaluate ${ev.title} to gauge whether economic fundamentals warrant shifts in ${country} monetary policy.`,
      derivedVia: `Official government or statistical reporting agency survey in ${country}.`,
      alsoCalled: ev.title,
      acroExpand: `${country} Economic Indicator`,
      pairs: [country + "USD", "EUR" + country, country + "JPY"],
    };
  }

  return {
    ...spec,
    eventTitle: ev.title,
    country,
    impact: ev.impact || "Low",
    actual: ev.actual || "Pending",
    forecast: ev.forecast || "-",
    previous: ev.previous || "-",
  };
}
