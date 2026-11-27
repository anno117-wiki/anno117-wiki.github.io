// Worker の模擬テスト: GitHub API と KV を作り物にして、操作の回数と出力を測る
export function makeEnv(){
  const store=new Map(); const ops={get:0,put:0,delete:0}; const clock={now:0};
  const kv={async get(k){ops.get++;const e=store.get(k);if(!e||(e.exp!=null&&clock.now>=e.exp))return null;return e.v},
            async put(k,v,o={}){ops.put++;store.set(k,{v,exp:o.expirationTtl?clock.now+o.expirationTtl*1000:null})},
            async delete(k){ops.delete++;store.delete(k)}};
  return {env:{GITHUB_TOKEN:'t',COMMENT_KV:kv},ops,store,clock};
}
export function installFetch(){
  const calls=[]; let nextId=100;
  const issues=[
    {id:1,number:16,title:'[コメント] guide/strategy — A',body:'**投稿者**: A\n**ページ**: guide/strategy.md\n**種別**: コメント\n\n---\n\n本文A',created_at:'2026-11-09T12:00:00Z',labels:[{name:'user-comment'}],comments:1},
    {id:2,number:15,title:'[誤り報告] wiki/items — B',body:'**投稿者**: B\n**ページ**: wiki/items.md\n**種別**: 誤り報告\n\n---\n\n本文B',created_at:'2026-11-06T12:00:00Z',labels:[{name:'user-comment'}],comments:2},
    {id:3,number:14,title:'隠し',body:'**投稿者**: C\n**ページ**: wiki/items.md\n**種別**: コメント\n\n---\n\n隠す',created_at:'2026-11-05T12:00:00Z',labels:[{name:'user-comment'},{name:'hidden'}],comments:0},
  ];
  const replies={16:[{id:11,body:'**投稿者**: X\n\n---\n\n返信',user:{login:'kojifujita0822'},created_at:'2026-11-09T13:00:00Z'}],15:[{id:12,body:'運営です',user:{login:'kojifujita0822'},created_at:'2026-11-06T13:00:00Z'},{id:13,body:'外部',user:{login:'someone'},created_at:'2026-11-06T14:00:00Z'}],14:[]};
  globalThis.fetch=async(url,init={})=>{
    const u=String(url); calls.push((init.method||'GET')+' '+u.replace('https://api.github.com',''));
    const R=(b,status=200)=>new Response(JSON.stringify(b),{status,headers:{'Content-Type':'application/json'}});
    let m;
    if((m=u.match(/\/issues\/(\d+)\/comments/))) return init.method==='POST'?R({id:nextId++},201):R(replies[m[1]]||[]);
    if((m=u.match(/\/issues\/(\d+)$/))) return R(issues.find(i=>i.number==m[1]));
    if(u.includes('/issues?')) return R(issues);
    if(u.endsWith('/issues')&&init.method==='POST') return R({number:99,html_url:'x'},201);
    return R({},404);
  };
  return calls;
}
