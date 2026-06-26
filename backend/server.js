import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { calculateLiveSavingsRate, calculateMonthlySavingsRate } from "./lib/savingsRate.js";
import { calculateVALAM } from "./lib/valam.js";
import { evaluateMilestones } from "./lib/milestoneEngine.js";
import { executeDueSIPs } from "./lib/sipCron.js";
import { determineNextTask } from "./lib/roadmapEngine.js";
import { generateCoachingTasks } from "./lib/aiCoach.js";
import { getCachedRoadmap, setCachedRoadmap } from "./lib/roadmapCache.js";
import { getFinancialYearStart } from "./lib/financialYear.js";
import { Resend } from "resend";

dotenv.config();
dotenv.config({ path: ".env.local" });           // loads GROQ_API_KEY from backend/.env.local
dotenv.config({ path: "../frontend/.env.local" });

const app = express();
app.use(cors({
  origin: [
    process.env.FRONTEND_ORIGIN,
    "http://localhost:3000",
    "http://192.168.29.174:3000"
  ]
}));
app.use(express.json());

// ── Supabase clients ──────────────────────────────────────────────────────────
const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.warn(
    "⚠️  Missing Supabase env vars. " +
    "Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY."
  );
}

// Auth client — uses anon key for JWT validation only
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

// Admin client — uses service role key for all DB operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Groq client — initialized once at startup, shared across all /roadmap requests
const groq   = new Groq({ apiKey: process.env.GROQ_API_KEY });
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// ── Constants ─────────────────────────────────────────────────────────────────
const VALID_GOALS = [
  "wealth", "retirement", "emergency",
  "home", "education", "business"
];

const VALID_INVESTMENT_TYPES = [
  "mf", "stock", "fd", "crypto", "bond", "etf", "realestate"
];

const VALID_PORTFOLIO_MF_TYPES = [
  "largecap", "midcap", "smallcap", "nifty50",
  "flexicap", "international", "debt", "commodity"
];

const VALID_INCOME_CATEGORIES = [
  "salary", "freelance", "business",
  "rental", "interest", "dividend", "other"
];

const VALID_NETWORTH_CATEGORIES = [
  "cash", "emergency", "property", "vehicle", "vehicle_loan", "other_asset",
  "debt", "emi", "other_liability"
];

// ── VALAM key mappers ─────────────────────────────────────────────────────────
function rateToSavingsKey(rate) {
  if (rate >= 40) return '40+'
  if (rate >= 30) return '30-40'
  if (rate >= 20) return '20-30'
  if (rate >= 15) return '15-20'
  if (rate >= 10) return '10-15'
  if (rate >= 5)  return '5-10'
  if (rate >= 2)  return '2-5'
  return '<2'
}

function amountToIncomeKey(annual) {
  if (annual >= 5000000)  return '50L+'
  if (annual >= 3000000)  return '30L-50L'
  if (annual >= 2000000)  return '20L-30L'
  if (annual >= 1200000)  return '12L-20L'
  if (annual >= 800000)   return '8L-12L'
  if (annual >= 500000)   return '5L-8L'
  if (annual >= 300000)   return '3L-5L'
  return '<3L'
}

// ── Context builder helpers ───────────────────────────────────────────────────
function buildAssetBreakdown(nwItems) {
  const result = {}
  const LIABILITY_CATS = new Set(['debt', 'emi', 'other_liability', 'vehicle_loan'])
  for (const item of nwItems ?? []) {
    if (!LIABILITY_CATS.has(item.category)) {
      result[item.category] = (result[item.category] ?? 0) + Number(item.amount)
    }
  }
  return result
}

function buildInvestmentAllocation(investments) {
  const totals = {}
  const grand = investments.reduce((s, r) => s + Number(r.amount), 0)
  for (const inv of investments) {
    totals[inv.type] = (totals[inv.type] ?? 0) + Number(inv.amount)
  }
  const result = {}
  for (const [type, amt] of Object.entries(totals)) {
    result[type] = grand > 0 ? Math.round((amt / grand) * 100) : 0
  }
  return result
}

