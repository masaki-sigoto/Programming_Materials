#!/usr/bin/env node

/**
 * WordPress自動デプロイスクリプト
 * GitHub ActionsからWordPress REST APIを使ってコンテンツを投稿・更新
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// 環境変数から設定を取得
const WP_URL = process.env.WP_URL;
const WP_USERNAME = process.env.WP_USERNAME;
const WP_PASSWORD = process.env.WP_PASSWORD;

// 設定チェック
if (!WP_URL || !WP_USERNAME || !WP_PASSWORD) {
    console.error('❌ Error: WordPress credentials not set');
    console.error('Please set WP_URL, WP_USERNAME, and WP_PASSWORD in GitHub Secrets');
    process.exit(1);
}

// Basic認証ヘッダー
const authHeader = 'Basic ' + Buffer.from(`${WP_USERNAME}:${WP_PASSWORD}`).toString('base64');

/**
 * WordPress REST APIにリクエストを送信
 */
async function wpRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, WP_URL);

        const options = {
            method,
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
        };

        const req = https.request(url, options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(body));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

/**
 * Markdownファイルを投稿に変換
 */
async function deployMarkdownPost(filePath) {
    console.log(`📝 Processing Markdown: ${filePath}`);

    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.md');

    // 簡単なMarkdown解析（タイトルと本文を分離）
    const lines = content.split('\n');
    const title = lines[0].replace(/^#\s+/, '').trim();
    const body = lines.slice(1).join('\n').trim();

    // HTMLに変換（簡易版、本格的にはmarkdown-itなどを使用）
    const htmlContent = body
        .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
        .replace(/^###\s+(.+)$/gm, '<h3>$3</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.+)$/gm, '<p>$1</p>');

    // 既存の投稿を検索（スラッグで）
    const slug = fileName.toLowerCase().replace(/\s+/g, '-');

    try {
        const existingPosts = await wpRequest(`/wp-json/wp/v2/posts?slug=${slug}`);

        if (existingPosts.length > 0) {
            // 既存投稿を更新
            const postId = existingPosts[0].id;
            await wpRequest(`/wp-json/wp/v2/posts/${postId}`, 'PUT', {
                title,
                content: htmlContent,
                status: 'draft', // 下書きとして保存
            });
            console.log(`✅ Updated post: ${title} (ID: ${postId})`);
        } else {
            // 新規投稿作成
            const newPost = await wpRequest('/wp-json/wp/v2/posts', 'POST', {
                title,
                content: htmlContent,
                slug,
                status: 'draft',
            });
            console.log(`✅ Created new post: ${title} (ID: ${newPost.id})`);
        }
    } catch (error) {
        console.error(`❌ Failed to deploy ${filePath}:`, error.message);
        throw error;
    }
}

/**
 * HTMLファイルを固定ページに変換
 */
async function deployHtmlPage(filePath) {
    console.log(`📄 Processing HTML: ${filePath}`);

    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath, '.html');
    const slug = fileName === 'index'
        ? path.basename(path.dirname(filePath))
        : fileName;

    // タイトルを抽出（<title>タグまたは<h1>タグから）
    const titleMatch = content.match(/<title>(.*?)<\/title>/) || content.match(/<h1[^>]*>(.*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : slug;

    try {
        const existingPages = await wpRequest(`/wp-json/wp/v2/pages?slug=${slug}`);

        if (existingPages.length > 0) {
            // 既存ページを更新
            const pageId = existingPages[0].id;
            await wpRequest(`/wp-json/wp/v2/pages/${pageId}`, 'PUT', {
                title,
                content,
                status: 'draft',
            });
            console.log(`✅ Updated page: ${title} (ID: ${pageId})`);
        } else {
            // 新規ページ作成
            const newPage = await wpRequest('/wp-json/wp/v2/pages', 'POST', {
                title,
                content,
                slug,
                status: 'draft',
            });
            console.log(`✅ Created new page: ${title} (ID: ${newPage.id})`);
        }
    } catch (error) {
        console.error(`❌ Failed to deploy ${filePath}:`, error.message);
        throw error;
    }
}

/**
 * 画像をメディアライブラリにアップロード
 */
async function deployImage(filePath) {
    console.log(`🖼️  Processing Image: ${filePath}`);

    // 画像アップロードは複雑なので、現バージョンではスキップ
    // 必要に応じて実装
    console.log(`⚠️  Image upload not implemented yet: ${filePath}`);
}

/**
 * メイン処理
 */
async function main() {
    const changedFiles = process.argv[2] ? process.argv[2].split(' ') : [];

    if (changedFiles.length === 0) {
        console.log('ℹ️  No files to deploy');
        return;
    }

    console.log(`🚀 Starting deployment to ${WP_URL}`);
    console.log(`📦 Files to deploy: ${changedFiles.length}`);

    for (const file of changedFiles) {
        if (!file.trim()) continue;

        try {
            if (file.startsWith('articles/') && file.endsWith('.md')) {
                await deployMarkdownPost(file);
            } else if (file.startsWith('pages/') && file.endsWith('.html')) {
                await deployHtmlPage(file);
            } else if (file.startsWith('images/')) {
                await deployImage(file);
            } else {
                console.log(`⏭️  Skipping: ${file}`);
            }
        } catch (error) {
            console.error(`❌ Error processing ${file}:`, error.message);
            // エラーがあっても続行
        }
    }

    console.log('✨ Deployment completed!');
}

// 実行
main().catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
});
