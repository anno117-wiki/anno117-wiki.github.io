const REPO = 'anno117-wiki/anno117-wiki.github.io';
const OWNER_LOGIN = 'kojifujita0822';
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
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() },
  });
}

async function checkRateLimit(env, ip) {
  if (!env.COMMENT_KV) return true;
  const key = `rate:${ip}:${new Date().toISOString().slice(0, 10)}`;
  const count = parseInt((await env.COMMENT_KV.get(key)) || '0', 10);
  if (count >= 20) return false;
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

  const { type } = body;
  const name = (body.name ?? '').trim().replaceAll('\n', '').replaceAll('\r', '');
  const text = (body.body ?? '').trim();
  const page = (body.page ?? '').trim();

  if (!name || name.length > 100) return json({ error: 'name は1〜100文字で入力してください' }, 400);
  if (!text || text.length > 5000) return json({ error: 'body は1〜5000文字で入力してください' }, 400);
  if (!page) return json({ error: 'page は必須です' }, 400);
  if (!type) return json({ error: 'type は必須です' }, 400);
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

  const apiUrl = `${GH_API}/repos/${REPO}/issues?state=open&labels=user-comment&sort=created&direction=desc&per_page=100`;
  const res = await fetch(apiUrl, {
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

  const issues = (await res.json()).filter((issue) =>
    !page || (issue.body || '').includes(`**ページ**: ${page}`)
  );
  const ghHeaders = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'anno117-wiki-worker',
  };

  const comments = await Promise.all(
    issues.map(async (issue) => {
      const { name, typeJa, text } = parseIssueBody(issue.body || '');

      let replies = [];
      try {
        const cacheKey = `replies:${issue.number}`;
        const cached = env.COMMENT_KV ? await env.COMMENT_KV.get(cacheKey) : null;
        if (cached) {
          replies = JSON.parse(cached);
        } else {
          const rRes = await fetch(`${GH_API}/repos/${REPO}/issues/${issue.number}/comments?per_page=50`, {
            headers: ghHeaders,
          });
          if (rRes.ok) {
            const rData = await rRes.json();
            replies = rData.map((c) => ({
              id: c.id,
              author: c.user?.login === OWNER_LOGIN ? '運営' : (c.user?.login ?? ''),
              body: c.body ?? '',
              createdAt: c.created_at,
            }));
            if (env.COMMENT_KV) {
              await env.COMMENT_KV.put(cacheKey, JSON.stringify(replies), { expirationTtl: 300 });
            }
          }
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
