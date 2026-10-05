/* ==========================================================================
   Modern Retail Store Network Simulator — Phase 2
   script.js  |  Vanilla JavaScript (no frameworks, no backend, no database)
   --------------------------------------------------------------------------
   Sections: 0 utils/icons · 1 data · 2 state · 3 topology · 4 devices
             5 status/log · 6 simulation controls · 7 Wi-Fi · 8 DNS
             9 HTTP · 10 test · 11 demo · 12 performance · 13 modal/toast
             14 navigation · 15 boot
   ========================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- utils */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  const pad = (n) => String(n).padStart(2, '0');
  const nowTime = () => {
    const d = new Date();
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const byId = (id) => document.getElementById(id);
  const setText = (id, text) => { const el = byId(id); if (el) el.textContent = text; };
  const delay = (ms, fn) => setTimeout(fn, ms);

  /* --------------------------------------------------------------- icons */
  const ICONS = {
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/>',
    router: '<rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 16.5h.01M10.5 16.5h.01"/><path d="M12 10V4"/><path d="M8.8 6.4a4.6 4.6 0 0 1 6.4 0"/><path d="M6.2 4a8 8 0 0 1 11.6 0"/>',
    wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><path d="M12 20h.01"/>',
    laptop: '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9"/><path d="M2 16h20"/><path d="M6 20h12"/>',
    mobile: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18.5h2"/>',
    server: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/><path d="M11 6.5h6M11 17.5h6"/>',
    ip: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M7 12.5h10M7 16h6"/>'
  };
  const svgIcon = (name) =>
    '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.laptop) + '</svg>';

  /* ---------------------------------------------------------------- data */
  const DEVICES = [
    {
      id: 'internet', name: 'Internet / Online Services', short: 'Internet', type: 'WAN Cloud',
      ip: '203.0.113.8', status: 'Connected', conn: 'Ethernet (WAN)', icon: 'globe',
      note: 'External ISP network reached through the store router.'
    },
    {
      id: 'router', name: 'Router', short: 'Router', type: 'Gateway Router',
      ip: '192.168.1.1', status: 'Online', conn: 'Ethernet / DSL', icon: 'router',
      note: 'Default gateway 192.168.1.1 — performs NAT and DHCP for the store LAN.'
    },
    {
      id: 'ap', name: 'Wi-Fi Access Point', short: 'Wi-Fi Access Point', type: 'Access Point',
      ip: '192.168.1.2', status: 'Connected', conn: 'Wired uplink', icon: 'wifi',
      note: 'Bridges the wireless clients to the wired LAN (SSID: RetailStore_WiFi).'
    },
    {
      id: 'customer-laptop', name: 'Customer Laptop', short: 'Customer Laptop', type: 'Client',
      ip: '192.168.1.101', status: 'Connected', conn: 'Wi-Fi', icon: 'laptop',
      note: 'Guest device used for the in-store portal and catalogue pages.'
    },
    {
      id: 'customer-mobile', name: 'Customer Mobile', short: 'Customer Mobile', type: 'Client',
      ip: '192.168.1.104', status: 'Connected', conn: 'Wi-Fi', icon: 'mobile',
      note: 'Phone joining the guest SSID for loyalty app and offers page.'
    },
    {
      id: 'employee-laptop', name: 'Employee Laptop', short: 'Employee Laptop', type: 'Client',
      ip: '192.168.1.102', status: 'Connected', conn: 'Wi-Fi', icon: 'laptop',
      note: 'Staff workstation used for inventory and stock lookups.'
    },
    {
      id: 'manager-mobile', name: 'Manager Mobile', short: 'Manager Mobile', type: 'Client',
      ip: '192.168.1.103', status: 'Connected', conn: 'Wi-Fi', icon: 'mobile',
      note: 'Management device with access to the store dashboard.'
    },
    {
      id: 'dns', name: 'DNS Server', short: 'DNS Server', type: 'Server (DNS)',
      ip: '192.168.1.10', status: 'Ready', conn: 'Ethernet', icon: 'server',
      nodeCls: 'node--server node--dns', note: 'Internal resolver — answers A record queries for retailstore.com (UDP/TCP 53).'
    },
    {
      id: 'http', name: 'HTTP Web Server', short: 'HTTP Server', type: 'Server (Web)',
      ip: '192.168.1.20', status: 'Online', conn: 'Ethernet', icon: 'server',
      nodeCls: 'node--server node--http', note: 'Hosts the retail website and API endpoints (TCP 80).'
    }
  ];

  const STATUS = [
    { id: 'wifi', name: 'Wi-Fi', state: 'Connected', detail: 'RetailStore_WiFi' },
    { id: 'router', name: 'Router', state: 'Online', detail: '192.168.1.1' },
    { id: 'dns', name: 'DNS Server', state: 'Ready', detail: '192.168.1.10' },
    { id: 'http', name: 'HTTP Server', state: 'Online', detail: '192.168.1.20' },
    { id: 'internet', name: 'Internet', state: 'Connected', detail: '203.0.113.8' }
  ];

  const DNS_RECORDS = {
    'www.retailstore.com': '192.168.1.10',
    'pos.retailstore.com': '192.168.1.10',
    'api.retailstore.com': '192.168.1.20'
  };

  const WIRELESS = DEVICES.filter((d) => d.conn === 'Wi-Fi');
  const CLIENTS = WIRELESS.slice();
  const DEVICE = {};
  DEVICES.forEach((d) => { DEVICE[d.id] = d; });

  const DEMO_STEPS = [
    { label: 'Associate Wi-Fi client', detail: 'RetailStore_WiFi · WPA2 handshake', log: 'Demo: Wi-Fi association started for Customer Laptop' },
    { label: 'Request DNS resolution', detail: 'www.retailstore.com → 192.168.1.10', log: 'Demo: DNS query sent to 192.168.1.10 (UDP/53)' },
    { label: 'Send HTTP request', detail: 'GET / HTTP/1.1 → 192.168.1.20', log: 'Demo: HTTP GET / sent to web server 192.168.1.20' },
    { label: 'Receive HTTP response', detail: 'HTTP/1.1 200 OK · text/html', log: 'Demo: HTTP response 200 OK delivered to client' },
    { label: 'Measure performance', detail: 'Latency, packet loss, throughput', log: 'Demo: performance measurement started' },
    { label: 'Simulation complete', detail: 'All protocols verified', log: 'Demo: complete network simulation successful' }
  ];

  /* --------------------------------------------------------------- state */
  const state = {
    running: false,
    elapsed: 0,
    tickTimer: null,
    clockTimer: null,
    dnsToken: 0,
    httpToken: 0,
    testToken: 0,
    demoToken: 0,
    perfToken: 0,
    logCount: 0,
    events: 0,
    client: 'customer-laptop',
    wifi: true,
    loss: 0,
    stats: { sent: 0, received: 0, lost: 0, ok: 0, failed: 0, latency: 0, response: 0 },
    history: { dns: [], http: [], latency: [] }
  };

  const SIM_EVENTS = [
    ['http', 'HTTP request served: GET / from Customer Laptop (192.168.1.101)'],
    ['dns', 'DNS query resolved: www.retailstore.com → 192.168.1.10'],
    ['http', 'HTTP request served: GET /offers from Employee Laptop (192.168.1.102)'],
    ['info', 'Wi-Fi keep-alive received from Manager Mobile (192.168.1.103)'],
    ['info', 'DHCP lease renewed for Customer Mobile (192.168.1.104)'],
    ['http', 'HTTP response delivered: 200 OK → api.retailstore.com (192.168.1.20)'],
    ['info', 'Router forwarded store traffic to Internet (203.0.113.8)'],
    ['dns', 'DNS cache hit for www.retailstore.com']
  ];

  /* =====================================================================
     1. Diagram (clean fixed grid) + device cards
     ===================================================================== */
  function nodeHtml(dev, extraCls) {
    return '<button type="button" class="node ' + (dev.nodeCls || '') + (extraCls ? ' ' + extraCls : '') + '"' +
      ' data-node="' + dev.id + '" title="' + dev.name + ' — ' + dev.ip + '">' +
      '<span class="node__icon">' + svgIcon(dev.icon) + '</span>' +
      '<span class="node__name">' + dev.short + '</span>' +
      '<span class="node__ip">' + dev.ip + '</span>' +
      '<span class="node__status"><i class="dot dot--ok"></i>' + dev.status + '</span>' +
      '</button>';
  }

  function buildDiagram() {
    const host = $('#diagram');
    if (!host) return;

    const cells = CLIENTS.map(function (c) {
      return '<div class="branch__cell"><i class="branch__drop"></i>' + nodeHtml(c) + '</div>';
    }).join('');

    /* straight vertical chain on the left, two compact server cards on the right */
    host.innerHTML =
      '<div class="diagram__grid">' +
        nodeHtml(DEVICE.internet, 'g-internet') +
        '<i class="link link--v g-link-1"></i>' +
        nodeHtml(DEVICE.router, 'g-router') +
        '<i class="link link--h g-hl-1"></i>' +
        nodeHtml(DEVICE.dns, 'g-dns') +
        '<i class="link link--v g-link-2"></i>' +
        nodeHtml(DEVICE.ap, 'g-ap') +
        '<i class="link link--h g-hl-2"></i>' +
        nodeHtml(DEVICE.http, 'g-http') +
        '<div class="branch g-branch">' +
          '<i class="branch__stem"></i>' +
          '<i class="branch__bar" id="branchBar"></i>' +
          '<div class="branch__cells">' + cells + '</div>' +
        '</div>' +
      '</div>';

    /* bar spans exactly from the first to the last client column */
    const bar = byId('branchBar');
    if (bar) bar.style.margin = '0 ' + (50 / CLIENTS.length) + '%';

    wireNodeClicks(host);
  }

  function wireNodeClicks(root) {
    $$('[data-node]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        const dev = DEVICE[btn.dataset.node];
        if (!dev) return;
        selectDevice(dev.id);
        openModal(dev.name, deviceModalBody(dev));
        log('Device details opened: ' + dev.name + ' (' + dev.ip + ')', 'info');
      });
    });
  }

  function buildDeviceCards() {
    const grid = $('#deviceGrid');
    if (!grid) return;
    grid.innerHTML = DEVICES.map(function (dev) {
      return '<button type="button" class="node" data-device="' + dev.id + '">' +
        '<span class="node__icon">' + svgIcon(dev.icon) + '</span>' +
        '<span class="node__name">' + dev.name + '</span>' +
        '<span class="node__ip">' + dev.ip + '</span>' +
        '<span class="node__status"><i class="dot dot--ok"></i>' + dev.status + '</span>' +
        '</button>';
    }).join('');
    wireNodeClicks(grid);
  }

  function buildClientSelect() {
    const selects = [$('#clientSelect'), $('#clientSelectTest')].filter(Boolean);
    if (!selects.length) return;

    selects.forEach(function (select) {
      CLIENTS.forEach(function (dev) {
        const opt = document.createElement('option');
        opt.value = dev.id;
        opt.textContent = dev.name + ' (' + dev.ip + ')';
        if (dev.id === state.client) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener('change', function () {
        state.client = select.value;
        selects.forEach(function (s) { s.value = state.client; });
        const dev = DEVICE[state.client];
        setText('testClientName', dev.name + ' (' + dev.ip + ')');
        log('Active simulation client changed to ' + dev.name, 'info');
        flashStatus('wifi');
      });
    });

    updateTestClient();
  }

  function updateTestClient() {
    const dev = DEVICE[state.client];
    if (dev) setText('testClientName', dev.name + ' (' + dev.ip + ')');
  }

  function deviceModalBody(dev) {
    return (
      row('Device type', dev.type) +
      row('IP address', dev.ip) +
      row('Status', '<span class="ok">' + dev.status + '</span>') +
      row('Connection', dev.conn) +
      '<p class="modal__title2">Role in the store network</p>' +
      '<p class="modal__text">' + dev.note + '</p>'
    );
  }

  function selectDevice(id) {
    $$('[data-node], [data-device]').forEach((el) => el.classList.remove('is-selected'));
    const node = $('[data-node="' + id + '"]');
    const card = $('[data-device="' + id + '"]');
    if (node) node.classList.add('is-selected');
    if (card) card.classList.add('is-selected');
  }

  function row(label, value) {
    return '<div class="modal__row"><span class="modal__label">' + label + '</span>' +
      '<span class="modal__value">' + value + '</span></div>';
  }

  /* =====================================================================
     2. Status strip + protocol icons
     ===================================================================== */
  function buildStatus() {
    const list = $('#statusList');
    if (!list) return;
    list.innerHTML = STATUS.map(function (item) {
      return '<li class="strip__item" data-status="' + item.id + '">' +
        '<span class="strip__name">' + item.name + '</span>' +
        '<span class="strip__state"><i class="dot dot--ok"></i>' + item.state + '</span>' +
        '</li>';
    }).join('');
  }

  function flashStatus(id) {
    const el = $('[data-status="' + id + '"]');
    if (!el) return;
    el.classList.remove('is-flash');
    void el.offsetWidth;
    el.classList.add('is-flash');
  }

  function setStatusState(id, text, ok) {
    const el = $('[data-status="' + id + '"] .strip__state');
    if (!el) return;
    el.innerHTML = '<i class="dot ' + (ok ? 'dot--ok' : 'dot--err') + '"></i>' + text;
  }

  function buildProtocolIcons() {
    const map = { protoWifi: 'wifi', protoDns: 'server', protoHttp: 'server', protoRouter: 'router', protoIp: 'ip' };
    Object.keys(map).forEach(function (id) {
      const el = byId(id);
      if (el) el.innerHTML = svgIcon(map[id]);
    });
  }

  /* =====================================================================
     4. Activity log
     ===================================================================== */
  function log(message, level) {
    const list = $('#logList');
    if (!list) return;
    const li = document.createElement('li');
    li.className = 'log__row' + (level ? ' log__row--' + level : '');
    li.innerHTML = '<span class="log__time">[' + nowTime() + ']</span><span class="log__msg">' + message + '</span>';
    list.appendChild(li);
    list.scrollTop = list.scrollHeight;
    state.logCount += 1;
    updateLogCount();
  }

  function updateLogCount() {
    setText('logCount', state.logCount + (state.logCount === 1 ? ' entry' : ' entries'));
  }

  function seedLog() {
    const list = $('#logList');
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);
    state.logCount = 0;

    const seed = [
      [14, 'Wi-Fi connected — SSID RetailStore_WiFi (WPA2)', 'success'],
      [12, 'Customer Laptop joined network (192.168.1.101)', 'info'],
      [10, 'DNS Server ready (192.168.1.10)', 'dns'],
      [8, 'HTTP Server online (192.168.1.20)', 'http'],
      [5, 'Network connection successful', 'success']
    ];
    const base = new Date(Date.now() - 15000);
    seed.forEach(function (entry) {
      const d = new Date(base.getTime() + entry[0] * 1000);
      const li = document.createElement('li');
      li.className = 'log__row log__row--' + entry[2];
      li.innerHTML = '<span class="log__time">[' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + ']</span>' +
        '<span class="log__msg">' + entry[1] + '</span>';
      list.appendChild(li);
      state.logCount += 1;
    });
    updateLogCount();
  }

  /* =====================================================================
     5. Simulation controls
     ===================================================================== */
  function setState(mode) {
    const map = {
      idle: { cls: 'dot--idle', text: 'Idle' },
      running: { cls: 'dot--ok', text: 'Running' },
      paused: { cls: 'dot--warn', text: 'Paused' }
    };
    const s = map[mode];
    ['#headerState', '#simState'].forEach((sel) => {
      const el = $(sel);
      if (el) el.innerHTML = '<span class="dot ' + s.cls + '"></span>' + s.text;
    });

    byId('btnStart').disabled = state.running;
    byId('btnPause').disabled = !state.running;
  }

  function startSimulation() {
    if (state.running) return;
    if (!state.wifi) {
      showToast('Reconnect Wi-Fi before starting', 'error');
      return;
    }
    state.running = true;
    setState('running');
    log('Simulation started — network animation active', 'head');
    flashStatus('router');
    startClock();
    state.tickTimer = setInterval(function () {
      const ev = SIM_EVENTS[state.events % SIM_EVENTS.length];
      state.events += 1;
      log(ev[1], ev[0]);
      state.elapsed += 1;
      updateElapsed();
    }, 4000);
  }

  function pauseSimulation() {
    if (!state.running) return;
    state.running = false;
    setState('paused');
    clearInterval(state.tickTimer);
    state.tickTimer = null;
    log('Simulation paused', 'warn');
  }

  function resetSimulation() {
    state.running = false;
    state.elapsed = 0;
    state.events = 0;
    state.dnsToken += 1;
    state.httpToken += 1;
    state.testToken += 1;
    state.demoToken += 1;
    state.perfToken += 1;
    state.stats = { sent: 0, received: 0, lost: 0, ok: 0, failed: 0, latency: 0, response: 0 };
    state.history = { dns: [], http: [], latency: [] };

    clearInterval(state.tickTimer);
    state.tickTimer = null;
    setState('idle');
    updateElapsed();

    resetDns();
    resetHttp();
    resetTest();
    resetPerf();
    hideResult('controlResult');
    resetDemo();
    seedLog();
    drawChart();
    log('Dashboard reset to initial state', 'info');
  }

  function testConnection() {
    if (!state.wifi) {
      showToast('Wi-Fi disconnected — test failed', 'error');
      log('Connection test aborted — Wi-Fi is disconnected', 'error');
      setStatusState('wifi', 'Offline', false);
      showControlResult('Wi-Fi Disconnected', 'is-error');
      return;
    }
    const steps = [
      ['Pinging Wi-Fi Access Point (192.168.1.2)', 300],
      ['Pinging Router (192.168.1.1)', 550],
      ['Pinging DNS Server (192.168.1.10)', 800],
      ['Requesting www.retailstore.com over HTTP', 1100]
    ];
    steps.forEach(function (s) {
      delay(s[1], function () { log(s[0] + ' … reply received', 'info'); });
    });
    delay(1400, function () {
      showControlResult('Connection Successful', '');
      log('Connection Successful — store network reachable', 'success');
      ['wifi', 'router', 'dns', 'http', 'internet'].forEach(flashStatus);
      showToast('Connection Successful');
      runCommunicationTest();
    });
  }

  function showControlResult(text, cls) {
    const el = byId('controlResult');
    if (!el) return;
    el.textContent = text;
    el.className = 'controls__result' + (cls ? ' ' + cls : '');
    el.hidden = false;
  }

  function hideResult(id) {
    const el = byId(id);
    if (el) el.hidden = true;
  }

  function updateElapsed() {
    const h = Math.floor(state.elapsed / 3600);
    const m = Math.floor((state.elapsed % 3600) / 60);
    const s = state.elapsed % 60;
    setText('simClock', pad(h) + ':' + pad(m) + ':' + pad(s));
  }

  function startClock() {
    if (state.clockTimer) return;
    state.clockTimer = setInterval(function () { setText('headerClock', nowTime()); }, 1000);
    setText('headerClock', nowTime());
  }

  /* =====================================================================
     6. Wi-Fi association
     ===================================================================== */
  function buildAssocList() {
    const list = $('#assocList');
    if (!list) return;
    WIRELESS.forEach((dev) => {
      const li = document.createElement('li');
      li.className = 'assoc__row';
      li.dataset.assoc = dev.id;
      li.innerHTML =
        '<span class="dot dot--ok"></span>' +
        '<span class="assoc__name">' + dev.name + '</span>' +
        '<span class="assoc__state">associated</span>' +
        '<span class="assoc__ip">' + dev.ip + '</span>';
      list.appendChild(li);
    });
  }

  function setFlowStep(flowId, index, cls, text) {
    const step = $('#' + flowId + ' [data-step="' + index + '"]');
    if (!step) return;
    step.classList.remove('is-active', 'is-done', 'is-error');
    if (cls) step.classList.add(cls);
    const stateEl = $('.track__state', step) || $('.flow__state', step);
    if (stateEl) stateEl.textContent = text;
  }

  function resetFlow(flowId) {
    $$('#' + flowId + ' [data-step]').forEach(function (step) {
      step.classList.remove('is-active', 'is-done', 'is-error');
      const s = $('.track__state', step) || $('.flow__state', step);
      if (s) s.textContent = 'waiting';
    });
  }

  function connectWifi() {
    if (state.wifi) return;
    state.wifi = true;
    resetFlow('wifiFlow');
    setWifiUi(true);

    const order = [1, 2, 3, 4];
    order.forEach(function (n, i) {
      delay(i * 650, function () {
        if (!state.wifi) return;
        setFlowStep('wifiFlow', n, 'is-done', 'done');
        if (n === 1) log('Scanning for RetailStore_WiFi (2.4 GHz / 5 GHz)', 'info');
        if (n === 2) log('Access Point found — channel 6, signal strong', 'info');
        if (n === 3) log('WPA2-PSK handshake completed', 'info');
      });
    });

    delay(2700, function () {
      if (!state.wifi) return;
      setText('wifiStatus', 'Connected');
      log('Connected Successfully — ' + WIRELESS.length + ' wireless clients associated', 'success');
      setStatusState('wifi', 'Connected', true);
      updateSidebarState();
      flashStatus('wifi');
      showToast('Wi-Fi Connected');
    });
  }

  function disconnectWifi() {
    if (!state.wifi) return;
    state.wifi = false;
    setWifiUi(false);
    if (state.running) pauseSimulation();
    log('Wi-Fi disconnected — wireless clients lost association', 'warn');
    setStatusState('wifi', 'Offline', false);
    updateSidebarState();
    showToast('Wi-Fi Disconnected', 'error');
  }

  function setWifiUi(online) {
    setText('wifiSignal', online ? 'Strong' : 'No signal');
    const sig = byId('wifiSignal');
    if (sig) sig.className = online ? 'ok' : 'bad';
    setText('wifiStatus', online ? 'Connected' : 'Disconnected');
    const st = byId('wifiStatus');
    if (st) st.className = online ? 'ok' : 'bad';
    setText('wifiClientCount', online ? String(WIRELESS.length) : '0');

    $$('#assocList .assoc__row').forEach(function (row) {
      row.classList.toggle('is-offline', !online);
      const s = $('.assoc__state', row);
      if (s) s.textContent = online ? 'associated' : 'disconnected';
      const d = $('.dot', row);
      if (d) d.className = 'dot ' + (online ? 'dot--ok' : 'dot--err');
    });

    WIRELESS.forEach(function (dev) {
      ['[data-node="' + dev.id + '"]', '[data-device="' + dev.id + '"]'].forEach(function (sel) {
        const el = $(sel);
        if (!el) return;
        el.classList.toggle('is-offline', !online);
        const dot = $('.node__status .dot', el);
        if (dot) dot.className = 'dot ' + (online ? 'dot--ok' : 'dot--err');
      });
    });

    const ap = $('[data-node="ap"] .node__status .dot');
    if (ap) ap.className = 'dot ' + (online ? 'dot--ok' : 'dot--err');
  }

  function updateSidebarState() {
    const el = byId('sidebarState');
    if (!el) return;
    el.innerHTML = state.wifi
      ? '<span class="dot dot--ok"></span>Online'
      : '<span class="dot dot--err"></span>Degraded';
  }

  /* =====================================================================
     7. DNS resolution
     ===================================================================== */
  function resetDns() {
    state.dnsToken += 1;
    resetFlow('dnsFlow');
    setText('dnsIp', '—');
    setText('dnsStatus', 'Idle');
    const val = byId('dnsIp');
    if (val) val.className = 'result__value';
    const box = byId('dnsResultBox');
    if (box) box.className = 'result';
    const btn = byId('dnsResolveBtn');
    btn.disabled = false;
    btn.textContent = 'Resolve DNS';
  }

  function resolveDns() {
    if (!state.wifi) {
      setText('dnsStatus', 'No network');
      const s = byId('dnsStatus');
      if (s) s.className = 'result__value is-error';
      log('DNS query failed — no network connectivity', 'error');
      showToast('Wi-Fi is disconnected', 'error');
      return;
    }

    const input = $('#dnsInput');
    const domain = input.value.trim().toLowerCase();
    const token = ++state.dnsToken;
    const btn = byId('dnsResolveBtn');

    resetFlow('dnsFlow');
    setText('dnsIp', '—');
    setText('dnsDomain', domain || '—');
    setText('dnsStatus', 'Resolving…');

    if (!domain) {
      setFlowStep('dnsFlow', 1, 'is-error', 'error');
      setText('dnsStatus', 'Invalid input');
      const s = byId('dnsStatus');
      if (s) s.className = 'result__value is-error';
      log('DNS query aborted — empty domain name', 'error');
      showToast('Please enter a domain name', 'info');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Resolving…';
    log('Resolving domain: ' + domain + ' …', 'dns');
    showToast('Resolving ' + domain + '…', 'info');

    const ip = DNS_RECORDS[domain];
    const timings = [500, 1000, 1500, 2000];

    const DNS_STEPS = 4;

    setFlowStep('dnsFlow', 1, 'is-active', 'resolving');
    timings.forEach(function (t, i) {
      delay(t, function () {
        if (token !== state.dnsToken) return;
        setFlowStep('dnsFlow', i + 1, 'is-done', 'done');
        if (i + 2 <= DNS_STEPS) setFlowStep('dnsFlow', i + 2, 'is-active', 'resolving');
        if (i === 0) log('DNS request reached 192.168.1.10 (UDP/53)', 'dns');
        if (i === 2) log('A record matched in retailstore.com zone file', 'dns');
      });
    });

    delay(2600, function () {
      if (token !== state.dnsToken) return;
      btn.disabled = false;
      btn.textContent = 'Resolve DNS';

      const box = byId('dnsResultBox');
      if (ip) {
        setText('dnsIp', ip);
        setText('dnsStatus', 'Resolved (200 OK)');
        const v = byId('dnsIp');
        if (v) v.className = 'result__value is-ok';
        const s = byId('dnsStatus');
        if (s) s.className = 'result__value is-ok';
        if (box) box.className = 'result is-ok';
        for (let n = 1; n <= DNS_STEPS; n += 1) setFlowStep('dnsFlow', n, 'is-done', 'done');
        log('IP address found: ' + domain + ' → ' + ip, 'success');
        showToast('Resolved ' + domain + ' → ' + ip);
        flashStatus('dns');
        pushHistory('dns', randInt(8, 22));
      } else {
        setText('dnsIp', 'NXDOMAIN');
        setText('dnsStatus', 'Not found');
        const v = byId('dnsIp');
        if (v) v.className = 'result__value is-error';
        const s = byId('dnsStatus');
        if (s) s.className = 'result__value is-error';
        if (box) box.className = 'result is-error';
        setFlowStep('dnsFlow', 3, 'is-error', 'nxdomain');
        log('No A record found for ' + domain + ' — NXDOMAIN', 'error');
        showToast('Domain not found: ' + domain, 'info');
        pushHistory('dns', 0);
      }
    });
  }

  /* =====================================================================
     8. HTTP request / response
     ===================================================================== */
  const HTTP_STEPS = [
    [0, 'Client builds request   GET / HTTP/1.1', 'req'],
    [300, 'Host: www.retailstore.com   User-Agent: StorePOS/1.0', 'req'],
    [700, 'Router forwards to web server   192.168.1.20', 'srv'],
    [1100, 'Web Server received request   200 OK prepared', 'srv'],
    [1500, 'HTTP Response   HTTP/1.1 200 OK   Content-Type: text/html', 'res'],
    [1900, 'Response delivered via access point to client', 'ok']
  ];

  function consoleLine(text, kind) {
    const box = $('#httpConsole');
    if (!box) return;
    const empty = $('.console__empty', box);
    if (empty) empty.remove();
    const span = document.createElement('span');
    span.className = 'console__line' + (kind ? ' console__line--' + kind : '');
    span.innerHTML = '<span class="console__time">[' + nowTime() + ']</span> ' + text;
    box.appendChild(span);
    box.scrollTop = box.scrollHeight;
  }

  function resetHttp() {
    state.httpToken += 1;
    const box = $('#httpConsole');
    if (box) box.innerHTML = '<div class="console__empty">Communication log empty — click <strong>Send HTTP Request</strong> to trace an exchange.</div>';
    resetFlow('httpFlow');
    setText('httpStatus', 'Idle');
    setText('httpCode', '—');
    setText('httpTime', '—');
    ['httpCode', 'httpTime'].forEach((id) => {
      const el = byId(id);
      if (el) el.className = '';
    });
    const btn = byId('httpSendBtn');
    btn.disabled = false;
  }

  function sendHttpRequest() {
    const btn = byId('httpSendBtn');
    if (btn.disabled) return;

    if (!state.wifi) {
      log('HTTP request failed — no network connectivity', 'error');
      showToast('Wi-Fi is disconnected', 'error');
      return;
    }

    const token = ++state.httpToken;
    const ms = randInt(18, 42);
    const dev = DEVICE[state.client];
    const host = pick(['www.retailstore.com', 'pos.retailstore.com', 'api.retailstore.com']);
    const ip = DNS_RECORDS[host];

    btn.disabled = true;
    resetFlow('httpFlow');
    setText('httpUrl', 'http://' + host + '/');
    setText('httpStatus', 'In progress…');
    log('HTTP request initiated from ' + dev.name + ' (' + dev.ip + ')', 'http');
    consoleLine('--- HTTP transaction #' + (state.events % 97 + 1) + ' → ' + host + ' ---', 'srv');

    /* six console lines mapped onto the four visible stages */
    const stages = [1, 2, 2, 3, 4, 4];

    setFlowStep('httpFlow', 1, 'is-active', 'sending');
    HTTP_STEPS.forEach(function (step, i) {
      delay(step[0], function () {
        if (token !== state.httpToken) return;
        consoleLine(step[1], step[2]);

        const stage = stages[i];
        let n = 1;
        for (; n <= stage; n += 1) setFlowStep('httpFlow', n, 'is-done', 'done');
        if (stage < 4) setFlowStep('httpFlow', stage + 1, 'is-active', 'processing');

        if (stage === 3) log('Web Server received GET / from ' + dev.name, 'http');
        if (step[2] === 'ok') {
          setText('httpStatus', '200 OK');
          setText('httpCode', '200 OK');
          setText('httpTime', ms + ' ms');
          const c = byId('httpCode'); if (c) c.className = 'ok';
          const t = byId('httpTime'); if (t) t.className = 'ok';
          const s = byId('httpStatus'); if (s) s.className = 'ok';
          log('HTTP response received — Status 200 OK (' + ms + ' ms, ' + ip + ')', 'success');
          showToast('HTTP 200 OK · ' + ms + ' ms (simulated)');
          flashStatus('http');
          btn.disabled = false;
          state.events += 1;
          recordStats(true, ms);
          pushHistory('http', ms);
        }
      });
    });
  }

  /* =====================================================================
     9. Communication test (client → router / DNS / HTTP / internet)
     ===================================================================== */
  const TEST_TARGETS = [
    { key: 'router', label: 'Router Connection', detail: '192.168.1.1', at: 400 },
    { key: 'dns', label: 'DNS Connection', detail: '192.168.1.10 · UDP/53', at: 900 },
    { key: 'http', label: 'HTTP Connection', detail: '192.168.1.20 · TCP/80', at: 1400 },
    { key: 'internet', label: 'Internet Connection', detail: '203.0.113.8 · WAN', at: 1900 }
  ];

  function resetTest() {
    state.testToken += 1;
    $$('#testResults .test-list__row').forEach(function (row) {
      row.className = 'test-list__row';
      const s = $('.test-list__state', row);
      if (s) { s.textContent = 'Waiting'; s.dataset.state = 'idle'; }
      const r = $('.test-list__reason', row);
      if (r) r.remove();
    });
    setText('testChip', 'Not tested');
  }

  function setTestRow(key, stateName, reason) {
    const row = $('.test-list__row[data-target="' + key + '"]');
    if (!row) return;
    row.className = 'test-list__row' +
      (stateName === 'testing' ? ' is-testing' : stateName === 'success' ? ' is-success' : stateName === 'fail' ? ' is-fail' : '');
    const s = $('.test-list__state', row);
    if (s) { s.textContent = stateName === 'testing' ? 'Testing…' : stateName === 'success' ? 'Success' : stateName === 'fail' ? 'Failed' : 'Waiting'; s.dataset.state = stateName; }
    const old = $('.test-list__reason', row);
    if (old) old.remove();
    if (reason) {
      const span = document.createElement('span');
      span.className = 'test-list__reason';
      span.textContent = reason;
      $('.test-list__name', row).appendChild(span);
    }
  }

  function runCommunicationTest() {
    const token = ++state.testToken;
    setText('testChip', 'Testing…');

    TEST_TARGETS.forEach(function (t) {
      setTestRow(t.key, 'testing');
      delay(t.at, function () {
        if (token !== state.testToken) return;
        const ok = state.wifi || t.key !== 'router';
        setTestRow(t.key, ok ? 'success' : 'fail', ok ? t.detail + ' · reply in ' + randInt(1, 24) + ' ms' : 'unreachable');
        flashStatus(t.key);
      });
    });

    delay(2400, function () {
      if (token !== state.testToken) return;
      const failed = state.wifi ? 0 : TEST_TARGETS.length;
      setText('testChip', state.wifi ? 'All reachable' : 'Failed');
      log(state.wifi
        ? 'Test Communication — router, DNS, HTTP and Internet all reachable'
        : 'Test Communication failed — Wi-Fi is disconnected', state.wifi ? 'success' : 'error');
      showToast(state.wifi ? 'Communication test successful' : 'Communication test failed',
        state.wifi ? '' : 'error');
      if (failed) recordStats(false, 0);
    });
  }

  /* =====================================================================
     10. Complete demo
     ===================================================================== */
  function buildDemoSteps() {
    const list = $('#demoSteps');
    if (!list) return;
    DEMO_STEPS.forEach((s, i) => {
      const li = document.createElement('li');
      li.className = 'steps__item';
      li.dataset.step = String(i + 1);
      li.innerHTML =
        '<span class="steps__num">' + (i + 1) + '</span>' +
        '<span class="steps__body"><strong>' + s.label + '</strong><small>' + s.detail + '</small></span>';
      list.appendChild(li);
    });
  }

  function setDemoStep(index, cls) {
    const step = $('.steps__item[data-step="' + index + '"]');
    if (!step) return;
    step.className = 'steps__item' + (cls ? ' ' + cls : '');
  }

  function resetDemo() {
    state.demoToken += 1;
    $$('.steps__item').forEach(function (s) { s.className = 'steps__item'; });
    setText('demoChip', 'Idle');
    const banner = byId('demoBanner');
    if (banner) { banner.hidden = true; banner.className = 'banner'; }
  }

  function runDemo() {
    if (!state.wifi) {
      showToast('Reconnect Wi-Fi to run the demo', 'error');
      return;
    }
    resetDemo();
    const token = state.demoToken;
    const btn = byId('demoBtn');
    btn.disabled = true;
    setText('demoChip', 'Running…');

    DEMO_STEPS.forEach(function (s, i) {
      delay(i * 1200, function () {
        if (token !== state.demoToken) return;
        setDemoStep(i + 1, 'is-active');
        log(s.log, i === DEMO_STEPS.length - 1 ? 'success' : 'info');

        if (i === 0) { connectWifiSteps(); }
        if (i === 1) { runDnsForDemo(); }
        if (i === 2 || i === 3) { if (i === 2) sendHttpForDemo(); }
        if (i === 4) { runPerformanceForDemo(); }

        delay(900, function () {
          if (token !== state.demoToken) return;
          setDemoStep(i + 1, i === DEMO_STEPS.length - 1 ? 'is-done' : 'is-done');
        });
      });
    });

    delay(DEMO_STEPS.length * 1200 + 900, function () {
      if (token !== state.demoToken) return;
      setText('demoChip', 'Completed');
      const banner = byId('demoBanner');
      if (banner) banner.hidden = false;
      showToast('Complete network simulation successful');
      btn.disabled = false;
    });
  }

  /* light-weight visual helpers used by the demo (no duplicated logic) */
  function connectWifiSteps() {
    resetFlow('wifiFlow');
    [1, 2, 3, 4].forEach(function (n, i) {
      delay(i * 320, function () { setFlowStep('wifiFlow', n, 'is-done', 'done'); });
    });
  }

  function runDnsForDemo() {
    resetFlow('dnsFlow');
    [1, 2, 3, 4].forEach(function (n, i) {
      delay(i * 220, function () { setFlowStep('dnsFlow', n, 'is-done', 'done'); });
    });
    setText('dnsIp', DNS_RECORDS['www.retailstore.com']);
    setText('dnsStatus', 'Resolved (200 OK)');
    const v = byId('dnsIp'); if (v) v.className = 'result__value is-ok';
    const s = byId('dnsStatus'); if (s) s.className = 'result__value is-ok';
    const box = byId('dnsResultBox'); if (box) box.className = 'result is-ok';
  }

  function sendHttpForDemo() {
    resetFlow('httpFlow');
    [1, 2, 3, 4].forEach(function (n, i) {
      delay(i * 180, function () { setFlowStep('httpFlow', n, 'is-done', 'done'); });
    });
    consoleLine('--- HTTP transaction (demo)   GET / HTTP/1.1 ---', 'srv');
    consoleLine('HTTP/1.1 200 OK   Server: nginx/1.24.0', 'res');
    setText('httpStatus', '200 OK');
    setText('httpCode', '200 OK');
    setText('httpTime', randInt(18, 42) + ' ms');
    const c = byId('httpCode'); if (c) c.className = 'ok';
    const t = byId('httpTime'); if (t) t.className = 'ok';
    const s = byId('httpStatus'); if (s) s.className = 'ok';
    recordStats(true, randInt(18, 42));
  }

  function runPerformanceForDemo() {
    const btn = byId('perfTestBtn');
    if (btn && !btn.disabled) runPerformanceTest(true);
  }

  /* =====================================================================
     11. Performance analysis + chart
     ===================================================================== */
  function recordStats(ok, latency) {
    state.stats.sent += 1;
    if (ok) { state.stats.received += 1; state.stats.ok += 1; }
    else { state.stats.lost += 1; state.stats.failed += 1; }
    state.stats.latency = latency || state.stats.latency;
    if (latency) state.stats.response = latency;
    renderPerfTiles();
  }

  function renderPerfTiles() {
    const s = state.stats;
    setText('perfSent', String(s.sent));
    setText('perfReceived', String(s.received));
    setText('perfLatency', s.latency ? s.latency + ' ms' : '—');
    setText('perfResponse', s.response ? s.response + ' ms' : '—');
    const loss = s.sent ? ((s.lost / s.sent) * 100).toFixed(1) + '%' : '—';
    setText('perfLoss', s.sent ? loss : '—');
    const rate = s.sent ? ((s.ok / s.sent) * 100).toFixed(1) + '%' : '—';
    setText('perfSuccessRate', s.sent ? rate : '—');

    const lossEl = byId('perfLoss');
    if (lossEl) lossEl.className = 'metric__value' + (s.sent && s.lost > 0 ? ' is-warn' : '');
    const rateEl = byId('perfSuccessRate');
    if (rateEl) rateEl.className = 'metric__value' + (s.sent && s.failed > 0 ? ' is-warn' : '');
  }

  function pushHistory(key, value) {
    const arr = state.history[key];
    arr.push(value);
    if (arr.length > 12) arr.shift();
    drawChart();
  }

  function resetPerf() {
    state.stats = { sent: 0, received: 0, lost: 0, ok: 0, failed: 0, latency: 0, response: 0 };
    state.history = { dns: [], http: [], latency: [] };
    renderPerfTiles();
    setText('perfChip', 'Not tested');
    const btn = byId('perfTestBtn');
    if (btn) btn.disabled = false;
    drawChart();
  }

  function runPerformanceTest(silent) {
    if (!silent && !state.wifi) {
      showToast('Wi-Fi is disconnected', 'error');
      log('Performance test failed — no network connectivity', 'error');
      return;
    }
    const token = ++state.perfToken;
    const btn = byId('perfTestBtn');
    const total = 20;
    let sent = 0;
    let received = 0;
    let lost = 0;
    const latencies = [];

    if (btn) btn.disabled = true;
    setText('perfChip', 'Testing 0/' + total);

    const step = () => {
      if (token !== state.perfToken) return;
      sent += 1;
      const dropped = Math.random() * 100 < state.loss;
      const latency = randInt(8, state.loss > 10 ? 90 : 42);

      if (dropped) {
        lost += 1;
        log('Packet ' + sent + ' lost in transit (configured ' + state.loss + '% loss)', 'warn');
      } else {
        received += 1;
        latencies.push(latency);
        recordStats(true, latency);
        pushHistory('latency', latency);
      }

      if (sent < total) {
        setText('perfChip', 'Testing ' + sent + '/' + total);
        delay(160, step);
        return;
      }

      const avg = latencies.length
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0;
      setText('perfLatency', avg ? avg + ' ms' : '—');
      pushHistory('dns', randInt(8, 22));
      pushHistory('http', randInt(18, 42));

      const pct = ((lost / total) * 100).toFixed(1) + '%';
      setText('perfChip', 'Test complete · loss ' + pct);
      if (btn) btn.disabled = false;
      log('Performance test finished — ' + sent + ' packets sent, ' + received + ' received, ' +
        lost + ' lost (' + pct + '), avg latency ' + (avg || 0) + ' ms', lost ? 'warn' : 'success');
      if (!silent) {
        showToast(lost ? 'Test complete with ' + lost + ' lost packets' : 'Performance test successful', lost ? 'info' : '');
        flashStatus('router');
      }
      renderPerfTiles();
    };

    delay(200, step);
  }

  function chartColors() {
    const css = getComputedStyle(document.documentElement);
    const v = (n, fallback) => (css.getPropertyValue(n) || fallback).trim();
    return {
      grid: 'rgba(88,116,168,0.18)',
      dns: v('--dns', '#a78bfa'),
      http: v('--http', '#34d399'),
      lat: v('--lan', '#38bdf8'),
      text: v('--faint', '#6b7d9e')
    };
  }

  function drawChart() {
    const canvas = byId('perfChart');
    if (!canvas) return;
    const wrap = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(wrap.clientWidth - 16, 10);
    const h = Math.max(wrap.clientHeight - 16, 10);

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const c = chartColors();
    const padX = 6;
    const padY = 8;

    ctx.strokeStyle = c.grid;
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i += 1) {
      const y = padY + ((h - padY * 2) / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(w - padX, y);
      ctx.stroke();
    }

    const series = [
      { data: state.history.latency, color: c.lat },
      { data: state.history.dns, color: c.dns },
      { data: state.history.http, color: c.http }
    ];
    const max = Math.max(20, ...series.flatMap((s) => s.data)) * 1.15;

    series.forEach((s) => {
      if (!s.data.length) return;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      s.data.forEach((v, i) => {
        const x = padX + ((w - padX * 2) / Math.max(s.data.length - 1, 1)) * i;
        const y = h - padY - (v / max) * (h - padY * 2);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      const lx = padX + ((w - padX * 2) / Math.max(s.data.length - 1, 1)) * (s.data.length - 1);
      const ly = h - padY - (s.data[s.data.length - 1] / max) * (h - padY * 2);
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(lx, ly, 2.6, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = c.text;
    ctx.font = '10px ui-monospace, Consolas, monospace';
    ctx.fillText(max.toFixed(0) + ' ms', padX + 2, padY + 8);
    ctx.fillText('0 ms', padX + 2, h - 2);

    if (!state.history.latency.length && !state.history.dns.length && !state.history.http.length) {
      ctx.fillStyle = c.text;
      ctx.font = '11.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('No measurements yet — run a performance test.', padX + 10, h / 2);
    }
  }

  /* =====================================================================
     12. Modal + toast
     ===================================================================== */
  function openModal(title, html) {
    byId('modalTitle').textContent = title;
    byId('modalBody').innerHTML = html;
    byId('modal').hidden = false;
  }

  function closeModal() { byId('modal').hidden = true; }

  function showWifiDetails() {
    const clients = WIRELESS.map(function (d) {
      return '<div class="modal__dev"><span class="dot ' + (state.wifi ? 'dot--ok' : 'dot--err') + '"></span>' +
        d.name + '<span class="ip">' + d.ip + '</span></div>';
    }).join('');

    openModal('Wi-Fi Details — RetailStore_WiFi',
      row('SSID', 'RetailStore_WiFi') +
      row('Security', 'WPA2 (PSK / AES)') +
      row('Channel', 'Auto (1—13)') +
      row('Band', '2.4 GHz + 5 GHz') +
      row('Signal Strength', '<span class="ok">Strong (-46 dBm)</span>') +
      row('Connected Devices', state.wifi ? String(WIRELESS.length) : '0') +
      row('Status', state.wifi ? '<span class="ok">Connected</span>' : '<span class="bad">Disconnected</span>') +
      row('Access Point IP', '192.168.1.2') +
      '<p class="modal__title2">Associated clients</p>' +
      '<div class="modal__devlist">' + clients + '</div>'
    );
    log('Wi-Fi details viewed for RetailStore_WiFi', 'info');
    flashStatus('wifi');
  }

  let toastTimer = null;
  function showToast(message, kind) {
    const el = byId('toast');
    if (!el) return;
    el.textContent = message;
    el.className = 'toast' + (kind ? ' toast--' + kind : '');
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = delay(2600, function () { el.hidden = true; });
  }

  /* =====================================================================
     13. Sidebar navigation — single-page view switching (no scroll, no reload)
     ===================================================================== */
  const NAV_TITLES = {
    overview: 'Network Overview',
    devices: 'Devices',
    wifi: 'Wi-Fi',
    dns: 'DNS',
    http: 'HTTP',
    test: 'Network Test',
    performance: 'Performance',
    protocols: 'Protocols'
  };

  const NAV_SUBS = {
    overview: 'Retail Store Network Architecture',
    devices: 'Every device connected to the store network',
    wifi: 'Wireless network configuration and clients',
    dns: 'How a domain name becomes an IP address',
    http: 'How a client requests and receives a web page',
    test: 'Connectivity check across the store network',
    performance: 'Latency, packet loss and success rate',
    protocols: 'Role of each protocol in the store network'
  };

  const DEFAULT_VIEW = 'overview';
  let currentView = null;
  let relayoutHooks = [];

  function onRelayout(fn) { relayoutHooks.push(fn); }

  /* show exactly one view, hide every other one */
  function showView(key) {
    const view = $('.view[data-view="' + key + '"]');
    if (!view || key === currentView) return;

    $$('.view').forEach((v) => {
      const active = v === view;
      v.classList.toggle('is-active', active);
      if (active) v.removeAttribute('hidden');
      else v.setAttribute('hidden', '');
    });

    $$('.sidenav__link').forEach((l) => l.classList.toggle('is-active', l.dataset.nav === key));

    currentView = key;
    const title = NAV_TITLES[key];
    if (title) setText('pageTitle', title);
    const sub = NAV_SUBS[key];
    if (sub) setText('pageSub', sub);

    const page = byId('page');
    if (page) page.scrollTop = 0;

    /* hidden elements have no layout — re-measure what the new view needs */
    relayoutHooks.forEach(function (fn) {
      try { fn(); } catch (e) { /* ignore */ }
    });
  }

  function setActiveNav(key) {
    showView(key);
  }

  function closeNav() {
    document.body.classList.remove('nav-open');
    byId('sidebarBackdrop').hidden = true;
  }

  function initNav() {
    $$('.sidenav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        showView(link.dataset.nav);
        closeNav();
      });
    });

    byId('menuBtn').addEventListener('click', function () {
      const open = document.body.classList.toggle('nav-open');
      byId('sidebarBackdrop').hidden = !open;
    });
    byId('sidebarBackdrop').addEventListener('click', closeNav);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeModal(); closeNav(); }
    });

    currentView = null;
    showView(DEFAULT_VIEW);
  }

  /* =====================================================================
     14. Boot
     ===================================================================== */
  function init() {
    buildDiagram();
    buildDeviceCards();
    buildStatus();
    buildClientSelect();
    buildAssocList();
    buildDemoSteps();
    buildProtocolIcons();
    seedLog();
    initNav();

    const relayout = function () { if (currentView === 'performance') drawChart(); };
    onRelayout(relayout);
    window.addEventListener('resize', relayout);

    byId('btnStart').addEventListener('click', startSimulation);
    byId('btnPause').addEventListener('click', pauseSimulation);
    byId('btnReset').addEventListener('click', resetSimulation);
    byId('btnTest').addEventListener('click', testConnection);
    byId('testCommBtn').addEventListener('click', runCommunicationTest);

    byId('dnsResolveBtn').addEventListener('click', resolveDns);
    $('#dnsInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') resolveDns();
    });

    byId('httpSendBtn').addEventListener('click', sendHttpRequest);
    byId('httpClearBtn').addEventListener('click', function () {
      resetHttp();
      log('HTTP console cleared', 'info');
    });

    byId('wifiConnectBtn').addEventListener('click', connectWifi);
    byId('wifiDisconnectBtn').addEventListener('click', disconnectWifi);
    byId('wifiDetailsBtn').addEventListener('click', showWifiDetails);

    byId('demoBtn').addEventListener('click', runDemo);
    byId('perfTestBtn').addEventListener('click', function () { runPerformanceTest(false); });

    $$('#lossSeg .seg__btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('#lossSeg .seg__btn').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        state.loss = Number(btn.dataset.loss);
        log('Packet loss probability set to ' + state.loss + '%', state.loss ? 'warn' : 'info');
      });
    });

    byId('logClearBtn').addEventListener('click', function () {
      seedLog();
      log('Activity log cleared', 'info');
    });

    byId('modalClose').addEventListener('click', closeModal);
    byId('modal').addEventListener('click', function (e) {
      if (e.target.hasAttribute('data-close')) closeModal();
    });

    setState('idle');
    updateElapsed();
    renderPerfTiles();
    setText('devicesSub', DEVICES.length + ' devices on the retail store network');
    setText('headerClock', nowTime());
    startClock();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
