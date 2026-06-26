import { createClient } from "@supabase/supabase-js";

function evaluateEmergencyFund(context) {
const target = context.monthlyIncome * 3
const progress =
    target === 0
        ? 100
        : Math.min(
            100,
            Math.round((context.cashHoldings / target) * 100)
        )
        if (context.cashHoldings >= target) {
    return null
}
return {
    priority: 1,

    task_code: "EMERGENCY_FUND",

    title: "Build a 3 Month Emergency Fund",

    description: `Save ₹${target - context.cashHoldings} more`,

    progress,

    completed: false,
}
}

function evaluateActiveInvesting(context) {

    if (context.totalInvestments === 0) {
        return {
            priority: 2,
            task_code: "FIRST_INVESTMENT",
            title: "Make Your First Investment",
            description: "Start your investment journey by making your first investment.",
            progress: 0,
            completed: false,
        }
    }

    if ((context.sipPlans?.length ?? 0) === 0) {
        return {
            priority: 2,
            task_code: "START_SIP",
            title: "Start a Monthly SIP",
            description: "Create a recurring SIP to build investing discipline.",
            progress: 0,
            completed: false,
        }
    }

    return null
}



function evaluateSavingsRate(context) {

    // No income recorded last month
    if (context.monthlyIncome <= 0) {
        return {
            priority: 3,
            task_code: "ADD_INCOME",
            title: "Add Your Monthly Income",
            description: "Record last month's income to calculate your savings rate.",
            progress: 0,
            completed: false,
        }
    }

    const savingsRate =
        (context.monthlyInvestments / context.monthlyIncome) * 100

    let target = 0

    if (savingsRate < 10)
        target = 10
    else if (savingsRate < 20)
        target = 20
    else if (savingsRate < 30)
        target = 30
    else if (savingsRate < 40)
        target = 40
    else
        return null

    const progress = Math.min(
        100,
        Math.round((savingsRate / target) * 100)
    )

    return {
        priority: 3,
        task_code: `SAVE_${target}`,
        title: `Increase Savings Rate to ${target}%`,
        description: `Last month: ${savingsRate.toFixed(1)}% • Target: ${target}%`,
        progress,
        completed: false,
    }
}

export async function updateTasks(userId) {
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
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

// Admin client — uses service role key for all DB operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

     const { data: profile } =
        await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single()

    const { data: investments } =
        await supabaseAdmin
        .from("investments")
        .select("*")
        .eq("user_id", userId)
        const totalInvestments =
  (investments ?? []).reduce(
    (sum, inv) => sum + Number(inv.amount),
    0
  )

 const now = new Date()

const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

const prevMonth = previousMonth.getMonth()
const prevYear = previousMonth.getFullYear()
const monthlyInvestments = investments
  .filter(inv => {
    const d = new Date(inv.date)
    return (
      d.getMonth() === prevMonth &&
      d.getFullYear() === prevYear
    )
  })
  .reduce((sum, inv) => sum + Number(inv.amount), 0)

    const { data: networthItems } =
        await supabaseAdmin
        .from("networth_items")
        .select("*")
        .eq("user_id", userId)
        const totalAssets = networthItems
  .filter(item =>
    ['cash', 'emergency', 'property', 'vehicle', 'other_asset']
      .includes(item.category)
  )
  .reduce((sum, item) => sum + Number(item.amount), 0)

const totalLiabilities = networthItems
  .filter(item =>
    ['debt', 'emi', 'vehicle_loan', 'other_liability']
      .includes(item.category)
  )
  .reduce((sum, item) => sum + Number(item.amount), 0)

const netWorth = totalAssets - totalLiabilities
const cashHoldings = networthItems
  .filter(item =>
    item.category === 'cash' ||
    item.category === 'emergency'
  )
  .reduce((sum, item) => sum + Number(item.amount), 0)

    const { data: sipPlans } =
        await supabaseAdmin
        .from("sip_plans")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")

    const{data:incomeEntries} =
         await supabaseAdmin
         .from("income_entries")
         .select('*')
         .eq('user_id',userId)  
         const monthlyIncome = incomeEntries
  .filter(entry => {
    const d = new Date(entry.date)
    return (
      d.getMonth() === prevMonth &&
      d.getFullYear() === prevYear
    )
  })
  .reduce((sum, entry) => sum + Number(entry.amount), 0)


//Context for every evaluator
const context = {
  profile,
  investments: investments ?? [],
  networthItems: networthItems ?? [],
  incomeEntries: incomeEntries ?? [],
  sipPlans: sipPlans ?? [],
  monthlyIncome,
  monthlyInvestments,
  cashHoldings,
  totalAssets,
  totalLiabilities,
  netWorth,
  totalInvestments,
}

//console.log(context)
const tasks = []

const emergencyTask =
    evaluateEmergencyFund(context)

if (emergencyTask)
    tasks.push(emergencyTask)

const investingTask =
    evaluateActiveInvesting(context)

if (investingTask)
    tasks.push(investingTask)

const savingsTask =
    evaluateSavingsRate(context)

if (savingsTask)
    tasks.push(savingsTask)

//console.log(tasks)
await supabaseAdmin
  .from("user_tasks")
  .delete()
  .eq("user_id", userId)

  if (tasks.length > 0) {
  const rows = tasks.map(task => ({
    user_id: userId,
    priority: task.priority,
    task_code: task.task_code,
    title: task.title,
    description: task.description,
    progress: task.progress,
    completed: task.completed,
  }))

  const { error } = await supabaseAdmin
    .from("user_tasks")
    .insert(rows)

  if (error) {
    console.error("Failed to save tasks:", error)
  }
}
}
