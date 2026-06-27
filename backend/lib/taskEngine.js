import { createClient } from "@supabase/supabase-js";
import { getCurrentAllocation,getSuggestedAllocation } from "./allocationRules.js";

function evaluateEmergencyFund(context) {
const target = context.averageMonthlyIncome * 3
console.log(context.cashHoldings)
console.log('target',target)
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

async function getLearningStatus(userId, supabaseAdmin) {

  const { data: content } = await supabaseAdmin
    .from("learning_content")
    .select("level, topic_order")

  const { data: progress } = await supabaseAdmin
    .from("learning_progress")
    .select("level, topic_order, status")
    .eq("user_id", userId)

  const levelsCompleted = []

  for (let level = 1; level <= 7; level++) {

    const topics =
      [...new Set(
        (content ?? [])
          .filter(c => c.level === level)
          .map(c => c.topic_order)
      )]

    if (topics.length === 0)
      continue

    const complete = topics.every(topic =>
      progress?.some(p =>
        p.level === level &&
        p.topic_order === topic &&
        p.status === "completed"
      )
    )

    if (complete)
      levelsCompleted.push(level)
    else
      break
  }

  const completedLevels = levelsCompleted.length

  let experience = "beginner"

  if (completedLevels >= 4)
    experience = "advanced"

  else if (completedLevels >= 2)
    experience = "intermediate"

  else if (completedLevels >= 1)
    experience = "learning"

  await supabaseAdmin
    .from("profiles")
    .update({ experience })
    .eq("user_id", userId)

  return {
    completedLevels,
    experience,
    nextLevel: completedLevels + 1
  }
}

async function evaluateKnowledge(context, supabaseAdmin) {

  // User has completed all learning levels
  if (context.learning.nextLevel > 7) {
    return null
  }

  // Get the first topic of the next level
  const { data: topic } = await supabaseAdmin
    .from("learning_content")
    .select("topic_name")
    .eq("level", context.learning.nextLevel)
    .order("topic_order", { ascending: true })
    .limit(1)
    .single()

  return {
    priority: 4,

    task_code: `LEARNING_LEVEL_${context.learning.nextLevel}`,

    title: `Complete Learning Level ${context.learning.nextLevel}`,

    description: topic
      ? `Complete "${topic.topic_name}" to progress your financial knowledge.`
      : `Complete Learning Level ${context.learning.nextLevel}.`,

    progress: 0,

    completed: false,
  }
}

function evaluateDiversification(context) {

    const target = getSuggestedAllocation(
        context.profile.age,
        context.profile.risk_level
    )

    const actual = getCurrentAllocation(
        context.investments
    )

    const tasks = []

    for (const asset of target) {

        const currentPct = actual[asset.label] ?? 0
        const difference = currentPct - asset.pct

        // Within ±10% → balanced
        if (Math.abs(difference) <= 10)
            continue

        if (difference < 0) {

            tasks.push({

                priority: 5,

                task_code: `ADD_${asset.label.toUpperCase()}`,

                title: `Increase ${asset.label} Allocation`,

                description:
                    `Current ${currentPct}% • Recommended ${asset.pct}%`,

                progress: Math.min(
                    100,
                    Math.round((currentPct / asset.pct) * 100)
                ),

                completed: false,
            })

        } else {

            tasks.push({

                priority: 5,

                task_code: `REDUCE_${asset.label.toUpperCase()}`,

                title: `Reduce ${asset.label} Allocation`,

                description:
                    `Current ${currentPct}% • Recommended ${asset.pct}%`,

                progress: 100,

                completed: false,
            })

        }
    }

    return tasks
}

function evaluateNetWorth(context) {

    const netWorth = context.networthItems + context.totalInvestments

    const milestones = [
        50_000,
        1_00_000,
        5_00_000,
        10_00_000,
        25_00_000,
        50_00_000,
        1_00_00_000,
    ]

    const labels = {
        50000: "₹50K",
        100000: "₹1L",
        500000: "₹5L",
        1000000: "₹10L",
        2500000: "₹25L",
        5000000: "₹50L",
        10000000: "₹1Cr",
    }

    // Already reached ₹1Cr
    if (netWorth >= 1_00_00_000)
        return null

    for (const target of milestones) {

        if (netWorth < target) {

            const progress = Math.min(
                100,
                Math.round((netWorth / target) * 100)
            )

            return {

                priority: 6,

                task_code: `NETWORTH_${target}`,

                title: `Reach ${labels[target]} Net Worth`,

                description:
                    `Current ₹${netWorth.toLocaleString()} • Target ${labels[target]}`,

                progress,

                completed: false,
            }
        }
    }

    return null
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
       const totalIncome = (incomeEntries ?? []).reduce(
  (sum, entry) => sum + Number(entry.amount),
  0
)

const uniqueMonths = new Set(
  (incomeEntries ?? []).map(entry => {
    const d = new Date(entry.date)
    return `${d.getFullYear()}-${d.getMonth()}`
  })
).size

const averageMonthlyIncome =
  uniqueMonths === 0
    ? 0
    : totalIncome / uniqueMonths


//Context for every evaluator
const context = {
  profile,
  investments: investments ?? [],
  networthItems: networthItems ?? [],
  incomeEntries: incomeEntries ?? [],
  sipPlans: sipPlans ?? [],
  averageMonthlyIncome,
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

const learning =
  await getLearningStatus(userId, supabaseAdmin)
  context.learning = learning

  const knowledgeTask =
  await evaluateKnowledge(context, supabaseAdmin)

if (knowledgeTask)
  tasks.push(knowledgeTask)

const diversificationTasks =
    evaluateDiversification(context)

tasks.push(...diversificationTasks)

const netWorthTask =
    evaluateNetWorth(context)

if (netWorthTask)
    tasks.push(netWorthTask)
console.log('tasks',tasks)
await supabaseAdmin
  .from("user_tasks")
  .delete()
  .eq("user_id", userId)

  tasks.sort((a, b) => a.priority - b.priority)

  const topTasks = tasks.slice(0, 3)
  console.log('top tasks',topTasks)
  if (topTasks.length > 0) {
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