function getAllocationSuggestion(level) {
  if (level <= 2) return [
    { label: 'Emergency Fund', pct: 50 },
    { label: 'FDs',            pct: 30 },
    { label: 'Mutual Funds',   pct: 20 },
  ]
  if (level <= 4) return [
    { label: 'Mutual Funds',   pct: 40 },
    { label: 'FDs',            pct: 25 },
    { label: 'Stocks',         pct: 20 },
    { label: 'Emergency Fund', pct: 15 },
  ]
  if (level <= 6) return [
    { label: 'Stocks',       pct: 40 },
    { label: 'Mutual Funds', pct: 30 },
    { label: 'Bonds',        pct: 15 },
    { label: 'Gold',         pct: 15 },
  ]
  return [
    { label: 'Stocks',        pct: 35 },
    { label: 'International', pct: 25 },
    { label: 'Alternatives',  pct: 20 },
    { label: 'Bonds',         pct: 20 },
  ]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getRecommendation(level, goal) {
  const goalLabel =
    goal === "retirement"   ? "retirement" :
    goal === "emergency"    ? "emergency fund" :
    goal === "business"     ? "business capital" :
    goal === "education"    ? "education fund" :
    goal === "home"         ? "home fund" :
                              "wealth";

  return {
    headline: `Build your ${goalLabel} plan from Level ${level}`,
    summary:
      "Your dashboard is based on your current VALAM level, savings habits, " +
      "investment base, and goal. Keep the next steps simple and consistent.",
    steps: [
      "Protect your basics first: emergency savings, insurance, and no high-interest debt.",
      "Set one automatic monthly investment that matches your current income and savings rate.",
      "Review your progress every month and increase contributions whenever income grows.",
    ],
    products: ["Index fund SIP", "Liquid fund", "PPF or NPS", "Term insurance"],
    milestone: `Move from Level ${level} to Level ${Math.min(8, level + 1)} with consistent monthly action.`,
    warning: "Do not chase products before your basics and contribution habit are stable.",
  };
}

// BUG FIX 1: was mapping id → should map user_id for all profile queries
// BUG FIX 3: added v3 fields — potential_score, potential_level,
//            potential_level_name, wealth_velocity
function mapProfile(row) {
  const goal   = VALID_GOALS.includes(row.goal) ? row.goal : "wealth";
  const level  = row.valam_level ?? 1;

  return {
    id:               row.id,
    userId:           row.user_id,
    name:             row.name ?? "",
    age:              row.age ?? 0,
    income:           row.income ?? "",
    savingsRate:      row.savings_rate ?? "",
    investments:      row.investments ?? "",
    experience:       row.experience ?? "",
    goal,
    valamScore:       row.valam_score ?? 0,
    valamLevel:       level,
    valamLevelName:   row.valam_level_name ?? "",
    // v3 fields
    potentialScore:      row.potential_score ?? 0,
    potentialLevel:      row.potential_level ?? 0,
    potentialLevelName:  row.potential_level_name ?? "",
    wealthVelocity:      row.wealth_velocity ?? 0,
    onboarded:        row.onboarded ?? false,
    breakdown: {
      savingsScore:     row.savings_score ?? 0,
      investmentsScore: row.investments_score ?? 0,
      incomeScore:      row.income_score ?? 0,
      experienceScore:  row.experience_score ?? 0,
      ageScore:         row.age_score ?? 0,
    },
    createdAt:        row.created_at,
    recommendation:   getRecommendation(level, goal),
  };
}

// BUG FIX 2: onConflict changed from "id" → "user_id"
// BUG FIX 3: added potential_score, potential_level,
//            potential_level_name, wealth_velocity
function assessmentToProfile(userId, body, onboarded) {
  return {
    user_id:              userId,
    name:                 body.name,
    age:                  body.age,
    income:               body.income,
    savings_rate:         body.savingsRate,
    investments:          body.investments,
    experience:           body.experience,
    goal:                 body.goal ?? "wealth",
    valam_score:          body.valamScore,
    valam_level:          body.valamLevel,
    valam_level_name:     body.valamLevelName,
    // v3 potential fields
    potential_score:      body.potentialScore      ?? null,
    potential_level:      body.potentialLevel      ?? null,
    potential_level_name: body.potentialLevelName  ?? null,
    wealth_velocity:      body.wealthVelocity      ?? null,
    savings_score:          body.breakdown?.savingsScore          ?? null,
    investments_score:      body.breakdown?.investmentsScore      ?? null,
    income_score:           body.breakdown?.incomeScore           ?? null,
    experience_score:       body.breakdown?.experienceScore       ?? null,
    age_score:              body.breakdown?.ageScore              ?? null,
    emergency_fund:         body.emergencyFund                    ?? null,
    high_interest_debt:     body.highInterestDebt                 ?? null,
    health_insurance:       body.healthInsurance                  ?? null,
    financial_health_score: body.breakdown?.financialHealthScore  ?? null,
    onboarded,
  };
}

// ── Auth middleware ───────────────────────────────────────────────────────────
async function requireUser(req, res, next) {
  const header = req.headers.authorization;
  const token  = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Auth timeout')), 5000)
  );

  try {
    const { data: { user }, error } = await Promise.race([
      supabaseAuth.auth.getUser(token),
      timeoutPromise,
    ]);
    if (error || !user) {
      return res.status(401).json({ error: "Invalid authorization token" });
    }
    req.user  = user;
    req.token = token;
    return next();
  } catch (err) {
    console.error('[requireUser] auth error:', err.message);
    return res.status(401).json({ error: "Auth timeout — please retry" });
  }
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "VALAM backend is running" });
});

app.get("/health", async (_req, res) => {
  try {
    const { error } = await supabaseAdmin.from("profiles").select("id").limit(1);
    if (error) throw error;
    res.json({ status: "ok", supabase: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", supabase: err.message });
  }
});

// ── Auth routes ───────────────────────────────────────────────────────────────
app.post("/auth/signup", async (req, res) => {
  const { email, password, name, age, assessment } = req.body;

  if (!email || !password || !name || !age) {
    return res.status(400).json({ error: "Missing required signup fields" });
  }

  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: { data: { name, age } },
  });

  if (error || !data.user) {
    return res.status(400).json({ error: error?.message ?? "Failed to sign up" });
  }

  const profilePayload = assessment
    ? assessmentToProfile(data.user.id, { ...assessment, name, age }, true)
    : { user_id: data.user.id, name, age, onboarded: false };

  // BUG FIX 2: onConflict: "user_id" not "id"
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(profilePayload, { onConflict: "user_id" });

  if (profileError) {
    return res.status(500).json({
      error: "Account created but profile could not be saved",
      detail: profileError.message
    });
  }

  return res.status(201).json({
    userId: data.user.id,
    message: "Account created successfully.",
  });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email, password
  });

  if (error || !data.session || !data.user) {
    return res.status(401).json({ error: error?.message ?? "Login failed" });
  }

  return res.json({
    accessToken: data.session.access_token,
    user: {
      id:    data.user.id,
      email: data.user.email,
      name:  data.user.user_metadata?.name ?? "",
      age:   Number(data.user.user_metadata?.age ?? 0),
    },
  });
});

app.get("/auth/me", requireUser, (req, res) => {
  res.json({
    user: {
      id:    req.user.id,
      email: req.user.email,
      name:  req.user.user_metadata?.name ?? "",
      age:   Number(req.user.user_metadata?.age ?? 0),
    },
  });
});

// ── Profile routes ────────────────────────────────────────────────────────────

