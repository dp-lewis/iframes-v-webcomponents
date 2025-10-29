# iframes vs Web Components: A Real-World Performance Comparison

## It's 2025 and We're Still Using Technology From 1997

iframes were introduced in **1997**. The same year Princess Diana died, the first Harry Potter book was published, and Google.com was registered as a domain.

Twenty-eight years later, and it's *still* the most reliable way to embed isolated HTML on a webpage. That blows my mind!

Surely we've invented something better by now. Enter **Web Components** - the modern, standards-based alternative that promises native browser support for encapsulated, reusable components without the baggage of iframes.

But here's the thing: **I don't actually know which performs better.**

---

## The Third-Party Widget Problem

Before I dive into the comparison, let's think about why this matters.

You know that tiny weather widget on your site? The one that shows "23°C, Partly Cloudy"? It probably shipped **3.2MB of JavaScript**. That's React, ReactDOM, Lodash, Moment.js, a CSS-in-JS library, and probably some analytics SDK for good measure.

I've seen entire React applications used to render a sports result. Literally something like:
```
England: 4
Germany: 2
```

That's it. Two characters of actual data. Rendered by 500KB+ of framework code.

### The Modern Web Performance Paradox

Third-party widgets are everywhere:
- Sports scores
- Weather forecasts  
- Social media feeds
- Advertisement slots
- Chat widgets
- Analytics dashboards

Each one brings:
- ✅ 10-50 lines of actual UI code
- ❌ 500KB - 3MB of framework dependencies
- ❌ Potential security vulnerabilities
- ❌ CSS conflicts with your page
- ❌ JavaScript that could crash your entire site

We solve this with iframes - creating a completely isolated browsing context. But that comes with overhead. Entire document contexts, separate HTTP requests, layout complexity.

So the question becomes: Can Web Components give us isolation without the iframe tax?

---

## TL;DR

I (with a little help from Copilot) built identical sports scoreboards using both iframes and Web Components, then ran automated performance tests across 1, 5, and 10 concurrent instances. Using percentile-based metrics (p50, p95) instead of simple averages, I discovered Web Components are significantly faster for initial load time, whilst both perform identically for rendering and memory.

**Key Takeaways:**
- **Web Components load 4.5x faster** (21ms vs 116ms median for single instance)
- **iframes have inconsistent load times** (p95 of 134ms vs p50 of 50ms shows high variance)
- **Memory usage is identical** (9.54MB median for both approaches) - I was expecting this to be wildy different TBH

**View the complete test suite:** [GitHub repo link]

---

## The Experiment Setup

I needed to test something realistic - not just "hello world" components. So I built a sports scoreboard widget that:
- Updates every 5 seconds with game progression
- Shows live scores, period/quarter, game status
- Fetches data from JSON (simulating real API calls)
- Has meaningful styling and layout

