'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/app/context/themecontext'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ConceptData {
  term: string; cat: string; icon: string; diff: string; read: string
  def: string; source: string; simple: string; example: string
  takeaways: string[]; mistakes: string[]; related: string[]; learnNext: string[]
}

// ─── Data ────────────────────────────────────────────────────────────────────

const CONCEPTS: Record<string, ConceptData> = {
  'asset-allocation': {
    term: 'Asset Allocation', cat: 'Portfolio Management', icon: '⚖️', diff: 'Intermediate', read: '2 min',
    def: 'Asset allocation is the process of dividing an investment portfolio among different asset classes — typically equities, fixed income, and cash or cash equivalents — to balance risk and reward according to an investor\'s goals, risk tolerance, and time horizon.',
    source: 'Sources: Investor.gov, Fidelity Learning Center, CFI',
    simple: 'It\'s the big-picture mix of what you own — how much in stocks versus bonds versus cash. This mix matters more to your long-term results than picking individual investments.',
    example: 'An investor with a five-year horizon and moderate risk tolerance might split a ₹10,00,000 portfolio as 50% equity mutual funds, 40% debt funds, and 10% cash — adjusting the mix as goals or time horizon change.',
    takeaways: ['Drives most of a portfolio\'s long-term risk and return', 'No single allocation fits everyone — it depends on goals and time horizon', 'Should be revisited as life stage and risk tolerance change', 'Works hand-in-hand with diversification within each asset class'],
    mistakes: ['Setting an allocation once and never revisiting it as goals change', 'Confusing asset allocation with diversification — they solve different problems', 'Chasing last year\'s best-performing asset class instead of sticking to a plan'],
    related: ['diversification', 'portfolio', 'risk-vs-return', 'portfolio-rebalancing'],
    learnNext: ['diversification', 'portfolio-rebalancing', 'risk-vs-return'],
  },
  'asset-location': {
    term: 'Asset Location', cat: 'Taxation', icon: '📍', diff: 'Advanced', read: '3 min',
    def: 'Asset location is a tax-aware strategy that determines which account type — taxable, tax-deferred, or tax-exempt — is best suited to hold a given investment, with the goal of improving after-tax returns without changing overall investment risk.',
    source: 'Sources: T. Rowe Price, Charles Schwab, Morningstar',
    simple: 'It\'s not about what you invest in — it\'s about where you hold it. Putting tax-heavy investments in tax-sheltered accounts, and tax-friendly ones in regular accounts, can quietly boost what you keep after tax.',
    example: 'A bond fund that pays regular taxable interest is better placed inside a tax-deferred retirement account, while a tax-efficient index fund can sit comfortably in a regular taxable account.',
    takeaways: ['Complements — but is distinct from — asset allocation', 'Aims to reduce tax drag without changing portfolio risk', 'More valuable for investors with multiple account types', 'Mutual funds with high turnover tend to be less tax-efficient'],
    mistakes: ['Treating asset location as a replacement for proper asset allocation', 'Ignoring account type entirely when placing high-turnover or income-generating funds', 'Overcomplicating a small portfolio where the tax benefit is minimal'],
    related: ['tax-efficiency', 'taxation', 'asset-allocation', 'portfolio'],
    learnNext: ['tax-efficiency', 'asset-allocation', 'taxation'],
  },
  'behavioral-finance': {
    term: 'Behavioral Finance', cat: 'Behavioral Finance', icon: '🧠', diff: 'Intermediate', read: '2 min',
    def: 'Behavioral finance is the study of how psychology — cognitive biases, emotions, and social influences — affects the financial decisions of investors, often causing behavior that departs from the rational-actor assumptions of traditional finance theory.',
    source: 'Sources: ScienceDirect, William & Mary Online, Wikipedia',
    simple: 'It explains why people don\'t always act logically with money — like selling in a panic or chasing a hot stock — because feelings and mental shortcuts often outweigh cold calculation.',
    example: 'An investor who bought a stock at its peak may refuse to sell at a loss, holding on far longer than the fundamentals justify simply because admitting the loss feels worse than the financial damage of waiting.',
    takeaways: ['Explains gaps between rational theory and real investor behavior', 'Covers biases like overconfidence, loss aversion, and herding', 'Helps explain market anomalies that pure efficient-market theory can\'t', 'Awareness of bias is the first step to managing it'],
    mistakes: ['Assuming you personally are immune to behavioral bias', 'Making big financial decisions during periods of high emotion', 'Following the crowd into or out of an investment without independent analysis'],
    related: ['emotional-investing', 'lifestyle-inflation', 'risk', 'market-volatility'],
    learnNext: ['emotional-investing', 'market-volatility', 'lifestyle-inflation'],
  },
  'bear-market': {
    term: 'Bear Market', cat: 'Stock Market', icon: '🐻', diff: 'Beginner', read: '1 min',
    def: 'A bear market refers to a sustained period — conventionally a decline of 20% or more from recent highs — during which prices of securities fall and pessimism about future performance becomes widespread among investors.',
    source: 'Sources: Investor.gov, major exchange terminology',
    simple: 'It\'s when the market falls sharply and stays down for a while, and most investors feel nervous or pessimistic about where prices are headed next.',
    example: 'If a stock index falls from 25,000 to 19,500 points and stays depressed for months amid falling investor confidence, that decline qualifies as a bear market.',
    takeaways: ['Conventionally defined as a 20%+ decline from a recent peak', 'Often accompanies economic slowdown or rising uncertainty', 'Can last months to years, unlike a short-term correction', 'Historically followed, eventually, by recovery and new bull markets'],
    mistakes: ['Panic-selling near the bottom and locking in losses', 'Trying to perfectly time the exact bottom before re-investing', 'Stopping SIP contributions during downturns, which forfeits lower buying prices'],
    related: ['bull-market', 'market-volatility', 'market-crash', 'risk'],
    learnNext: ['bull-market', 'market-crash', 'market-volatility'],
  },
  'bull-market': {
    term: 'Bull Market', cat: 'Stock Market', icon: '📈', diff: 'Beginner', read: '1 min',
    def: 'A bull market describes a sustained period of rising security prices, typically accompanied by investor optimism, strong economic indicators, and broad-based gains across the market.',
    source: 'Sources: Investor.gov, major exchange terminology',
    simple: 'It\'s when prices keep climbing over an extended stretch and most people feel optimistic about investing and the economy.',
    example: 'A multi-year rally where an index rises from 18,000 to 26,000 points, supported by strong corporate earnings and investor confidence, is typically described as a bull market.',
    takeaways: ['Marked by sustained price gains and investor optimism', 'Often coincides with economic growth and rising earnings', 'Can encourage overconfidence if it runs for a long time', 'No fixed percentage threshold the way bear markets have one'],
    mistakes: ['Assuming gains will continue indefinitely and over-investing near the peak', 'Ignoring valuation and risk simply because sentiment is positive', 'Increasing risk-taking purely because recent returns have been strong'],
    related: ['bear-market', 'market-volatility', 'risk', 'return'],
    learnNext: ['bear-market', 'risk-vs-return', 'market-volatility'],
  },
  'compounding': {
    term: 'Compounding', cat: 'Investing', icon: '⏲️', diff: 'Beginner', read: '2 min',
    def: 'Compounding is the process by which an asset\'s earnings — from capital gains or interest — are reinvested to generate additional earnings over time, causing the asset\'s value to grow at an accelerating, non-linear rate.',
    source: 'Sources: standard finance reference definitions',
    simple: 'Your money earns money, and then that new money earns more money too. The longer you stay invested, the faster your wealth grows — which is why starting early matters more than investing larger amounts later.',
    example: 'Invest ₹10,000 at the start. After year one, returns are added to the principal. In year two, gains are calculated on the original ₹10,000 plus last year\'s returns — not just the original amount.',
    takeaways: ['Long-term growth accelerates over time', 'Returns are continuously reinvested', 'Time matters more than timing', 'Core mechanism behind SIP investing', 'Starting early beats investing more later', 'Also works against you with high-interest debt'],
    mistakes: ['Withdrawing early and breaking the compounding cycle', 'Underestimating how much delay costs — even a 5-year gap matters', 'Ignoring how the same effect compounds high-interest debt against you'],
    related: ['sip-systematic-investment-plan', 'time-value-of-money', 'lump-sum-investing', 'return'],
    learnNext: ['sip-systematic-investment-plan', 'time-value-of-money', 'return'],
  },
  'corporate-bond-fund': {
    term: 'Corporate Bond Fund', cat: 'Mutual Funds', icon: '🏢', diff: 'Intermediate', read: '2 min',
    def: 'A corporate bond fund is a debt mutual fund that invests predominantly in bonds issued by companies, aiming to generate income through interest payments while taking on credit risk tied to the issuing corporations\' ability to repay.',
    source: 'Sources: standard debt-fund category definitions used by mutual fund regulators and AMCs',
    simple: 'It\'s a fund that lends money to companies by buying their bonds, and pays you a share of the interest those companies pay back.',
    example: 'A corporate bond fund might hold bonds from several highly rated companies, collecting periodic interest and passing returns to investors, generally with steadier — though not risk-free — returns than equity funds.',
    takeaways: ['Primarily invests in high-rated corporate debt instruments', 'Generates returns mainly through interest income', 'Carries credit risk if the issuing company\'s rating weakens', 'Generally less volatile than equity funds, but not risk-free'],
    mistakes: ['Assuming all debt funds are equally safe regardless of issuer quality', 'Ignoring interest-rate risk when rates rise and bond prices fall', 'Overlooking expense ratio differences between funds with similar holdings'],
    related: ['debt-fund', 'mutual-funds-investing', 'risk', 'money-market-fund'],
    learnNext: ['debt-fund', 'money-market-fund', 'risk-vs-return'],
  },
  'debt-fund': {
    term: 'Debt Fund', cat: 'Mutual Funds', icon: '📑', diff: 'Beginner', read: '2 min',
    def: 'A debt fund is a mutual fund that invests primarily in fixed-income instruments such as government securities, corporate bonds, treasury bills, and money market instruments, aiming to generate relatively stable income with lower volatility than equity funds.',
    source: 'Sources: standard mutual fund category definitions used by AMCs and regulators',
    simple: 'It\'s a fund that lends money on your behalf — to governments or companies — instead of buying company shares, so returns tend to be steadier but usually smaller than equity.',
    example: 'A debt fund holding government bonds and high-rated corporate paper might target moderate, relatively predictable annual returns, useful for short-to-medium-term goals.',
    takeaways: ['Invests in fixed-income instruments rather than equities', 'Generally lower volatility than equity mutual funds', 'Returns are influenced by interest rate movements', 'Useful for shorter time horizons and capital stability goals'],
    mistakes: ['Assuming debt funds carry zero risk — interest rate and credit risk still apply', 'Using long-duration debt funds for very short-term goals', 'Ignoring how rising interest rates can reduce existing bond fund NAVs'],
    related: ['corporate-bond-fund', 'money-market-fund', 'risk', 'portfolio'],
    learnNext: ['corporate-bond-fund', 'money-market-fund', 'risk'],
  },
  'diversification': {
    term: 'Diversification', cat: 'Investing', icon: '✂️', diff: 'Beginner', read: '2 min',
    def: 'Diversification is an investment strategy that spreads capital across a variety of assets, sectors, or geographies so that the poor performance of any single holding has a limited effect on overall portfolio returns.',
    source: 'Sources: Investor.gov, Britannica Money',
    simple: 'Don\'t put all your money in one place. By spreading investments across different types of assets, a loss in one area is less likely to sink your entire portfolio.',
    example: 'Instead of holding only one company\'s stock, an investor spreads money across multiple sectors, asset classes, and a few mutual funds so a downturn in any one of them doesn\'t derail the whole portfolio.',
    takeaways: ['Reduces the impact of any single investment\'s poor performance', 'Works best when held assets don\'t move in the same direction together', 'Doesn\'t eliminate risk, but helps manage it', 'Can fail if holdings only look diverse but are actually correlated'],
    mistakes: ['Believing that holding many funds automatically means diversification', 'Owning multiple funds that all hold the same underlying stocks', 'Over-diversifying to the point that strong performers get diluted away'],
    related: ['asset-allocation', 'portfolio-concentration-risk', 'risk', 'portfolio'],
    learnNext: ['portfolio-concentration-risk', 'asset-allocation', 'risk'],
  },
  'emotional-investing': {
    term: 'Emotional Investing', cat: 'Behavioral Finance', icon: '😭', diff: 'Intermediate', read: '2 min',
    def: 'Emotional investing refers to investment decisions driven primarily by feelings — such as fear, greed, excitement, or regret — rather than by objective analysis of fundamentals, goals, or risk tolerance.',
    source: 'Sources: behavioral finance literature, William & Mary Online, ScienceDirect',
    simple: 'It\'s making money moves because of how you feel in the moment — panic, excitement, fear of missing out — instead of sticking to a plan.',
    example: 'An investor who sells an entire equity portfolio during a sharp market drop out of fear, only to miss the recovery that follows, is acting on emotional investing rather than a predetermined strategy.',
    takeaways: ['Driven by fear, greed, or fear-of-missing-out rather than analysis', 'Often leads to buying high and selling low', 'A written investment plan helps counter impulsive decisions', 'Common during market volatility and news-driven hype cycles'],
    mistakes: ['Panic-selling during a downturn instead of reviewing the original plan', 'Chasing a rapidly rising asset purely out of FOMO', 'Checking portfolio value so frequently that short-term noise triggers reactions'],
    related: ['behavioral-finance', 'market-volatility', 'lifestyle-inflation', 'risk'],
    learnNext: ['behavioral-finance', 'market-volatility', 'goal-based-investing'],
  },
  'emergency-fund': {
    term: 'Emergency Fund', cat: 'Money Basics', icon: '🛟', diff: 'Beginner', read: '1 min',
    def: 'An emergency fund is a reserve of readily accessible cash set aside to cover unexpected expenses or income disruption, such as medical emergencies, job loss, or urgent repairs, without resorting to debt or liquidating long-term investments.',
    source: 'Sources: standard personal-finance guidance used by financial planners and consumer-finance regulators',
    simple: 'It\'s money kept aside purely for surprises — so a sudden expense doesn\'t force you to break your investments or borrow at high interest.',
    example: 'Someone with monthly expenses of ₹40,000 might keep ₹2,40,000 (six months\' worth) in a savings account or liquid fund, untouched except for genuine emergencies.',
    takeaways: ['Should be held in liquid, low-risk instruments, not equity', 'Commonly sized at 3–6 months of essential expenses', 'Protects long-term investments from forced early withdrawal', 'Acts as the first layer of financial planning before investing'],
    mistakes: ['Investing emergency funds in equity for higher returns', 'Treating the fund as available for discretionary spending', 'Skipping this step entirely to invest more aggressively sooner'],
    related: ['net-worth', 'investing', 'short-term-goals', 'risk'],
    learnNext: ['net-worth', 'short-term-goals', 'money-market-fund'],
  },
  'financial-independence': {
    term: 'Financial Independence', cat: 'Financial Planning', icon: '🏝️', diff: 'Intermediate', read: '2 min',
    def: 'Financial independence is a state in which an individual has accumulated sufficient assets and passive income to cover living expenses without depending on active employment income.',
    source: 'Sources: Wikipedia (FIRE movement), standard financial-planning terminology',
    simple: 'It means your investments and savings can pay for your life, so working becomes optional rather than necessary.',
    example: 'Someone who saves and invests aggressively for two decades may reach a point where dividend income, rental income, and withdrawals can cover living costs indefinitely, regardless of employment.',
    takeaways: ['Defined by passive income or assets covering ongoing expenses', 'Often pursued through high savings rates and disciplined investing', 'Distinct from retirement — independence can happen at any age', 'Requires realistic estimates of future expenses and withdrawal rates'],
    mistakes: ['Underestimating future expenses, including inflation and healthcare', 'Withdrawing too aggressively in early years, risking sequence-of-returns damage', 'Treating a single net-worth number as guaranteed safety without a plan'],
    related: ['goal-based-investing', 'wealth-preservation', 'long-term-goals', 'net-worth'],
    learnNext: ['goal-based-investing', 'wealth-preservation', 'sequence-of-returns-risk'],
  },
  'flexi-cap-fund': {
    term: 'Flexi Cap Fund', cat: 'Mutual Funds', icon: '🔀', diff: 'Intermediate', read: '2 min',
    def: 'A flexi cap fund is an equity mutual fund category that can invest across large-cap, mid-cap, and small-cap companies without a fixed allocation mandate, giving the fund manager flexibility to shift exposure based on market conditions.',
    source: 'Sources: standard mutual fund category definitions used by AMCs and regulators',
    simple: 'It\'s a fund that isn\'t locked into one company size — the manager can move between big, medium, and small companies depending on where they see opportunity.',
    example: 'A flexi cap fund manager might increase exposure to small-cap stocks when valuations look attractive, then rotate back toward large caps when markets turn volatile.',
    takeaways: ['No fixed minimum allocation to any single market-cap segment', 'Performance depends heavily on the fund manager\'s stock-picking and timing', 'Generally carries more risk than a pure large-cap fund', 'Offers diversification across company sizes within one fund'],
    mistakes: ['Assuming flexibility automatically means lower risk', 'Not checking the fund\'s actual current allocation across market caps', 'Comparing returns directly against a pure large-cap or small-cap benchmark'],
    related: ['large-cap-fund', 'mid-cap-fund', 'small-cap-fund', 'mutual-funds-investing'],
    learnNext: ['large-cap-fund', 'mid-cap-fund', 'small-cap-fund'],
  },
  'generational-wealth': {
    term: 'Generational Wealth', cat: 'Financial Planning', icon: '🌳', diff: 'Intermediate', read: '2 min',
    def: 'Generational wealth refers to assets — such as cash, property, investments, or businesses — that are passed down from one generation of a family to the next, often combined with financial knowledge intended to sustain that wealth over time.',
    source: 'Sources: Britannica Money, Cambridge Dictionary',
    simple: 'It\'s wealth that outlives the person who built it — money, property, or a business handed down to children or grandchildren, ideally along with the knowledge to keep growing it.',
    example: 'A family that invests consistently, holds property, and teaches the next generation how to manage money may pass down both assets and the skills to sustain them across multiple generations.',
    takeaways: ['Goes beyond a one-time inheritance — meant to be sustained, not spent', 'Includes both tangible assets and financial knowledge transfer', 'Often built through long-term investing, property, and businesses', 'Frequently erodes by the third generation without proper planning'],
    mistakes: ['Passing down assets without passing down financial literacy', 'Failing to plan for taxes and costs involved in wealth transfer', 'Assuming a single large inheritance alone guarantees lasting wealth'],
    related: ['wealth-preservation', 'net-worth', 'long-term-goals', 'financial-independence'],
    learnNext: ['wealth-preservation', 'long-term-goals', 'financial-independence'],
  },
  'goal-based-investing': {
    term: 'Goal-Based Investing', cat: 'Financial Planning', icon: '🎯', diff: 'Intermediate', read: '2 min',
    def: 'Goal-based investing is an investment approach that aligns portfolios and strategies with specific, time-bound financial objectives — such as retirement, education, or a home purchase — rather than focusing purely on outperforming a market benchmark.',
    source: 'Sources: Wikipedia, SoFi Learn, Business LibreTexts',
    simple: 'Instead of just chasing the highest returns, you invest with a clear destination in mind — like a house in seven years — and choose strategies that fit that specific timeline and risk level.',
    example: 'An investor saving for a child\'s education in 12 years might use a more equity-heavy portfolio early on, then gradually shift to safer instruments as the goal date approaches.',
    takeaways: ['Anchors investment decisions to specific goals and timelines', 'Different goals can call for different risk levels and asset mixes', 'Reduces anxiety tied to short-term market swings', 'Encourages regular review as life circumstances change'],
    mistakes: ['Using one generic portfolio for all goals regardless of timeline', 'Failing to revisit goals and timelines as priorities shift', 'Measuring success only against market benchmarks instead of the goal itself'],
    related: ['short-term-goals', 'medium-term-goals', 'long-term-goals', 'financial-independence'],
    learnNext: ['short-term-goals', 'medium-term-goals', 'long-term-goals'],
  },
  'gold-fund': {
    term: 'Gold Fund', cat: 'Mutual Funds', icon: '🪙', diff: 'Intermediate', read: '2 min',
    def: 'A gold fund is a mutual fund that invests in gold-related instruments — typically gold ETFs or physical gold-backed assets — allowing investors exposure to gold price movements without directly holding physical gold.',
    source: 'Sources: standard mutual fund category definitions used by AMCs',
    simple: 'It\'s a way to invest in gold\'s price movement through a fund, instead of buying and storing physical gold yourself.',
    example: 'An investor wanting exposure to gold as a portfolio diversifier might invest through a gold fund rather than purchasing jewelry or bars, avoiding storage and purity concerns.',
    takeaways: ['Tracks gold prices rather than company performance', 'Often used as a portfolio diversifier or inflation hedge', 'More liquid and convenient than holding physical gold', 'Returns depend entirely on gold price movements, not business growth'],
    mistakes: ['Treating gold funds as a primary wealth-building tool rather than a diversifier', 'Over-allocating to gold expecting equity-like long-term growth', 'Ignoring that gold prices can also be volatile over shorter periods'],
    related: ['diversification', 'portfolio', 'asset-allocation', 'inflation'],
    learnNext: ['diversification', 'inflation', 'asset-allocation'],
  },
  'health-insurance': {
    term: 'Health Insurance', cat: 'Insurance', icon: '🏥', diff: 'Beginner', read: '2 min',
    def: 'Health insurance is a contract in which an insurer agrees to cover specified medical expenses — such as hospitalization, treatment, and sometimes pre- and post-care costs — in exchange for a periodic premium, protecting policyholders from large, unpredictable healthcare costs.',
    source: 'Sources: standard insurance terminology used by insurance regulators and providers',
    simple: 'It\'s a safety net for medical bills — you pay a smaller, predictable premium so a large, unpredictable hospital bill doesn\'t wreck your finances.',
    example: 'A policyholder hospitalized for surgery costing ₹3,00,000 may have most of that amount covered by their health insurance plan, paying only a small co-payment or deductible out of pocket.',
    takeaways: ['Protects against large, unpredictable medical expenses', 'Premiums are generally far smaller than potential treatment costs', 'Coverage details, exclusions, and waiting periods vary by policy', 'Should be reviewed and renewed without lapses to retain benefits'],
    mistakes: ['Buying based on premium alone without checking coverage limits and exclusions', 'Letting a policy lapse and losing continuity benefits', 'Relying solely on employer coverage with no personal backup policy'],
    related: ['term-insurance', 'emergency-fund', 'risk', 'financial-independence'],
    learnNext: ['term-insurance', 'emergency-fund', 'risk'],
  },
  'index-fund': {
    term: 'Index Fund', cat: 'Mutual Funds', icon: '📊', diff: 'Beginner', read: '2 min',
    def: 'An index fund is a mutual fund or exchange-traded fund designed to replicate the performance of a specific market index by holding the same securities in similar proportions, typically using a passive management approach with lower costs than actively managed funds.',
    source: 'Sources: Investor.gov-style resources, standard fund category definitions',
    simple: 'Instead of trying to beat the market, this fund simply copies a market index — so your returns roughly track the overall market rather than depending on a fund manager\'s picks.',
    example: 'An index fund tracking a benchmark equity index will hold roughly the same stocks in the same proportions as that index, rising and falling largely in line with the broader market.',
    takeaways: ['Passively tracks a market index rather than picking stocks actively', 'Typically has a lower expense ratio than actively managed funds', 'Returns mirror the index, including its declines', 'A common, low-cost building block for long-term investors'],
    mistakes: ['Expecting index funds to outperform the market — they aim to match it', 'Ignoring tracking error and expense ratio differences between similar funds', 'Assuming all index funds track the same index or follow it equally well'],
    related: ['large-cap-fund', 'sip-systematic-investment-plan', 'diversification', 'mutual-funds-investing'],
    learnNext: ['large-cap-fund', 'sip-systematic-investment-plan', 'mutual-funds-investing'],
  },
  'inflation': {
    term: 'Inflation', cat: 'Economics', icon: '%', diff: 'Beginner', read: '2 min',
    def: 'Inflation is the rate at which the general price level of goods and services in an economy rises over time, resulting in a corresponding decline in the purchasing power of a given amount of currency.',
    source: 'Sources: standard macroeconomic terminology, central bank and Investor.gov-style resources',
    simple: 'It\'s why the same ₹100 buys less over time — as prices for everyday goods and services rise, your money\'s purchasing power gradually shrinks.',
    example: 'If a basket of groceries costing ₹1,000 today costs ₹1,060 a year from now, that 6% rise reflects the inflation rate experienced for that basket of goods.',
    takeaways: ['Erodes purchasing power of uninvested cash over time', 'Investment returns should be evaluated after adjusting for inflation', 'Moderate inflation is normal in growing economies', 'A key reason long-term investing matters more than just saving'],
    mistakes: ['Keeping large sums in low-interest savings accounts for many years', 'Ignoring real (inflation-adjusted) returns when evaluating investments', 'Underestimating future costs like education or healthcare due to inflation'],
    related: ['compounding', 'lifestyle-inflation', 'investing', 'wealth-preservation'],
    learnNext: ['compounding', 'wealth-preservation', 'investing'],
  },
  'investing': {
    term: 'Investing', cat: 'Money Basics', icon: '💡', diff: 'Beginner', read: '1 min',
    def: 'Investing is the act of allocating money into assets — such as equities, bonds, mutual funds, or real estate — with the expectation of generating income or capital appreciation over time.',
    source: 'Sources: standard finance reference definitions',
    simple: 'It\'s putting your money to work, instead of letting it sit idle, with the goal of growing it over time — accepting some risk in exchange for the potential of higher returns than plain saving.',
    example: 'Rather than keeping all savings in a bank account, an investor allocates a portion into mutual funds and stocks, aiming for growth that outpaces inflation over the long run.',
    takeaways: ['Different from saving — involves accepting some risk for potential growth', 'Returns are never guaranteed, only probabilistic over time', 'Time horizon should guide how much risk to take', 'Diversification and goal alignment improve long-term outcomes'],
    mistakes: ['Confusing investing with speculation or short-term trading', 'Investing money that may be needed in the near term into volatile assets', 'Starting too late, losing years of potential compounding'],
    related: ['compounding', 'risk', 'return', 'diversification'],
    learnNext: ['compounding', 'risk-vs-return', 'diversification'],
  },
  'large-cap-fund': {
    term: 'Large Cap Fund', cat: 'Mutual Funds', icon: '🏙️', diff: 'Beginner', read: '2 min',
    def: 'A large cap fund is an equity mutual fund that invests predominantly in companies with large market capitalization — typically well-established, financially stable businesses — aiming for relatively steadier, lower-volatility equity returns.',
    source: 'Sources: standard mutual fund category definitions used by AMCs and regulators',
    simple: 'It invests in the biggest, most established companies, which tend to be steadier — though usually slower-growing — than smaller, newer businesses.',
    example: 'A large cap fund might hold shares of well-known, financially established companies across sectors, aiming for steady long-term growth with comparatively lower volatility than small-cap funds.',
    takeaways: ['Invests in established, financially stable, large companies', 'Generally less volatile than mid-cap or small-cap funds', 'Often used as a core, lower-risk equity holding', 'Growth potential is typically steadier but slower than smaller companies'],
    mistakes: ['Expecting small-cap-like growth from a large-cap fund', 'Holding only large-cap funds and missing diversification across market caps', 'Ignoring expense ratios when comparing similar large-cap fund options'],
    related: ['mid-cap-fund', 'small-cap-fund', 'flexi-cap-fund', 'index-fund'],
    learnNext: ['mid-cap-fund', 'small-cap-fund', 'flexi-cap-fund'],
  },
  'lifestyle-inflation': {
    term: 'Lifestyle Inflation', cat: 'Behavioral Finance', icon: '📈', diff: 'Intermediate', read: '2 min',
    def: 'Lifestyle inflation, also called lifestyle creep, is the tendency for personal spending to increase in proportion with rising income, often gradually and unconsciously, which can limit the ability to save, invest, or reach long-term financial goals.',
    source: 'Sources: Rocket Money, Thrivent, Wikipedia (lifestyle creep)',
    simple: 'As you earn more, your spending quietly creeps up too — nicer dinners, new gadgets, bigger rent — until a raise barely changes how much you actually save.',
    example: 'After a salary increase from ₹60,000 to ₹75,000 a month, someone\'s expenses rise from ₹50,000 to ₹65,000 on non-essentials, leaving the same savings amount despite earning more.',
    takeaways: ['Spending rises alongside income, often without conscious decisions', 'Can quietly prevent savings rates from improving despite raises', 'Often triggered by promotions, bonuses, or paying off old debt', 'Directing a portion of any raise to savings first helps counter it'],
    mistakes: ['Increasing fixed costs like rent or EMIs immediately after a raise', 'Not pre-deciding where extra income goes before it gets spent', 'Comparing lifestyle to peers rather than personal financial goals'],
    related: ['emotional-investing', 'net-worth', 'wealth-preservation', 'goal-based-investing'],
    learnNext: ['net-worth', 'goal-based-investing', 'wealth-preservation'],
  },
  'long-term-goals': {
    term: 'Long-Term Goals', cat: 'Financial Planning', icon: '📅', diff: 'Beginner', read: '1 min',
    def: 'Long-term financial goals are objectives with a time horizon generally exceeding 7–10 years, such as retirement or children\'s higher education, that typically allow for greater allocation to growth-oriented, higher-volatility assets.',
    source: 'Sources: standard financial-planning time-horizon frameworks',
    simple: 'These are the big goals that are still years away — like retirement — giving you enough time to ride out short-term market ups and downs.',
    example: 'Saving for retirement 25 years away allows an investor to hold a larger proportion of equity, since there\'s enough time to recover from interim market downturns.',
    takeaways: ['Time horizon typically beyond 7–10 years', 'Can usually tolerate higher equity exposure and short-term volatility', 'Benefits significantly from compounding over time', 'Should still be reviewed periodically, not ignored entirely'],
    mistakes: ['Being too conservative early on and missing growth potential', 'Not increasing safety as the goal date eventually approaches', 'Treating a long-term goal\'s investments as available for short-term needs'],
    related: ['short-term-goals', 'medium-term-goals', 'goal-based-investing', 'compounding'],
    learnNext: ['medium-term-goals', 'short-term-goals', 'compounding'],
  },
  'lump-sum-investing': {
    term: 'Lump Sum Investing', cat: 'Investing', icon: '💰', diff: 'Beginner', read: '1 min',
    def: 'Lump sum investing is the practice of investing a large amount of capital into the market at one time, rather than spreading the investment across multiple smaller installments over a period of time.',
    source: 'Sources: standard investment terminology',
    simple: 'Instead of investing little by little, you put a large amount in all at once — which can work well if markets rise afterward, but carries more timing risk than spreading it out.',
    example: 'An investor receiving a ₹5,00,000 bonus might invest the entire amount into a mutual fund in a single transaction, rather than spreading it across several months.',
    takeaways: ['Invests the full amount immediately rather than gradually', 'Historically performs well in rising markets, on average, over long periods', 'Carries more short-term timing risk than staggered investing', 'Suited to investors comfortable with near-term volatility'],
    mistakes: ['Lump-sum investing money needed again within a year or two', 'Investing the entire amount right before a known major event without considering risk', 'Avoiding lump sum entirely out of fear, while letting the cash sit idle and lose value to inflation'],
    related: ['sip-systematic-investment-plan', 'compounding', 'risk', 'market-volatility'],
    learnNext: ['sip-systematic-investment-plan', 'market-volatility', 'risk'],
  },
  'market-crash': {
    term: 'Market Crash', cat: 'Stock Market', icon: '📉', diff: 'Intermediate', read: '2 min',
    def: 'A market crash is a sudden, sharp, and often unanticipated decline in security prices across a broad market, typically occurring over a very short period and frequently triggered by economic shocks, panic selling, or systemic events.',
    source: 'Sources: standard market terminology',
    simple: 'It\'s a fast, severe drop in prices across the market — much quicker and sharper than a typical bear market decline — often driven by sudden panic or shock events.',
    example: 'A market index losing 10–15% of its value within a few trading days, triggered by an unexpected global economic shock, would typically be described as a market crash.',
    takeaways: ['Distinguished from a bear market by speed and severity', 'Often triggered by shock events or sudden loss of investor confidence', 'Tends to be followed by extended periods of high volatility', 'Staying invested through a crash has historically rewarded patient investors more than panic-selling'],
    mistakes: ['Selling everything in a panic immediately after a crash begins', 'Trying to perfectly time re-entry instead of staying systematically invested', 'Ignoring how a crash affects only paper value unless positions are actually sold'],
    related: ['bear-market', 'market-volatility', 'risk', 'sequence-of-returns-risk'],
    learnNext: ['bear-market', 'market-volatility', 'sequence-of-returns-risk'],
  },
  'market-volatility': {
    term: 'Market Volatility', cat: 'Stock Market', icon: '📶', diff: 'Intermediate', read: '2 min',
    def: 'Market volatility refers to the rate and magnitude at which the price of a security or market index fluctuates over a given period, commonly used as a statistical measure of investment risk and uncertainty.',
    source: 'Sources: standard market risk terminology',
    simple: 'It\'s how much and how fast prices swing up and down. Higher volatility means bigger price swings — and bigger swings can mean bigger gains, but also bigger losses.',
    example: 'A stock whose price swings between -5% and +5% in a single week is considered more volatile than one that moves within a narrow ±1% band over the same period.',
    takeaways: ['Measures the size and frequency of price swings, not direction alone', 'Higher volatility generally implies higher potential risk and reward', 'Diversification can help reduce, though not eliminate, portfolio-level volatility', 'Short-term volatility matters less to long-term goals than it feels like it does'],
    mistakes: ['Reacting emotionally to every short-term price swing', 'Equating high volatility automatically with a bad investment', 'Avoiding equity entirely due to volatility, sacrificing long-term growth'],
    related: ['risk', 'bear-market', 'emotional-investing', 'sequence-of-returns-risk'],
    learnNext: ['risk', 'emotional-investing', 'bear-market'],
  },
  'mid-cap-fund': {
    term: 'Mid Cap Fund', cat: 'Mutual Funds', icon: '🏘️', diff: 'Intermediate', read: '2 min',
    def: 'A mid cap fund is an equity mutual fund that invests primarily in companies with medium market capitalization, positioned between large-cap and small-cap firms, generally offering a balance between growth potential and relative stability.',
    source: 'Sources: standard mutual fund category definitions used by AMCs and regulators',
    simple: 'It invests in mid-sized companies — bigger and more established than small startups, but smaller and often faster-growing than the largest blue-chip companies.',
    example: 'A mid cap fund might hold growing companies that have outgrown small-cap status but haven\'t yet reached the scale of the largest market leaders, aiming for above-average growth with moderate risk.',
    takeaways: ['Sits between large-cap stability and small-cap growth potential', 'Generally more volatile than large-cap, less than small-cap funds', 'Can offer stronger long-term growth potential than large-cap funds', 'Best suited to medium-to-long time horizons given higher volatility'],
    mistakes: ['Allocating too heavily to mid-cap funds for short-term goals', 'Ignoring the higher volatility relative to large-cap during downturns', 'Chasing mid-cap funds purely based on a recent strong run'],
    related: ['large-cap-fund', 'small-cap-fund', 'flexi-cap-fund', 'risk'],
    learnNext: ['large-cap-fund', 'small-cap-fund', 'flexi-cap-fund'],
  },
  'money-market-fund': {
    term: 'Money Market Fund', cat: 'Mutual Funds', icon: '🏦', diff: 'Beginner', read: '2 min',
    def: 'A money market fund is a mutual fund that invests in short-term, highly liquid, low-risk debt instruments such as treasury bills and commercial paper, aiming to preserve capital and provide modest income with high liquidity.',
    source: 'Sources: standard mutual fund category definitions used by AMCs and regulators',
    simple: 'It\'s one of the safest, most liquid types of funds — good for parking money you might need soon, rather than for long-term growth.',
    example: 'An investor holding surplus cash for a few months before a planned expense might park it in a money market fund rather than a savings account, for slightly better returns with similar liquidity.',
    takeaways: ['Invests in short-term, low-risk, highly liquid instruments', 'Prioritizes capital preservation over growth', 'Often used for parking short-term surplus cash', 'Returns are modest compared to equity or even longer-duration debt funds'],
    mistakes: ['Expecting meaningful long-term growth from a money market fund', 'Using it as a substitute for an emergency fund without checking liquidity terms', 'Comparing its returns directly against equity fund performance'],
    related: ['debt-fund', 'emergency-fund', 'short-term-goals', 'risk'],
    learnNext: ['debt-fund', 'emergency-fund', 'short-term-goals'],
  },
  'net-worth': {
    term: 'Net Worth', cat: 'Money Basics', icon: '₹', diff: 'Beginner', read: '1 min',
    def: 'Net worth is the total value of an individual\'s assets — including cash, investments, and property — minus all outstanding liabilities, such as loans and debts, providing a snapshot of overall financial position at a point in time.',
    source: 'Sources: standard personal finance terminology',
    simple: 'It\'s everything you own minus everything you owe. A simple number that tells you whether you\'re actually building wealth over time, beyond just income.',
    example: 'Someone with ₹15,00,000 in savings, investments, and property, and ₹5,00,000 in loans, has a net worth of ₹10,00,000.',
    takeaways: ['Calculated as total assets minus total liabilities', 'A more meaningful wealth indicator than income alone', 'Should be tracked over time, not just as a single snapshot', 'Improves through both asset growth and debt reduction'],
    mistakes: ['Confusing high income with high net worth', 'Tracking net worth only once instead of periodically', 'Excluding liabilities like credit card debt when calculating it'],
    related: ['emergency-fund', 'wealth-preservation', 'financial-independence', 'lifestyle-inflation'],
    learnNext: ['wealth-preservation', 'financial-independence', 'emergency-fund'],
  },
  'portfolio': {
    term: 'Portfolio', cat: 'Portfolio Management', icon: '🗂️', diff: 'Beginner', read: '1 min',
    def: 'A portfolio is the complete collection of financial investments held by an individual or institution, which may include stocks, bonds, mutual funds, cash, and other assets, managed collectively to meet specific financial objectives.',
    source: 'Sources: standard finance reference definitions',
    simple: 'It\'s everything you\'ve invested in, looked at together as one whole — not just each holding on its own.',
    example: 'An investor\'s portfolio might include equity mutual funds, a debt fund, some gold exposure, and cash reserves, viewed together to assess overall risk and progress toward goals.',
    takeaways: ['Refers to the entire collection of holdings, not a single investment', 'Should be evaluated as a whole, not holding-by-holding', 'Composition should reflect goals, risk tolerance, and time horizon', 'Needs periodic review and rebalancing as conditions change'],
    mistakes: ['Evaluating each holding in isolation instead of total portfolio impact', 'Letting a portfolio drift far from its intended allocation over time', 'Building a portfolio around products sold rather than personal goals'],
    related: ['asset-allocation', 'portfolio-rebalancing', 'portfolio-review', 'diversification'],
    learnNext: ['portfolio-rebalancing', 'portfolio-review', 'asset-allocation'],
  },
  'portfolio-concentration-risk': {
    term: 'Portfolio Concentration Risk', cat: 'Portfolio Management', icon: '🎯', diff: 'Advanced', read: '3 min',
    def: 'Portfolio concentration risk is the risk that arises when a disproportionate share of a portfolio\'s value depends on a single asset, sector, or closely correlated group of holdings, leaving the portfolio vulnerable to outsized losses if that exposure underperforms.',
    source: 'Sources: Britannica Money, American Century, AMC research notes',
    simple: 'It\'s when too much of your money depends on one thing going right — even if you technically hold many investments, if they\'re all tied to the same risk, you\'re more exposed than you might realize.',
    example: 'An investor holding ten different mutual funds that are all heavily weighted toward the same handful of technology stocks is still carrying significant concentration risk, despite appearing diversified on paper.',
    takeaways: ['Can exist even within a portfolio that holds many different funds', 'Driven by correlation between holdings, not just the number of holdings', 'Often grows unintentionally after one investment performs very well', 'Best identified by checking overlap and sector weight across all holdings'],
    mistakes: ['Assuming more funds automatically means less concentration risk', 'Letting one outperforming holding grow to dominate the portfolio unchecked', 'Not checking for overlapping stocks across multiple mutual funds'],
    related: ['diversification', 'portfolio', 'asset-allocation', 'portfolio-rebalancing'],
    learnNext: ['diversification', 'portfolio-rebalancing', 'portfolio-review'],
  },
  'portfolio-rebalancing': {
    term: 'Portfolio Rebalancing', cat: 'Portfolio Management', icon: '⚖️', diff: 'Intermediate', read: '2 min',
    def: 'Portfolio rebalancing is the periodic process of realigning a portfolio\'s asset allocation back to its original or target weights by buying or selling holdings, typically performed after market movements cause the allocation to drift.',
    source: 'Sources: standard portfolio management terminology',
    simple: 'Over time, some investments grow faster than others, throwing your original mix off balance. Rebalancing means adjusting things back to your intended plan.',
    example: 'If equities grow from 60% to 72% of a portfolio after a strong rally, rebalancing might involve selling some equity and buying debt funds to restore the original 60-40 mix.',
    takeaways: ['Restores a portfolio to its intended risk level after market drift', 'Can be done on a fixed schedule or when allocation drifts past a threshold', 'Helps enforce discipline — selling some winners, buying underweighted assets', 'Should account for tax and transaction costs when executed'],
    mistakes: ['Never rebalancing, letting risk levels drift far from original intent', 'Rebalancing too frequently and incurring unnecessary costs or taxes', 'Rebalancing based on emotion rather than a predefined rule or threshold'],
    related: ['asset-allocation', 'portfolio', 'portfolio-review', 'diversification'],
    learnNext: ['portfolio-review', 'asset-allocation', 'portfolio'],
  },
  'portfolio-review': {
    term: 'Portfolio Review', cat: 'Portfolio Management', icon: '🔍', diff: 'Beginner', read: '1 min',
    def: 'A portfolio review is the periodic process of evaluating a portfolio\'s holdings, performance, allocation, and alignment with an investor\'s goals and risk tolerance, typically used to inform decisions about rebalancing or strategy changes.',
    source: 'Sources: standard financial planning practice terminology',
    simple: 'It\'s a regular check-up for your investments — making sure everything still matches your goals, risk comfort, and life situation, not just checking whether returns look good.',
    example: 'An annual portfolio review might reveal that a fund has consistently underperformed its category peers, prompting the investor to consider a replacement.',
    takeaways: ['Should happen on a regular schedule, not only during market stress', 'Looks at allocation, performance, costs, and goal alignment together', 'Often triggers rebalancing or fund-level changes', 'Useful after major life events like a new goal or change in income'],
    mistakes: ['Only reviewing a portfolio when markets are falling and panic sets in', 'Focusing solely on returns while ignoring risk or cost changes', 'Reviewing too rarely to catch meaningful allocation drift'],
    related: ['portfolio-rebalancing', 'portfolio', 'goal-based-investing', 'risk'],
    learnNext: ['portfolio-rebalancing', 'portfolio', 'goal-based-investing'],
  },
  'return': {
    term: 'Return', cat: 'Investing', icon: '↑', diff: 'Beginner', read: '1 min',
    def: 'Return is the gain or loss generated by an investment over a specified period, expressed as a percentage of the original amount invested, encompassing income such as interest or dividends as well as capital appreciation.',
    source: 'Sources: standard finance reference definitions',
    simple: 'It\'s how much you made — or lost — on an investment, usually shown as a percentage of what you originally put in.',
    example: 'An investment of ₹1,00,000 that grows to ₹1,12,000 in a year has generated a 12% return for that period.',
    takeaways: ['Expressed as a percentage relative to the amount invested', 'Includes both capital appreciation and income like dividends or interest', 'Should be evaluated net of inflation, taxes, and fees for real comparison', 'Past returns don\'t guarantee future performance'],
    mistakes: ['Comparing absolute return figures without accounting for risk taken', 'Ignoring the impact of fees and taxes on actual realized returns', 'Chasing the highest recent return without checking consistency over time'],
    related: ['risk-vs-return', 'risk', 'compounding', 'investing'],
    learnNext: ['risk-vs-return', 'compounding', 'investing'],
  },
  'risk': {
    term: 'Risk', cat: 'Investing', icon: '⚠️', diff: 'Beginner', read: '1 min',
    def: 'Risk, in an investment context, refers to the possibility that actual returns will differ from expected returns, including the potential for partial or total loss of the original investment.',
    source: 'Sources: standard finance reference definitions',
    simple: 'It\'s the chance that things don\'t go as planned — an investment could earn less than expected, or even lose money, and risk is a way of describing how likely and how large that uncertainty is.',
    example: 'A stock with highly variable past returns is generally considered riskier than a government bond with stable, predictable interest payments, even though the stock may offer higher potential returns.',
    takeaways: ['Represents uncertainty of outcomes, not just the possibility of loss', 'Different asset classes carry different levels and types of risk', 'Risk tolerance should match an investor\'s goals and time horizon', 'Higher potential returns generally come with higher risk'],
    mistakes: ['Equating "no recent loss" with "no risk" in an investment', 'Taking on more risk than one\'s time horizon or goals can absorb', 'Avoiding all risk and missing growth needed to beat inflation'],
    related: ['risk-vs-return', 'return', 'diversification', 'market-volatility'],
    learnNext: ['risk-vs-return', 'diversification', 'market-volatility'],
  },
  'risk-vs-return': {
    term: 'Risk vs Return', cat: 'Investing', icon: '⚖️', diff: 'Beginner', read: '2 min',
    def: 'Risk versus return describes the fundamental trade-off in investing whereby potential returns on an investment tend to rise with an increase in risk, meaning investors typically must accept greater uncertainty to pursue higher potential gains.',
    source: 'Sources: standard finance reference definitions',
    simple: 'Generally, you can\'t get higher potential rewards without accepting more uncertainty — the trade-off between how much you could gain and how much you could lose is at the heart of every investment decision.',
    example: 'Government bonds typically offer lower, steadier returns with lower risk, while equities offer higher potential long-term returns but with greater short-term price swings.',
    takeaways: ['Higher potential returns are generally paired with higher risk', 'No investment offers high returns with guaranteed safety', 'The right balance depends on goals, time horizon, and comfort with volatility', 'Diversification helps optimize this trade-off, not eliminate it'],
    mistakes: ['Seeking high returns while expecting no risk exposure', 'Choosing investments based on return alone, ignoring the risk taken to get there', 'Misjudging personal risk tolerance under real market stress, not just in theory'],
    related: ['risk', 'return', 'diversification', 'asset-allocation'],
    learnNext: ['risk', 'return', 'asset-allocation'],
  },
  'sequence-of-returns-risk': {
    term: 'Sequence of Returns Risk', cat: 'Retirement', icon: '🗓️', diff: 'Advanced', read: '3 min',
    def: 'Sequence of returns risk is the risk that the timing or order of investment returns, particularly when combined with ongoing withdrawals, can significantly affect how long a portfolio lasts — even if the long-term average return is identical to another scenario.',
    source: 'Sources: Charles Schwab, Northwestern Mutual, MIT Sloan',
    simple: 'Two people can earn the exact same average return over time, but if one experiences a market downturn right when they start withdrawing money, their savings can run out much sooner than the other\'s.',
    example: 'Two retirees with identical average annual returns over 20 years can end up with very different portfolio balances if one faced poor returns in the first few retirement years while withdrawing income, and the other didn\'t.',
    takeaways: ['Matters most in the years just before and after withdrawals begin', 'Identical average returns can still produce very different outcomes', 'Distinct from general market risk — it\'s specifically about timing of withdrawals', 'Strategies like flexible withdrawal rates can help reduce its impact'],
    mistakes: ['Assuming average historical returns guarantee a safe withdrawal plan', 'Withdrawing a fixed amount regardless of recent market performance', 'Ignoring this risk because long-term averages look reassuring on paper'],
    related: ['market-volatility', 'financial-independence', 'wealth-preservation', 'risk'],
    learnNext: ['financial-independence', 'market-volatility', 'wealth-preservation'],
  },
  'short-term-goals': {
    term: 'Short-Term Goals', cat: 'Financial Planning', icon: '⏱️', diff: 'Beginner', read: '1 min',
    def: 'Short-term financial goals are objectives with a time horizon generally under 2–3 years, such as building an emergency fund or saving for a vacation, typically requiring capital preservation over growth-seeking risk.',
    source: 'Sources: standard financial-planning time-horizon frameworks',
    simple: 'These are goals that are coming up soon — within a couple of years — so the money for them needs to stay safe and accessible rather than chasing high growth.',
    example: 'Saving ₹2,00,000 for a wedding happening in 14 months calls for a savings account or short-duration debt fund, not equity, since there\'s little time to recover from a downturn.',
    takeaways: ['Time horizon typically under 2–3 years', 'Prioritizes capital safety and liquidity over growth', 'Equity exposure is generally inappropriate for this horizon', 'Should be kept separate from long-term investment goals'],
    mistakes: ['Investing short-term goal money into equity for higher returns', 'Locking short-term funds into instruments with exit penalties or long lock-ins', 'Mixing short-term goal money with long-term investment portfolios'],
    related: ['medium-term-goals', 'long-term-goals', 'emergency-fund', 'money-market-fund'],
    learnNext: ['medium-term-goals', 'emergency-fund', 'money-market-fund'],
  },
  'sip-systematic-investment-plan': {
    term: 'SIP (Systematic Investment Plan)', cat: 'Mutual Funds', icon: '♾️', diff: 'Beginner', read: '2 min',
    def: 'A Systematic Investment Plan (SIP) is a method of investing a fixed amount into a mutual fund at regular intervals — typically monthly — allowing investors to build positions gradually and benefit from rupee-cost averaging over time.',
    source: 'Sources: standard mutual fund category and process definitions used by AMCs',
    simple: 'Instead of investing a large amount at once, you invest a fixed, smaller amount regularly — say every month — which smooths out the impact of market ups and downs over time.',
    example: 'Investing ₹5,000 every month into a mutual fund means buying more units when prices are low and fewer when prices are high, averaging the purchase cost over time rather than guessing the best moment to invest.',
    takeaways: ['Invests a fixed amount at regular intervals, not a one-time lump sum', 'Helps average purchase cost across market ups and downs', 'Builds investing discipline without requiring market timing', 'Particularly suited to long-term goals and salaried income patterns'],
    mistakes: ['Stopping SIPs during market downturns, missing lower-cost purchase opportunities', 'Treating SIP as a guarantee of profit rather than a disciplined process', 'Choosing SIP amount without first building an emergency fund'],
    related: ['compounding', 'lump-sum-investing', 'index-fund', 'long-term-goals'],
    learnNext: ['compounding', 'lump-sum-investing', 'long-term-goals'],
  },
  'small-cap-fund': {
    term: 'Small Cap Fund', cat: 'Mutual Funds', icon: '🌱', diff: 'Intermediate', read: '2 min',
    def: 'A small cap fund is an equity mutual fund that invests primarily in companies with small market capitalization, which tend to offer higher growth potential alongside significantly higher volatility and risk than larger companies.',
    source: 'Sources: standard mutual fund category definitions used by AMCs and regulators',
    simple: 'It invests in smaller, often younger companies that have more room to grow quickly — but can also fall sharply, since they\'re less established and more sensitive to market stress.',
    example: 'A small cap fund might hold emerging companies with strong growth potential but limited track records, making the fund more volatile than large-cap or mid-cap equivalents during downturns.',
    takeaways: ['Highest growth potential, but also highest volatility, among equity fund categories', 'Best suited to long time horizons that can absorb sharp downturns', 'Often more sensitive to economic slowdowns than larger companies', 'Usually a smaller component of a diversified portfolio, not the core'],
    mistakes: ['Allocating a large share of a short-term portfolio to small-cap funds', 'Panic-selling during the sharp downturns this category is prone to', 'Chasing recent outsized small-cap returns without considering the elevated risk'],
    related: ['mid-cap-fund', 'large-cap-fund', 'flexi-cap-fund', 'risk'],
    learnNext: ['mid-cap-fund', 'large-cap-fund', 'risk'],
  },
  'tax-efficiency': {
    term: 'Tax Efficiency', cat: 'Taxation', icon: '🧾', diff: 'Intermediate', read: '2 min',
    def: 'Tax efficiency refers to structuring investments and account choices in a way that minimizes the tax burden on returns, thereby maximizing the after-tax growth of a portfolio over time.',
    source: 'Sources: Charles Schwab, T. Rowe Price, BlackRock',
    simple: 'It\'s about keeping more of what you earn after tax — by choosing the right investments and accounts so taxes take a smaller bite out of your returns.',
    example: 'Choosing a fund with low portfolio turnover, and holding investments long enough to qualify for lower long-term capital gains tax rates, are both ways of improving tax efficiency.',
    takeaways: ['Focuses on after-tax returns, not just headline pre-tax returns', 'Influenced by holding period, fund turnover, and account type', 'Closely related to, but distinct from, asset location strategy', 'Should never come at the cost of an otherwise sound investment decision'],
    mistakes: ['Making investment decisions purely to avoid tax, ignoring underlying quality', 'Ignoring holding-period rules that affect applicable capital gains tax rates', 'Overlooking how frequent buying and selling triggers avoidable tax events'],
    related: ['taxation', 'asset-location', 'portfolio', 'return'],
    learnNext: ['taxation', 'asset-location', 'return'],
  },
  'taxation': {
    term: 'Taxation', cat: 'Taxation', icon: '📋', diff: 'Beginner', read: '2 min',
    def: 'Taxation, in the context of personal finance, refers to the system of levies imposed by government authorities on income, capital gains, and other financial transactions, which directly affects the net returns an investor actually keeps.',
    source: 'Sources: standard public finance terminology',
    simple: 'It\'s the portion of your income or investment gains that goes to the government — and it directly affects how much of your return you actually get to keep.',
    example: 'A mutual fund investment that gains ₹50,000 may be taxed at a different rate depending on how long it was held, directly changing the investor\'s actual take-home gain.',
    takeaways: ['Directly reduces the net return an investor actually realizes', 'Tax treatment often depends on the holding period of an investment', 'Different investment types can be taxed very differently', 'Should be factored into every comparison of investment options'],
    mistakes: ['Comparing investment options on pre-tax returns alone', 'Triggering avoidable tax events through frequent unnecessary transactions', 'Ignoring changes in tax rules that affect existing holdings'],
    related: ['tax-efficiency', 'asset-location', 'return', 'portfolio'],
    learnNext: ['tax-efficiency', 'asset-location', 'return'],
  },
  'term-insurance': {
    term: 'Term Insurance', cat: 'Insurance', icon: '🛡️', diff: 'Beginner', read: '2 min',
    def: 'Term insurance is a life insurance policy that provides a death benefit to designated beneficiaries if the policyholder dies within a specified term, offering pure protection without any investment or savings component, typically at a lower premium than other life insurance types.',
    source: 'Sources: standard insurance terminology used by insurance regulators and providers',
    simple: 'It\'s pure life cover — if something happens to you during the policy term, your family gets a payout. There\'s no savings or investment built in, which is exactly why it\'s cheaper than other life insurance types.',
    example: 'A 30-year-old buying a ₹1 crore term plan for a 30-year term pays a relatively low annual premium, with the payout going to beneficiaries only if death occurs within that period.',
    takeaways: ['Provides pure protection — no investment or maturity value attached', 'Generally far cheaper than investment-linked life insurance products', 'Coverage ends when the term expires, with no payout if the policyholder survives', 'Sized based on dependents\' needs, debts, and income replacement requirements'],
    mistakes: ['Confusing term insurance with investment products and expecting maturity returns', 'Under-insuring relative to actual dependents and outstanding liabilities', 'Letting a policy lapse due to missed premium payments'],
    related: ['health-insurance', 'net-worth', 'financial-independence', 'emergency-fund'],
    learnNext: ['health-insurance', 'emergency-fund', 'net-worth'],
  },
  'time-value-of-money': {
    term: 'Time Value of Money', cat: 'Money Basics', icon: '⏳', diff: 'Beginner', read: '2 min',
    def: 'The time value of money is the financial principle that a given sum of money has greater value today than the same nominal amount received in the future, due to its potential earning capacity over that intervening time.',
    source: 'Sources: standard finance reference definitions',
    simple: '₹1,000 today is worth more than ₹1,000 a year from now — because that money, if invested today, could grow in the meantime.',
    example: 'Offered a choice between ₹1,00,000 today or ₹1,00,000 in five years, a rational investor prefers receiving it today, since it can be invested and grow during those five years.',
    takeaways: ['Underpins the logic behind compounding and discounting', 'Explains why receiving money sooner is generally preferable', 'Used to compare cash flows occurring at different points in time', 'Foundational concept behind loan, retirement, and goal calculations'],
    mistakes: ['Treating future and present sums of money as directly comparable without adjustment', 'Delaying investing because of the mistaken sense that "later" costs nothing', 'Ignoring this principle when evaluating long-term financial decisions like loans'],
    related: ['compounding', 'return', 'goal-based-investing', 'investing'],
    learnNext: ['compounding', 'return', 'investing'],
  },
  'wealth-preservation': {
    term: 'Wealth Preservation', cat: 'Financial Planning', icon: '🏰', diff: 'Intermediate', read: '2 min',
    def: 'Wealth preservation refers to financial strategies focused on protecting accumulated assets from risks such as market volatility, inflation, and taxation, prioritizing stability and capital protection over aggressive growth.',
    source: 'Sources: U.S. Money Reserve, Davies Wealth Management, Atfinity',
    simple: 'Once you\'ve built wealth, preservation is about protecting it — through diversification, insurance, and careful planning — rather than continuing to chase higher and higher growth.',
    example: 'An investor nearing retirement might shift from growth-focused equities toward a more balanced mix of debt and equity, prioritizing protecting accumulated wealth over further aggressive growth.',
    takeaways: ['Prioritizes protecting existing assets over pursuing further growth', 'Commonly involves diversification, insurance, and tax planning together', 'Becomes more important as wealth accumulates or retirement nears', 'Complements, rather than replaces, earlier wealth accumulation strategies'],
    mistakes: ['Continuing an aggressive growth strategy well past the point it\'s appropriate', 'Treating preservation as meaning zero risk, which can lose ground to inflation', 'Neglecting tax and estate planning as part of an overall preservation strategy'],
    related: ['net-worth', 'generational-wealth', 'financial-independence', 'tax-efficiency'],
    learnNext: ['generational-wealth', 'financial-independence', 'tax-efficiency'],
  },
  'medium-term-goals': {
    term: 'Medium-Term Goals', cat: 'Financial Planning', icon: '🧭', diff: 'Beginner', read: '1 min',
    def: 'Medium-term financial goals are objectives with a time horizon generally between 3 and 7 years, such as buying a car or funding a home down payment, often calling for a balanced mix of growth and stability in the underlying investments.',
    source: 'Sources: standard financial-planning time-horizon frameworks',
    simple: 'These goals sit in the middle — not so soon that you need to play it completely safe, but not so far away that you can ignore short-term risk entirely.',
    example: 'Saving for a home down payment in five years might call for a balanced allocation between debt and equity funds, rather than purely safe instruments or purely high-growth ones.',
    takeaways: ['Time horizon generally between 3 and 7 years', 'Usually calls for a balanced mix of equity and debt exposure', 'Requires more caution than long-term goals as the date approaches', 'Should be reviewed more frequently than long-term goals'],
    mistakes: ['Treating a medium-term goal with the same risk approach as a long-term one', 'Leaving the allocation purely in equity right up to the goal date', 'Failing to gradually shift toward safety as the goal date nears'],
    related: ['short-term-goals', 'long-term-goals', 'goal-based-investing', 'asset-allocation'],
    learnNext: ['long-term-goals', 'short-term-goals', 'asset-allocation'],
  },
  'mutual-funds-investing': {
    term: 'Mutual Funds', cat: 'Mutual Funds', icon: '🧺', diff: 'Beginner', read: '2 min',
    def: 'A mutual fund is a professionally managed investment vehicle that pools money from multiple investors to purchase a diversified portfolio of securities such as stocks, bonds, or other assets, with returns distributed proportionally to each investor\'s holding.',
    source: 'Sources: standard mutual fund category definitions used by AMCs and regulators',
    simple: 'It\'s a pool of money from many investors, managed by professionals, that buys a basket of investments — giving each investor instant diversification without having to pick individual stocks themselves.',
    example: 'Rather than buying shares of dozens of individual companies, an investor can buy units of a single mutual fund that already holds a diversified basket of those companies.',
    takeaways: ['Pools money from many investors into a professionally managed portfolio', 'Offers built-in diversification difficult to achieve with small individual investments', 'Comes in many categories — equity, debt, hybrid, and more', 'Returns and risk depend on the fund\'s category and underlying holdings'],
    mistakes: ['Choosing a fund based on past returns alone without checking category and risk', 'Ignoring the expense ratio\'s long-term drag on returns', 'Not checking whether a fund\'s category actually matches personal goals'],
    related: ['sip-systematic-investment-plan', 'index-fund', 'large-cap-fund', 'diversification'],
    learnNext: ['sip-systematic-investment-plan', 'index-fund', 'diversification'],
  },
}