// BUG FIX 1: was .eq("id", req.user.id) — must be .eq("user_id", req.user.id)
app.get("/profile", requireUser, async (req, res) => {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("user_id", req.user.id)   // ← FIX
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return res.status(404).json({ error: "Profile not found" });
    }
    return res.status(500).json({ error: "Failed to fetch profile" });
  }

  // ── Compute actual net worth from networth_items (for PDF formula) ──────────
  const NW_LIABILITY_CATS = new Set(["debt", "emi", "other_liability", "vehicle_loan"]);
  const nwFetch = await supabaseAdmin
    .from("networth_items")
    .select("category, amount")
    .eq("user_id", req.user.id);
  const totalAssets = (nwFetch.data ?? [])
    .filter(r => !NW_LIABILITY_CATS.has(r.category))
    .reduce((s, r) => s + Number(r.amount), 0);
  const totalLiabilities = (nwFetch.data ?? [])
    .filter(r => NW_LIABILITY_CATS.has(r.category))
    .reduce((s, r) => s + Number(r.amount), 0);
  const computedNetWorth = totalAssets - totalLiabilities;
  // ── Compute live savings rate and income from FY transactions ──────────────
  const fyStart = getFinancialYearStart();
  const fyDate  = new Date(fyStart);
  const nowDate = new Date();
  const monthsElapsed = Math.max(1,
    (nowDate.getFullYear() - fyDate.getFullYear()) * 12 +
    (nowDate.getMonth() - fyDate.getMonth()) + 1
  );
  const [liveInvResult, liveIncResult] = await Promise.all([
    supabaseAdmin.from('investments').select('amount').eq('user_id', req.user.id).gte('date', fyStart),
    supabaseAdmin.from('income_entries').select('amount').eq('user_id', req.user.id).gte('date', fyStart),
  ]);
  const totalInvestedFY    = (liveInvResult.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const totalIncomeFY      = (liveIncResult.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const fyLiveSavingsRate  = totalIncomeFY > 0 ? (totalInvestedFY / totalIncomeFY) * 100 : 0;
  const annualisedIncome   = (totalIncomeFY / Math.max(1, monthsElapsed)) * 12;

  const liveSavingsKey = totalIncomeFY > 0
    ? rateToSavingsKey(fyLiveSavingsRate)
    : (profile.savings_rate ?? '<2');
  const liveIncomeKey = totalIncomeFY > 0
    ? amountToIncomeKey(annualisedIncome)
    : (profile.income ?? '<3L');

  // ── VALAM recalculation + dual-score ratchet ─────────────────────────────
  let scoreStatus      = "stable";
  let calculatedScore  = profile.valam_score ?? 0;
  let currentScore     = profile.current_score ?? profile.valam_score ?? 0;

  if (profile.investments && profile.experience && profile.age) {
    const fresh = calculateVALAM({
      age:             Number(profile.age),
      income:          liveIncomeKey,
      savingsRate:     liveSavingsKey,
      investments:     profile.investments,
      experience:      profile.experience,
      netWorth:        computedNetWorth,
      emergencyFund:   profile.emergency_fund    ?? null,
      highInterestDebt: profile.high_interest_debt ?? null,
      healthInsurance: profile.health_insurance  ?? null,
    });

    calculatedScore = fresh.positionScore;
    const storedCurrent = profile.current_score ?? profile.valam_score ?? 0;

    if (fresh.positionScore > storedCurrent) {
      // Promotion: calculated beats stored high-water mark — ratchet up
      scoreStatus  = "promotion";
      currentScore = fresh.positionScore;
      await supabaseAdmin
        .from("profiles")
        .update({
          calculated_score:       fresh.positionScore,
          current_score:          fresh.positionScore,
          valam_score:            fresh.positionScore,
          valam_level:            fresh.positionLevel,
          valam_level_name:       fresh.positionLevelName,
          financial_health_score: fresh.breakdown.financialHealthScore,
        })
        .eq("user_id", req.user.id);
    } else if (fresh.positionScore < storedCurrent) {
      // Regression: calculated dipped below high-water mark — store calc only
      scoreStatus  = "regression";
      currentScore = storedCurrent;
      await supabaseAdmin
        .from("profiles")
        .update({
          calculated_score:       fresh.positionScore,
          financial_health_score: fresh.breakdown.financialHealthScore,
        })
        .eq("user_id", req.user.id);
    } else {
      // Stable: no change
      scoreStatus  = "stable";
      currentScore = storedCurrent;
      await supabaseAdmin
        .from("profiles")
        .update({
          calculated_score:       fresh.positionScore,
          financial_health_score: fresh.breakdown.financialHealthScore,
        })
        .eq("user_id", req.user.id);
    }
  }

  // Also fetch investments, networth items, and income entries
  const [invResult, nwResult, incResult] = await Promise.all([
    supabaseAdmin
      .from("investments")
      .select("id, date, type, amount, note")
      .eq("user_id", req.user.id)
      .order("date", { ascending: true }),
    supabaseAdmin
      .from("networth_items")
      .select("id, category, label, amount")
      .eq("user_id", req.user.id),
    supabaseAdmin
      .from("income_entries")
      .select("id, date, source, category, amount")
      .eq("user_id", req.user.id)
      .order("date", { ascending: false }),
  ]);

  const liveSavingsRate     = await calculateLiveSavingsRate(supabaseAdmin, req.user.id);
  const monthlySavingsRate  = await calculateMonthlySavingsRate(supabaseAdmin, req.user.id);

  return res.json({
    profile:         mapProfile(profile),
    scoreStatus,
    calculatedScore,
    currentScore,
    investments:     invResult.data  ?? [],
    networthItems:   nwResult.data   ?? [],
    incomeEntries:   incResult.data  ?? [],
    liveSavingsRate,
    monthlySavingsRate,
  });
});

app.post("/profile/ensure", requireUser, async (req, res) => {
  const name = req.body.name ?? req.user.user_metadata?.name ?? "";
  const age  = Number(req.body.age ?? req.user.user_metadata?.age ?? 0);

  // BUG FIX 2: onConflict: "user_id"
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .upsert(
      { user_id: req.user.id, name, age, onboarded: false },
      { onConflict: "user_id" }
    )
    .select("id")
    .single();

  if (error) {
    return res.status(500).json({ error: "Failed to create profile" });
  }

  return res.json({ profileId: data.id });
});

app.post("/profile/save-assessment", requireUser, async (req, res) => {
  const body = req.body;
  const required = [
    "name", "age", "income", "savingsRate", "investments",
    "experience", "valamScore", "valamLevel", "valamLevelName"
  ];

  for (const field of required) {
    if (body[field] === undefined || body[field] === null) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }

  // BUG FIX 2: onConflict: "user_id"
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .upsert(
      assessmentToProfile(req.user.id, body, true),
      { onConflict: "user_id" }
    )
    .select("id")
    .single();

  if (error) {
    return res.status(500).json({
      error: "Failed to save profile",
      detail: error.message
    });
  }

  return res.status(201).json({ profileId: data.id });
});