Why a scoreboard? Because it represents the exact use case where developers reach for iframes:
- ✅ Frequent updates (every few seconds)
- ✅ Self-contained functionality
- ✅ Common third-party widget scenario
- ✅ Needs isolation (can't break the main page)
- ✅ Scales naturally (sports sites show multiple games)

I implemented it twice - once as an iframe, once as a Web Component - with identical functionality.

---

## What I Built

A sports scoreboard widget with:
- Live score updates every 5 seconds
- Period/quarter tracking
- Game status (Live, Final, Scheduled)
- Realistic game progression from JSON data
- Identical visual styling

The kicker? My implementation is deliberately lightweight:
- Zero frameworks
- Zero dependencies  
- Pure vanilla JavaScript
- ~100 lines of code per implementation
- Shared CSS (~50 lines)

This is intentional. I wanted to measure the overhead of the isolation mechanism itself - not React vs Vue, not npm package bloat, just iframe vs Web Component.

I stripped everything away. No build tools. No transpilation. No polyfills. No CSS frameworks. No state management libraries. Just the raw browser primitives: `<iframe>` vs Custom Elements with Shadow DOM.

This is the performance baseline that matters. Because if a barebones iframe is slower than a barebones Web Component, imagine the difference when you add 3MB of React on top. The isolation mechanism's overhead compounds with everything else you add.

### Two Implementations, Identical Functionality

**iframe version:**
```html
<iframe src="scoreboard.html?1" width="350" height="180"></iframe>
```
Self-contained HTML document. Complete isolation. Old school.

**Web Component version:**
```html
<sports-scoreboard></sports-scoreboard>
```
Custom element with Shadow DOM. Modern standards. New school.

Both do exactly the same thing. Both fetch the same JSON. Both update on the same interval. The *only* difference is the isolation mechanism.

---

## The Testing Methodology: Beyond Averages

### Test Scenarios

I tested three scaling scenarios to understand performance degradation:
- **1 instance**: Baseline single-widget performance
- **5 instances**: Moderate multi-widget load
- **10 instances**: Heavy multi-widget stress test

Each scenario runs automated tests via Playwright, collecting metrics from Chromium.

### Metrics That Matter

I tracked:
- **Load Time (ms)**: Time until page `load` event
- **First Paint (FP)**: When any pixel first renders
- **First Contentful Paint (FCP)**: When meaningful content appears
- **DOM Interactive**: When DOM is fully parsed
- **DOM Complete**: When all resources finish loading
- **Memory Usage (MB)**: Average JavaScript heap size
- **FPS**: Frame rate during updates

### Why Percentiles > Averages

I chose percentile-based analysis because averages can be misleading. Consider this scenario:

```
9 runs load in 100ms
1 run loads in 1000ms
```

- **Average**: 190ms (misleading - most users saw 100ms!)
- **p50 (median)**: 100ms (typical user experience)
- **p95**: Catches that outlier (worst 5% of users)

**I use percentile-based analysis** because:
- **p50** = what most users actually experience
- **p95** = SLA-critical worst-case scenarios
- **Standard deviation (σ)** = consistency/predictability

This is how Google measures Core Web Vitals, and how you should considering measuring performance.

---

## The Results

### Visual Dashboard

I built a zero-dependency dashboard to visualise results across 102 test runs:

**Summary Statistics (all 102 runs):**
```
                   Load Time (ms)    FCP (ms)        Memory (MB)     FPS
p50 (median):      50               46              9.54            60.0
p95 (worst-case):  134              112             9.54            60.2
σ (std dev):       53               39              0.00            0.1
```

**Comparison by Implementation:**

| Instances | Metric     | iframe p50 | web-component p50 | Delta                    |
|-----------|------------|------------|-------------------|--------------------------|
| 1         | Load (ms)  | 116        | 21                | **+95 (+452.4%)**       |
| 1         | FCP (ms)   | 100        | 40                | **+60 (+150.0%)**       |
| 1         | Memory (MB)| 9.54       | 9.54              | +0.00 (+0.0%)           |
| 1         | FPS        | 60.0       | 60.0              | +0.0 (+0.0%)            |
| 5         | Load (ms)  | 45         | 27                | **+18 (+66.7%)**        |
| 5         | FCP (ms)   | 52         | 44                | **+8 (+18.2%)**         |
| 5         | Memory (MB)| 9.54       | 9.54              | +0.00 (+0.0%)           |
| 5         | FPS        | 60.0       | 60.0              | +0.0 (+0.0%)            |
| 10        | Load (ms)  | 113        | 21                | **+92 (+438.1%)**       |
| 10        | FCP (ms)   | 44         | 36                | **+8 (+22.2%)**         |
| 10        | Memory (MB)| 9.54       | 9.54              | +0.00 (+0.0%)           |
| 10        | FPS        | 60.0       | 60.0              | +0.1 (+0.1%)            |

### Key Findings

#### 1 Instance Tests
- **Winner:** Web Components (dramatically faster)
- **Load Time:** Web Components are **452% faster** (21ms vs 116ms median)
- **FCP:** Web Components render content **150% faster** (40ms vs 100ms)
- **Memory:** Identical at 9.54MB median
- **Insight:** For a single widget, iframes carry significant overhead from creating an entire document context. Web Components share the parent page's context and avoid duplicate HTTP requests.

#### 5 Instance Tests
- **Winner:** Web Components (still faster, but gap narrows)
- **Load Time:** Web Components are **67% faster** (27ms vs 45ms)
- **Scaling pattern:** iframes *improve* with multiple instances (116ms → 45ms), suggesting browser optimisations or caching. Web Components scale linearly (21ms → 27ms).
- **Memory impact:** Still identical at 9.54MB - both implementations are lightweight enough that scaling to 5 instances doesn't trigger measurable heap growth
- **Insight:** Multiple iframes may benefit from browser parallelisation and caching. The initial iframe might be paying the full document-creation tax, but subsequent iframes amortise this cost - I'll be honest I'm not sure about this.

#### 10 Instance Tests
- **Winner:** Web Components (gap widens again)
- **Load Time:** Web Components are **438% faster** (21ms vs 113ms)
- **FCP:** Web Components still lead by **22%** (36ms vs 44ms)
- **Breaking point?:** Neither approach struggles - both maintain 60 FPS, identical memory
- **Insight:** At scale, iframe load times become unpredictable (113ms median, but individual runs varied 47ms-173ms). Web Components maintain consistent low latency (21ms median with little variation).

### What About Standard Deviation?

Consistency matters. A technology with:
- Lower σ = predictable performance (good for UX)
- Higher σ = unpredictable spikes (bad for SLAs)

**My findings (overall across 102 runs):**
- **Load Time σ:** 53ms (high variance - some runs 12ms, others 379ms)
- **FCP σ:** 39ms (moderate variance)
- **Memory σ:** 0.00MB (perfectly consistent - both approaches use identical heap)
- **FPS σ:** 0.1 (near-perfect 60 FPS consistency)

**Interpretation:** 
- **iframes have unpredictable load times** - the same test can vary from 28ms to 173ms depending on browser caching, parallelisation, and document initialisation
- **Web Components are more consistent** - tighter clustering around the median (21ms typical, rarely exceeding 100ms)
- **Both are rock-solid for rendering** - once loaded, 60 FPS is maintained regardless of approach
- **Memory is a non-issue** - neither implementation leaks or grows with multiple instances

---

## Why These Differences Exist

### iframe Architecture

**Pros:**
- Complete browser-level isolation
- Separate browsing context = separate paint layers
- True CSS encapsulation (no style leaks)
- Robust security boundary

**Cons:**
- Creates entire document context (overhead)
- Separate HTTP request per iframe
- Cannot share JavaScript state easily
- Layout reflow can be expensive

### Web Component Architecture

**Pros:**
- Shares same document context (lighter weight?)
- Shadow DOM = scoped styles (efficient?)
- Can share parent page's JavaScript
- Modern browser API optimisations

**Cons:**
- Shadow DOM still renders in main thread
- Style encapsulation via DOM tree (not process)
- Potential for main-thread blocking
- Less battle-tested than iframes

---

## Practical Recommendations

### Choose iframes when:
- ✅ You need **absolute isolation** (third-party content)
- ✅ Security is critical (untrusted code)
- ✅ You're embedding complete mini-apps
- ✅ You want **guaranteed** style/script isolation
- ✅ Load time variance is acceptable (your p95 SLA is >150ms)
- ✅ You're loading a single iframe (browser caching helps)

### Choose Web Components when:
- ✅ You control all the code
- ✅ You need tight parent-child communication
- ✅ You want to share state/context easily
- ✅ SEO matters (single-page content)
- ✅ **Performance is critical** (4-5x faster initial load)
- ✅ You're loading multiple widgets (consistent scaling)
- ✅ You need predictable p95 latency (<50ms)

### The Hybrid Approach

You don't have to choose just one! Consider:
- **Web Components** for trusted, internal widgets
- **iframes** for third-party embeds
- **Progressive enhancement**: Start with Web Components, fall back to iframes for older browsers

---

## How to Run This Test Yourself

I've open-sourced everything. Here's how to reproduce:

```bash
# Clone the repo
git clone https://github.com/dp-lewis/iframes-v-webcomponents
cd iframes-v-webcomponents

# Install dependencies
npm install
npx playwright install chromium

# Start dev server (in one terminal)
npm run serve

# Run performance tests (in another terminal)
npm test

# View results dashboard
# Open http://localhost:8080/dashboard/index.html
```

The entire test suite:
- ✅ Zero build tools (vanilla JS/HTML/CSS)
- ✅ Automated with Playwright
- ✅ Percentile-based metrics
- ✅ Visual dashboard with filtering
- ✅ Clean data export (JSON)

---

## What I Learned About Performance Testing

Beyond the iframe vs Web Component comparison, this project taught me:

### 1. Averages Lie
Simple averages hide outliers. Consider percentiles for web performance.

### 2. Test Multiple Scales
Performance doesn't degrade linearly. 1 widget might be fast, but 10 might reveal memory leaks or render thrashing.

### 3. Measure What Matters
Don't just measure load time. Consider:
- FCP (user perceives content)
- Memory (affects device longevity)
- FPS (smoothness during updates)
- Consistency (σ matters for UX)

### 4. Automation Is Essential
Manual testing is inconsistent. Playwright + Performance API = reproducible results.

### 5. Visualise Your Data
A dashboard makes patterns obvious. I spotted the 5-instance iframe anomaly (faster than 1 or 10 instances) that raw JSON wouldn't reveal - browser parallelisation and caching create non-linear scaling patterns.

---

## Conclusion

After 102 automated test runs analysing 6 different scenarios, the data is clear: **Web Components are 4-5x faster than iframes for initial load time**, whilst maintaining identical memory usage and frame rates.

**Let me be honest: these numbers aren't earth-shattering.** The difference between 100ms and 20ms is literally the blink of an eye. Users won't consciously notice it. You could ship either implementation and your product would be fine.

But here's the thing: if the newer technology performs measurably better - even by milliseconds - **why would you choose the slower option?** Technology moves forward. Web Components are the modern standard. The browser vendors are optimising for them. The ecosystem is building around them. The performance delta, however small today, will likely widen as browsers continue to evolve.

When two technologies solve the same problem and one is objectively faster, the choice becomes obvious. Use the faster one.

But here's the nuance: iframes aren't slow because they're "bad technology." They're slower because they do more:
- Create entire document contexts
- Enforce browser-level security boundaries
- Provide bulletproof style/script isolation
- Handle untrusted third-party code safely

**Web Components win on speed. iframes win on security.**

For most developers building trusted, internal widgets - use Web Components. The performance gains are substantial and consistent.

For developers embedding third-party content - iframes remain the safest choice, and the ~100ms load time overhead is a reasonable trade-off for complete isolation.

The "right" choice depends on your use case. But now you have data, not opinions.

---

## A Plea: Keep Your Widgets Lightweight

Here's what this experiment really taught me: the isolation mechanism matters less than what you put inside it.

My barebones widgets - both iframe and Web Component - measured **9.54MB of memory** and rendered at **60 FPS**. They loaded in milliseconds. They were fast because they were **simple**.

But I've seen production widgets that ship:
- ❌ 3MB of React + ReactDOM (to show "23°C")
- ❌ Moment.js + date-fns (because someone copy-pasted from Stack Overflow)
- ❌ Entire UI frameworks (to render 5 lines of text)
- ❌ Analytics libraries, A/B testing SDKs, error trackers
- ❌ Polyfills for browsers they don't even support

**Every kilobyte you ship makes the web slower for everyone.**

If you're building a widget - whether iframe or Web Component - ask yourself:
- Do I really need this framework? (Probably not)
- Can I use native DOM APIs instead? (Probably yes)
- Does this need to work on IE11? (No, it's 2025)
- Will users notice if I remove this library? (Probably not)

Build for 2025, not 2015. Browsers are incredibly capable now. You don't need jQuery. You don't need React for a scoreboard. You don't need 500KB of dependencies to show a weather icon.

Ship less. Ship faster. Respect your users' bandwidth, battery, and time.

### Further Reading

- [MDN: Using Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
- [MDN: iframe element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe)
- [Web.dev: Custom Elements](https://web.dev/custom-elements-v1/)
- [Core Web Vitals](https://web.dev/vitals/)

### The Code

⭐ **[GitHub Repository](https://github.com/dp-lewis/iframes-v-webcomponents)** - Star if you found this useful!

---

## Discussion

What's your experience with iframes vs Web Components? Have you noticed different performance characteristics? Share your findings in the comments!

