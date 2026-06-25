import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { calculateLiveSavingsRate, calculateMonthlySavingsRate } from "./lib/savingsRate.js";
import { calculateVALAM } from "./lib/valam.js";
import { checkAndUnlockMilestones } from "./lib/milestoneEngine.js";
import { determineNextTask } from "./lib/roadmapEngine.js";
import { generateCoachingExplanation } from "./lib/aiCoach.js";
import { getCachedRoadmap, setCachedRoadmap } from "./lib/roadmapCache.js";
import { getFinancialYearStart } from "./lib/financialYear.js";
import { Resend } from "resend";
import { executeDueSIPs,advanceSipDate } from "./lib/sipCron.js";

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
  "mf", "stock", "fd", "crypto", "bond", "etf"
];

const VALID_MF_TYPES = [
  "largecap",
  "midcap",
  "smallcap",
  "nifty50",
  "flexicap",
  "international",
  "debt",
  "commodity"
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

  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Invalid authorization token" });
  }

  req.user  = user;
  req.token = token;
  return next();
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
 // console.log(computedNetWorth)
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
      investments:     profile.totalinvestments,
      experience:      profile.experience,
      netWorth:        computedNetWorth,
      emergencyFund:   profile.emergency_fund    ?? null,
      highInterestDebt: profile.high_interest_debt ?? null,
      healthInsurance: profile.health_insurance  ?? null,
    });

    calculatedScore = fresh.positionScore;
   // console.log(calculatedScore)
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

