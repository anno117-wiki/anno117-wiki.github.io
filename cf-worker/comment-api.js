const REPO = 'anno117-wiki/anno117-wiki.github.io';
const OWNER_LOGIN = 'kojifujita0822';
const GH_API = 'https://api.github.com';

const ALLOWED_ORIGINS = [
  'https://anno117-wiki.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
];

const TYPE_JA = {
  comment: 'コメント',
  report: '誤り報告',
  bug: 'バグ報告',
};

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(origin) },
  });
}

const DAILY_LIMIT_PER_IP = 5;
const DAILY_LIMIT_GLOBAL = 50;

// 短時間の連投を抑える（Workers の ratelimit バインディング。ロケーションごとの近似値）。
// バインディングが無い・失敗したときは投稿を止めない。
async function checkBurstLimit(env, ip) {
  if (!env.POST_LIMITER) return true;
  try {
    const { success } = await env.POST_LIMITER.limit({ key: ip });
    return success;
  } catch (error) {
    console.error('[rate-limit] POST_LIMITER failed:', error);
    return true;
  }
}

// 1日あたりの件数を KV で数える（keyBase ごとに日付で分ける）
async function incrementDailyCount(env, keyBase, limit) {
  if (!env.COMMENT_KV) return true;
  const key = `${keyBase}:${new Date().toISOString().slice(0, 10)}`;
  const count = parseInt((await env.COMMENT_KV.get(key)) || '0', 10);
  if (count >= limit) return false;
  await env.COMMENT_KV.put(key, String(count + 1), { expirationTtl: 86400 });
  return true;
}

// IPごとの連投・1日上限を調べる。超過していれば返すレスポンス、問題なければ null
async function checkIpLimits(request, env, origin) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!(await checkBurstLimit(env, ip))) {
    return json({ error: '短時間に投稿が集中しています。しばらく待ってからお試しください' }, 429, origin);
  }
  if (!(await incrementDailyCount(env, `rate:${ip}`, DAILY_LIMIT_PER_IP))) {
    return json({ error: `1日の投稿上限（${DAILY_LIMIT_PER_IP}件）に達しました` }, 429, origin);
  }
  return null;
}

// 名前から改行とMarkdownの記号を除く
function cleanName(raw) {
  return (raw ?? '').trim().replaceAll('\n', '').replaceAll('\r', '').replace(/[*_`#\[\]]/g, '');
}

async function handlePost(request, env, origin) {
  const limited = await checkIpLimits(request, env, origin);
  if (limited) return limited;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'リクエストボディが不正です' }, 400, origin);
  }

  const { type } = body;
  let name = (body.name ?? '').trim().replaceAll('\n', '').replaceAll('\r', '');
  const text = (body.body ?? '').trim();
  const page = (body.page ?? '').trim();

  if (!name || name.length > 100) return json({ error: 'name は1〜100文字で入力してください' }, 400, origin);
  if (!text || text.length > 5000) return json({ error: 'body は1〜5000文字で入力してください' }, 400, origin);
  if (!page) return json({ error: 'page は必須です' }, 400, origin);
  if (!type) return json({ error: 'type は必須です' }, 400, origin);
  if (!TYPE_JA[type]) return json({ error: 'type は comment / report / bug のいずれかです' }, 400, origin);

  // 全体の上限は、入力が正しい投稿だけ数える（不正な入力で枠を使い切られないため）
  if (!(await incrementDailyCount(env, 'rate-global', DAILY_LIMIT_GLOBAL))) {
    return json({ error: '本日の投稿受付数が上限に達しました。明日以降にお試しください' }, 429, origin);
  }

  name = name.replace(/[*_`#\[\]]/g, '');

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
    return json({ error: 'GitHub API エラー' }, 502, origin);
  }

  const issue = await res.json();
  await invalidateCommentsCache(env); // 一覧のキャッシュを消し、すぐ画面に出す
  return json({ number: issue.number, url: issue.html_url }, 201, origin);
}

const GH_HEADERS_BASE = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'anno117-wiki-worker',
};

