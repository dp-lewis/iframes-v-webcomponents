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
│   ├── scoreboard.html     # Scoreboard widget as iframe
│   ├── scoreboard.css      # Styles for iframe scoreboard
│   ├── scoreboard.js       # JavaScript for iframe scoreboard
│   └── tests/             # Test pages for iframe implementation
│       ├── single.html    # Single instance test
│       ├── five.html      # Five instances test
│       └── ten.html       # Ten instances test
│
├── web-component/
│   ├── scoreboard.html     # Web Component demo page
│   ├── scoreboard.css      # Styles for web component
│   ├── scoreboard.js       # Web Component definition
│   └── tests/             # Test pages for web component
│       ├── single.html    # Single instance test
│       ├── five.html      # Five instances test
│       └── ten.html       # Ten instances test
│
├── shared/
│   ├── data/              # Static JSON mock data
│   ├── styles/            # Common CSS styles
│   └── test-data/         # Test fixture data
│
├── tests/
│   ├── performance.js     # Performance test scripts
│   └── utils.js          # Test utilities
│
└── dashboard/
    ├── index.html        # Results dashboard
    ├── styles.css        # Dashboard styles
    ├── app.js           # Dashboard logic
    └── data/           # Test results storage
```

## Performance Metrics

### Primary Metrics (Lighthouse)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Total Blocking Time (TBT)
- Cumulative Layout Shift (CLS)

### Core Web Vitals
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)

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
- Playwright for automation
- Lighthouse for core metrics
- web-vitals library for Core Web Vitals
- Custom performance marks and measures
- Chrome DevTools Performance API

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
- **Languages**: 
  - Vanilla JavaScript (No frameworks or build tools)
  - Plain CSS
  - HTML
- **Server**: Simple HTTP server for development
- **Mock Data**: Static JSON sports data
- **Philosophy**: Zero-build, no transpilation or bundling

### Testing
- **Framework**: Playwright
  - Multi-browser engine support
  - Built-in network throttling
  - Lighthouse integration
- **Performance**: 
  - Lighthouse for core metrics
  - web-vitals library for Core Web Vitals
  - Custom Performance API implementations
  - Chrome DevTools Performance API

### Dashboard
- **Visualization**: Chart.js
  - Real-time data updates
  - Comparative visualizations
  - Time-series analysis
- **Data Storage**: JSON
  - Structured test results
  - Version controlled history
  - Easy export/import

### Automation
- **Build Scripts**: Node.js
- **Test Automation**: Playwright
- **Data Processing**: Custom Node.js scripts

## Running Tests

(To be added: Instructions for running tests locally)

## Viewing Results

(To be added: Instructions for accessing and interpreting the dashboard)

## Contributing

(To be added: Guidelines for contributing to the project)

## License

MIT

---
*This project is part of a research effort to quantify the performance differences between iFrames and Web Components in real-world applications.*