const TOTAL = Object.keys(CONCEPTS).length

const CATS = [
  { name: 'Investing', icon: '📊', big: true },
  { name: 'Mutual Funds', icon: '🧺', big: false },
  { name: 'Stock Market', icon: '📈', big: false },
  { name: 'Portfolio Management', icon: '🗂️', big: false },
  { name: 'Money Basics', icon: '💡', big: false },
  { name: 'Financial Planning', icon: '🧭', big: false },
  { name: 'Behavioral Finance', icon: '🧠', big: false },
  { name: 'Taxation', icon: '🧾', big: false },
  { name: 'Insurance', icon: '🛡️', big: false },
  { name: 'Retirement', icon: '🏖️', big: false },
  { name: 'Economics', icon: '%', big: false },
]

const TRENDING = [
  'compounding', 'index-fund', 'tax-efficiency',
  'portfolio-concentration-risk', 'sip-systematic-investment-plan', 'diversification',
]

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500..650&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
  @keyframes kh-fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes kh-spin   { to { transform:rotate(360deg); } }
  .kh-enter { animation: kh-fadeUp 0.22s ease both; }
  .kh-strip::-webkit-scrollbar { height: 4px; }
  .kh-strip::-webkit-scrollbar-track { background: transparent; }
  .kh-strip::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
