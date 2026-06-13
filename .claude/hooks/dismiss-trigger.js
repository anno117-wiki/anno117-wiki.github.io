// UserPromptSubmit hook: ユーザー入力に「解散」が含まれたら、
// セッション終了ルーチン（次回プラン作成＋CLAUDE.md更新）の指示を Claude へ注入する。
// 含まれなければ何も出力せず、通常の入力として扱われる。
let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const prompt = typeof data.prompt === 'string' ? data.prompt : '';
    if (prompt.includes('解散')) {
      const context = [
        'ユーザーが「解散」と入力しました。これはセッション終了の合図です。',
        '通常の応答に入る前に、以下のセッション終了ルーチンを実施してください。',
        '',
        '1. 次回作業の引き継ぎプランを docs-notes/ 配下に作成する。',
        '   - 実コマンドで現在の戦況（git状態・ビルド可否・未コミット変更）を確認してから書く。',
        '   - 残作業・次の一手・注意点を含める。',
        '2. CLAUDE.md のフェーズ進捗・記述を実態に合わせて更新する（200行以内を厳守）。',
        '   - 古い記述（着手中フェーズの日付など）を実態へ修正する。',
        '',
        '完了したら、何を更新したかを簡潔に報告してください。',
      ].join('\n');
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: context,
        },
      }));
    }
  } catch (e) {
    // 解析失敗時は何も注入しない（通常の入力として扱う）。
  }
});
