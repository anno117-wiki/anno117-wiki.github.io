// UserPromptSubmit hook: ユーザー入力に「解散」が含まれたら、セッション終了の合図とみなす。
//
// 終了作業（引き継ぎメモ作成＋CLAUDE.md更新）は 1 セッションだけが代表して行う。
// 3 セッション並列時に全員が CLAUDE.md を書いて競合するのを防ぐため、ロックファイル
// （.claude/.dismiss.lock）を最初に取得できた 1 セッションのみ終了作業を指示し、
// それ以外には「終了作業はしない」と明示して抑止する（早い者勝ち）。
//
// 指揮役に担当させたい場合は、指揮役のターミナルで最初に「解散」と打てばよい。
// ロックは STALE_MS を過ぎると陳腐化したとみなし、次回の解散で取り直せる。
const fs = require('fs');
const path = require('path');

const STALE_MS = 10 * 60 * 1000; // 10分。これを過ぎたロックは無効とみなす。
const lockPath = path.join(process.cwd(), '.claude', '.dismiss.lock');

// ロック取得を試みる。取得できたら true（=このセッションが終了作業の代表）。
function acquireLock() {
  try {
    // O_EXCL 相当。既存なら例外 → 他セッションが先に取得済み。
    fs.writeFileSync(lockPath, String(Date.now()), { flag: 'wx' });
    return true;
  } catch (e) {
    // 既存ロックがある。陳腐化していれば奪取する。
    try {
      const stat = fs.statSync(lockPath);
      if (Date.now() - stat.mtimeMs > STALE_MS) {
        fs.writeFileSync(lockPath, String(Date.now()));
        return true;
      }
    } catch (_) { /* 競合で消えた等は取得失敗扱い */ }
    return false;
  }
}

let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const prompt = typeof data.prompt === 'string' ? data.prompt : '';
    if (!prompt.includes('解散')) return;

    const isLead = acquireLock();

    const leadContext = [
      'ユーザーが「解散」と入力しました。これはセッション終了の合図です。',
      'あなたが終了作業の代表（解散ロックを取得）です。あなた 1 人が終了作業を行います。',
      '通常の応答に入る前に、以下のセッション終了ルーチンを実施してください。',
      '',
      '1. 次回作業の引き継ぎプランを docs-notes/handover-next-session.md に作成する',
      '   （固定ファイル名。既存があれば上書き更新。CLAUDE.md がこのファイルを開始時に読む導線になっている）。',
      '   - 実コマンドで現在の戦況（git状態・ビルド可否・未コミット変更）を確認してから書く。',
      '   - 残作業・次の一手・注意点を含める。',
      '2. CLAUDE.md のフェーズ進捗・記述を実態に合わせて更新する（200行以内を厳守）。',
      '   - 古い記述（着手中フェーズの日付など）を実態へ修正する。',
      '   - CLAUDE.md を更新するのは代表のあなただけです（他セッションは触りません）。',
      '',
      '完了したら、何を更新したかを簡潔に報告してください。',
    ].join('\n');

    const standbyContext = [
      'ユーザーが「解散」と入力しました。これはセッション終了の合図です。',
      'ただし終了作業（引き継ぎメモ作成・CLAUDE.md 更新）は別のセッションが代表して行います。',
      'あなたは CLAUDE.md や引き継ぎ書に書き込まないでください（同時書き込みによる競合を防ぐため）。',
      '自分の持ち場に区切りをつけ、未報告の成果があれば代表セッションへ peer で一報したうえで待機・終了してよいです。',
    ].join('\n');

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: isLead ? leadContext : standbyContext,
      },
    }));
  } catch (e) {
    // 解析失敗時は何も注入しない（通常の入力として扱う）。
  }
});
