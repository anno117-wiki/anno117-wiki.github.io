// コメント用 Worker の模擬テスト（GitHub API と KV を作り物にする）。
// 実行: bun run cf-worker/test/comment-api.test.mjs
// 確かめること: ページ指定の絞り込み・KV の使用回数（無料枠の書き込み1,000回／日を使い切らない）・
// 投稿と返信でのキャッシュの破棄・KV や GitHub が失敗したときの動き
import worker from '../comment-api.js';
import { makeEnv, installFetch } from './harness.mjs';

const ORIGIN = { Origin: 'https://anno117-wiki.github.io' };
let failures = 0;
const check = (cond, message) => {
  console.log(`${cond ? '  OK  ' : '  NG  '}${message}`);
  if (!cond) failures++;
};
const setup = () => ({ calls: installFetch(), ...makeEnv() });
const get = async (env, query = '') => {
  const res = await worker.fetch(new Request(`https://w.dev/comments${query}`, { headers: ORIGIN }), env);
  return { status: res.status, body: await res.json() };
};
const post = (env, path, ip, payload) =>
  worker.fetch(
    new Request(`https://w.dev${path}`, {
      method: 'POST',
      headers: { ...ORIGIN, 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
      body: JSON.stringify(payload),
    }),
    env
  );

{ // 一覧と絞り込み
  const { env } = setup();
  const all = await get(env);
  check(all.status === 200 && all.body.length === 2, '全件: 隠したコメントを除いた2件');
  check(!JSON.stringify(all.body).includes('pageLine'), '出力に内部の項目（pageLine）が出ない');
  check(JSON.stringify(Object.keys(all.body[0])) === '["id","number","title","name","type","body","createdAt","replies"]', '項目の並びが今までと同じ');
  const items = await get(env, '?page=wiki%2Fitems.md');
  check(items.body.length === 1 && items.body[0].number === 15, 'ページ指定: wiki/items.md のコメントだけ');
  const none = await get(env, '?page=nothing');
  check(none.body.length === 0, 'ページ指定: 該当なしは空');
  const reply = all.body.find((c) => c.number === 15).replies;
  check(reply[0].author === '運営' && reply[1].author === 'someone', '返信の投稿者（運営・外部）の扱いが今までと同じ');
}

{ // キャッシュ（KV の使用回数）
  const { env, ops, calls, clock } = setup();
  await get(env);
  const afterFirst = calls.length;
  await get(env, '?page=wiki%2Fitems.md');
  check(calls.length === afterFirst, '2回目（ページ指定）は GitHub に通信しない');
  check(ops.put === 1, 'KV の書き込みは1回だけ');
  for (let i = 0; i < 100; i++) {
    await get(env, i % 2 ? '' : '?page=guide%2Fstrategy.md');
    clock.now += 10000; // 10秒ごとに1回（33分で100回）
  }
  check(ops.put <= 6, `33分・100回の取得で KV の書き込みは ${ops.put} 回（5分おき。以前は約34回）`);
  check(ops.get >= 100 && ops.get <= 102, '読み取りは1リクエストにつき1回');
}

{ // 投稿・返信でキャッシュを消す
  const { env, ops, calls } = setup();
  await get(env);
  const created = await post(env, '/comment', '1.1.1.1', { type: 'comment', name: 'T', body: 'x', page: 'guide/strategy.md' });
  check(created.status === 201 && ops.delete === 1, '投稿でキャッシュを消す');
  const before = calls.length;
  await get(env);
  check(calls.length > before, '投稿の後は GitHub から取り直す');
  const replied = await post(env, '/reply', '2.2.2.2', { number: 16, name: 'R', body: 'y' });
  check(replied.status === 201 && ops.delete === 2, '返信でキャッシュを消す');
}

{ // 失敗したときの動き（無料枠の上限に達した場合など）
  const origError = console.error;
  console.error = () => {};
  const a = setup();
  a.env.COMMENT_KV.put = async () => { throw new Error('KV put limit exceeded'); };
  const putFail = await get(a.env);
  check(putFail.status === 200 && putFail.body.length === 2, 'KV の書き込みが失敗しても、一覧を返す');
  const b = setup();
  b.env.COMMENT_KV.get = async () => { throw new Error('KV get limit exceeded'); };
  const getFail = await get(b.env);
  check(getFail.status === 200 && getFail.body.length === 2, 'KV の読み取りが失敗しても、GitHub から取って返す');
  const c = setup();
  delete c.env.COMMENT_KV;
  check((await get(c.env)).body.length === 2, 'KV が無くても動く');
  const d = setup();
  globalThis.fetch = async () => new Response('{}', { status: 500 });
  check((await get(d.env)).status === 502, 'GitHub が失敗したら502');
  console.error = origError;
}

console.log(failures ? `\n失敗 ${failures}件` : '\nすべて合格');
process.exit(failures ? 1 : 0);