// 表示するのは open・closed どちらでもよい。サイトから隠したいIssueには、このラベルを付ける
const HIDDEN_LABEL = 'hidden';
const MAX_REPLIES_PER_ISSUE = 50;
const MAX_REPLY_LENGTH = 2000;
const RESERVED_NAME = '運営';

// 訪問者の返信は、運営のトークンでIssueコメントとして作る。
// 見分けのため本文の先頭に「**投稿者**: 名前」を付ける（GET側でこの形式を読む）。
async function handleReply(request, env, origin) {
  const limited = await checkIpLimits(request, env, origin);
  if (limited) return limited;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'リクエストボディが不正です' }, 400, origin);
  }

  const number = Number(body.number);
  const name = cleanName(body.name);
  const text = (body.body ?? '').trim();

  if (!Number.isInteger(number) || number <= 0) return json({ error: 'number が不正です' }, 400, origin);
  if (!name || name.length > 100) return json({ error: 'name は1〜100文字で入力してください' }, 400, origin);
  // 運営の返信と見分けがつかなくなるため、名前に使わせない
  if (name.includes(RESERVED_NAME)) return json({ error: `「${RESERVED_NAME}」を含む名前は使えません` }, 400, origin);
  if (!text || text.length > MAX_REPLY_LENGTH) {
    return json({ error: `body は1〜${MAX_REPLY_LENGTH}文字で入力してください` }, 400, origin);
  }

  const headers = { ...GH_HEADERS_BASE, Authorization: `Bearer ${env.GITHUB_TOKEN}` };

  // 返信先は「サイトに表示中のコメントIssue」だけに限る（無関係なIssueやPR、隠したコメントに書かせない）
  const issueRes = await fetch(`${GH_API}/repos/${REPO}/issues/${number}`, { headers });
  if (!issueRes.ok) return json({ error: '返信先のコメントが見つかりません' }, 404, origin);
  const issue = await issueRes.json();
  const labelNames = (issue.labels ?? []).map((l) => l.name);
  const isVisibleComment =
    !issue.pull_request && labelNames.includes('user-comment') && !labelNames.includes(HIDDEN_LABEL);
  if (!isVisibleComment) return json({ error: '返信先のコメントが見つかりません' }, 404, origin);
  if (issue.comments >= MAX_REPLIES_PER_ISSUE) {
    return json({ error: 'このコメントへの返信数が上限に達しています' }, 429, origin);
  }

  // 全体の上限は、入力が正しい返信だけ数える（投稿と同じ枠を共有する）
  if (!(await incrementDailyCount(env, 'rate-global', DAILY_LIMIT_GLOBAL))) {
    return json({ error: '本日の投稿受付数が上限に達しました。明日以降にお試しください' }, 429, origin);
  }

  const res = await fetch(`${GH_API}/repos/${REPO}/issues/${number}/comments`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: `**投稿者**: ${name}\n\n---\n\n${text}` }),
  });
  if (!res.ok) return json({ error: 'GitHub API エラー' }, 502, origin);

  // 一覧のキャッシュを消し、すぐ画面に出す
  await invalidateCommentsCache(env);
  return json({ ok: true }, 201, origin);
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

// 返信1件を表示用に整える。
// ヘッダー付きは Worker 経由の訪問者の返信。なりすまし防止のため、運営のトークンで作られたコメント（user が運営）だけに限って読む。
function parseReply(c) {
  const isOwner = c.user?.login === OWNER_LOGIN;
  const raw = c.body ?? '';
  const posted = isOwner ? raw.match(/^\*\*投稿者\*\*: (.+)\n\n---\n\n([\s\S]*)$/) : null;
  if (posted) {
    return { id: c.id, author: posted[1].trim(), body: posted[2].trim(), createdAt: c.created_at };
  }
  return {
    id: c.id,
    author: isOwner ? '運営' : (c.user?.login ?? ''),
    body: raw,
    createdAt: c.created_at,
  };
}