// ── Recommendations ───────────────────────────────────────────────────────────
app.get("/recommendations", (req, res) => {
  const level = parseInt(req.query.level, 10);
  const goal  = String(req.query.goal ?? "wealth");

  if (Number.isNaN(level) || level < 1 || level > 8) {
    return res.status(400).json({ error: "Invalid level: must be 1–8" });
  }

  if (!VALID_GOALS.includes(goal)) {
    return res.status(400).json({ error: `Invalid goal. Must be one of: ${VALID_GOALS.join(", ")}` });
  }

  return res.json({ recommendation: getRecommendation(level, goal) });
});

// ── Investments ───────────────────────────────────────────────────────────────
app.get("/investments", requireUser, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("investments")
    .select("*")
    .eq("user_id", req.user.id)
    .order("date", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ investments: data ?? [] });
});

app.post("/investments", requireUser, async (req, res) => {
  const { date, type, amount, mfType, note } = req.body;

  if (!type || amount == null) {
    return res.status(400).json({ error: "Missing required fields: type, amount" });
  }

  if (!VALID_INVESTMENT_TYPES.includes(type)) {
    return res.status(400).json({
      error: `Invalid type. Must be one of: ${VALID_INVESTMENT_TYPES.join(", ")}`
    });
  }

  if (type === 'mf' && mfType && !VALID_PORTFOLIO_MF_TYPES.includes(mfType)) {
    return res.status(400).json({
      error: `Invalid mfType. Must be one of: ${VALID_PORTFOLIO_MF_TYPES.join(', ')}`
    });
  }

  const { data, error } = await supabaseAdmin
    .from("investments")
    .insert({
      user_id: req.user.id,
      date:    date ?? null,
      type,
      mf_type: type === 'mf' ? (mfType ?? null) : null,
      amount:  Number(amount),
      note:    note ?? null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(201).json({ investment: data });
});

app.delete("/investments/:id", requireUser, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("investments")
    .delete()
    .eq("id", id)
    .eq("user_id", req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// ── SIP Plans ────────────────────────────────────────────────────────────────

const VALID_MF_TYPES   = ['index','flexicap','midcap','largecap','smallcap','elss','hybrid'];
const VALID_FREQUENCIES = ['monthly','weekly'];
const SIP_INVESTMENT_TYPES = VALID_INVESTMENT_TYPES.filter(t => t !== 'realestate');

/** Advance a date by one SIP frequency cycle (month-end safe for monthly). */
function advanceSipDate(current, frequency, startDate) {
  if (frequency === 'weekly') {
    return new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  // monthly: keep same calendar day as start_date, clamped to month end
  const startDay = new Date(startDate + 'T00:00:00').getDate();
  const next = new Date(current);
  next.setMonth(next.getMonth() + 1);
  const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(startDay, maxDay));
  return next;
}

// 2a. GET /sips — list all SIPs for the authenticated user
app.get("/sips", requireUser, async (req, res) => {
  const { data: sips, error } = await supabaseAdmin
    .from('sip_plans')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Attach history count per SIP
  const withCounts = await Promise.all((sips ?? []).map(async (sip) => {
    const { count } = await supabaseAdmin
      .from('investments')
      .select('id', { count: 'exact', head: true })
      .eq('sip_id', sip.id);
    return { ...sip, history_count: count ?? 0 };
  }));

  res.json({ sips: withCounts });
});

// 2b. POST /sips — create a new SIP plan
app.post("/sips", requireUser, async (req, res) => {
  const { investment_type, mf_type, amount, frequency, start_date, note } = req.body;

  if (!investment_type || !amount || !frequency || !start_date) {
    return res.status(400).json({ error: 'investment_type, amount, frequency, and start_date are required' });
  }
  if (!SIP_INVESTMENT_TYPES.includes(investment_type)) {
    return res.status(400).json({ error: `investment_type must be one of: ${SIP_INVESTMENT_TYPES.join(', ')}` });
  }
  if (investment_type === 'mf' && !VALID_MF_TYPES.includes(mf_type)) {
    return res.status(400).json({ error: `mf_type is required for Mutual Funds and must be one of: ${VALID_MF_TYPES.join(', ')}` });
  }
  if (investment_type !== 'mf' && mf_type) {
    return res.status(400).json({ error: 'mf_type is only valid when investment_type is mf' });
  }
  if (!VALID_FREQUENCIES.includes(frequency)) {
    return res.status(400).json({ error: "frequency must be 'monthly' or 'weekly'" });
  }
  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }

  const today = new Date().toISOString().split('T')[0];
  let nextExecDate = start_date;

  // If start_date is today or past, execute immediately and advance to next cycle
  let immediateInvestment = null;
  if (start_date <= today) {
    const execResult = await supabaseAdmin
      .from('investments')
      .insert({
        user_id: req.user.id,
        date:    start_date,
        type:    investment_type,
        amount:  amt,
        note:    note ? `[SIP] ${note}` : `[SIP] Auto-logged ${frequency} SIP`,
      })
      .select()
      .single();

    if (!execResult.error) {
      immediateInvestment = execResult.data;
      // Advance next_execution_date past today
      let d = new Date(start_date + 'T00:00:00');
      do {
        d = advanceSipDate(d, frequency, start_date);
      } while (d.toISOString().split('T')[0] <= today);
      nextExecDate = d.toISOString().split('T')[0];
    }
  }

  const { data: sip, error } = await supabaseAdmin
    .from('sip_plans')
    .insert({
      user_id:             req.user.id,
      investment_type,
      mf_type:             investment_type === 'mf' ? (mf_type ?? null) : null,
      amount:              amt,
      frequency,
      start_date,
      next_execution_date: nextExecDate,
      note:                note ?? null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Link the immediate investment to the sip if one was created
  if (immediateInvestment) {
    await supabaseAdmin
      .from('investments')
      .update({ sip_id: sip.id })
      .eq('id', immediateInvestment.id);
    immediateInvestment = { ...immediateInvestment, sip_id: sip.id };
  }

  res.status(201).json({ sip, immediateInvestment });
});

// 2c. PATCH /sips/:id — edit amount, note, or status
app.patch("/sips/:id", requireUser, async (req, res) => {
  const { id } = req.params;
  const { amount, note, status } = req.body;

  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from('sip_plans')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .single();

  if (fetchErr || !existing) return res.status(404).json({ error: 'SIP not found' });
  if (existing.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot modify a cancelled SIP' });
  }

  const updates = { updated_at: new Date().toISOString() };

  if (amount !== undefined) {
    const amt = Number(amount);
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'amount must be a positive number' });
    updates.amount = amt;
  }
  if (note !== undefined) updates.note = note;

  if (status !== undefined) {
    if (!['active','paused','cancelled'].includes(status)) {
      return res.status(400).json({ error: "status must be 'active', 'paused', or 'cancelled'" });
    }
    updates.status = status;

    // Resuming from paused: advance next_execution_date past today without backfilling
    if (status === 'active' && existing.status === 'paused') {
      const today = new Date().toISOString().split('T')[0];
      let d = new Date(existing.start_date + 'T00:00:00');
      // Walk forward in steps until we find the next future date
      while (d.toISOString().split('T')[0] <= today) {
        d = advanceSipDate(d, existing.frequency, existing.start_date);
      }
      updates.next_execution_date = d.toISOString().split('T')[0];
    }
  }

  const { data: updated, error } = await supabaseAdmin
    .from('sip_plans')
    .update(updates)
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ sip: updated });
});

// 2d. DELETE /sips/:id — soft-cancel (keeps history)
app.delete("/sips/:id", requireUser, async (req, res) => {
  const { id } = req.params;

  const { data: updated, error } = await supabaseAdmin
    .from('sip_plans')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ sip: updated });
});