`

// ─── SVG icons ────────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} width={11} height={11}>
    <path d="M20 6L9 17l-5-5"/>
  </svg>
)
const CrossIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} width={10} height={10}>
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
)
const ChevronRight = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M9 18l6-6-6-6"/>
  </svg>
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

function catCount(name: string) {
  return Object.values(CONCEPTS).filter(c => c.cat === name).length
}

function availableLetters(): Set<string> {
  const s = new Set<string>()
  Object.values(CONCEPTS).forEach(c => s.add(c.term[0].toUpperCase()))
  return s
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function KnowledgeHubPage() {
  const { dark, toggleTheme } = useTheme()
  const router = useRouter()

  const [screen, setScreen]               = useState<'home' | 'concept'>('home')
  const [activeConcept, setActiveConcept] = useState<string | null>(null)
  const [searchQuery, setSearchQuery]     = useState('')
  const [azLetter, setAzLetter]           = useState('ALL')
  const [catFilter, setCatFilter]         = useState<string | null>(null)
  const [recentlyViewed, setRecent]       = useState<string[]>([])
  const [favorites, setFavorites]         = useState<Set<string>>(new Set())
  const [showFavOnly, setShowFavOnly]     = useState(false)

  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem('valam_kh_recent') ?? '[]') as string[]
      const f = JSON.parse(localStorage.getItem('valam_kh_favorites') ?? '[]') as string[]
      setRecent(r.filter(k => CONCEPTS[k]))
      setFavorites(new Set(f.filter(k => CONCEPTS[k])))
    } catch { /* ignore parse errors */ }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('kh-search')?.focus()
      }
      if (e.key === 'Escape' && screen === 'concept') goHome()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  function openConcept(key: string) {
    if (!CONCEPTS[key]) return
    setActiveConcept(key)
    setScreen('concept')
    setRecent(prev => {
      const next = [key, ...prev.filter(k => k !== key)].slice(0, 5)
      localStorage.setItem('valam_kh_recent', JSON.stringify(next))
      return next
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goHome() {
    setScreen('home')
    setActiveConcept(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleFavorite(key: string) {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      localStorage.setItem('valam_kh_favorites', JSON.stringify([...next]))
      return next
    })
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const letters = availableLetters()

  const filteredEntries = Object.entries(CONCEPTS)
    .sort((a, b) => a[1].term.localeCompare(b[1].term))
    .filter(([, c]) => {
      if (showFavOnly && !favorites.has(Object.keys(CONCEPTS).find(k => CONCEPTS[k] === c) ?? '')) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return c.term.toLowerCase().includes(q) || c.cat.toLowerCase().includes(q)
      }
      if (catFilter) return c.cat === catFilter
      if (azLetter !== 'ALL') return c.term[0].toUpperCase() === azLetter
      return true
    })

  // for continue learning card
  const suggestKey = TRENDING.find(k => !recentlyViewed.includes(k)) ?? TRENDING[0]
  const suggestConcept = CONCEPTS[suggestKey]
  const progressPct = Math.round((recentlyViewed.length / TOTAL) * 100)

  // ── Mini nav ───────────────────────────────────────────────────────────────

  const miniNav = (
    <nav style={{
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      padding: '0 28px', height: 52,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 30,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Link href="/" style={{ color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', lineHeight: 1 }}>V</Link>
        </div>
        <span style={{ fontFamily: 'Playfair Display,serif', fontWeight: 600, fontSize: 16, color: 'var(--text)' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>VALAM</Link>
        </span>
        <span style={{
          fontSize: 11, color: 'var(--gold)', background: 'rgba(184,146,74,0.1)',
          borderRadius: 20, padding: '2px 10px', border: '1px solid rgba(184,146,74,0.25)',
          marginLeft: 4, fontWeight: 500,
        }}>Knowledge Hub</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={toggleTheme} style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 20, padding: '4px 12px', fontSize: 11,
          color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
        }}>
          {dark ? '☀ Light' : '◑ Dark'}
        </button>
        <button onClick={handleSignOut} style={{
          background: 'transparent', border: '1px solid var(--border)',
          borderRadius: 20, padding: '4px 14px', fontSize: 11,
          color: 'var(--muted)', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
        }}>Sign Out</button>
      </div>
    </nav>
  )

  // ── Home screen ────────────────────────────────────────────────────────────

  const homeScreen = (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 80px' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>
        <Link href="/dashboard" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Dashboard</Link>
        <span>/</span>
        <Link href="/learning/1" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Learning Hub</Link>
        <span>/</span>
        <span style={{ color: 'var(--gold)', fontWeight: 500 }}>Knowledge Hub</span>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ width: 16, height: 1.5, background: 'var(--gold)', display: 'inline-block' }} />
          <span style={{ fontFamily: '\'IBM Plex Mono\', monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8E661F' }}>
            KNOWLEDGE HUB
          </span>
        </div>
        <h1 style={{ fontFamily: '\'Fraunces\', serif', fontWeight: 600, fontSize: 42, letterSpacing: '-0.015em', margin: '0 0 10px', color: 'var(--text)' }}>
          Knowledge Hub
        </h1>
        <p style={{ fontSize: 15, color: 'var(--muted)', margin: 0, maxWidth: 480, lineHeight: 1.6 }}>
          Learn every financial concept used across VALAM — sourced, structured, and always close at hand.
        </p>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 999, padding: '13px 20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
        }}>
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={2}>
            <circle cx={11} cy={11} r={7}/><line x1={21} y1={21} x2={16.65} y2={16.65}/>
          </svg>
          <input
            id="kh-search"
            type="text"
            placeholder="Search any financial concept..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setAzLetter('ALL'); setCatFilter(null) }}
            style={{
              border: 'none', outline: 'none', background: 'none',
              fontSize: 14, width: '100%', color: 'var(--text)', fontFamily: 'Inter,sans-serif',
            }}
          />
          <span style={{
            fontFamily: '\'IBM Plex Mono\', monospace', fontSize: 11, color: 'var(--muted)',
            border: '1px solid var(--border)', borderRadius: 7, padding: '3px 7px', flexShrink: 0,
          }}>⌘K</span>
        </div>
        <button
          onClick={() => setShowFavOnly(f => !f)}
          title="Favorites"
          style={{
            width: 48, height: 48, borderRadius: '50%',
            background: showFavOnly ? 'rgba(184,146,74,0.12)' : 'var(--surface)',
            border: showFavOnly ? '1px solid var(--gold)' : '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: showFavOnly ? 'var(--gold)' : 'var(--muted)', cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
          }}>
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>

      {/* Search results */}
      {searchQuery && (
        <div className="kh-enter">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: 12 }}>
            {filteredEntries.length} result{filteredEntries.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
          </div>
          {filteredEntries.length === 0 ? (
            <div style={{ padding: '30px 22px', fontSize: 13, color: 'var(--muted)', textAlign: 'center',
              background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14 }}>
              No concepts found for &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              {filteredEntries.map(([key, c]) => (
                <div key={key} onClick={() => openConcept(key)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 22px', background: 'var(--surface)',
                  borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  transition: 'background 0.15s',
                }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                   onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontFamily: '\'Fraunces\', serif', fontWeight: 600, fontSize: 14, color: 'var(--gold)', width: 22, flexShrink: 0 }}>
                      {c.term[0].toUpperCase()}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{c.term}</span>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>{c.cat}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!searchQuery && (<>

        {/* Section 1: Recently Viewed */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: 14 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(184,146,74,0.12)', color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: '\'IBM Plex Mono\', monospace' }}>1</span>
            Recently Viewed
          </div>
          {recentlyViewed.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
              Start exploring concepts to see your history here.
            </p>
          ) : (
            <div className="kh-strip" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
              {recentlyViewed.map(key => {
                const c = CONCEPTS[key]
                if (!c) return null
                return (
                  <div key={key} onClick={() => openConcept(key)} style={{
                    flexShrink: 0, width: 160, background: 'var(--surface)',
                    border: '1px solid var(--border)', borderRadius: 14, padding: 16,
                    cursor: 'pointer', transition: 'transform 0.18s, border-color 0.18s',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = 'translateY(-3px)'; el.style.borderColor = 'var(--gold)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = ''; el.style.borderColor = 'var(--border)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(184,146,74,0.12)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, marginBottom: 12 }}>
                      {c.icon}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{c.term}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.cat}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Section 2: Continue Learning */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: 14 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(184,146,74,0.12)', color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: '\'IBM Plex Mono\', monospace' }}>2</span>
            Continue Learning
          </div>
          <div onClick={() => openConcept(suggestKey)} style={{
            background: 'linear-gradient(135deg, var(--surface) 60%, rgba(184,146,74,0.1) 130%)',
            border: '1px solid var(--border)', borderRadius: 24, padding: '28px 32px',
            cursor: 'pointer', transition: 'border-color 0.18s',
            boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gold)'}
          onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#3C5A45', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {suggestConcept?.cat} · {recentlyViewed.length} of {TOTAL} viewed
              </span>
              <span style={{ fontFamily: '\'IBM Plex Mono\', monospace', fontSize: 13, color: 'var(--muted)' }}>
                {progressPct}%
              </span>
            </div>
            <div style={{ fontFamily: '\'Fraunces\', serif', fontSize: 24, fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
              {suggestConcept?.term}
            </div>
            <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 18px', maxWidth: 440, lineHeight: 1.6 }}>
              {suggestConcept?.simple.slice(0, 100)}…
            </p>
            <div style={{ height: 7, borderRadius: 99, background: 'var(--surface2)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, borderRadius: 99, background: 'linear-gradient(90deg, var(--gold), #3C5A45)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>

        {/* Section 3: Trending */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: 14 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(184,146,74,0.12)', color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: '\'IBM Plex Mono\', monospace' }}>3</span>
            Trending Concepts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TRENDING.map((key, i) => {
              const c = CONCEPTS[key]
              if (!c) return null
              return (
                <div key={key} onClick={() => openConcept(key)} style={{
                  display: 'flex', alignItems: 'center', gap: 18,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '16px 20px', cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  transition: 'border-color 0.18s, transform 0.18s',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--gold)'; el.style.transform = 'translateX(3px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--border)'; el.style.transform = '' }}>
                  <span style={{ fontFamily: '\'Fraunces\', serif', fontSize: 20, fontWeight: 600, color: '#8E661F', width: 28, flexShrink: 0 }}>
                    0{i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{c.term}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{c.cat}</div>
                  </div>
                  <span style={{ fontSize: 12, color: '#3C5A45', fontWeight: 600, fontFamily: '\'IBM Plex Mono\', monospace', flexShrink: 0 }}>
                    ↑ {280 - i * 45}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section 4: Collections */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: 14 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(184,146,74,0.12)', color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: '\'IBM Plex Mono\', monospace' }}>4</span>
            Browse by Collections
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: 128, gap: 12 }}>
            {CATS.filter(cat => catCount(cat.name) > 0).map(cat => {
              const count = catCount(cat.name)
              return (
                <div key={cat.name} onClick={() => { setCatFilter(cat.name); setAzLetter('ALL'); setSearchQuery(''); setTimeout(() => document.getElementById('kh-az-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50) }} style={{
                  background: 'var(--surface)', border: `1px solid ${catFilter === cat.name ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: 20, padding: 18, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  transition: 'border-color 0.18s, transform 0.18s',
                  gridColumn: cat.big ? 'span 2' : 'span 1',
                  gridRow: cat.big ? 'span 2' : 'span 1',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--gold)'; el.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = catFilter === cat.name ? 'var(--gold)' : 'var(--border)'; el.style.transform = '' }}>
                  <div style={{ fontSize: cat.big ? 26 : 22 }}>{cat.icon}</div>
                  <div>
                    <div style={{ fontFamily: '\'Fraunces\', serif', fontWeight: 600, fontSize: cat.big ? 18 : 14, color: 'var(--text)', marginBottom: 3 }}>{cat.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{count} concept{count > 1 ? 's' : ''}</div>
                  </div>
                </div>
              )
            })}
          </div>
          {catFilter && (
            <button onClick={() => setCatFilter(null)} style={{
              marginTop: 12, fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none',
              cursor: 'pointer', padding: '4px 0', fontFamily: 'Inter,sans-serif',
            }}>
              ✕ Clear filter: {catFilter}
            </button>
          )}
        </div>

        {/* Section 5: A-Z */}
        <div id="kh-az-section">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--gold)', marginBottom: 14 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(184,146,74,0.12)', color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: '\'IBM Plex Mono\', monospace' }}>5</span>
            All Concepts · <span style={{ color: 'var(--muted)', fontWeight: 400 }}>{TOTAL} total</span>
          </div>

          {/* A-Z bar */}
          {!catFilter && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {(['ALL', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')] as string[]).map(L => {
                const has = L === 'ALL' || letters.has(L)
                return (
                  <button key={L} onClick={() => has ? setAzLetter(L) : undefined} style={{
                    width: L === 'ALL' ? 44 : 30, height: 30, borderRadius: 9,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 600,
                    background: azLetter === L ? 'var(--gold)' : 'var(--surface)',
                    color: azLetter === L ? '#fff' : has ? 'var(--muted)' : 'var(--muted)',
                    border: azLetter === L ? '1px solid var(--gold)' : '1px solid var(--border)',
                    cursor: has ? 'pointer' : 'default',
                    opacity: has ? 1 : 0.35,
                    fontFamily: 'Inter,sans-serif',
                  }}>
                    {L}
                  </button>
                )
              })}
            </div>
          )}

          {/* Concept rows */}
          <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            {filteredEntries.length === 0 ? (
              <div style={{ padding: '30px 22px', fontSize: 13, color: 'var(--muted)', textAlign: 'center', background: 'var(--surface)' }}>
                No concepts found.
              </div>
            ) : filteredEntries.map(([key, c], idx) => (
              <div key={key} onClick={() => openConcept(key)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 22px', background: 'var(--surface)',
                borderBottom: idx < filteredEntries.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer', gap: 14, transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface2)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                  <span style={{ fontFamily: '\'Fraunces\', serif', fontWeight: 600, fontSize: 14, color: '#8E661F', width: 22, flexShrink: 0 }}>
                    {c.term[0].toUpperCase()}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{c.term}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>{c.cat}</span>
              </div>
            ))}
          </div>
        </div>

      </>)}
    </div>
  )

  // ── Concept screen ─────────────────────────────────────────────────────────

  const conceptScreen = (() => {
    if (!activeConcept) return null
    const c = CONCEPTS[activeConcept]
    if (!c) return null
    const isFav = favorites.has(activeConcept)

    const cardStyle: React.CSSProperties = {
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 24, padding: '26px 30px', marginBottom: 16,
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    }
    const labelStyle: React.CSSProperties = {
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.07em', color: '#8E661F', marginBottom: 14,
    }
    const dotStyle: React.CSSProperties = {
      fontFamily: '\'IBM Plex Mono\', monospace', width: 20, height: 20,
      borderRadius: '50%', background: 'rgba(184,146,74,0.12)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
    }

    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 80px' }} className="kh-enter">

        {/* Back button */}
        <button onClick={goHome} style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          fontSize: 13, fontWeight: 600, color: 'var(--muted)',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '6px 0', marginBottom: 20, fontFamily: 'Inter,sans-serif',
        }}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M15 18l-6-6 6-6"/></svg>
          Back to Knowledge Hub
        </button>

        {/* Meta chips */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 999, background: 'rgba(184,146,74,0.12)', border: '1px solid var(--gold)', color: '#8E661F' }}>
            {c.cat}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 999, background: 'rgba(60,90,69,0.08)', border: '1px solid #3C5A45', color: '#3C5A45' }}>
            ◈ {c.diff}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
            ⏱ {c.read} read
          </span>
        </div>

        {/* Title + actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, gap: 20 }}>
          <h2 style={{ fontFamily: '\'Fraunces\', serif', fontSize: 36, fontWeight: 600, margin: 0, letterSpacing: '-0.01em', color: 'var(--text)' }}>
            {c.term}
          </h2>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button onClick={() => toggleFavorite(activeConcept)} title="Bookmark" style={{
              width: 44, height: 44, borderRadius: '50%',
              background: isFav ? 'rgba(184,146,74,0.12)' : 'var(--surface)',
              border: isFav ? '1px solid var(--gold)' : '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isFav ? 'var(--gold)' : 'var(--muted)', cursor: 'pointer',
            }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            <button onClick={() => { if (typeof navigator !== 'undefined') navigator.clipboard.writeText(c.term) }} title="Copy name" style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--surface)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted)', cursor: 'pointer',
            }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx={18} cy={5} r={3}/><circle cx={6} cy={12} r={3}/><circle cx={18} cy={19} r={3}/>
                <path d="M8.6 13.5l6.8 3.9M15.4 6.6L8.6 10.5"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Card 1: Definition */}
        <div style={cardStyle}>
          <div style={labelStyle}><span style={dotStyle}>1</span> Professional Definition</div>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text)', margin: '0 0 12px' }}>{c.def}</p>
          <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: '\'IBM Plex Mono\', monospace', margin: 0 }}>{c.source}</p>
        </div>

        {/* Card 2: Simple */}
        <div style={cardStyle}>
          <div style={labelStyle}><span style={dotStyle}>2</span> Simple Explanation</div>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--muted)', margin: 0 }}>{c.simple}</p>
        </div>

        {/* Card 3: Example */}
        <div style={cardStyle}>
          <div style={labelStyle}><span style={dotStyle}>3</span> Practical Example</div>
          <div style={{ background: 'rgba(60,90,69,0.07)', borderLeft: '3px solid #3C5A45', borderRadius: 12, padding: '18px 20px', fontSize: 14, lineHeight: 1.7, color: '#244332' }}>
            {c.example}
          </div>
        </div>

        {/* Card 4: Takeaways */}
        <div style={cardStyle}>
          <div style={labelStyle}><span style={dotStyle}>4</span> Key Takeaways</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 18px' }}>
            {c.takeaways.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1, background: 'rgba(60,90,69,0.1)', color: '#3C5A45', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckIcon />
                </span>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Card 5: Mistakes */}
        <div style={cardStyle}>
          <div style={labelStyle}><span style={dotStyle}>5</span> Common Mistakes</div>
          <div>
            {c.mistakes.map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                fontSize: 14, color: 'var(--muted)', lineHeight: 1.6,
                padding: '12px 0', borderBottom: i < c.mistakes.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1, background: 'rgba(181,86,59,0.1)', color: '#B5563B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CrossIcon />
                </span>
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* Card 6: Related */}
        <div style={cardStyle}>
          <div style={labelStyle}><span style={dotStyle}>6</span> Related Concepts</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
            {c.related.map(rid => {
              const rc = CONCEPTS[rid]
              return (
                <span key={rid} onClick={() => rc && openConcept(rid)} style={{
                  fontSize: 13, fontWeight: 500, padding: '9px 17px', borderRadius: 999,
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  color: rc ? 'var(--muted)' : 'var(--muted)',
                  cursor: rc ? 'pointer' : 'default', opacity: rc ? 1 : 0.45,
                  transition: 'border-color 0.15s, background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { if (rc) { const el = e.currentTarget as HTMLSpanElement; el.style.borderColor = 'var(--gold)'; el.style.color = '#8E661F'; el.style.background = 'rgba(184,146,74,0.1)' }}}
                onMouseLeave={e => { if (rc) { const el = e.currentTarget as HTMLSpanElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--muted)'; el.style.background = 'var(--surface2)' }}}>
                  {rc ? rc.term : rid}
                </span>
              )
            })}
          </div>
        </div>

        {/* Card 7: Learn Next */}
        <div style={cardStyle}>
          <div style={labelStyle}><span style={dotStyle}>7</span> Learn Next</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {c.learnNext.map(nid => {
              const nc = CONCEPTS[nid]
              if (!nc) return null
              return (
                <div key={nid} onClick={() => openConcept(nid)} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
                  transition: 'border-color 0.18s, transform 0.18s',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--gold)'; el.style.transform = 'translateX(3px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--border)'; el.style.transform = '' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 15 }}>
                    {nc.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{nc.term}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{nc.cat}</div>
                  </div>
                  <span style={{ color: 'var(--muted)', flexShrink: 0 }}><ChevronRight /></span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  })()

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'Inter,sans-serif' }}>
      <style>{CSS}</style>
      {miniNav}
      {screen === 'home' ? homeScreen : conceptScreen}
    </main>
  )
}
