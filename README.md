# iFrames vs Web Components Performance Comparison

This project compares the performance characteristics of iFrames and Web Components by implementing identical sports scoreboard widgets using both technologies.

## Project Overview

The goal is to provide quantitative performance data to help developers make informed decisions when choosing between iFrames and Web Components for widget implementations.

### Test Component: Sports Scoreboard

The test implementation is a sports scoreboard widget that includes:
- Live score display
- Team information
- Game status/time
- Real-time updates

Both implementations will have identical functionality and styling to ensure a fair comparison.

## Project Structure

```
├── iframe/
│   ├── scoreboard.html       # Scoreboard widget page (iframe content)
│   ├── scoreboard.js         # iFrame scoreboard logic
│   └── tests/                # Article-like host pages embedding the iframe
│       ├── single.html       # 1 instance
│       ├── five.html         # 5 instances
│       └── ten.html          # 10 instances
│
├── web-component/
│   ├── scoreboard.html       # Demo page using the web component
│   ├── scoreboard.js         # Web Component (shadow DOM + inline styles)
│   └── tests/                # Article-like host pages embedding the component
│       ├── single.html       # 1 instance
│       ├── five.html         # 5 instances
│       └── ten.html          # 10 instances
│
├── shared/
│   ├── styles/
│   │   ├── article.css       # Article layout styles used by test pages
│   │   └── scoreboard.css    # Shared scoreboard styles (used by iframe)
│   └── data/
│       └── game-events.json  # Realistic game progression data (chronological scoring events)
│
├── tests/
│   ├── performance.spec.js   # Automated Playwright test
│   └── utils/
│       └── performance.js    # Metrics collection + file save helpers
│
└── dashboard/
  ├── index.html            # Results dashboard
  ├── styles.css            # Dashboard styles
  ├── app.js                # Loads JSON runs and renders UI
  └── data/
    └── .gitkeep          # Folder for generated JSON results (git-ignored)
```

## Performance Metrics

### Primary Metrics (from Performance API)
- Load time (navigation to first render)
- First Paint (FP)
- First Contentful Paint (FCP)
- DOM Interactive
- DOM Complete

### Custom Metrics
- Memory usage (per instance and total)
- Update latency (average and variance across instances)
- Frame rate during updates (per instance)
- JavaScript execution time
- Resource loading time
- Instance initialization time
- Cross-instance communication latency
- Memory leak detection for long-running tests
- Resource isolation metrics

## Testing Methodology

### Environment Setup
- Local development server
- Network condition simulation (throttling)
- Automated testing using Playwright
- Consistent browser state for each test

### Test Scenarios
1. Initial Load Performance
   - Cold and warm cache loading
   - Different network conditions
   - Scaling tests with 1, 5, and 10 instances
   
2. Runtime Performance
   - Score update frequency testing
   - Performance impact with multiple instances (1, 5, and 10 widgets)
   - Memory usage over time for different instance counts
   - Update latency across multiple instances
   
3. Resource Usage
   - Memory consumption patterns per instance
   - Cumulative CPU utilization with increasing instances
   - Network request patterns and overhead
   - Resource isolation effectiveness
   
4. Scalability Analysis
   - Load time scaling (1 vs 5 vs 10 instances)
   - Memory scaling patterns
   - Performance degradation analysis
   - Browser resource allocation differences

### Testing Tools
- Playwright for automation and navigation timing
- Performance API (paint and timing entries)
- Custom performance marks and measures (in code)

## Data Collection & Analysis

### Collection Process
1. Automated test runs for each implementation
2. Multiple iterations for statistical significance
3. Data storage in JSON format
4. Automated metric extraction

### Visualization Dashboard
- Real-time metrics display
- Historical data comparison
- Performance trends
- Side-by-side implementation comparison

## Technology Stack

### Development
- Languages: Vanilla JavaScript, CSS, HTML (no build tools)
- Server: Simple `http-server`
- Mock Data: Static JSON sports data
- Philosophy: Zero-build, no transpilation or bundling

### Testing
- Framework: Playwright (Chromium)
- Performance: Performance API (FP/FCP/DOM timings), sampled FPS, JS heap usage via `performance.memory`

### Dashboard
- Vanilla JS + CSS (no chart libs)
- Reads JSON run files from `dashboard/data/`

### Automation
- npm scripts for serving, testing, and cleaning artifacts

## Quick Start

Prerequisites:
- Node.js 18+ and npm

Install dependencies (first time):

```bash
npm install
npx playwright install chromium
```

Start the local server (terminal A):

```bash
npm run serve
```

Open the demo pages directly (optional):
- iFrame: http://localhost:8080/iframe/tests/single.html | five.html | ten.html
- Web Component: http://localhost:8080/web-component/tests/single.html | five.html | ten.html

Run automated measurements (terminal B):

```bash
npm test
```

This runs both implementations with 1, 5, and 10 instances and writes JSON results to `dashboard/data/`.

## Viewing Results

Open the dashboard:

- http://localhost:8080/dashboard/index.html

How to use:
- Click “Refresh” to load the latest JSON files from `dashboard/data/`
- Filter by implementation (iframe vs web-component) and instance count (1/5/10)
- Summary shows averages across the current filter
- Table shows each run: load time, FP, FCP, DOM Interactive, DOM Complete, Avg Memory (MB), Avg FPS

Notes:
- If “implementation” shows “unknown”, those runs were created before metadata was added; rerun tests or delete old JSON files.

## Cleaning Generated Files

```bash
npm run clean:reports
```

This clears Playwright reports and dashboard JSON runs. The `dashboard/data/` folder stays (tracked via `.gitkeep`).

## Version Control

- Generated artifacts (Playwright reports and `dashboard/data/*.json`) are ignored by Git via `.gitignore`.
- Commit only the source code, tests, and dashboard app — not the generated results.

## Optional: Add Lighthouse Later

To keep dependencies minimal, Lighthouse isn’t wired into the automated run. If you want to add it later:
- Run Lighthouse CLI against a page (e.g., one of the test pages)
- Save results JSON alongside other runs and extend the dashboard to read Lighthouse scores

## Contributing

(To be added: Guidelines for contributing to the project)

## License

MIT

---
*This project is part of a research effort to quantify the performance differences between iFrames and Web Components in real-world applications.*