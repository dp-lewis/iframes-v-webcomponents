const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function collectMetrics(url, duration = 5000) {
  const browser = await chromium.launch({ args: ['--remote-debugging-port=9222'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const metrics = {
    memoryUsage: [],
    frameRate: [],
    loadTime: 0,
    updateLatency: []
  };

  const startTime = Date.now();
  await page.goto(url);
  metrics.loadTime = Date.now() - startTime;

  // Wait for paint timing to be available (but don't include this in loadTime)
  await page.waitForFunction(() => {
    const paints = performance.getEntriesByType('paint');
    return paints.length > 0;
  }, { timeout: 5000 }).catch(() => {
    // If paint timing doesn't arrive, continue anyway
  });

  const performanceMetrics = await page.evaluate(() => {
    const paints = performance.getEntriesByType('paint');
    const fp = paints.find(p => p.name === 'first-paint');
    const fcp = paints.find(p => p.name === 'first-contentful-paint');
    const t = performance.timing;
    return {
      firstPaint: fp ? fp.startTime : null,
      firstContentfulPaint: fcp ? fcp.startTime : null,
      domInteractive: t.domInteractive && t.navigationStart ? t.domInteractive - t.navigationStart : null,
      domComplete: t.domComplete && t.navigationStart ? t.domComplete - t.navigationStart : null
    };
  });
  
  metrics.performance = performanceMetrics;

  const startCollecting = Date.now();
  while (Date.now() - startCollecting < duration) {
    const memory = await page.evaluate(() => performance.memory?.usedJSHeapSize || 0);
    metrics.memoryUsage.push(Number(memory) || 0);

    const fps = await page.evaluate(() => new Promise(resolve => {
      requestAnimationFrame(t1 => {
        requestAnimationFrame(t2 => {
          const dt = t2 - t1;
          resolve(dt > 0 ? 1000 / dt : 0);
        });
      });
    }));
    metrics.frameRate.push(Number(fps) || 0);

    await page.waitForTimeout(1000);
  }

  await browser.close();
  return metrics;
}

async function saveMetrics(metrics, implementation, instances) {
  const resultsDir = path.join(process.cwd(), 'dashboard', 'data');
  await fs.mkdir(resultsDir, { recursive: true });
  const timestamp = Date.now();
  const filename = `${implementation}-${instances}-instances-${timestamp}.json`;

  const payload = {
    _meta: { implementation, instances, timestamp },
    ...metrics
  };

  await fs.writeFile(path.join(resultsDir, filename), JSON.stringify(payload, null, 2));
}

module.exports = { collectMetrics, saveMetrics };