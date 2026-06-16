import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();
dotenv.config({ path: "../frontend/.env" });

const app = express();
app.use(cors({ origin:[process.env.FRONTEND_ORIGIN,"http://localhost:3000","http://192.168.29.174:3000"] }));
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.warn("Missing Supabase env vars. Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.");
}

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const VALID_GOALS = ["wealth", "retirement", "emergency", "home", "education", "business"];

function getRecommendation(level, goal) {
  const goalLabel = goal === "retirement"
    ? "retirement"
    : goal === "emergency"
      ? "emergency fund"
      : goal === "business"
        ? "business capital"
        : goal === "education"
          ? "education fund"
          : goal === "home"
            ? "home fund"
            : "wealth";

  return {
    headline: `Build your ${goalLabel} plan from Level ${level}`,
    summary: "Your dashboard is based on your current VALAM level, savings habits, investment base, and goal. Keep the next steps simple and consistent.",
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

function mapProfile(row) {
  const goal = VALID_GOALS.includes(row.goal) ? row.goal : "wealth";
  const valamLevel = row.valam_level ?? 1;

  return {
    id: row.id,
    name: row.name ?? "",
    age: row.age ?? 0,
    income: row.income ?? "",
    savingsRate: row.savings_rate ?? "",
    investments: row.investments ?? "",
    experience: row.experience ?? "",
    goal,
    valamScore: row.valam_score ?? 0,
    valamLevel,
    valamLevelName: row.valam_level_name ?? "",
    onboarded: row.onboarded ?? false,
    breakdown: {
      savingsScore: row.savings_score ?? 0,
      investmentsScore: row.investments_score ?? 0,
      incomeScore: row.income_score ?? 0,
      experienceScore: row.experience_score ?? 0,
      ageScore: row.age_score ?? 0,
    },
    createdAt: row.created_at,
    recommendation: getRecommendation(valamLevel, goal),
  };
}

function assessmentToProfile(userId, body, onboarded) {
  return {
    id: userId,
    name: body.name,
    age: body.age,
    income: body.income,
    savings_rate: body.savingsRate,
    investments: body.investments,
    experience: body.experience,
    goal: body.goal ?? "wealth",
    valam_score: body.valamScore,
    valam_level: body.valamLevel,
    valam_level_name: body.valamLevelName,
    savings_score: body.breakdown?.savingsScore,
    investments_score: body.breakdown?.investmentsScore,
    income_score: body.breakdown?.incomeScore,
    experience_score: body.breakdown?.experienceScore,
    age_score: body.breakdown?.ageScore,
    onboarded,
  };
}

async function requireUser(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Invalid authorization token" });
  }

  req.user = user;
  return next();
}

app.get("/", (_req, res) => {
  res.send("Backend is up and running");
});

app.post("/auth/signup", async (req, res) => {
  const { email, password, name, age, assessment } = req.body;

  if (!email || !password || !name || !age) {
    return res.status(400).json({ error: "Missing required signup fields" });
  }

  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: {
      data: { name, age },
    },
  });

  if (error || !data.user) {
    return res.status(400).json({ error: error?.message ?? "Failed to sign up" });
  }

  const profilePayload = assessment
    ? assessmentToProfile(data.user.id, { ...assessment, name, age }, true)
    : { id: data.user.id, name, age, onboarded: false };

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(profilePayload, { onConflict: "id" });

  if (profileError) {
    return res.status(500).json({ error: "Account created, but profile could not be saved" });
  }

  return res.status(201).json({
    userId: data.user.id,
    message: "Account created. Please verify your email before logging in.",
  });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }

  const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });

  if (error || !data.session || !data.user) {
    return res.status(401).json({ error: error?.message ?? "Login failed" });
  }

  return res.json({
    accessToken: data.session.access_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name ?? "",
      age: Number(data.user.user_metadata?.age ?? 0),
    },
  });
});

app.get("/auth/me", requireUser, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.user_metadata?.name ?? "",
      age: Number(req.user.user_metadata?.age ?? 0),
    },
  });
});

app.get("/profile", requireUser, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", req.user.id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return res.status(404).json({ error: "Profile not found" });
    }
    return res.status(500).json({ error: "Failed to fetch profile" });
  }

  return res.json({ profile: mapProfile(data) });
});

app.post("/profile/ensure", requireUser, async (req, res) => {
  const name = req.body.name ?? req.user.user_metadata?.name ?? "";
  const age = Number(req.body.age ?? req.user.user_metadata?.age ?? 0);

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .upsert({ id: req.user.id, name, age }, { onConflict: "id" })
    .select("id")
    .single();

  if (error) {
    return res.status(500).json({ error: "Failed to create profile" });
  }

  return res.json({ profileId: data.id });
});

app.post("/profile/save-assessment", requireUser, async (req, res) => {
  const body = req.body;
  const required = ["name", "age", "income", "savingsRate", "investments", "experience", "valamScore", "valamLevel", "valamLevelName"];

  for (const field of required) {
    if (body[field] === undefined || body[field] === null) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .upsert(assessmentToProfile(req.user.id, body, true), { onConflict: "id" })
    .select("id")
    .single();

  if (error) {
    return res.status(500).json({ error: "Failed to save profile" });
  }

  return res.status(201).json({ profileId: data.id });
});

app.get("/recommendations", (req, res) => {
  const level = parseInt(req.query.level, 10);
  const goal = String(req.query.goal ?? "wealth");

  if (Number.isNaN(level) || level < 1 || level > 8) {
    return res.status(400).json({ error: "Invalid level: must be 1-8" });
  }

  if (!VALID_GOALS.includes(goal)) {
    return res.status(400).json({ error: "Invalid goal" });
  }

  return res.json({ recommendation: getRecommendation(level, goal) });
});

const PORT = process.env.PORT ?? 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