// コメント一覧（返信込み）は、全件を1つの KV キーにまとめて持つ。
// KV の無料枠は書き込みが1日1,000回までで、以前は「コメント1件ごとに60秒おき」に書いていたため、
// アクセスが続くと上限に近づいていた（2026-11 に Cloudflare から「50%」の通知）。
// 今は全件を1キー・5分おきに書くので、書き込みは多くても1日288回。読み取りは1回のリクエストにつき1回。
// 投稿・返信があったときはこのキーを消して、すぐ新しい内容が出るようにする。
const COMMENTS_CACHE_KEY = 'comments:all:v1';
const COMMENTS_CACHE_TTL = 300; // 秒。KV の expirationTtl は60秒以上

async function invalidateCommentsCache(env) {
  if (!env.COMMENT_KV) return;
  try {
    await env.COMMENT_KV.delete(COMMENTS_CACHE_KEY);
  } catch (error) {
    console.error('[cache] invalidate failed:', error);
  }
}

// 隠していないコメントIssueを全件、返信込みで GitHub から取る。
// 返す項目に pageLine（投稿時のページ。絞り込み用）を含める。呼び出し側で取り除く。
async function loadAllComments(env) {
  const ghHeaders = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'anno117-wiki-worker',
  };

  const MAX_PAGES = 5;
  let issues = [];
  let nextUrl = `${GH_API}/repos/${REPO}/issues?state=all&labels=user-comment&sort=created&direction=desc&per_page=100`;
  for (let p = 0; p < MAX_PAGES && nextUrl; p++) {
    const res = await fetch(nextUrl, { headers: ghHeaders });
    if (!res.ok) throw new Error(`GitHub API ${res.status}`);
    const batch = await res.json();
    issues = issues.concat(batch);
    const link = res.headers.get('Link') || '';
    const m = link.match(/<([^>]+)>;\s*rel="next"/);
    nextUrl = m ? m[1] : null;
  }
  const visible = issues.filter((issue) => !(issue.labels ?? []).some((l) => l.name === HIDDEN_LABEL));

  return Promise.all(
    visible.map(async (issue) => {
      const rawBody = issue.body || '';
      const { name, typeJa, text } = parseIssueBody(rawBody);

      let replies = [];
      try {
        const rRes = await fetch(`${GH_API}/repos/${REPO}/issues/${issue.number}/comments?per_page=50`, {
          headers: ghHeaders,
        });
        if (rRes.ok) replies = (await rRes.json()).map((c) => parseReply(c));
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
        pageLine: (rawBody.match(/^\*\*ページ\*\*: (.*)$/m) || [, ''])[1],
      };
    })
  );
}

async function handleGet(request, env, origin) {
  const url = new URL(request.url);
  const page = url.searchParams.get('page');

  let all = null;
  if (env.COMMENT_KV) {
    try {
      const cached = await env.COMMENT_KV.get(COMMENTS_CACHE_KEY);
      if (cached) all = JSON.parse(cached);
    } catch (error) {
      console.error('[cache] read failed:', error);
    }
  }

  if (!all) {
    try {
      all = await loadAllComments(env);
    } catch {
      return json({ error: 'GitHub API エラー' }, 502, origin);
    }
    if (env.COMMENT_KV) {
      try {
        await env.COMMENT_KV.put(COMMENTS_CACHE_KEY, JSON.stringify(all), { expirationTtl: COMMENTS_CACHE_TTL });
      } catch (error) {
        // 無料枠の上限などで書けなくても、取った内容はそのまま返す
        console.error('[cache] write failed:', error);
      }
    }
  }

  // ページを指定されたら、そのページに付いたコメントだけにする（以前の「本文に **ページ**: ○○ を含む」と同じ条件）
  const result = all
    .filter((c) => !page || (c.pageLine ?? '').startsWith(page))
    .map(({ pageLine, ...rest }) => rest);

  return json(result, 200, origin);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === 'POST' && !ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: '許可されていないオリジンです' }, 403, origin);
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/comment' && request.method === 'POST') return handlePost(request, env, origin);
    if (path === '/reply' && request.method === 'POST') return handleReply(request, env, origin);
    if (path === '/comments' && request.method === 'GET') return handleGet(request, env, origin);

    return json({ error: 'Not Found' }, 404, origin);
  },
};