// 2e. GET /sips/:id/history — investment entries created by this SIP
app.get("/sips/:id/history", requireUser, async (req, res) => {
  const { id } = req.params;

  // Verify ownership
  const { data: sip, error: sipErr } = await supabaseAdmin
    .from('sip_plans')
    .select('id')
    .eq('id', id)
    .eq('user_id', req.user.id)
    .single();

  if (sipErr || !sip) return res.status(404).json({ error: 'SIP not found' });

  const { data: history, error } = await supabaseAdmin
    .from('investments')
    .select('*')
    .eq('sip_id', id)
    .order('date', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ history: history ?? [] });
});

// ── Net Worth Items ───────────────────────────────────────────────────────────
app.get("/networth", requireUser, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("networth_items")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ items: data ?? [] });
});

app.post("/networth", requireUser, async (req, res) => {
  try {
    const { category, label, amount, note } = req.body;

    if (!category || !label || amount == null) {
      return res.status(400).json({ error: "Missing required fields: category, label, amount" });
    }

    if (!VALID_NETWORTH_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${VALID_NETWORTH_CATEGORIES.join(", ")}`
      });
    }

    const { data, error } = await supabaseAdmin
      .from("networth_items")
      .insert({
        user_id: req.user.id,
        category,
        label,
        amount: Number(amount),
        note: note ?? null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ item: data });
  } catch (err) {
    console.error('POST /networth error:', err)
    return res.status(500).json({ error: 'Internal server error', detail: err.message })
  }
});

app.delete("/networth/:id", requireUser, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("networth_items")
    .delete()
    .eq("id", id)
    .eq("user_id", req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// ── Income Entries ────────────────────────────────────────────────────────────
app.get("/income", requireUser, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("income_entries")
    .select("*")
    .eq("user_id", req.user.id)
    .order("date", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ entries: data ?? [] });
});

app.post("/income", requireUser, async (req, res) => {
  const { date, source, amount, note } = req.body;

  if (!date || !source || amount == null) {
    return res.status(400).json({
      error: "Missing required fields: date, source, amount"
    });
  }

  if (!VALID_INCOME_CATEGORIES.includes(source)) {
    return res.status(400).json({
      error: `Invalid source. Must be one of: ${VALID_INCOME_CATEGORIES.join(", ")}`
    });
  }

  const { data, error } = await supabaseAdmin
    .from("income_entries")
    .insert({
      user_id: req.user.id,
      date,
      source,
      amount: Number(amount),
      note: note ?? null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(201).json({ entry: data });
});

app.delete("/income/:id", requireUser, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from("income_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// ── Milestones ────────────────────────────────────────────────────────────────
app.get("/milestones", requireUser, async (req, res) => {
  const { data: all } = await supabaseAdmin
    .from('milestones')
    .select('*')
    .order('id');

  const evalMap = await evaluateMilestones(supabaseAdmin, req.user.id, all ?? []);

  const result = (all ?? []).map(m => {
    const evaluated = evalMap.get(m.id) ?? { unlocked: false, unlocked_at: null };
    return { ...m, unlocked: evaluated.unlocked, unlocked_at: evaluated.unlocked_at };
  });

  const unlockedCount = result.filter(m => m.unlocked).length;
  res.json({ milestones: result, unlockedCount });
});

// ── Allocation Insights ───────────────────────────────────────────────────────
app.get("/allocation-insights", requireUser, async (req, res) => {
  try {
    const { level, risk, gaps } = req.query;
    if (!level || !risk || !gaps) {
      return res.status(400).json({ error: 'level, risk, and gaps are required' });
    }

    let parsedGaps;
    try {
      parsedGaps = JSON.parse(gaps);
    } catch {
      return res.status(400).json({ error: 'gaps must be valid JSON' });
    }

    const riskLabel = { low: 'Conservative', medium: 'Balanced', high: 'Aggressive' }[risk] ?? risk;

    const { data: profR } = await supabaseAdmin
      .from('profiles').select('age').eq('user_id', req.user.id).single();
    const userAge = profR?.age ?? null;

    const totalAbsGap = parsedGaps.reduce((s, g) => s + Math.abs(Number(g.delta ?? 0)), 0);
    const alignmentScore = Math.max(0, Math.round(100 - totalAbsGap / 2));

    const prompt = `You are VALAM AI, a wealth coach for Indian retail investors following the VALAM framework.
The user is ${userAge ? `${userAge} years old, ` : ''}at VALAM Level ${level} with a ${riskLabel} risk profile.

VALAM ASSET ALLOCATION FRAMEWORK:
- Level 1–3 (Foundation): Emergency fund first, then basic equity exposure via SIP and FDs
- Level 4–5 (Growth): Diversify across equity (index/diversified funds), debt (FD, bonds), and gold (SGBs)
- Level 6–8 (Wealth): Sophisticated allocation — direct equity, international exposure, alongside core SIP

Their current portfolio vs VALAM suggested allocation:
${parsedGaps.map(g => `${g.label}: actual ${g.actualPct}%, suggested ${g.suggestedPct}%, gap ${g.delta > 0 ? '+' : ''}${g.delta}%`).join('\n')}

First line must be exactly: "Alignment Score: ${alignmentScore}%"
Then write 2 concise sentences identifying the 1–2 biggest gaps and what they mean for this user's wealth journey.
End with one concrete action using Indian context (SIP, FD, equity mutual funds as categories — never specific fund names or guaranteed returns).
Plain text only — no markdown, no bullet points.`;

    const response = await groq.chat.completions.create({
      model:      'llama-3.3-70b-versatile',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const insight = (response.choices?.[0]?.message?.content ?? '').trim();
    if (!insight) return res.json({ insight: null });

    res.json({ insight });
  } catch (err) {
    console.error('[GET /allocation-insights] error:', err.message);
    res.json({ insight: null });
  }
});

// ── Roadmap & AI Coaching ─────────────────────────────────────────────────────
app.get("/roadmap", requireUser, async (req, res) => {
  try {
    // 1. Fetch current profile — same query as GET /profile
    const { data: profileRow, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", req.user.id)
      .single();

    if (profileError || !profileRow) {
      console.error("[GET /roadmap] Profile fetch failed:", profileError?.message);
      return res.json({
        task:        null,
        explanation: "Keep building your financial habits — check back soon for personalized guidance.",
        source:      "error",
      });
    }

    const profile       = mapProfile(profileRow);

    // Compute actual net worth for PDF formula
    const NW_LIABILITY_CATS_R = new Set(["debt", "emi", "other_liability", "vehicle_loan"]);
    const nwResultR = await supabaseAdmin
      .from("networth_items")
      .select("category, amount")
      .eq("user_id", req.user.id);
    const totalAssetsR = (nwResultR.data ?? [])
      .filter(r => !NW_LIABILITY_CATS_R.has(r.category))
      .reduce((s, r) => s + Number(r.amount), 0);
    const totalLiabilitiesR = (nwResultR.data ?? [])
      .filter(r => NW_LIABILITY_CATS_R.has(r.category))
      .reduce((s, r) => s + Number(r.amount), 0);
    const roadmapNetWorth = totalAssetsR - totalLiabilitiesR;

    // ── Compute live savings rate and income from FY transactions ──────────
    const fyStartR  = getFinancialYearStart();
    const fyDateR   = new Date(fyStartR);
    const nowDateR  = new Date();
    const monthsElapsedR = Math.max(1,
      (nowDateR.getFullYear() - fyDateR.getFullYear()) * 12 +
      (nowDateR.getMonth() - fyDateR.getMonth()) + 1
    );
    const [liveInvResultR, liveIncResultR] = await Promise.all([
      supabaseAdmin.from('investments').select('amount').eq('user_id', req.user.id).gte('date', fyStartR),
      supabaseAdmin.from('income_entries').select('amount').eq('user_id', req.user.id).gte('date', fyStartR),
    ]);
    const totalInvestedFYR  = (liveInvResultR.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const totalIncomeFYR    = (liveIncResultR.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
    const liveSavingsRateR  = totalIncomeFYR > 0 ? (totalInvestedFYR / totalIncomeFYR) * 100 : 0;
    // monthlyIncomeR: FY total ÷ months elapsed (direct — no annualise+de-annualise roundtrip)
    const monthlyIncomeR    = totalIncomeFYR > 0 ? Math.round(totalIncomeFYR / monthsElapsedR) : 0;
    // annualisedIncomeR is only used for income bracket key (amountToIncomeKey expects yearly figure)
    const annualisedIncomeR = monthlyIncomeR * 12;

    // ── DIAGNOSTIC (temporary) ───────────────────────────────────────────────
    console.log('[roadmap:DIAG] income | user:', req.user.id,
      '| fyStart:', fyStartR,
      '| monthsElapsed:', monthsElapsedR,
      '| totalIncomeFY:', totalIncomeFYR,
      '| annualisedIncome:', annualisedIncomeR,
      '| monthlyIncome:', monthlyIncomeR,
      '| savingsRate:', liveSavingsRateR.toFixed(2) + '%',
    );

    const liveSavingsKeyR = totalIncomeFYR > 0
      ? rateToSavingsKey(liveSavingsRateR)
      : (profileRow.savings_rate ?? '<2');
    const liveIncomeKeyR = totalIncomeFYR > 0
      ? amountToIncomeKey(annualisedIncomeR)
      : (profileRow.income ?? '<3L');

    // Compute fresh factor scores from live savings/income + stored profile fields
    let fresh = null;
    let freshFactorScores = null;
    if (profileRow.investments && profileRow.experience && profileRow.age) {
      fresh = calculateVALAM({
        age:             Number(profileRow.age),
        income:          liveIncomeKeyR,
        savingsRate:     liveSavingsKeyR,
        investments:     profileRow.investments,
        experience:      profileRow.experience,
        netWorth:        roadmapNetWorth,
        emergencyFund:   profileRow.emergency_fund    ?? null,
        highInterestDebt: profileRow.high_interest_debt ?? null,
        healthInsurance: profileRow.health_insurance  ?? null,
      });
      freshFactorScores = {
        nw:              fresh.breakdown.netWorthScore,
        wv:              fresh.breakdown.wealthVelocityScore,
        sav:             fresh.breakdown.savingsScore,
        inc:             fresh.breakdown.incomeScore,
        exp:             fresh.breakdown.experienceScore,
        fh:              fresh.breakdown.financialHealthScore,
        emergencyFund:   profileRow.emergency_fund    ?? null,
        highInterestDebt: profileRow.high_interest_debt ?? null,
        healthInsurance: profileRow.health_insurance  ?? null,
      };
    }

    // ── Fetch full context for VALAM AI ──────────────────────────────────────
    const [invResult, incResult, learningResult, sipResult] = await Promise.all([
      supabaseAdmin.from('investments').select('type, amount, date').eq('user_id', req.user.id),
      supabaseAdmin.from('income_entries').select('source, amount, date').eq('user_id', req.user.id).gte('date', fyStartR),
      supabaseAdmin.from('learning_progress').select('level, topic_order, status').eq('user_id', req.user.id).eq('status', 'completed'),
      supabaseAdmin.from('sip_plans').select('id').eq('user_id', req.user.id).eq('status', 'active').limit(1),
    ]);
    const totalInvestedAll = (invResult.data ?? []).reduce((s, r) => s + Number(r.amount), 0);

    // ── Derived financial health fields ──────────────────────────────────────
    const hasActiveSIP = (sipResult.data ?? []).length > 0;
    const cashAndEmergency = (nwResultR.data ?? [])
      .filter(r => ['cash', 'emergency'].includes(r.category))
      .reduce((s, r) => s + Number(r.amount), 0);
    const emergencyFundTarget = Math.round(monthlyIncomeR * 6);
    const emergencyMonthsCovered = emergencyFundTarget > 0
      ? Math.round((cashAndEmergency / emergencyFundTarget) * 6 * 10) / 10
      : 0;
    const invData = invResult.data ?? [];
    const totalInvSafe = totalInvestedAll || 1;
    const equityAmt = invData.filter(r => ['mf','stock','etf'].includes(r.type)).reduce((s, r) => s + Number(r.amount), 0);
    const debtAmt   = invData.filter(r => ['fd','bond'].includes(r.type)).reduce((s, r) => s + Number(r.amount), 0);
    const goldAmt   = invData.filter(r => ['gold'].includes(r.type)).reduce((s, r) => s + Number(r.amount), 0);
    const equityPct = Math.round(equityAmt / totalInvSafe * 100);
    const debtPct   = Math.round(debtAmt   / totalInvSafe * 100);
    const goldPct   = Math.round(goldAmt   / totalInvSafe * 100);

    const LEVEL_NAMES_SRV = ['Seed','Explorer','Builder','Accelerator','Achiever','Wealth Creator','Wealth Architect','Legend'];
    const currentLevelNum  = fresh?.positionLevel ?? profile.valamLevel ?? 1;
    // PDF-defined lifetime potential: based purely on age, not VALAM weighted score
    const age = Number(profileRow.age ?? 25);
    const agePotentialLevel = age < 40 ? 'Legend' : age <= 70 ? 'Wealth Architect' : 'Wealth Creator';
    const valamContext = {
      userProfile: {
        name:           profile.name,
        age:            profile.age,
        goal:           profile.goal,
        knowledgeLevel: profile.experience,
        currentLevel:   fresh?.positionLevelName  ?? profile.valamLevelName,
        nextLevel:      currentLevelNum < 8 ? LEVEL_NAMES_SRV[currentLevelNum] : null,
        currentScore:   fresh?.positionScore      ?? profile.valamScore,
        potentialLevel: agePotentialLevel,
      },
      financialProfile: {
        netWorth:         roadmapNetWorth,
        totalAssets:      totalAssetsR,
        totalLiabilities: totalLiabilitiesR,
        assetBreakdown:   buildAssetBreakdown(nwResultR.data),
        monthlyIncome:          Math.round(monthlyIncomeR),
        monthlyIncomeFormatted: `₹${(monthlyIncomeR / 100000).toFixed(2)}L`,
        savingsRate:      Math.round(liveSavingsRateR * 10) / 10,
        savingsRateScore: freshFactorScores?.sav ?? 0,
        cashAndEmergency,
        emergencyFundTarget,
        emergencyMonthsCovered,
        hasActiveSIP,
      },
      portfolioProfile: {
        totalInvested:    totalInvestedAll,
        entryCount:       (invResult.data ?? []).length,
        allocationByType: buildInvestmentAllocation(invResult.data ?? []),
        equityPct,
        debtPct,
        goldPct,
      },
      learningProfile: {
        completedTopics:   (learningResult.data ?? []).length,
        completedModules:  (learningResult.data ?? [])
          .map(r => `Level ${r.level} Topic ${r.topic_order}`)
          .slice(0, 10),
      },
      scores: {
        netWorthScore:      freshFactorScores?.nw  ?? 0,
        wealthVelocityScore: freshFactorScores?.wv ?? 0,
        savingsScore:       freshFactorScores?.sav  ?? 0,
        incomeScore:        freshFactorScores?.inc  ?? 0,
        knowledgeScore:     freshFactorScores?.exp  ?? 0,
      },
      suggestedAllocation: getAllocationSuggestion(fresh?.positionLevel ?? profile.valamLevel ?? 3),
    };

    // learningLevel: experienceScore / 2 → beginner=2→1, learning=4→2, intermediate=6→3, advanced=8→4
    const learningLevel = Math.max(1, Math.min(4, profile.breakdown.experienceScore / 2));

    const positionScore   = fresh?.positionScore ?? profile.valamScore;

    // 2. Check cache — composite key: positionScore + totalInvested + savingsRate
    const cached = await getCachedRoadmap(
      supabaseAdmin, req.user.id,
      positionScore, totalInvestedAll, liveSavingsRateR,
    );

    // 3. Cache hit — getCachedRoadmap already validated key match and JSON format
    if (cached) {
      const roadmapResult = determineNextTask(profile, learningLevel, freshFactorScores);
      return res.json({
        task:   roadmapResult,
        tasks:  cached.tasks,
        source: "cache",
      });
    }

    // 4. Cache miss — call Groq for 5 personalised tasks
    const roadmapResult = determineNextTask(profile, learningLevel, freshFactorScores);
    const { tasks: aiTasks, source } = await generateCoachingTasks(groq, valamContext, roadmapResult.tasks);

    try {
      await setCachedRoadmap(
        supabaseAdmin, req.user.id,
        positionScore, totalInvestedAll, liveSavingsRateR,
        aiTasks,
      );
    } catch (cacheErr) {
      console.error("[GET /roadmap] Cache write failed (non-fatal):", cacheErr.message);
    }

    return res.json({
      task:   roadmapResult,
      tasks:  aiTasks,
      source,
    });
  } catch (err) {
    console.error("[GET /roadmap] Unexpected error:", err.message);
    return res.json({
      task:        null,
      explanation: "Keep building your financial habits — check back soon for personalized guidance.",
      source:      "error",
    });
  }
});

// ── Learning Hub ─────────────────────────────────────────────────────────────
const LEVEL_NAMES = ['Seed', 'Explorer', 'Builder', 'Accelerator', 'Achiever', 'Wealth Creator', 'Wealth Architect', 'Legend'];

// IMPORTANT: /learning/recent must be registered BEFORE /learning/:level
// so Express doesn't treat "recent" as a level parameter.
app.get("/learning/recent", requireUser, async (req, res) => {
  try {
    const { data: progress, error } = await supabaseAdmin
      .from("learning_progress")
      .select("level, topic_order, status, last_viewed_at")
      .eq("user_id", req.user.id)
      .order("last_viewed_at", { ascending: false })
      .limit(3);

    if (error) throw error;

    if (!progress || progress.length === 0) {
      return res.json({ recent: [] });
    }

    // Fetch topic names for each recent row
    const enriched = await Promise.all(
      progress.map(async (p) => {
        const { data: content } = await supabaseAdmin
          .from("learning_content")
          .select("topic_name")
          .eq("level", p.level)
          .eq("topic_order", p.topic_order)
          .limit(1)
          .single();

        return {
          level:        p.level,
          levelName:    LEVEL_NAMES[p.level - 1] ?? "",
          topicOrder:   p.topic_order,
          topicName:    content?.topic_name ?? "",
          status:       p.status,
          lastViewedAt: p.last_viewed_at,
        };
      })
    );

    return res.json({ recent: enriched });
  } catch (err) {
    console.error("[GET /learning/recent]", err.message);
    return res.status(500).json({ error: "Failed to fetch recent topics" });
  }
});

app.get("/learning/:level", requireUser, async (req, res) => {
  const levelParam = parseInt(req.params.level, 10);

  if (Number.isNaN(levelParam) || levelParam < 1 || levelParam > 8) {
    return res.status(400).json({ error: "Invalid level: must be 1–8" });
  }

  try {
    // Fetch all sub-concepts for this level
    const { data: content, error: contentErr } = await supabaseAdmin
      .from("learning_content")
      .select("topic_order, topic_name, sub_concept_order, sub_concept_name, explanation, check_question, check_answer")
      .eq("level", levelParam)
      .order("topic_order")
      .order("sub_concept_order");

    if (contentErr) throw contentErr;

    // Fetch user progress for this level
    const { data: progress } = await supabaseAdmin
      .from("learning_progress")
      .select("topic_order, status, last_viewed_at, completed_at")
      .eq("user_id", req.user.id)
      .eq("level", levelParam);

    const progressMap = new Map((progress ?? []).map(p => [p.topic_order, p]));

    // Group by topic
    const topicMap = new Map();
    for (const row of (content ?? [])) {
      if (!topicMap.has(row.topic_order)) {
        topicMap.set(row.topic_order, {
          topicOrder:   row.topic_order,
          topicName:    row.topic_name,
          subConcepts:  [],
          status:       progressMap.get(row.topic_order)?.status       ?? "not_started",
          lastViewedAt: progressMap.get(row.topic_order)?.last_viewed_at ?? null,
          completedAt:  progressMap.get(row.topic_order)?.completed_at   ?? null,
        });
      }
      topicMap.get(row.topic_order).subConcepts.push({
        subConceptOrder: row.sub_concept_order,
        subConceptName:  row.sub_concept_name,
        explanation:     row.explanation,
        checkQuestion:   row.check_question,
        checkAnswer:     row.check_answer,
      });
    }

    const topics = Array.from(topicMap.values());
    const totalTopics    = topics.length;
    const topicsCompleted = topics.filter(t => t.status === "completed").length;

    return res.json({
      level:      levelParam,
      levelName:  LEVEL_NAMES[levelParam - 1] ?? "",
      topics,
      summary: {
        totalTopics,
        topicsCompleted,
        topicsRemaining: totalTopics - topicsCompleted,
      },
    });
  } catch (err) {
    console.error("[GET /learning/:level]", err.message);
    return res.status(500).json({ error: "Failed to fetch learning content" });
  }
});

app.post("/learning/progress", requireUser, async (req, res) => {
  const { level, topicOrder, status } = req.body;

  if (!level || !topicOrder || !status) {
    return res.status(400).json({ error: "Missing required fields: level, topicOrder, status" });
  }

  const VALID_STATUSES = ["not_started", "continue", "completed"];
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` });
  }

  try {
    const update = {
      user_id:        req.user.id,
      level:          Number(level),
      topic_order:    Number(topicOrder),
      status,
      last_viewed_at: new Date().toISOString(),
    };

    if (status === "completed") {
      update.completed_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from("learning_progress")
      .upsert(update, { onConflict: "user_id, level, topic_order" });

    if (error) throw error;

    return res.json({ success: true });
  } catch (err) {
    console.error("[POST /learning/progress]", err.message);
    return res.status(500).json({ error: "Failed to update progress" });
  }
});

// ── Contact form ──────────────────────────────────────────────────────────────
app.post('/contact', async (req, res) => {
  try {
    if (!resend) {
      return res.status(503).json({
        error: 'Email service not configured',
        fallback: 'valamhq@gmail.com',
      })
    }
    const { name, email, message } = req.body
    await resend.emails.send({
      from:    'VALAM <onboarding@resend.dev>',
      to:      'valamhq@gmail.com',
      subject: `Contact Form from ${name}`,
      html: `
        <h2>VALAM Contact Form</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b></p>
        <p>${message}</p>
      `
    })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to send email' })
  }
})

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 5000;
app.listen(PORT, () => {
  console.log(`✅ VALAM backend running on port ${PORT}`);
});

// ── SIP daily cron ────────────────────────────────────────────────────────────
// Run on startup to catch any SIPs missed overnight, then every 24 hours.
executeDueSIPs(supabaseAdmin).catch(console.error);
setInterval(() => {
  executeDueSIPs(supabaseAdmin).catch(console.error);
}, 24 * 60 * 60 * 1000);
