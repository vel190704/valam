import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Resend } from 'resend'

dotenv.config();
dotenv.config({ path: "../frontend/.env.local" });

const resend = new Resend(
  process.env.RESEND_API_KEY
)
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

// ── Constants ─────────────────────────────────────────────────────────────────
const VALID_GOALS = [
  "wealth", "retirement", "emergency",
  "home", "education", "business"
];

const VALID_INVESTMENT_TYPES = [
  "mf", "stock", "fd", "crypto", "bond", "etf", "realestate"
];

const VALID_INCOME_CATEGORIES = [
  "salary", "freelance", "business",
  "rental", "interest", "dividend", "other"
];

const VALID_NETWORTH_CATEGORIES = [
  "cash", "emergency", "property", "vehicle", "other_asset",
  "debt", "emi", "other_liability"
];

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
    savings_score:        body.breakdown?.savingsScore     ?? null,
    investments_score:    body.breakdown?.investmentsScore ?? null,
    income_score:         body.breakdown?.incomeScore      ?? null,
    experience_score:     body.breakdown?.experienceScore  ?? null,
    age_score:            body.breakdown?.ageScore         ?? null,
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

  return res.json({
    profile:       mapProfile(profile),
    investments:   invResult.data  ?? [],
    networthItems: nwResult.data   ?? [],
    incomeEntries: incResult.data  ?? [],
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
  const { date, type, amount, note } = req.body;

  if (!date || !type || amount == null) {
    return res.status(400).json({ error: "Missing required fields: date, type, amount" });
  }

  if (!VALID_INVESTMENT_TYPES.includes(type)) {
    return res.status(400).json({
      error: `Invalid type. Must be one of: ${VALID_INVESTMENT_TYPES.join(", ")}`
    });
  }

  const { data, error } = await supabaseAdmin
    .from("investments")
    .insert({
      user_id: req.user.id,
      date,
      type,
      amount: Number(amount),
      note: note ?? null,
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
  const { date, source, category, amount, note } = req.body;

  if (!date || !source || !category || amount == null) {
    return res.status(400).json({
      error: "Missing required fields: date, source, category, amount"
    });
  }

  if (!VALID_INCOME_CATEGORIES.includes(category)) {
    return res.status(400).json({
      error: `Invalid category. Must be one of: ${VALID_INCOME_CATEGORIES.join(", ")}`
    });
  }

  const { data, error } = await supabaseAdmin
    .from("income_entries")
    .insert({
      user_id: req.user.id,
      date,
      source,
      category,
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

// CONTACT US EMAIL API
app.post('/contact',async (req,res)=>{
    try{
      const {
        name,
        email,
        message
      } = req.body
      await resend.emails.send({
        from:
          'VALAM <onboarding@resend.dev>',
        to:
          'valamhq@gmail.com',
        subject:
          `Contact Form from ${name}`,
        html:`
          <h2>
            VALAM Contact Form
          </h2>
          <p>
            <b>Name:</b>
            ${name}
          </p>
          <p>
            <b>Email:</b>
            ${email}
          </p>
          <p>
            <b>Message:</b>
          </p>
          <p>
            ${message}
          </p>
        `
      })
      res.json({
        success:true
      })
    }
    catch(err){
      console.error(err)
      res
      .status(500)
      .json({
        error:
          'Failed to send email'
      })
    }
})
// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 5000;
app.listen(PORT, () => {
  console.log(`✅ VALAM backend running on port ${PORT}`);
});
