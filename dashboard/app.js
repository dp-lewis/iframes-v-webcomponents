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
  }

  function updateSummary(rows) {
    const totalRuns = rows.length;
    setText('totalRuns', totalRuns || '–');

    const avgLoad = avg(rows.map(r => r.loadTime));
    const avgFcp = avg(rows.map(r => r.fcp));
    const avgMem = avg(rows.map(r => r.avgMemMB));
    const avgFps = avg(rows.map(r => r.avgFps));

    setText('avgLoad', fmt(avgLoad));
    setText('avgFcp', fmt(avgFcp));
    setText('avgMem', fmt(avgMem, 2));
    setText('avgFps', fmt(avgFps, 1));
  }

  function avg(arr) {
    const vals = arr.filter(v => typeof v === 'number' && !Number.isNaN(v));
    if (!vals.length) return null;
    return vals.reduce((a,b)=>a+b,0)/vals.length;
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

  // initial load
  loadData();
})();
