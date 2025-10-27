const { test, expect } = require('@playwright/test');
const { collectMetrics, saveMetrics } = require('./utils/performance');

const implementations = ['iframe', 'web-component'];
const instanceCounts = [1, 5, 10];

for (const impl of implementations) {
  for (const count of instanceCounts) {
    test(`Performance test: ${impl} with ${count} instances`, async ({ page }) => {
      // Test URL for the specific implementation and instance count
      const url = `/${impl}/tests/${count === 1 ? 'single' : count === 5 ? 'five' : 'ten'}.html`;
      
      // Collect metrics
      const metrics = await collectMetrics(url);
      
      // Save metrics for dashboard
      await saveMetrics(metrics, impl, count);
      
      // Basic assertions to ensure the test ran successfully
      expect(metrics.loadTime).toBeDefined();
      expect(metrics.performance).toBeDefined();
      expect(metrics.memoryUsage.length).toBeGreaterThan(0);
      expect(metrics.frameRate.length).toBeGreaterThan(0);
    });
  }
}