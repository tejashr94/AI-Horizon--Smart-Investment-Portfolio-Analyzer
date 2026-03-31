/* ============================================
   AI HORIZON — app.js
   All chat logic, charts & image generation
   ============================================ */

// ── API KEYS — Add yours below ──────────────────────────────────
const TEXT_API_KEY = "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";
const IMAGE_API_KEY = "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";

// ── MODELS ──────────────────────────────────────────────────────
const TEXT_MODEL  = "nvidia/nemotron-3-super-120b-a12b:free";
const IMAGE_MODEL = "bytedance-seed/seedream-4.5";
const API_URL     = "https://openrouter.ai/api/v1/chat/completions";

// ── SYSTEM PROMPT ────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a specialized Smart Investment and Portfolio Analyzer AI assistant built by Team AI HORIZON.

YOUR RULES:
1. You ONLY answer questions about: investments, stocks, bonds, mutual funds, ETFs, portfolio diversification, asset allocation, risk management, financial markets, trading strategies, wealth management, real estate investment, commodities, SIP, index funds, financial ratios, and any directly related financial topics.
2. If the user asks about ANYTHING outside these topics (like AI concepts, coding, sports, cooking, general knowledge, history, entertainment, etc.), respond with exactly this and nothing else: "I am designed to handle queries related to Smart Investment and Portfolio Analysis only. Please ask me about investments, portfolios, or financial strategies."
3. NEVER use any markdown formatting. No asterisks (*), double asterisks (**), hash symbols (#), underscores, backticks, or dashes for bullets.
4. Write in plain clear prose. Use numbered lists like: 1. Point one  2. Point two — on new lines.
5. For section headings write them plainly on their own line followed by a colon, like:  Risk Management:
6. Be professional, data-driven, and give actionable advice.`;

// ── STATE ────────────────────────────────────────────────────────
let busy       = false;
let chartCount = 0;

// ── HELPERS ──────────────────────────────────────────────────────
function timeNow() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function esc(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function scrollDown() {
  const el = document.getElementById('messages');
  el.scrollTop = el.scrollHeight;
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 110) + 'px';
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function askQuick(text) {
  document.getElementById('user-input').value = text;
  sendMessage();
}

// ── DECIDE IF CHART IS NEEDED ─────────────────────────────────────
function wantsChart(q, reply) {
  const combined = (q + ' ' + reply).toLowerCase();
  const keys = ['allocat', 'portfolio', 'diversif', '%', 'equity', 'debt',
    'bond', 'gold', 'real estate', 'sector', 'return', 'performance',
    'asset class', 'breakdown', 'fund', 'stock'];
  return keys.some(k => combined.includes(k));
}

// ── DECIDE IF IMAGE IS NEEDED ─────────────────────────────────────
function wantsImage(q) {
  const keys = ['invest', 'portfolio', 'stock market', 'trading', 'bull',
    'bear', 'wealth', 'market', 'diversif', 'finance', 'economic'];
  return keys.some(k => q.toLowerCase().includes(k));
}

// ── BUILD CHART DATA ──────────────────────────────────────────────
function chartData(reply) {
  const t = reply.toLowerCase();

  if (t.includes('sector')) {
    return {
      type:   'bar',
      title:  'Sector Allocation',
      labels: ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Utilities'],
      data:   [28, 18, 22, 12, 14, 6],
      colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8', '#1e40af'],
    };
  }

  if (t.includes('return') || t.includes('performance') || t.includes('growth')) {
    return {
      type:   'line',
      title:  'Annual Portfolio Returns (%)',
      labels: ['2019', '2020', '2021', '2022', '2023', '2024'],
      data:   [12.4, 8.1, 21.3, -4.8, 16.2, 13.7],
      colors: ['#3b82f6'],
    };
  }

  // Default doughnut
  return {
    type:   'doughnut',
    title:  'Suggested Portfolio Allocation',
    labels: ['Equities', 'Bonds', 'Gold', 'Real Estate', 'Cash'],
    data:   [40, 25, 15, 12, 8],
    colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb', '#1d4ed8'],
  };
}

// ── RENDER CHART ──────────────────────────────────────────────────
function renderChart(bubble, cfg) {
  const card = document.createElement('div');
  card.className = 'chart-card';

  const label = document.createElement('div');
  label.className = 'chart-label';
  label.textContent = cfg.title;
  card.appendChild(label);

  const canvas = document.createElement('canvas');
  canvas.id = 'chart-' + (++chartCount);
  card.appendChild(canvas);
  bubble.appendChild(card);

  const isDough = cfg.type === 'doughnut';
  const isLine  = cfg.type === 'line';

  new Chart(canvas, {
    type: cfg.type,
    data: {
      labels: cfg.labels,
      datasets: [{
        data: cfg.data,
        backgroundColor: isDough
          ? cfg.colors.map(c => c + '66')
          : isLine ? 'rgba(59,130,246,0.1)' : cfg.colors.map(c => c + '99'),
        borderColor: isDough ? cfg.colors : isLine ? cfg.colors[0] : cfg.colors,
        borderWidth: isDough ? 2 : isLine ? 2.5 : 1.5,
        fill: isLine,
        tension: isLine ? 0.4 : undefined,
        pointBackgroundColor: isLine ? '#3b82f6' : undefined,
        pointRadius: isLine ? 5 : undefined,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: isDough ? 'right' : 'top',
          labels: {
            color: '#8fadc8',
            font: { family: 'DM Sans', size: 11 },
            padding: 12,
            boxWidth: 12,
          },
        },
        tooltip: {
          backgroundColor: '#112240',
          titleColor: '#60a5fa',
          bodyColor: '#e2eaf4',
          borderColor: 'rgba(59,130,246,0.3)',
          borderWidth: 1,
          callbacks: {
            label: ctx => isDough
              ? ` ${ctx.label}: ${ctx.parsed}%`
              : ` ${ctx.parsed}${isLine ? '%' : ''}`,
          },
        },
      },
      scales: !isDough ? {
        x: { ticks: { color: '#4a6580', font: { family: 'DM Sans', size: 11 } }, grid: { color: 'rgba(59,130,246,0.08)' } },
        y: { ticks: { color: '#4a6580', font: { family: 'DM Sans', size: 11 } }, grid: { color: 'rgba(59,130,246,0.08)' } },
      } : {},
    },
  });
}

// ── GENERATE IMAGE ────────────────────────────────────────────────
async function generateImage(prompt, bubble) {
  const loader = document.createElement('div');
  loader.className = 'img-loading';
  loader.textContent = '🖼 Generating image, please wait…';
  bubble.appendChild(loader);
  scrollDown();

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + IMAGE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        messages: [{
          role: 'user',
          content: 'Professional financial illustration about: ' + prompt + '. Clean, modern style, blue tones, investment and finance theme.',
        }],
        modalities: ['image'],
      }),
    });

    const data = await res.json();
    const msg  = data?.choices?.[0]?.message;
    const imgB = Array.isArray(msg?.content)
      ? msg.content.find(b => b.type === 'image_url')
      : null;

    loader.remove();

    if (imgB?.image_url?.url) {
      const img = document.createElement('img');
      img.className = 'ai-img';
      img.src = imgB.image_url.url;
      img.alt = 'Investment visual';
      bubble.appendChild(img);
      scrollDown();
    }
  } catch {
    loader.remove();
  }
}

// ── ADD USER MESSAGE ──────────────────────────────────────────────
function addUserMsg(text) {
  const row = document.createElement('div');
  row.className = 'msg-row user';
  row.innerHTML = `
    <div class="msg-av usr">👤</div>
    <div class="msg-wrap">
      <div class="bubble">${esc(text)}</div>
      <div class="msg-time">${timeNow()}</div>
    </div>`;
  document.getElementById('messages').appendChild(row);
  scrollDown();
}

// ── ADD THINKING ──────────────────────────────────────────────────
function addThinking() {
  const row = document.createElement('div');
  row.className = 'thinking-row';
  row.id = 'thinking';
  row.innerHTML = `
    <div class="msg-av ai">📈</div>
    <div class="thinking-bubble">
      <div class="dots"><span></span><span></span><span></span></div>
      <span class="thinking-text">Analyzing your query…</span>
    </div>`;
  document.getElementById('messages').appendChild(row);
  scrollDown();
}

function removeThinking() {
  const el = document.getElementById('thinking');
  if (el) el.remove();
}

// ── ADD AI MESSAGE ────────────────────────────────────────────────
function addAIMsg(text, userQuery) {
  const row = document.createElement('div');
  row.className = 'msg-row';

  const av = document.createElement('div');
  av.className = 'msg-av ai';
  av.textContent = '📈';

  const wrap = document.createElement('div');
  wrap.className = 'msg-wrap';
  wrap.style.maxWidth = '78%';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';

  // Plain text only — no markdown
  const p = document.createElement('p');
  p.style.whiteSpace = 'pre-line';
  p.textContent = text;
  bubble.appendChild(p);

  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = 'AI HORIZON · ' + timeNow();

  wrap.appendChild(bubble);
  wrap.appendChild(time);
  row.appendChild(av);
  row.appendChild(wrap);
  document.getElementById('messages').appendChild(row);
  scrollDown();

  // Add chart if topic warrants it
  if (wantsChart(userQuery, text)) {
    renderChart(bubble, chartData(text));
    scrollDown();
  }

  // Add AI image (async)
  if (wantsImage(userQuery)) {
    generateImage(userQuery, bubble);
  }
}

// ── SEND MESSAGE ──────────────────────────────────────────────────
async function sendMessage() {
  if (busy) return;

  const inp  = document.getElementById('user-input');
  const text = inp.value.trim();
  if (!text) return;

  inp.value = '';
  inp.style.height = 'auto';
  busy = true;
  document.getElementById('send-btn').disabled = true;

  addUserMsg(text);
  addThinking();

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + TEXT_API_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ai-horizon.github.io',
        'X-Title': 'AI HORIZON Investment Analyzer',
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user',   content: text },
        ],
      }),
    });

    const data  = await res.json();
    removeThinking();

    const reply = data?.choices?.[0]?.message?.content
      || 'Could not get a response. Please check your API key and try again.';

    addAIMsg(reply, text);

  } catch (err) {
    removeThinking();
    addAIMsg('Network error. Please check your API key and internet connection.', text);
  } finally {
    busy = false;
    document.getElementById('send-btn').disabled = false;
  }
}
