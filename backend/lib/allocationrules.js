// lib/allocationRules.js

function getSuggestedAllocation(age, risk) {

  // Conservative
  if (risk === "low") {

    if (age < 40) {
      return [
        { label: "Equity", pct: 70 },
        { label: "Debt", pct: 20 },
        { label: "Commodity", pct: 10 },
      ]
    }

    if (age < 60) {
      return [
        { label: "Equity", pct: 60 },
        { label: "Debt", pct: 30 },
        { label: "Commodity", pct: 10 },
      ]
    }

    return [
      { label: "Equity", pct: 40 },
      { label: "Debt", pct: 50 },
      { label: "Commodity", pct: 10 },
    ]
  }

  // Moderate
  if (risk === "medium") {

    if (age < 40) {
      return [
        { label: "Equity", pct: 80 },
        { label: "Debt", pct: 10 },
        { label: "Commodity", pct: 10 },
      ]
    }

    if (age < 60) {
      return [
        { label: "Equity", pct: 70 },
        { label: "Debt", pct: 20 },
        { label: "Commodity", pct: 10 },
      ]
    }

    return [
      { label: "Equity", pct: 50 },
      { label: "Debt", pct: 40 },
      { label: "Commodity", pct: 10 },
    ]
  }

  // Aggressive
  if (age < 40) {
    return [
      { label: "Equity", pct: 90 },
      { label: "Debt", pct: 0 },
      { label: "Commodity", pct: 10 },
    ]
  }

  if (age < 60) {
    return [
      { label: "Equity", pct: 80 },
      { label: "Debt", pct: 10 },
      { label: "Commodity", pct: 10 },
    ]
  }

  return [
    { label: "Equity", pct: 60 },
    { label: "Debt", pct: 30 },
    { label: "Commodity", pct: 10 },
  ]
}

function getCurrentAllocation(investments) {

  const totals = {
    Equity: 0,
    Debt: 0,
    Commodity: 0,
  }

  for (const inv of investments) {

    switch (inv.type) {

      case "stock":
      case "mf":
      case "etf":
      case "crypto":
        totals.Equity += Number(inv.amount)
        break

      case "fd":
      case "bond":
        totals.Debt += Number(inv.amount)
        break

      case "commodity":
        totals.Commodity += Number(inv.amount)
        break
    }
  }

  const total =
    totals.Equity +
    totals.Debt +
    totals.Commodity

  if (total === 0) {
    return {
      Equity: 0,
      Debt: 0,
      Commodity: 0,
    }
  }

  return {
    Equity: Math.round((totals.Equity * 100) / total),
    Debt: Math.round((totals.Debt * 100) / total),
    Commodity: Math.round((totals.Commodity * 100) / total),
  }
}

module.exports = {
  getSuggestedAllocation,
  getCurrentAllocation,
}