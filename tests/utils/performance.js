const { chromium } = require('playwright');
const lighthouse = require('lighthouse');
const fs = require('fs').promises;
const path = require('path');

async function collectMetrics(url, duration = 5000) {
  const browser = await chromium.launch({ args: ['--remote-debugging-port=9222'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Store metrics
  const metrics = {
    memoryUsage: [],
    frameRate: [],
    loadTime: 0,
    updateLatency: []
  };

  // Measure page load time
  const startTime = Date.now();
  await page.goto(url);
  metrics.loadTime = Date.now() - startTime;

  // Collect performance metrics
  const performanceMetrics = await page.evaluate(() => {
    return {
      firstPaint: performance.getEntriesByType('paint')[0]?.startTime,
      firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime,
      domInteractive: performance.timing.domInteractive - performance.timing.navigationStart,
      domComplete: performance.timing.domComplete - performance.timing.navigationStart
    };
  });
  
  metrics.performance = performanceMetrics;

  // Collect memory and frame rate metrics over time
  const startCollecting = Date.now();
  while (Date.now() - startCollecting < duration) {
    // Collect memory usage
    const memory = await page.evaluate(() => {
      return performance.memory?.usedJSHeapSize || 0;
    });
    metrics.memoryUsage.push(memory);

    // Collect frame rate
    const fps = await page.evaluate(() => {
      return new Promise(resolve => {
        requestAnimationFrame(t1 => {
          requestAnimationFrame(t2 => {
            resolve(1000 / (t2 - t1));
          });
        });
      });
    });
    metrics.frameRate.push(fps);

    // Wait a second between measurements
    await page.waitForTimeout(1000);
  }

  await browser.close();
  return metrics;
}

async function saveMetrics(metrics, implementation, instances) {
  const resultsDir = path.join(process.cwd(), 'dashboard', 'data');
  await fs.mkdir(resultsDir, { recursive: true });
  
  const filename = `${implementation}-${instances}-instances-${Date.now()}.json`;
  await fs.writeFile(
    path.join(resultsDir, filename),
    JSON.stringify(metrics, null, 2)
  );
}

module.exports = {
  collectMetrics,
  saveMetrics
};