app.post('/profile/inv', requireUser, async (req, res) => {
  try {
    const { totalinvestments } = req.body

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        totalinvestments,
      })
      .eq('user_id', req.user.id)

    if (error) {
      console.error(error)
      return res.status(500).json({ error: 'Failed to update investments' })
    }

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

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
  const { date, type, amount,mfType, note } = req.body;

  if (!type || amount == null) {
    return res.status(400).json({ error: "Missing required fields: type, amount" });
  }

  if (!VALID_INVESTMENT_TYPES.includes(type)) {
    return res.status(400).json({
      error: `Invalid type. Must be one of: ${VALID_INVESTMENT_TYPES.join(", ")}`
    });
  }
  if (
  type === "mf" &&
  (!mfType ||
   !VALID_MF_TYPES.includes(mfType))
) {
  return res.status(400).json({
    error:
      `Invalid mfType. Must be one of: ${VALID_MF_TYPES.join(", ")}`
  })
}

  const { data, error } = await supabaseAdmin
    .from("investments")
    .insert({
      user_id: req.user.id,
      date: date ?? null,
      type,
      mfType: type === "mf"  ?  mfType  :null,
      amount: Number(amount),
      note: note ?? null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Fire-and-forget milestone checks (investment affects investment, savings rate, and net worth)
  void checkAndUnlockMilestones(supabaseAdmin, req.user.id, 'investment');
  void checkAndUnlockMilestones(supabaseAdmin, req.user.id, 'savings');
  void checkAndUnlockMilestones(supabaseAdmin, req.user.id, 'networth');

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

    // Fire-and-forget milestone check
    void checkAndUnlockMilestones(supabaseAdmin, req.user.id, 'networth');

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

  // Fire-and-forget milestone checks (new income affects income total and savings rate denominator)
  void checkAndUnlockMilestones(supabaseAdmin, req.user.id, 'income');
  void checkAndUnlockMilestones(supabaseAdmin, req.user.id, 'savings');

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

  const { data: unlocked } = await supabaseAdmin
    .from('user_milestones')
    .select('milestone_id, unlocked_at')
    .eq('user_id', req.user.id);

  const unlockedMap = new Map((unlocked ?? []).map(u => [u.milestone_id, u.unlocked_at]));
  const result = (all ?? []).map(m => ({
    ...m,
    unlocked:    unlockedMap.has(m.id),
    unlocked_at: unlockedMap.get(m.id) ?? null,
  }));

  res.json({ milestones: result, unlockedCount: unlocked?.length ?? 0 });
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
    const annualisedIncomeR = (totalIncomeFYR / monthsElapsedR) * 12;

    const liveSavingsKeyR = totalIncomeFYR > 0
      ? rateToSavingsKey(liveSavingsRateR)
      : (profileRow.savings_rate ?? '<2');
    const liveIncomeKeyR = totalIncomeFYR > 0
      ? amountToIncomeKey(annualisedIncomeR)
      : (profileRow.income ?? '<3L');

    // Compute fresh factor scores from live savings/income + stored profile fields
    let freshFactorScores = null;
    if (profileRow.investments && profileRow.experience && profileRow.age) {
      const fresh = calculateVALAM({
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

    // learningLevel: experienceScore / 2 → beginner=2→1, learning=4→2, intermediate=6→3, advanced=8→4
    const learningLevel = Math.max(1, Math.min(4, profile.breakdown.experienceScore / 2));

    // 2. Check cache
    const cached = await getCachedRoadmap(supabaseAdmin, req.user.id);

    // 3. Cache hit: score unchanged → return cached explanation, skip Groq entirely
    //    Still call determineNextTask() (cheap deterministic math) to reconstruct
    //    the full task/progress object for the response.
    if (cached && cached.scoreSnapshot === profile.valamScore) {
      const roadmapResult = determineNextTask(profile, learningLevel, freshFactorScores);
      return res.json({
        task:        roadmapResult,
        tasks:       roadmapResult.tasks,
        explanation: cached.explanation,
        source:      "cache",
      });
    }

    // 4. Cache miss: score changed or first visit — call full pipeline
    const roadmapResult = determineNextTask(profile, learningLevel, freshFactorScores);

    const firstName = (profile.name ?? "").split(" ")[0].trim() || "";
    const { explanation, source } = await generateCoachingExplanation(groq, roadmapResult, firstName);

    // Persist the new cache entry (await so it's ready for the immediate next request)
    try {
      await setCachedRoadmap(
        supabaseAdmin,
        req.user.id,
        explanation,
        roadmapResult.task.taskType,
        profile.valamScore,
      );
    } catch (cacheErr) {
      console.error("[GET /roadmap] Cache write failed (non-fatal):", cacheErr.message);
    }

    return res.json({
      task:        roadmapResult,
      tasks:       roadmapResult.tasks,
      explanation,
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
      return res.status(503).json({ error: 'Email not configured' })
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

// GET /sips — list all active/paused SIPs for the logged-in user
app.get('/sips', requireUser, async (req, res) => {
const userId = req.user.id

const { data: sips, error } = await supabaseAdmin
.from('sip_plans')
.select('*')
.eq('user_id', userId)
.neq('status', 'cancelled')
.order('created_at', { ascending: false })

if (error) return res.status(500).json({ error: error.message })

// Attach history count to each SIP
const sipsWithCount = await Promise.all(
(sips ?? []).map(async sip => {
const { count } = await supabaseAdmin
.from('investments')
.select('*', { count: 'exact', head: true })
.eq('sip_id', sip.id)
return { ...sip, history_count: count ?? 0 }
})
)

res.json({ sips: sipsWithCount })
})

// POST /sips — create a new SIP plan
app.post('/sips', requireUser, async (req, res) => {
  console.log('req reciueved')
const userId = req.user.id
const { investment_type, mf_type, amount,
frequency, start_date, note } = req.body
console.log(investment_type, mf_type,amount,frequency,start_date,note)
// Validation
if (!investment_type || !amount || !frequency || !start_date)
return res.status(400).json({ error: 'Missing required fields' })
if (investment_type === 'mf' && !mf_type)
return res.status(400).json({
error: 'mf_type is required for Mutual Fund SIPs'
})

const today = new Date().toISOString().split('T')[0]

// Insert the SIP plan
const { data: sip, error } = await supabaseAdmin
.from('sip_plans')
.insert({
user_id: userId,
investment_type,
mf_type: investment_type === 'mf' ? mf_type : null,
amount,
frequency,
start_date,
next_execution_date: start_date,
note: note ?? null,
})
.select()
.single()

if (error) return res.status(500).json({ error: error.message })

let next_execution_date = start_date

// If start_date is today or in the past, execute immediately
if (start_date <= today) {
await supabaseAdmin.from('investments').insert({
user_id: userId,
date: start_date,
type: investment_type,
mf_type: investment_type === 'mf' ? mf_type : null,
amount,
note: note ? `[SIP] ${note}`
: `[SIP] Auto-logged ${frequency} SIP`,
sip_id: sip.id,
})

// Advance to next cycle
next_execution_date = advanceSipDate(
start_date, frequency, start_date
)
await supabaseAdmin
.from('sip_plans')
.update({ next_execution_date })
.eq('id', sip.id)
}

res.status(201).json({
sip: { ...sip, next_execution_date }
})
})

// PATCH /sips/:id — edit amount, note, or pause/resume/cancel
app.patch('/sips/:id', requireUser, async (req, res) => {
const userId = req.user.id
const { id } = req.params
const { amount, note, status } = req.body

const updates = { updated_at: new Date().toISOString() }
if (amount !== undefined) updates.amount = amount
if (note !== undefined) updates.note = note

if (status !== undefined) {
updates.status = status

// When resuming: recalculate next_execution_date
// WITHOUT backfilling missed cycles
if (status === 'active') {
const { data: sip } = await supabaseAdmin
.from('sip_plans')
.select('*')
.eq('id', id)
.single()

if (sip) {
const today = new Date().toISOString().split('T')[0]
let next = sip.start_date
while (next <= today) {
next = advanceSipDate(next, sip.frequency, sip.start_date)
}
updates.next_execution_date = next
}
}
}

const { data, error } = await supabaseAdmin
.from('sip_plans')
.update(updates)
.eq('id', id)
.eq('user_id', userId)
.select()
.single()

if (error) return res.status(500).json({ error: error.message })
res.json({ sip: data })
})

// DELETE /sips/:id — soft cancel (history is preserved)
app.delete('/sips/:id', requireUser, async (req, res) => {
const userId = req.user.id
const { id } = req.params

const { error } = await supabaseAdmin
.from('sip_plans')
.update({
status: 'cancelled',
updated_at: new Date().toISOString()
})
.eq('id', id)
.eq('user_id', userId)

if (error) return res.status(500).json({ error: error.message })
res.json({ success: true })
})

// GET /sips/:id/history — investment entries auto-logged by this SIP
app.get('/sips/:id/history', requireUser, async (req, res) => {
const { id } = req.params

const { data, error } = await supabaseAdmin
.from('investments')
.select('*')
.eq('sip_id', id)
.order('date', { ascending: false })
.limit(10)

if (error) return res.status(500).json({ error: error.message })
res.json({ history: data ?? [] })
})


// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 5000;
app.listen(PORT, () => {
  console.log(`✅ VALAM backend running on port ${PORT}`);
});

executeDueSIPs(supabaseAdmin).catch(console.error)
setInterval(() => {
executeDueSIPs(supabaseAdmin).catch(console.error)
}, 24 * 60 * 60 * 1000)
