# Cursor + Claude Code でのスキル利用方法

## Claude Codeとは

Claude Codeは、ターミナルで動作するAnthropicのAIコーディングアシスタントです。
Cursorと併用することで、それぞれの強みを活かした開発ができます。

## 配置方法

### 方法1: プロジェクトルートに配置（推奨）

```
your-project/
├── .claude/
│   └── commands/
│       └── nature-mapping.md    # このスキルファイル（SKILL.mdをリネーム）
├── lib/
├── app/
└── ...
```

Claude Codeは `.claude/commands/` 内のMarkdownファイルを自動認識します。

### 方法2: CLAUDE.md として配置

```
your-project/
├── CLAUDE.md                    # プロジェクト全体の指示書
├── lib/
├── app/
└── ...
```

`CLAUDE.md` はClaude Codeが最初に読み込む特別なファイルです。

## セットアップ手順

### 1. Claude Codeのインストール

```bash
# npm
npm install -g @anthropic-ai/claude-code

# または直接
npx @anthropic-ai/claude-code
```

### 2. スキルファイルの配置

```bash
# プロジェクトルートで実行
mkdir -p .claude/commands
cp path/to/SKILL.md .claude/commands/nature-mapping.md
```

### 3. 使用開始

```bash
# プロジェクトディレクトリで起動
cd your-project
claude
```

## 使い方の例

### Claude Codeでの指示

```
> @nature-mapping lib/transfer-to-formatted.ts を実装して
```

または単に：

```
> ①の転記機能を実装して
```

Claude Codeはスキルファイルを参照し、設計に沿ったコードを生成します。

### Cursorとの使い分け

| 作業 | ツール | 理由 |
|------|--------|------|
| 新機能の実装 | Claude Code | スキルを参照して一貫した実装 |
| 細かい修正 | Cursor | ファイル内のピンポイント編集 |
| デバッグ | Cursor | エラー箇所の特定が視覚的 |
| リファクタリング | Claude Code | 全体を見た改善提案 |

## CLAUDE.md の書き方（プロジェクト全体指示）

```markdown
# プロジェクト概要

地域自然環境マッピングアプリ。
市民が投稿した画像から位置情報を抽出し、マイマップで可視化する。

## 技術スタック

- Next.js 14 (App Router)
- TypeScript
- Google Sheets API / Drive API

## コーディング規約

- 関数は必ず戻り値の型を明示
- エラーはconsole.errorでログ出力
- 日本語コメントOK

## lib/ の構成

詳細は .claude/commands/nature-mapping.md を参照
```

## ファイル構成まとめ

```
your-project/
├── .claude/
│   └── commands/
│       └── nature-mapping.md    # 詳細なスキル定義
├── CLAUDE.md                     # プロジェクト概要（任意）
├── lib/
│   ├── types.ts
│   ├── google-api.ts
│   ├── transfer-to-formatted.ts
│   ├── extract-image-location.ts
│   ├── fetch-address.ts
│   ├── generate-kml-formatted.ts
│   ├── merge-nearby-locations.ts
│   └── generate-kml-merged.ts
├── app/
│   ├── actions/
│   │   └── admin.ts
│   ├── admin/
│   │   └── page.tsx
│   └── login/
│       └── page.tsx
├── middleware.ts
├── .env.local
└── package.json
```

## 注意点

### Claude Codeの制限

- インターネット接続が必要（API呼び出し）
- 大きなファイルの一括生成は苦手
- ファイル間の依存関係を一度に把握するのは難しい場合がある

### Cursorとの競合

- 両方同時に同じファイルを編集しない
- 保存のタイミングに注意
- Git管理で変更を追跡

## トラブルシューティング

### スキルが読み込まれない

```bash
# .claudeディレクトリの確認
ls -la .claude/commands/

# パーミッション確認
chmod 644 .claude/commands/nature-mapping.md
```

### Claude Codeが起動しない

```bash
# バージョン確認
claude --version

# 再インストール
npm uninstall -g @anthropic-ai/claude-code
npm install -g @anthropic-ai/claude-code
```
