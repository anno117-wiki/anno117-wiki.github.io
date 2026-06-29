const REPO = 'anno117-wiki/anno117-wiki.github.io';
const GH_API = 'https://api.github.com';

const TYPE_JA = {
  comment: 'コメント',
  report: '誤り報告',
  bug: 'バグ報告',
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

async function checkRateLimit(env, ip) {
  if (!env.COMMENT_KV) return true;
  const key = `rate:${ip}:${new Date().toISOString().slice(0, 10)}`;
  const count = parseInt((await env.COMMENT_KV.get(key)) || '0', 10);
  if (count >= 10) return false;
  await env.COMMENT_KV.put(key, String(count + 1), { expirationTtl: 86400 });
  return true;
}

async function handlePost(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const allowed = await checkRateLimit(env, ip);
  if (!allowed) return json({ error: '1日の投稿上限（10件）に達しました' }, 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'リクエストボディが不正です' }, 400);
  }

  const { name, type, body: text, page } = body;
  if (!name || !type || !text || !page) return json({ error: 'name / type / body / page は必須です' }, 400);
  if (!TYPE_JA[type]) return json({ error: 'type は comment / report / bug のいずれかです' }, 400);

  const typeJa = TYPE_JA[type];
  const title = `[${typeJa}] ${page} — ${name}`;
  const issueBody = `**投稿者**: ${name}\n**ページ**: ${page}\n**種別**: ${typeJa}\n\n---\n\n${text}`;

  const res = await fetch(`${GH_API}/repos/${REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'anno117-wiki-worker',
    },
    body: JSON.stringify({
      title,
      body: issueBody,
      labels: ['user-comment', `type:${type}`],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return json({ error: 'GitHub API エラー', detail: err }, 502);
  }

  const issue = await res.json();
  return json({ number: issue.number, url: issue.html_url }, 201);
}

function parseIssueBody(rawBody) {
  const nameMatch = rawBody.match(/^\*\*投稿者\*\*: (.+)$/m);
  const typeMatch = rawBody.match(/^\*\*種別\*\*: (.+)$/m);
  const bodyMatch = rawBody.match(/---\n\n([\s\S]*)$/);
  return {
    name: nameMatch ? nameMatch[1].trim() : '',
    typeJa: typeMatch ? typeMatch[1].trim() : '',
    text: bodyMatch ? bodyMatch[1].trim() : rawBody,
  };
}

async function handleGet(request, env) {
  const url = new URL(request.url);
  const page = url.searchParams.get('page');

  const q = page
    ? encodeURIComponent(`repo:${REPO} is:open label:user-comment "${page}" in:body`)
    : encodeURIComponent(`repo:${REPO} is:open label:user-comment`);
  const res = await fetch(`${GH_API}/search/issues?q=${q}&sort=created&order=desc&per_page=50`, {
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'anno117-wiki-worker',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    return json({ error: 'GitHub API エラー', detail: err }, 502);
  }

  const data = await res.json();
  const ghHeaders = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'anno117-wiki-worker',
  };

  const comments = await Promise.all(
    (data.items || []).map(async (issue) => {
      const { name, typeJa, text } = parseIssueBody(issue.body || '');

      let replies = [];
      try {
        const rRes = await fetch(`${GH_API}/repos/${REPO}/issues/${issue.number}/comments?per_page=50`, {
          headers: ghHeaders,
        });
        if (rRes.ok) {
          const rData = await rRes.json();
          replies = rData.map((c) => ({
            id: c.id,
            author: c.user?.login ?? '',
            body: c.body ?? '',
            createdAt: c.created_at,
          }));
        }
      } catch {
        // フォールバック: replies は空配列のまま
      }

      return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        name,
        type: typeJa,
        body: text,
        createdAt: issue.created_at,
        replies,
      };
    })
  );

  return json(comments);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/comment' && request.method === 'POST') return handlePost(request, env);
    if (path === '/comments' && request.method === 'GET') return handleGet(request, env);

    return json({ error: 'Not Found' }, 404);
  },
};
