export interface Recommendation {
  headline: string
  summary: string
  steps: string[]
  products: string[]
  milestone: string
  warning: string
}

export type GoalKey = 'wealth' | 'retirement' | 'emergency' | 'home' | 'education' | 'business'

const RECOMMENDATIONS: Record<GoalKey, Record<number, Recommendation>> = {
  wealth: {
    1: {
      headline: 'Your first ₹500 SIP changes everything',
      summary: 'At the Seed stage, your only job is to build the habit of investing before spending. Most people at this stage delay starting because the amounts feel too small — but compounding rewards consistency, not size.',
      steps: [
        'Open a Zerodha or Groww account this week and start a ₹500 SIP in a Nifty 50 index fund',
        'Set up a ₹1,000 recurring deposit in your bank as a forced savings habit',
        'Enable auto-debit for both on your salary date so you never manually transfer',
      ],
      products: ['Nifty 50 Index Fund (SIP)', 'Bank Recurring Deposit', 'PPF (₹500/month)'],
      milestone: 'Reach ₹10,000 in total investments and maintain 10%+ savings rate for 3 months',
      warning: 'Waiting until you earn more — ₹500/month at 22 beats ₹5,000/month at 32',
    },
    2: {
      headline: 'Stack your first ₹1 lakh — make it automatic',
      summary: "As an Explorer, you've started but haven't built consistency. Your biggest risk is stopping when markets dip. Automation removes the human decision from the equation.",
      steps: [
        'Increase your SIP to ₹2,000/month in a Nifty 50 or Flexi Cap fund',
        'Open a PPF account and contribute ₹500/month — it compounds tax-free for 15 years',
        'Build a 1-month emergency buffer of ₹10,000–₹15,000 in a liquid fund',
      ],
      products: ['Nifty 50 Index Fund', 'PPF Account', 'Liquid Fund (emergency buffer)'],
      milestone: 'Cross ₹1L in total investments with no missed SIP in 6 months',
      warning: 'Stopping SIPs during market corrections — that is exactly when you should be buying more',
    },
    3: {
      headline: 'Diversify beyond one fund — build your core portfolio',
      summary: 'At the Builder stage, a single index fund SIP is no longer enough. You need a 3-fund portfolio that covers large cap, mid cap, and debt so you can weather any market cycle.',
      steps: [
        'Split investments across Nifty 50 (50%), Nifty Midcap 150 (30%), and a short-term debt fund (20%)',
        'Start ELSS SIP of ₹1,500/month to exhaust your 80C limit of ₹1.5L/year',
        'Get a pure term insurance cover of at least 10x your annual income',
      ],
      products: ['Nifty 50 Index Fund', 'Nifty Midcap 150 Fund', 'ELSS Fund (tax saving)', 'Term Insurance'],
      milestone: 'Reach ₹5L in investments with a proper 3-fund allocation and full 80C utilisation',
      warning: 'Buying ULIPs or endowment plans sold as investments — they are insurance products with poor returns',
    },
    4: {
      headline: 'Your portfolio should now work harder than your salary',
      summary: 'As an Accelerator, you have enough invested that returns are becoming meaningful. The focus now shifts to maximising contribution rate and reducing tax drag on your growing corpus.',
      steps: [
        'Maximise NPS contribution to claim additional ₹50,000 deduction under 80CCD(1B)',
        'Rebalance your portfolio annually — bring equity back to target allocation every January',
        'Start tracking your net worth monthly in a spreadsheet to see the compounding effect',
      ],
      products: ['NPS Tier 1 (80CCD benefit)', 'ELSS Fund', 'Nifty 50 Index Fund', 'Short Duration Debt Fund'],
      milestone: 'Cross ₹25L corpus and achieve a savings rate above 30%',
      warning: 'Churning funds frequently — every switch resets your LTCG clock and triggers tax',
    },
    5: {
      headline: 'Build wealth at market speed — direct stocks await',
      summary: 'At the Achiever stage, you understand markets well enough to go beyond mutual funds. Adding 5–10 quality direct stocks to your portfolio can meaningfully outperform index funds over a decade.',
      steps: [
        'Allocate 15–20% of your portfolio to 6–8 quality large-cap stocks you understand deeply',
        'Harvest LTCG annually — sell and rebuy ₹1L of gains each March to reset your cost basis tax-free',
        'Open an NPS Tier 2 account for flexible equity investment with lower expense ratio than mutual funds',
      ],
      products: ['Direct Stocks (large cap)', 'NPS Tier 2', 'Nifty 50 ETF', 'Sovereign Gold Bond (5–10% allocation)'],
      milestone: 'Cross ₹50L corpus with equity allocation generating visible annual LTCG',
      warning: 'Concentrating more than 10% in a single stock — diversification is your risk management',
    },
    6: {
      headline: 'Your money should outlive your career',
      summary: 'As a Wealth Creator, you are in the compounding sweet spot. The decisions you make in the next 5 years will determine whether you hit ₹1 Crore or ₹5 Crore. Focus shifts from accumulation to optimisation.',
      steps: [
        'Review your asset allocation — at this stage 70% equity / 20% debt / 10% gold is a strong anchor',
        'Consider a fee-only financial planner to optimise tax across LTCG, dividend income, and NPS',
        'Start a separate corpus for a specific goal — sabbatical fund, house down payment, or business seed',
      ],
      products: ['Direct Stocks', 'REITs (real estate exposure without buying property)', 'Sovereign Gold Bonds', 'NPS Tier 1 + Tier 2'],
      milestone: 'Cross ₹1 Crore net worth with a written investment policy statement',
      warning: 'Lifestyle inflation eating your savings rate — protect the 30%+ rate that got you here',
    },
    7: {
      headline: 'Institutional strategies are now within your reach',
      summary: 'As a Wealth Architect, your corpus is large enough to access PMS and structured products. The game changes from beating markets to managing risk, tax efficiency, and estate planning.',
      steps: [
        'Evaluate PMS options with a minimum ticket of ₹50L — compare 3-year rolling returns against Nifty',
        'Diversify internationally via Mirae Asset NYSE FANG+ ETF or Motilal Oswal S&P 500 ETF',
        'Draft a basic will and nominate all financial accounts — estate planning is now non-negotiable',
      ],
      products: ['PMS (Portfolio Management Services)', 'International ETFs (S&P 500, NASDAQ)', 'REITs', 'Sovereign Gold Bonds'],
      milestone: '₹2Cr+ corpus with international diversification and estate planning in place',
      warning: 'Chasing PMS strategies with short track records — demand 5+ years of audited performance data',
    },
    8: {
      headline: 'Protect the empire you have built',
      summary: 'As a Legend, wealth preservation and tax efficiency matter more than returns. Your focus is on structuring assets to minimise LTCG, maximise tax-free withdrawal, and build multi-generational wealth.',
      steps: [
        'Structure family finances — HUF (Hindu Undivided Family) can split income and reduce tax liability',
        'Diversify across asset classes: equity 50%, debt 20%, real estate 15%, gold 10%, international 5%',
        'Engage a SEBI-registered investment advisor for a comprehensive financial plan review annually',
      ],
      products: ['AIF (Alternative Investment Funds)', 'PMS', 'International ETFs', 'Commercial REITs', 'Sovereign Gold Bonds'],
      milestone: 'Complete estate plan with will, trusts, and nominated beneficiaries across all assets',
      warning: 'Over-concentrating in real estate — illiquidity and transaction costs destroy long-term returns',
    },
  },

  retirement: {
    1: {
      headline: 'Retirement at 60 starts with ₹500 today',
      summary: "At the Seed stage, retirement feels distant — but that distance is your biggest advantage. ₹500/month invested at 21 grows to ₹35L by 60 at 12% returns. The math rewards early starters disproportionately.",
      steps: [
        'Open NPS account online via eNPS portal — contribute just ₹500/month to start',
        'Start a PPF account — the EEE tax status (exempt-exempt-exempt) makes it the best risk-free retirement vehicle',
        'Calculate your retirement number: monthly expenses × 300 = the corpus you need',
      ],
      products: ['NPS Tier 1 (equity heavy — LC75 scheme)', 'PPF Account', 'Nifty 50 Index Fund SIP'],
      milestone: 'Open both NPS and PPF accounts and set up auto-debit contributions',
      warning: 'Relying only on EPF — EPF alone will not fund a comfortable retirement given inflation',
    },
    2: {
      headline: 'Lock in tax-free growth before life gets expensive',
      summary: 'As an Explorer, you still have time on your side. The priority is to maximise tax-advantaged accounts before your income grows and you lose certain exemptions. Every rupee in PPF today is worth far more at retirement.',
      steps: [
        'Max out PPF contribution to ₹1.5L/year — it is the safest EEE investment available',
        'Increase NPS to ₹2,000/month — claim the extra ₹50,000 deduction under 80CCD(1B)',
        'Avoid withdrawing EPF when switching jobs — keep it growing for compound effect',
      ],
      products: ['PPF (max ₹1.5L/year)', 'NPS Tier 1', 'EPF (do not withdraw)'],
      milestone: 'Fully fund PPF for 2 consecutive years and accumulate ₹1L+ in NPS',
      warning: 'Withdrawing EPF on job change — this is the single most damaging retirement mistake in India',
    },
    3: {
      headline: 'Build the retirement portfolio that works in all seasons',
      summary: 'At the Builder stage, you need a proper retirement allocation — not just EPF and PPF. A mix of equity mutual funds, NPS, and PPF gives you growth, tax efficiency, and safety across different market conditions.',
      steps: [
        'Follow the 100-minus-age rule: at 30, keep 70% in equity funds and 30% in debt/PPF/NPS',
        "Start a dedicated retirement SIP of ₹3,000/month in a Nifty 50 index fund labelled 'DO NOT TOUCH'",
        'Review your EPF balance annually and check that your employer is depositing correctly',
      ],
      products: ['Nifty 50 Index Fund (retirement SIP)', 'NPS Tier 1 (LC75)', 'PPF', 'EPF'],
      milestone: 'Retirement corpus crosses ₹5L with clear equity/debt split aligned to age',
      warning: 'Mixing retirement money with short-term goals — keep a separate account labelled retirement only',
    },
    4: {
      headline: 'Accelerate contributions while income is high',
      summary: 'At the Accelerator stage, your income is growing faster than your lifestyle costs. This is the window to front-load your retirement corpus. Every extra rupee invested now has decades of compounding ahead.',
      steps: [
        'Target a retirement savings rate of 20% of gross income dedicated only to retirement accounts',
        'Open NPS Tier 2 for flexible retirement investing with lower expense ratios than mutual funds',
        'Project your retirement corpus using a simple calculator — knowing your target makes contributions feel purposeful',
      ],
      products: ['NPS Tier 1 + Tier 2', 'PPF', 'ELSS Fund (80C benefit)', 'Nifty 50 Index Fund'],
      milestone: 'Retirement corpus crosses ₹25L and you have projected your retirement number',
      warning: 'Under-insuring yourself — a serious illness or accident can wipe out years of retirement savings',
    },
    5: {
      headline: 'Your retirement is now self-funding — keep it that way',
      summary: 'At the Achiever stage, your retirement corpus is generating meaningful returns on its own. The risk now is disruption — lifestyle inflation, large purchases, or market panic that causes you to withdraw prematurely.',
      steps: [
        'Calculate your projected retirement corpus using SIP calculators — model 3 scenarios: conservative, moderate, aggressive',
        'Add Sovereign Gold Bonds as 10% of retirement allocation — they pay 2.5% interest plus gold appreciation tax-free at maturity',
        'Review insurance coverage — health insurance of ₹20L+ is critical to protect the retirement corpus from medical expenses',
      ],
      products: ['Sovereign Gold Bonds', 'NPS Tier 1', 'Nifty 50 + Midcap Index Funds', 'Health Insurance (₹20L+)'],
      milestone: 'Retirement corpus crosses ₹50L and you have a written retirement plan with target date and monthly income projection',
      warning: 'Taking early retirement corpus withdrawals for non-emergencies — once broken, the compounding chain is very hard to restart',
    },
    6: {
      headline: 'Shift from accumulation to optimisation',
      summary: 'As a Wealth Creator approaching peak earning years, the retirement game shifts to tax optimisation. How you withdraw in retirement will determine how much you actually keep. Plan the withdrawal strategy now.',
      steps: [
        'Model your retirement income sources: NPS annuity (40% mandatory), PPF maturity, LTCG from equity — ensure they are diversified',
        'Contribute maximum to NPS Tier 1 every year — the ₹50,000 additional deduction saves ₹15,000+ in tax annually at 30% bracket',
        'Consider a target-date strategy — gradually shift equity to debt as you approach 5 years from retirement',
      ],
      products: ['NPS Tier 1 (max contribution)', 'Sovereign Gold Bonds', 'Short Duration Debt Funds', 'REITs (retirement income)'],
      milestone: 'Retirement corpus crosses ₹1 Crore with a documented withdrawal strategy',
      warning: '100% annuity from NPS — annuity rates are low; plan to use only the mandatory 40% and invest the rest yourself',
    },
    7: {
      headline: 'Pre-retirement: optimise for tax-free withdrawals',
      summary: 'As a Wealth Architect, you are likely 5–15 years from retirement with a substantial corpus. The focus shifts to tax-efficient decumulation — structuring withdrawals to minimise tax across PPF maturity, NPS partial withdrawal rules, and equity LTCG.',
      steps: [
        'Plan NPS withdrawal: at retirement, 60% lump sum (40% of that is tax-free) + 40% mandated annuity — model both in your drawdown plan',
        'Harvest LTCG annually: sell and rebuy ₹1L of equity gains each March — the exemption resets your cost basis tax-free every year',
        'Stagger PPF maturities by opening accounts in family members names for rolling 15-year EEE cycles',
      ],
      products: ['PMS (for ₹50L+ equity component)', 'NPS Tier 1 (withdrawal strategy)', 'PPF (multi-cycle)', 'International ETFs (geographic diversification)'],
      milestone: 'Achieve ₹2Cr+ retirement corpus with a written, tax-optimised drawdown model and a completed estate plan',
      warning: 'Delaying estate planning — without a will, family disputes in Indian courts can freeze retirement assets for years',
    },
    8: {
      headline: 'Your retirement corpus should outlive you by a generation',
      summary: 'As a Legend, retirement is not about surviving — it is about leaving a legacy. The focus is on perpetual income generation, minimising estate tax exposure, and ensuring the corpus grows faster than you withdraw.',
      steps: [
        'Structure a 4% withdrawal rate portfolio: at ₹3Cr corpus, you can withdraw ₹12L/year indefinitely if the portfolio grows at 10%+',
        'Use a bucket strategy: 2 years of expenses in liquid funds, 3 years in debt funds, rest in equity — rebalance annually',
        'Engage a SEBI-RIA for a comprehensive retirement income plan covering health costs, inflation, and estate transfer',
      ],
      products: ['AIF (Alternative Investment Funds)', 'Commercial REITs (rental income)', 'International ETFs', 'Sovereign Gold Bonds', 'NPS annuity (40% component)'],
      milestone: 'Retirement income exceeds monthly expenses from passive sources alone — true financial independence',
      warning: 'Under-estimating healthcare inflation — medical costs grow at 12–15% annually, far above general inflation',
    },
  },

  emergency: {
    1: {
      headline: 'One unexpected bill should not derail your life',
      summary: 'At the Seed stage, you likely have no financial buffer. A single medical bill, job loss, or repair can send you into debt. Building a ₹25,000 emergency fund is the single most important financial move you can make right now.',
      steps: [
        'Open a separate savings account labelled Emergency Only — never use it for anything else',
        'Set up ₹2,000/month auto-transfer to this account on salary day before you can spend it',
        'Park the money in a liquid mutual fund for better returns than savings account — still fully accessible in 24 hours',
      ],
      products: ['Liquid Mutual Fund (e.g. Parag Parikh Liquid Fund)', 'High-interest savings account (IDFC First, AU Small Finance Bank)'],
      milestone: 'Reach ₹25,000 in emergency fund — enough for one month of basic expenses',
      warning: 'Keeping emergency money in a fixed deposit — FD premature withdrawal penalties defeat the purpose of an emergency fund',
    },
    2: {
      headline: 'One month is survival — three months is security',
      summary: 'As an Explorer, you have started saving but your buffer is still thin. A job loss or medical emergency lasting more than a few weeks would exhaust your savings. Three months of expenses is the minimum viable safety net.',
      steps: [
        'Calculate your actual monthly expenses — rent, food, transport, utilities, EMIs — and multiply by 3 for your target',
        'Split emergency fund: 1 month in savings account (instant access) + 2 months in liquid fund (next-day access)',
        'Review and cancel unused subscriptions to redirect ₹500–₹1,000/month to emergency fund faster',
      ],
      products: ['Liquid Mutual Fund', 'Sweep-in FD (auto-moves excess to FD, accessible instantly)', 'High-yield savings account'],
      milestone: 'Emergency fund reaches 3 months of expenses — approximately ₹60,000–₹90,000 for most urban Indians',
      warning: 'Using credit card as emergency fund — a credit card is debt, not savings; interest at 36–42% per year destroys wealth',
    },
    3: {
      headline: 'Six months of freedom — no job can hold you hostage',
      summary: 'At the Builder stage, a 6-month emergency fund transforms your psychology. When you know you can survive 6 months without income, you negotiate better, take smart risks, and never make desperate financial decisions.',
      steps: [
        'Target 6 months of total expenses including EMIs as your emergency fund — write the exact rupee amount down',
        'Park excess beyond 1 month in an ultra-short duration debt fund for slightly better returns than liquid funds',
        'Get health insurance of ₹10L minimum if not covered by employer — one hospitalisation can wipe the entire emergency fund',
      ],
      products: ['Ultra Short Duration Debt Fund', 'Liquid Fund (1 month portion)', 'Health Insurance (₹10L+)', 'Term Insurance'],
      milestone: 'Emergency fund fully funded at 6 months of expenses with health insurance in place',
      warning: 'Investing emergency fund in equity — markets can fall 40% right when you need the money most',
    },
    4: {
      headline: 'Emergency fund is done — now make it work harder',
      summary: 'At the Accelerator stage, your emergency fund should be fully funded. The risk now is leaving too much money idle in low-return instruments. Smart laddering keeps your money accessible while earning better returns.',
      steps: [
        'Ladder your emergency fund: 1 month in savings, 2 months in liquid fund, 3 months in arbitrage fund (better post-tax returns)',
        'Review the fund amount annually and increase as your lifestyle and EMIs grow',
        'Ensure your emergency fund size covers your insurance premium payments for 1 year — so insurance never lapses in a crisis',
      ],
      products: ['Arbitrage Fund (better post-tax vs debt for 30% bracket)', 'Liquid Fund', 'Overnight Fund (for truly instant access portion)'],
      milestone: 'Emergency fund earning 6%+ effective yield through smart laddering across 3 instruments',
      warning: 'Never rebalancing emergency fund size — as salary and EMIs grow, a fixed old amount becomes dangerously insufficient',
    },
    5: {
      headline: 'Your emergency fund should include an opportunity fund',
      summary: 'At the Achiever stage, emergencies are not just crises — they are also opportunities. A market crash, a business opportunity, or a property deal requires liquidity. Expand your thinking from emergency fund to opportunity fund.',
      steps: [
        'Maintain 6 months of expenses as true emergency fund in liquid/arbitrage funds',
        'Add a separate 3-month opportunity fund in a short-duration debt fund for market crashes or business opportunities',
        'Review all insurance: health ₹20L+, term insurance 10x income, critical illness rider — these prevent emergencies from becoming catastrophes',
      ],
      products: ['Arbitrage Fund', 'Short Duration Debt Fund (opportunity component)', 'Health Insurance (₹20L+)', 'Critical Illness Rider'],
      milestone: '₹3L+ emergency + opportunity corpus that is fully separate from investment portfolio',
      warning: 'Treating the opportunity fund as investment portfolio — if you invest it in equity, it may be down 30% exactly when you need it',
    },
    6: {
      headline: 'Protect a large corpus with a large safety net',
      summary: 'As a Wealth Creator, your emergency fund needs to scale with your lifestyle and liabilities. A person with ₹1Cr portfolio and ₹80,000/month expenses needs a very different emergency buffer than when they started out.',
      steps: [
        'Recalculate emergency fund: 6 months of current expenses including all EMIs, insurance premiums, and household costs',
        'Consider a pre-approved personal loan or overdraft facility against your investments — adds a second layer of emergency liquidity',
        'Review term insurance coverage — as income grows, ensure sum assured is still 10x annual income',
      ],
      products: ['Liquid Fund + Arbitrage Fund (laddered)', 'Overdraft against mutual fund units', 'Top-up Health Insurance', 'Term Insurance (review sum assured)'],
      milestone: 'Emergency fund recalibrated to current lifestyle with backup credit facility arranged',
      warning: 'Assuming employer health insurance is sufficient — group cover lapses immediately on job loss, exactly when you might need it most',
    },
    7: {
      headline: 'At your level, liquidity planning is risk management',
      summary: 'As a Wealth Architect, emergency planning is no longer about survival — it is about protecting a large corpus from forced selling. Selling equity in a crisis at the wrong price is the biggest wealth destroyer at your level.',
      steps: [
        'Maintain 12 months of expenses in liquid/overnight funds — the larger your corpus, the more damage a forced sale causes',
        'Set up a credit line against your mutual fund portfolio (Loan Against Mutual Funds) for crisis liquidity without selling',
        'Review business continuity insurance if self-employed — income disruption at this level can be ₹5–10L per month',
      ],
      products: ['Overnight Fund + Liquid Fund (12 months)', 'Loan Against Mutual Funds (LAMF)', 'Business Interruption Insurance (if applicable)', 'Super Top-up Health Insurance'],
      milestone: '12-month liquid buffer in place with LAMF facility set up as backup — zero forced selling risk',
      warning: 'Keeping too much in liquid funds beyond 12 months — above a certain level, opportunity cost of idle cash outweighs safety',
    },
    8: {
      headline: 'Your emergency plan should include a family office protocol',
      summary: 'As a Legend, a personal emergency is a multi-crore event. Illness, litigation, or business failure at your level can involve sums that dwarf typical emergency planning. You need institutional-grade liquidity management.',
      steps: [
        'Maintain 12–18 months of personal and business expenses in overnight/liquid funds across multiple AMCs',
        'Establish a credit facility with your private bank against your investment portfolio — ₹50L+ credit line on standby',
        'Engage a chartered accountant and legal advisor on retainer — professional fees in a crisis are an emergency cost too',
      ],
      products: ['Overnight Funds (multiple AMCs)', 'Credit Facility Against Investments', 'Business Interruption Insurance', 'Key Person Insurance (if you run a business)'],
      milestone: 'Institutional liquidity plan documented and tested with legal, financial, and operational continuity protocols',
      warning: 'Believing your network will bail you out — in a real financial crisis, liquidity is more reliable than relationships',
    },
  },

  home: {
    1: {
      headline: "Your dream home starts with today's ₹1,000 SIP",
      summary: "At the Seed stage, buying a home seems impossibly far away. But a ₹1,000/month SIP started today grows to ₹23L in 15 years at 12% returns — enough for a down payment on a starter home in most tier-2 cities.",
      steps: [
        "Start a dedicated home SIP of ₹1,000/month in a Nifty 50 index fund — label it Home Down Payment",
        'Research actual property prices in your target area — knowing the number makes the goal concrete',
        'Focus on improving your CIBIL score above 750 now — it directly determines your home loan interest rate in future',
      ],
      products: ['Nifty 50 Index Fund (dedicated SIP)', 'PPF (if timeline > 10 years)', 'Recurring Deposit (if timeline < 5 years)'],
      milestone: '₹50,000 in dedicated home fund and CIBIL score above 730',
      warning: 'Buying property before you can afford a 20% down payment — 100% financing means you are buying the bank a home, not yourself',
    },
    2: {
      headline: 'A good CIBIL score is worth ₹10 lakh on a home loan',
      summary: 'As an Explorer, the groundwork for a home purchase is credit health and down payment accumulation. A CIBIL score of 750+ vs 650 can mean 0.5% lower interest rate — that is ₹8–10L saved over a 20-year loan.',
      steps: [
        'Check your CIBIL score free on CIBIL website — dispute any errors immediately as corrections take 30–45 days',
        'Pay all credit card bills in full every month — even one missed payment drops score by 50–100 points',
        'Increase home down payment SIP to ₹3,000/month and set a specific target date for purchase',
      ],
      products: ['Nifty 50 Index Fund (down payment SIP)', 'Liquid Fund (if buying in 2–3 years)', 'Secured Credit Card (to build CIBIL if no credit history)'],
      milestone: 'CIBIL score above 750 and ₹1L+ in dedicated home fund',
      warning: 'Taking personal loans for gadgets or travel — every EMI reduces your home loan eligibility by 5–6x the EMI amount',
    },
    3: {
      headline: 'Build your 20% down payment systematically',
      summary: 'At the Builder stage, you have income and some savings. The goal is to accumulate a 20% down payment in 3–5 years so you borrow less, pay less interest, and own your home faster. The bigger the down payment, the better the deal.',
      steps: [
        'Calculate your target property price and work backward: 20% down payment + 2% stamp duty + 1% registration = your savings target',
        'Use the right instrument for your timeline: equity funds if 5+ years away, debt funds if 2–3 years away, liquid funds if 1 year away',
        'Get pre-approved for a home loan to know exactly how much you can borrow before you start searching',
      ],
      products: ['Nifty 50 Index Fund (5+ years)', 'Short Duration Debt Fund (2–3 years)', 'Liquid Fund (< 1 year)', 'Home Loan (pre-approval)'],
      milestone: 'Down payment corpus crosses ₹5L on the way to 20% of target property value',
      warning: 'Stretching EMI beyond 40% of take-home salary — financial stress from over-leverage ruins the joy of home ownership',
    },
    4: {
      headline: 'You are close — optimise the deal, not just the down payment',
      summary: 'At the Accelerator stage, you likely have enough saved for a down payment. The focus shifts to getting the best possible loan terms, minimising total interest paid, and choosing the right property at the right time.',
      steps: [
        'Compare home loan rates across 5 banks and NBFCs — a 0.25% difference on ₹50L over 20 years saves ₹3.5L',
        'Choose floating rate over fixed rate in a falling interest rate environment — RBI rate cuts directly benefit you',
        'Make one extra EMI per year — this alone reduces a 20-year loan to approximately 17 years',
      ],
      products: ['Home Loan (SBI, HDFC, ICICI — compare rates)', 'PMAY subsidy (if eligible under income criteria)', 'Term Insurance (to cover home loan outstanding)'],
      milestone: 'Home loan sanctioned at below 8.5% interest with 20%+ down payment ready',
      warning: 'Not buying term insurance equal to home loan outstanding — your family should inherit the home, not the debt',
    },
    5: {
      headline: 'Buy smart — location compounds like equity',
      summary: 'At the Achiever stage, a home purchase is within comfortable reach. The risk is buying the wrong property — either overpriced, in a poor location, or with legal issues. The right property in the right micro-market outperforms equities over 10 years.',
      steps: [
        'Research price per sq ft trends in your target micro-market over 5 years — buy in areas with proven appreciation',
        'Get a lawyer to verify title documents, encumbrance certificate, and RERA registration before paying any token amount',
        'Negotiate the builder or seller down — in a buyers market, 5–10% discount is always possible with a ready buyer',
      ],
      products: ['Home Loan (optimised rate)', 'RERA-registered property only', 'Title Insurance (highly recommended for resale properties)'],
      milestone: 'Home purchased in RERA-registered project with full legal verification and EMI below 35% of take-home',
      warning: 'Buying in a non-RERA project for a lower price — legal disputes can freeze the property for years',
    },
    6: {
      headline: 'Your second property should be an investment, not an emotion',
      summary: 'As a Wealth Creator, you likely already own a home. The question is whether to buy a second property for investment. Rental yields in India average 2–3% — far below equity returns. Buy only if you have a specific strategic reason.',
      steps: [
        'Calculate actual rental yield: annual rent / property value — if below 3%, REITs give better returns with more liquidity',
        'If buying a second property, ensure total real estate does not exceed 30% of net worth — illiquidity risk is real',
        'Consider REITs for real estate exposure — Embassy Office Parks REIT yields 6–7% with quarterly distributions and full liquidity',
      ],
      products: ['REITs (Embassy, Mindspace, Nexus)', 'Commercial Property (if buying — better yields than residential)', 'Home Loan (against investment property — interest is deductible)'],
      milestone: 'Real estate allocation capped at 30% of net worth with clear yield or appreciation thesis',
      warning: 'Buying second residential property for investment — 2–3% rental yield after maintenance and vacancy is wealth destruction',
    },
    7: {
      headline: 'Real estate at your level is about legacy, not lifestyle',
      summary: 'As a Wealth Architect, property decisions involve crores. The calculus is completely different — tax implications of sale, estate planning, rental income structuring, and portfolio diversification are all in play.',
      steps: [
        'Review property portfolio for tax efficiency — long-term capital gains on property above ₹1 Crore attract 20% with indexation',
        'Consider commercial property or warehouse investments for 6–8% yields — far superior to residential rental',
        'Ensure all properties are properly registered, insured, and included in your estate planning documents',
      ],
      products: ['Commercial REITs', 'Industrial/Warehouse REITs', 'Commercial Property (direct ownership)', 'Home Loan Against Property (liquidity tool)'],
      milestone: 'Property portfolio generating 5%+ yield with clear estate transfer plan for each asset',
      warning: 'Over-allocating to real estate — property is illiquid, management-intensive, and has concentration risk',
    },
    8: {
      headline: 'Your property portfolio is a business — manage it like one',
      summary: 'As a Legend, real estate is one pillar of a diversified wealth architecture. At this level, you are thinking about rental income optimisation, property tax efficiency, and multi-generational asset transfer rather than appreciation alone.',
      steps: [
        'Structure commercial property income through a company for better tax treatment than individual ownership',
        'Engage a property management firm for professional rental management — self-management of large portfolios is inefficient',
        'Review all properties for inclusion in family trust or HUF structure to optimise inheritance',
      ],
      products: ['Commercial Property (company-owned)', 'REITs (liquid property exposure)', 'HUF (tax and inheritance optimisation)', 'Property Management Services'],
      milestone: 'Real estate portfolio generating ₹1L+/month in net rental income with professional management',
      warning: 'Commingling personal and investment property finances — separate accounting prevents costly legal and tax complications',
    },
  },

  education: {
    1: {
      headline: 'Start a child education fund before the fees start',
      summary: 'At the Seed stage, education costs for a child born today will be 5–8x higher by the time they reach college — assuming 8% education inflation. Starting a small SIP now is the only way to avoid a massive loan burden later.',
      steps: [
        'Start a ₹1,000/month SIP in a Nifty 50 index fund dedicated to child education — label it clearly',
        'Calculate the future cost: current college fees × 1.08^years until admission for a realistic target',
        'Open a Sukanya Samriddhi account if you have a girl child — 8.2% guaranteed return with EEE tax status',
      ],
      products: ['Nifty 50 Index Fund (education SIP)', 'Sukanya Samriddhi Yojana (girl child)', 'PPF (if child is under 5)'],
      milestone: 'Education fund started with ₹12,000 invested in year one and target corpus calculated',
      warning: 'Taking education loans for child instead of starting early — loans at 10–12% are very expensive compared to equity returns',
    },
    2: {
      headline: 'Time is your co-investor — use it before it runs out',
      summary: 'As an Explorer, every year you delay the education fund is a year of compounding lost forever. The difference between starting at 25 vs 30 for a child education fund is not 5 years — it is ₹15–20L at 12% returns.',
      steps: [
        'Increase education SIP to ₹2,000–₹3,000/month — small amounts now become large amounts with time',
        'If child is under 8, use equity funds aggressively — you have 10+ years for compounding',
        'If child is 8–15, shift 30–40% to hybrid or balanced funds to reduce equity risk as goal approaches',
      ],
      products: ['Nifty 50 Index Fund (under 10 years to goal)', 'Balanced Advantage Fund (5–10 years to goal)', 'Sukanya Samriddhi (girl child)', 'Short Duration Debt Fund (under 5 years to goal)'],
      milestone: 'Education corpus crosses ₹1L and you have calculated the target amount needed',
      warning: 'Using education corpus for other goals — label it clearly and psychologically commit it to education only',
    },
    3: {
      headline: 'Fund the dream school without the nightmare loan',
      summary: 'At the Builder stage, you have enough income to build a serious education corpus. The goal is to self-fund at least 50% of the projected education cost so that any loan required is small and manageable.',
      steps: [
        'Model 3 scenarios: India college, foreign undergraduate, foreign postgraduate — each has a very different cost and SIP requirement',
        'Maximise Sukanya Samriddhi to ₹1.5L/year if you have a girl child — it is the best risk-free education investment in India',
        'Review the education fund asset allocation annually — shift from equity to debt starting 3 years before the target date',
      ],
      products: ['Nifty 50 Index Fund', 'Sukanya Samriddhi Yojana (max ₹1.5L/year)', 'Balanced Fund (glide path)', 'Child Education Plan (term + SIP is better than bundled insurance plan)'],
      milestone: 'Education corpus crosses ₹5L and glide path strategy is defined for asset shift as goal nears',
      warning: 'Buying child insurance plans as education investment — they have high charges and poor returns; buy term insurance separately',
    },
    4: {
      headline: 'Foreign education is now a real option — plan for it',
      summary: 'At the Accelerator stage, funding a foreign undergraduate or postgraduate degree becomes a realistic goal. A US/UK undergraduate degree costs ₹80L–₹1.5Cr today — in 10–15 years it could be ₹2–3Cr. Plan accordingly.',
      steps: [
        'Model a foreign education corpus target: current annual fees × 4 years × 1.08^years × current USD/INR rate with 3% currency depreciation per year',
        'Split the corpus: 70% in equity funds (Nifty 50 + mid cap) for long-term growth, 30% in debt as education nears',
        'Explore foreign education loan options in advance — some banks offer pre-approved loans with better rates for early planners',
      ],
      products: ['Nifty 50 + Midcap 150 Index Funds', 'Sukanya Samriddhi (girl child)', 'Foreign Currency FD (hedge INR depreciation)', 'Education Loan (pre-research)'],
      milestone: 'Education corpus crosses ₹25L with clear target for domestic vs foreign education scenarios',
      warning: 'Under-estimating foreign education inflation — US college fees have risen 5–6% annually in USD, plus INR depreciation adds another 3–4%',
    },
    5: {
      headline: 'Your child can go anywhere — fund is almost ready',
      summary: 'At the Achiever stage, the education corpus is substantial and the goal date is approaching. The priority shifts from accumulation to capital preservation and currency hedging as the spend date comes near.',
      steps: [
        'Start the glide path: move 10% from equity to debt each year starting 5 years before college admission',
        'For foreign education, convert 20–30% of corpus to USD/EUR FD or international fund to hedge INR depreciation',
        'Research scholarship opportunities — merit scholarships can reduce the corpus requirement by ₹20–50L',
      ],
      products: ['Short Duration Debt Fund (preservation)', 'International Fund or USD FD (currency hedge)', 'Liquid Fund (year of admission)', 'Education Loan (backup for shortfall)'],
      milestone: 'Education corpus at 80%+ of target with glide path fully executed and scholarship research done',
      warning: 'Remaining 100% in equity 2 years from goal — a 30% market crash right before college admission is devastating',
    },
    6: {
      headline: 'Fund education fully — and still grow your wealth',
      summary: 'As a Wealth Creator, funding your child\'s education fully without loans is well within reach. The focus is on structuring the payout efficiently — which accounts to liquidate in what order — to minimise tax and maximise what the child receives.',
      steps: [
        'Map out the liquidation sequence: Sukanya Samriddhi first (fully tax-free), then ELSS after 3-year lock-in (LTCG up to ₹1L tax-free), then other equity funds',
        'Gift funds directly to child above 18 for tax efficiency — in their hands it may be taxed at a lower rate',
        'Keep 6 months of education fees in liquid fund as buffer for currency fluctuation on foreign fees',
      ],
      products: ['Sukanya Samriddhi (maturity withdrawal)', 'ELSS Fund (post lock-in)', 'Liquid Fund (fees buffer)', 'Education Loan (only if needed for tax benefit on interest)'],
      milestone: 'Education fully funded with tax-efficient drawdown plan and currency buffer for foreign fees',
      warning: 'Liquidating retirement corpus for education — child can take a loan; you cannot take a loan for retirement',
    },
    7: {
      headline: 'Education fund done — focus on what comes after',
      summary: 'As a Wealth Architect, education funding is straightforward at your wealth level. The more valuable conversation is about teaching your child wealth management — the knowledge you pass on is more valuable than the corpus.',
      steps: [
        'Fund education completely from designated corpus — do not touch retirement or wealth corpus',
        'Open a demat account for your child at 18 and teach them to invest — give them ₹10,000 to manage and learn',
        'Consider setting up an education trust for multiple children or to benefit extended family — provides tax and estate planning benefits',
      ],
      products: ['Education Trust (if multiple beneficiaries)', 'Child Demat Account (financial education)', 'International Wire Transfer (foreign university fees)', 'FD in child name (if surplus after education)'],
      milestone: "Child's education fully funded, child has investment account and basic financial literacy",
      warning: 'Over-funding education at the cost of not teaching financial independence — a ₹2Cr corpus handed without knowledge creates dependency',
    },
    8: {
      headline: 'Education is an investment in your family legacy',
      summary: 'As a Legend, education funding is a small line item in a large wealth plan. The opportunity is to think generationally — funding not just your children but potentially grandchildren, and establishing your family\'s commitment to education as an institution.',
      steps: [
        'Establish an education endowment or scholarship fund — contributions to registered educational trusts qualify for 80G deduction',
        "Fund your child's postgraduate education fully including living expenses, travel, and contingency — no compromise",
        "Engage in your alma mater's alumni donation programme — builds network, gives tax deduction, creates legacy",
      ],
      products: ['Education Endowment Fund', 'Scholarship Fund (80G deduction)', 'International University Donation Programme', 'Family Office Education Budget'],
      milestone: "Multi-generational education fund established with corpus sufficient to fund grandchildren's education",
      warning: 'Funding education without teaching the value of money — the greatest wealth risk is an heir who cannot manage what they inherit',
    },
  },

  business: {
    1: {
      headline: 'Build your emergency fund before you build your business',
      summary: 'At the Seed stage, entrepreneurship is a dream but not yet viable. The honest truth: 90% of businesses fail in year 1, and most fail because the founder ran out of personal money. Build 6 months of personal expenses first, then start the business.',
      steps: [
        'Build a ₹50,000–₹1,00,000 personal emergency fund before investing a single rupee in a business idea',
        'Start validating your business idea with zero investment — talk to 20 potential customers before building anything',
        'Keep your job while testing the idea — the salary pays for experiments; quitting too early kills most businesses',
      ],
      products: ['Liquid Fund (emergency buffer)', 'Recurring Deposit (business seed fund)', 'Free tools: Razorpay for payments, Notion for planning, Instagram for validation'],
      milestone: '6-month personal emergency fund complete and business idea validated with 5+ paying customers',
      warning: 'Quitting your job before your business generates 3 months of salary replacement income',
    },
    2: {
      headline: 'Validate with cash before you invest cash',
      summary: 'As an Explorer, you have a business idea and some savings. The critical principle: never invest money in a business until customers have paid you money first. Pre-sales and pilots de-risk everything.',
      steps: [
        'Run a paid pilot: charge customers for a beta version or early access — if they pay, the idea has legs',
        'Keep business finances completely separate from personal finances — open a current account even at this stage',
        'Track every rupee of business income and expense from day one — good financial hygiene now prevents chaos at scale',
      ],
      products: ['Current Account (Razorpay, ICICI, HDFC)', 'GST Registration (free, mandatory above ₹20L revenue)', 'Razorpay or PayTM for Business (payment collection)'],
      milestone: 'First ₹10,000 in business revenue from paying customers — proof the idea works',
      warning: 'Building product for months before talking to customers — build only what someone will pay for',
    },
    3: {
      headline: 'Separate yourself from the business financially',
      summary: 'At the Builder stage, your business is generating some revenue but you are likely mixing personal and business finances. This is the most dangerous period — unclear finances lead to unclear decisions and tax nightmares.',
      steps: [
        'Register as Pvt Ltd or LLP if revenue is above ₹10L — the liability protection alone is worth the ₹10,000 registration cost',
        'Pay yourself a fixed salary from the business — do not withdraw randomly; treat yourself as employee #1',
        'Keep 3 months of business operating costs as a business emergency fund separate from your personal emergency fund',
      ],
      products: ['CA for GST + ITR filing (do not DIY above ₹10L revenue)', 'Business Current Account (separate from personal)', 'Business Insurance (professional indemnity if service business)'],
      milestone: 'Business registered as Pvt Ltd/LLP with separate accounts and ₹1L+ monthly revenue',
      warning: 'Mixing personal and business finances — the tax and legal consequences of this mistake take years to clean up',
    },
    4: {
      headline: 'Build business wealth and personal wealth simultaneously',
      summary: 'At the Accelerator stage, your business is profitable. The trap many entrepreneurs fall into is reinvesting everything in the business and building zero personal wealth. Pay yourself enough to build personal financial security in parallel.',
      steps: [
        'Set a personal salary from the business that allows you to invest at least 20% of personal income for retirement and goals',
        'Build a 6-month business operating expense reserve — businesses fail not because they are unprofitable but because they run out of cash',
        'Start separating business valuation from personal net worth — your business is an asset but it is not liquid',
      ],
      products: ['Business Line of Credit (working capital buffer)', 'Personal NPS + mutual fund SIP (from salary)', 'CA + CS for compliance (Pvt Ltd annual filings)'],
      milestone: 'Business generating ₹5L+/month revenue with 3-month cash reserve and founder investing personally',
      warning: 'Treating business profits as personal income before tax — advance tax payments and GST compliance must come first',
    },
    5: {
      headline: 'Your business is your biggest asset — protect and grow it',
      summary: 'At the Achiever stage, your business is likely your largest single asset. The risk is concentration — if the business fails, your entire wealth fails. Diversification through personal investments protects against this catastrophic scenario.',
      steps: [
        'Ensure personal investments outside business are at least 30% of total net worth — do not be 100% in your own business',
        'Get your business valued professionally — knowing the number helps in fundraising, acquisition, and succession planning',
        'Explore ESOPs or equity grants for key employees — retention of talent is now a financial risk to the business',
      ],
      products: ['Personal Mutual Fund Portfolio (separate from business)', 'Business Valuation (CA or investment banker)', 'Key Person Insurance (if you are irreplaceable)', 'ESOP Framework (for employee retention)'],
      milestone: 'Personal net worth outside business crosses ₹25L and business has a documented valuation',
      warning: 'Having 90%+ of net worth in an illiquid private business — you cannot eat equity in a crisis',
    },
    6: {
      headline: 'Build systems so the business grows without you',
      summary: 'As a Wealth Creator with a business, the next level of wealth creation is making the business owner-independent. A business that requires your daily presence is a high-paying job, not a wealth-creating asset.',
      steps: [
        'Document all key processes and hire a strong #2 — the business should run without you for 30 days before you consider it systematised',
        'Explore raising external funding or taking on a strategic partner to accelerate growth beyond what cash flows allow',
        'Start planning for exit or partial exit — understanding your options (acquisition, PE, IPO, succession) gives you negotiating power',
      ],
      products: ['CA + Investment Banker (for fundraising or M&A)', 'Business Process Documentation Tools', 'ESOP Pool (attract senior talent)', 'Personal Wealth Manager (separate from business CA)'],
      milestone: 'Business runs for 30+ days without founder and has documented processes for all key functions',
      warning: 'Building a business entirely dependent on your personal relationships or skills — it has zero resale value without you',
    },
    7: {
      headline: 'Your business empire needs a business architecture',
      summary: 'As a Wealth Architect, you likely have multiple business interests or a single large business. The game changes to tax efficiency across entities, succession planning, and building structures that outlast you.',
      steps: [
        'Explore a holding company structure to own operating businesses — tax efficiency on dividends and capital gains is significant at this scale',
        'Engage a Big 4 firm or top-tier CA for annual tax planning — the fee is a rounding error against the tax saved',
        'Begin succession planning: identify internal successors, document transition plan, consider family governance policies',
      ],
      products: ['Holding Company Structure', 'Big 4 CA Firm (tax planning)', 'Investment Bank (for strategic options)', 'Family Office Setup (if net worth > ₹50Cr)'],
      milestone: 'Holding company structure in place with tax-efficient dividend flow and succession plan documented',
      warning: 'Delaying succession planning — unexpected health events without a plan create business and family chaos',
    },
    8: {
      headline: 'Your business legacy should outlive your tenure',
      summary: 'As a Legend, the business conversation is about legacy, governance, and multi-generational value creation. The entrepreneurs who build lasting businesses are those who build institutions, not just companies.',
      steps: [
        'Establish a formal board with independent directors — governance creates accountability and increases business value for acquisition or succession',
        'Consider philanthropic initiatives aligned with business — CSR at scale creates brand value and meaningful impact',
        "Document your business philosophy and values — the founder's vision should be embedded in the institution, not just the founder's head",
      ],
      products: ['Independent Board Members', 'CSR Foundation (tax deductible)', 'Family Office (wealth management)', 'Business Succession Trust'],
      milestone: 'Business operates with full institutional governance, board oversight, and a documented 10-year succession plan',
      warning: 'Treating the business as personal property at scale — founders who cannot separate self from company destroy both eventually',
    },
  },
}

export function getRecommendation(level: number, goal: GoalKey): Recommendation {
  const rec = RECOMMENDATIONS[goal]?.[level]
  return rec ?? RECOMMENDATIONS['wealth'][1]
}
