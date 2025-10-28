(function() {
  const dataDir = '/dashboard/data/';
  const tableBody = document.querySelector('#resultsTable tbody');
  const emptyState = document.getElementById('emptyState');
  const refreshBtn = document.getElementById('refreshBtn');
  const implFilter = document.getElementById('implFilter');
  const countFilter = document.getElementById('countFilter');

  refreshBtn.addEventListener('click', loadData);
  implFilter.addEventListener('change', render);
  countFilter.addEventListener('change', render);

  let runs = [];

  async function listJsonFiles() {
    // http-server exposes a directory index HTML — parse links
    // Add cache-busting query + no-store to avoid stale directory listing
    const bust = `t=${Date.now()}`;
    const url = dataDir.endsWith('/') ? `${dataDir}?${bust}` : `${dataDir}/?${bust}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    if (!res.ok) throw new Error('Failed to load data directory');
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const jsonHrefRe = /\.json(\?|$)/i;
    const links = Array.from(doc.querySelectorAll('a'))
      .map(a => a.getAttribute('href'))
      .filter(href => href && jsonHrefRe.test(href))
      .map(href => href.trim());
    return links;
  }

  async function loadData() {
    try {
      const files = await listJsonFiles();
      if (!files.length) {
        emptyState.hidden = false;
        tableBody.innerHTML = '';
        updateSummary([]);
        return;
      }

      const fetches = files.map(f => {
        // Resolve to absolute URL to avoid base path issues
        let href = f;
        if (!/^https?:\/\//i.test(f)) {
          href = f.startsWith('/') ? f : (dataDir + f);
        }
        // Add cache buster to JSON file fetch as well
        const sep = href.includes('?') ? '&' : '?';
        const bustedHref = `${href}${sep}t=${Date.now()}`;
        return fetch(bustedHref, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }).then(r => r.json().then(j => ({ file: f, data: j })));
      });
      const loaded = await Promise.all(fetches);

      // Parse metadata from filenames: `${implementation}-${instances}-instances-${timestamp}.json`
      runs = loaded.map(({ file, data }) => {
        const base = ((file.split('/').pop() || file).split('?')[0] || '').trim();

        // Prefer metadata from JSON if available
  let implementation = (data && data._meta && data._meta.implementation) ? String(data._meta.implementation).toLowerCase() : null;
        let instances = (data && data._meta && data._meta.instances != null) ? Number(data._meta.instances) : null;
        let timestamp = (data && data._meta && data._meta.timestamp != null) ? Number(data._meta.timestamp) : null;

        if (!implementation || !instances || !timestamp) {
          const m = base.toLowerCase().match(/^(iframe|web-component)-(\d+)-instances-(\d+)\.json$/i);
          if (m) {
            implementation = implementation || m[1];
            instances = instances || Number(m[2]);
            timestamp = timestamp || Number(m[3]);
          } else {
            const nameNoExt = base.replace(/\.json$/i, '');
            const parts = nameNoExt.split('-');
            const implCandidate = (parts[0] || '').toLowerCase();
            implementation = implementation || ((implCandidate === 'iframe' || implCandidate === 'web-component') ? implCandidate : 'unknown');
            instances = instances || Number(parts[1]);
            const tsMatch = base.match(/(\d+)\.json$/);
            timestamp = timestamp || (tsMatch ? Number(tsMatch[1]) : Date.now());
          }
        }

        // Final normalization
        if (implementation !== 'iframe' && implementation !== 'web-component') {
          implementation = 'unknown';
        }

        const mem = Array.isArray(data.memoryUsage) ? data.memoryUsage : [];
        const fps = Array.isArray(data.frameRate) ? data.frameRate : [];
        const perf = data.performance || {};

        return {
          file: base,
          implementation,
          instances,
          timestamp,
          loadTime: data.loadTime || 0,
          firstPaint: perf.firstPaint || null,
          fcp: perf.firstContentfulPaint || null,
          domInteractive: perf.domInteractive || null,
          domComplete: perf.domComplete || null,
          avgMemMB: mem.length ? (mem.reduce((a,b)=>a+b,0)/mem.length)/1048576 : null,
          avgFps: fps.length ? (fps.reduce((a,b)=>a+b,0)/fps.length) : null
        };
      }).sort((a,b) => b.timestamp - a.timestamp);

      emptyState.hidden = true;
      render();
    } catch (e) {
      console.error(e);
      emptyState.hidden = false;
      emptyState.textContent = 'Error loading data: ' + e.message;
      tableBody.innerHTML = '';
      updateSummary([]);
    }
  }

  function render() {
    const impl = implFilter.value;
    const count = countFilter.value;

    const filtered = runs.filter(r => (impl==='all' || r.implementation===impl) && (count==='all' || r.instances===Number(count)));
    tableBody.innerHTML = '';

    for (const r of filtered) {
      const tr = document.createElement('tr');
      const pageName = r.instances === 1 ? 'single' : (r.instances === 5 ? 'five' : (r.instances === 10 ? 'ten' : String(r.instances)));
      const testHref = `/${r.implementation}/tests/${pageName}.html`;
      tr.innerHTML = `
        <td>${new Date(r.timestamp).toLocaleString()}</td>
        <td>${r.implementation}</td>
        <td>${r.instances}</td>
        <td><a href="${testHref}" target="_blank" rel="noopener noreferrer">open</a></td>
        <td>${fmt(r.loadTime)}</td>
        <td>${fmt(r.firstPaint)}</td>
        <td>${fmt(r.fcp)}</td>
        <td>${fmt(r.domInteractive)}</td>
        <td>${fmt(r.domComplete)}</td>
        <td>${fmt(r.avgMemMB, 2)}</td>
        <td>${fmt(r.avgFps, 1)}</td>
      `;
      tableBody.appendChild(tr);
    }

    updateSummary(filtered);
    updateComparison(runs);
  }

  function updateSummary(rows) {
    const totalRuns = rows.length;
    setText('totalRuns', totalRuns || '–');

    if (!rows.length) {
      setText('loadP50', '–'); setText('loadP95', '–'); setText('loadStd', '–');
      setText('fcpP50', '–'); setText('fcpP95', '–'); setText('fcpStd', '–');
      setText('memP50', '–'); setText('memP95', '–'); setText('memStd', '–');
      setText('fpsP50', '–'); setText('fpsP95', '–'); setText('fpsStd', '–');
      return;
    }

    const loadStats = stats(rows.map(r => r.loadTime));
    const fcpStats = stats(rows.map(r => r.fcp));
    const memStats = stats(rows.map(r => r.avgMemMB));
    const fpsStats = stats(rows.map(r => r.avgFps));

    setText('loadP50', fmt(loadStats.p50));
    setText('loadP95', fmt(loadStats.p95));
    setText('loadStd', fmt(loadStats.stdDev));

    setText('fcpP50', fmt(fcpStats.p50));
    setText('fcpP95', fmt(fcpStats.p95));
    setText('fcpStd', fmt(fcpStats.stdDev));

    setText('memP50', fmt(memStats.p50, 2));
    setText('memP95', fmt(memStats.p95, 2));
    setText('memStd', fmt(memStats.stdDev, 2));

    setText('fpsP50', fmt(fpsStats.p50, 1));
    setText('fpsP95', fmt(fpsStats.p95, 1));
    setText('fpsStd', fmt(fpsStats.stdDev, 1));
  }

  function avg(arr) {
    const vals = arr.filter(v => typeof v === 'number' && !Number.isNaN(v));
    if (!vals.length) return null;
    return vals.reduce((a,b)=>a+b,0)/vals.length;
  }

  function percentile(arr, p) {
    const vals = arr.filter(v => typeof v === 'number' && !Number.isNaN(v)).sort((a,b) => a - b);
    if (!vals.length) return null;
    const index = (p / 100) * (vals.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    if (lower === upper) return vals[lower];
    return vals[lower] * (1 - weight) + vals[upper] * weight;
  }

  function stdDev(arr) {
    const vals = arr.filter(v => typeof v === 'number' && !Number.isNaN(v));
    if (vals.length < 2) return null;
    const mean = vals.reduce((a,b)=>a+b,0) / vals.length;
    const variance = vals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / vals.length;
    return Math.sqrt(variance);
  }

  function min(arr) {
    const vals = arr.filter(v => typeof v === 'number' && !Number.isNaN(v));
    if (!vals.length) return null;
    return Math.min(...vals);
  }

  function max(arr) {
    const vals = arr.filter(v => typeof v === 'number' && !Number.isNaN(v));
    if (!vals.length) return null;
    return Math.max(...vals);
  }

  function stats(arr) {
    return {
      p50: percentile(arr, 50),
      p95: percentile(arr, 95),
      p99: percentile(arr, 99),
      stdDev: stdDev(arr),
      min: min(arr),
      max: max(arr),
      count: arr.filter(v => typeof v === 'number' && !Number.isNaN(v)).length
    };
  }

  function setText(id, value) {
    document.getElementById(id).textContent = value == null ? '–' : value;
  }

  function fmt(n, digits = 0) {
    if (n == null) return '–';
    const f = Number(n);
    if (Number.isNaN(f)) return '–';
    return f.toFixed(digits);
  }

  function pct(a, b) {
    if (a == null || b == null || !isFinite(a) || !isFinite(b) || b === 0) return null;
    return ((a - b) / b) * 100;
  }

  function updateComparison(allRuns) {
    const container = document.getElementById('compareTable');
    if (!container) return;

    // Group by instances and implementation
    const byInst = new Map(); // inst -> { iframe: [], wc: [] }
    for (const r of allRuns) {
      if (!byInst.has(r.instances)) byInst.set(r.instances, { iframe: [], 'web-component': [] });
      byInst.get(r.instances)[r.implementation]?.push(r);
    }

    const instances = Array.from(byInst.keys()).sort((a,b)=>a-b);
    if (!instances.length) {
      container.innerHTML = '<div class="empty">No data available for comparison yet.</div>';
      return;
    }

    const rows = [];
    const metrics = [
      { key: 'loadTime', label: 'Load (ms)', digits: 0 },
      { key: 'fcp', label: 'FCP (ms)', digits: 0 },
      { key: 'avgMemMB', label: 'Memory (MB)', digits: 2 },
      { key: 'avgFps', label: 'FPS', digits: 1 },
    ];

    function medianFor(list, key) {
      return percentile(list.map(x => x[key]), 50);
    }

    for (const inst of instances) {
      const group = byInst.get(inst);
      const iframeList = group.iframe;
      const wcList = group['web-component'];
      for (const m of metrics) {
        const iVal = medianFor(iframeList, m.key);
        const wVal = medianFor(wcList, m.key);
        const delta = (iVal != null && wVal != null) ? (iVal - wVal) : null; // iframe - web-component
        const deltaPct = pct(iVal, wVal);
        const cls = delta == null ? 'delta-neutral' : (delta < 0 ? 'delta-pos' : (delta > 0 ? 'delta-neg' : 'delta-neutral'));
        const deltaStr = (delta == null ? '–' : `${delta >= 0 ? '+' : ''}${fmt(delta, m.digits)}`) + (deltaPct == null ? '' : ` (${deltaPct >= 0 ? '+' : ''}${fmt(deltaPct, 1)}%)`);
        rows.push(`
          <tr>
            <td>${inst}</td>
            <td>${m.label}</td>
            <td>${fmt(iVal, m.digits)}</td>
            <td>${fmt(wVal, m.digits)}</td>
            <td class="${cls}">${deltaStr}</td>
          </tr>
        `);
      }
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Instances</th>
            <th>Metric</th>
            <th>iframe p50</th>
            <th>web-component p50</th>
            <th>delta (iframe - web-component)</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join('')}
        </tbody>
      </table>
    `;
  }

  // initial load
  loadData();
})();
