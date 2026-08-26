// ==UserScript==
// @name NGA用户分析助手(豆包精简版)
// @namespace http://tampermonkey.net/
// @version 1.5
// @description 多页抓取(默认3页) + 智能过滤，页内抽屉打开豆包自动填充，支持所有NGA域名
// @author You
// @match *://bbs.nga.cn/read.php?*
// @match *://ngabbs.com/read.php?*
// @match *://www.nga.cn/read.php?*
// @match *://g.nga.cn/read.php?*
// @match *://nga.178.com/read.php?*
// @match *://www.doubao.com/chat/*
// @match *://doubao.com/chat/*
// @grant GM_xmlhttpRequest
// @grant GM_addStyle
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_deleteValue
// @connect bbs.nga.cn
// @connect ngabbs.com
// @connect www.nga.cn
// @connect g.nga.cn
// @connect nga.178.com
// @connect doubao.com
// @run-at document-end
// @all-frames true
// @downloadURL https://update.greasyfork.org/scripts/578086/NGA%E7%94%A8%E6%88%B7%E5%88%86%E6%9E%90%E5%8A%A9%E6%89%8B%28%E8%B1%86%E5%8C%85%E7%B2%BE%E7%AE%80%E7%89%88%29.user.js
// @updateURL https://update.greasyfork.org/scripts/578086/NGA%E7%94%A8%E6%88%B7%E5%88%86%E6%9E%90%E5%8A%A9%E6%89%8B%28%E8%B1%86%E5%8C%85%E7%B2%BE%E7%AE%80%E7%89%88%29.meta.js
// ==/UserScript==

(function() {
'use strict';

// ===================== 核心配置 =====================
const DOUBO_URL = "https://www.doubao.com/chat/new";
const MAX_CONTENT_LEN = 15000;
const MIN_CONTENT_LEN = 50;
const MAX_PAGES = 3;
const PAGE_DELAY = 800;
const STORAGE_KEY = "nga_analysis_content";
const LOCK_KEY = "nga_analysis_lock";
const FILLED_FLAG_KEY = "nga_filled_flag";
const RETRY_MAX = 15;
const RETRY_INTERVAL = 500;

const PROMPT = `===== [本次独立分析 开始] =====
[强制规则]完全忽略本次对话之前的所有内容，仅基于本次提供的NGA用户回帖分析，禁止参考任何历史对话。
请完成4个维度的客观分析：
1. 政治光谱与立场倾向
2. 游戏偏好与高频讨论的核心话题
3. 性格特征、语言风格与发言习惯
4. 是否存在反串、引战、带节奏、恶意挑动对立的嫌疑，如有标注对应行为特征

请用条理清晰、简洁易懂的中文输出完整分析报告，报告精良简明扼要控制字数。使用NGA毒嘴锐评风格。并为用户评分(0-100)

以下是用户有效回帖内容：
`;
const PROMPT_END = `\n===== [本次独立分析 结束] =====
[最终规则]仅基于本次内容分析，禁止参考任何历史对话！`;

// ===================== 样式注入 =====================
GM_addStyle(`
.nga-doubao-btn {
margin-left: 6px;
padding: 1px 8px;
background: #4080FF;
color: #fff;
border: none;
border-radius: 3px;
cursor: pointer;
font-size: 12px;
vertical-align: middle;
}
.nga-doubao-btn:hover { opacity: 0.8; }
.nga-doubao-btn:disabled { background: #999; cursor: not-allowed; }

#nga-doubao-drawer {
position: fixed;
top: 0;
right: 0;
width: 420px;
height: 100vh;
background: #fff;
box-shadow: -4px 0 20px rgba(0,0,0,0.15);
z-index: 999999;
transform: translateX(100%);
transition: transform 0.3s ease;
display: flex;
flex-direction: column;
}
#nga-doubao-drawer.open { transform: translateX(0); }
#drawer-header {
padding: 12px 16px;
border-bottom: 1px solid #eee;
display: flex;
justify-content: space-between;
align-items: center;
background: #f8f9fa;
}
#drawer-close { cursor: pointer; font-size: 20px; line-height: 1; }
#drawer-body { flex: 1; width: 100%; overflow: hidden; }
#doubao-iframe { width: 100%; height: 100%; border: none; }
#drawer-footer {
padding: 8px 16px;
border-top: 1px solid #eee;
font-size: 12px;
color: #666;
}
`);

// ===================== 环境判断 =====================
const host = window.location.host;
const isNgaPage = host.includes("nga.cn") || host.includes("ngabbs.com") || host.includes("nga.178.com");
const isDoubaoPage = host.includes("doubao.com");
const isInIframe = window.self !== window.top;

if (isNgaPage && !isInIframe) initNgaLogic();
if (isDoubaoPage) initDoubaoFillLogic();

// ===================== NGA页面核心逻辑 =====================
function initNgaLogic() {
initDrawer();
injectButtons();
new MutationObserver(injectButtons).observe(document.body, { childList: true, subtree: true });
}

function initDrawer() {
if (document.getElementById("nga-doubao-drawer")) return;
const drawer = document.createElement("div");
drawer.id = "nga-doubao-drawer";
drawer.innerHTML = `
<div id="drawer-header">
<span>豆包用户分析</span>
<span id="drawer-close">×</span>
</div>
<div id="drawer-body">
<iframe id="doubao-iframe" src="about:blank"
sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation">
</iframe>
</div>
<div id="drawer-footer">就绪：点击'豆包分析'按钮开始</div>
`;
document.body.appendChild(drawer);
document.getElementById("drawer-close").onclick = closeDrawer;
}

function openDrawer() { document.getElementById("nga-doubao-drawer").classList.add("open"); }
function closeDrawer() {
const drawer = document.getElementById("nga-doubao-drawer");
drawer.classList.remove("open");
document.getElementById("doubao-iframe").src = "about:blank";
updateFooter("就绪：点击'豆包分析'按钮开始");
GM_deleteValue(STORAGE_KEY);
GM_deleteValue(LOCK_KEY);
GM_deleteValue(FILLED_FLAG_KEY);
}
function updateFooter(text) {
const footer = document.getElementById("drawer-footer");
if (footer) footer.textContent = text;
}

function injectButtons() {
// 多选择器兼容不同域名
const selectors = [
'a.userlink.author[href*="uid="]',
'a.author[href*="uid="]',
'.author a[href*="uid="]',
'a[href*="uid="].author'
];

let authors = [];
for (let selector of selectors) {
const elements = document.querySelectorAll(selector);
if (elements.length > 0) {
authors = elements;
break;
}
}

authors.forEach(author => {
if (author.nextSibling && author.nextSibling.className === "nga-doubao-btn") return;
const uidMatch = author.getAttribute("href").match(/uid=(\d+)/);
if (!uidMatch) return;

const btn = document.createElement("button");
btn.className = "nga-doubao-btn";
btn.textContent = "豆包分析";
btn.onclick = (e) => {
e.preventDefault();
e.stopPropagation();
startAnalysis(uidMatch[1], btn);
};
author.parentNode.insertBefore(btn, author.nextSibling);
});
}

// ===================== 多页抓取核心 =====================
async function startAnalysis(uid, btn) {
GM_deleteValue(STORAGE_KEY);
GM_deleteValue(LOCK_KEY);
GM_deleteValue(FILLED_FLAG_KEY);
btn.disabled = true;
btn.textContent = "抓取中...";
updateFooter("正在抓取用户历史回帖(多页)...");
openDrawer();

try {
const ngaHost = window.location.host;
let allPosts = [];

for (let page = 1; page <= MAX_PAGES; page++) {
updateFooter(`正在抓取第 ${page}/${MAX_PAGES} 页...`);
const url = `https://${ngaHost}/thread.php?searchpost=1&authorid=${uid}&page=${page}`;
const html = await fetchPost(url, ngaHost);
const posts = parsePostPage(html);
allPosts = allPosts.concat(posts);
if (posts.length === 0 && page > 1) break;
if (page < MAX_PAGES) await sleep(PAGE_DELAY);
}

const uniquePosts = deduplicatePosts(allPosts);
const content = formatPosts(uniquePosts);

if (content.length < MIN_CONTENT_LEN) throw new Error("无有效回帖内容，或无查看权限");

let finalContent = PROMPT + content + PROMPT_END;
if (finalContent.length > MAX_CONTENT_LEN) {
finalContent = finalContent.slice(0, MAX_CONTENT_LEN) + "\n\n[内容过长已截断]" + PROMPT_END;
}

GM_setValue(STORAGE_KEY, finalContent);
GM_setValue(LOCK_KEY, "1");
GM_setValue(FILLED_FLAG_KEY, "0");
updateFooter(`✅ 抓取成功(共${uniquePosts.length}条有效回复, ${content.length}字)，正在加载豆包...`);

const iframe = document.getElementById("doubao-iframe");
iframe.src = DOUBO_URL;
btn.disabled = false;
btn.textContent = "豆包分析";

iframe.onload = () => {
updateFooter("✅ 豆包加载完成，正在自动填充...");
setTimeout(() => {
iframe.contentWindow.postMessage({ type: "NGA_FILL", content: finalContent, fillId: Date.now() }, "*");
}, 1000);
};

} catch (err) {
updateFooter("❌ 失败：" + err.message);
btn.disabled = false;
btn.textContent = "豆包分析";
console.error("=== [NGA] 错误：", err);
}
}

function parsePostPage(html) {
const parser = new DOMParser();
const doc = parser.parseFromString(html, "text/html");
const posts = [];

const rows = doc.querySelectorAll("tr.topicrow");
rows.forEach(row => {
const author = row.querySelector("a.author[href*='uid=']");
const post = row.querySelector("div.postcontent");
if (!author || !post) return;

let postText = post.textContent.trim();
const forum = row.querySelector("span.titleadd2 a")?.textContent.trim() || "";
const title = row.querySelector("a.topic")?.textContent.trim() || "";

// 无效内容过滤
const invalidPatterns = [
/帖子发布或回复时间超过限制/,
/帐号权限不足/,
/未登录/,
/账号已注销/,
/本帖已被锁定/,
/本帖已被删除/,
/内容自动屏蔽/,
/管理员已屏蔽/,
/用户被禁言/,
/该回复已被折叠/,
/该主题已被删除/,
/作者被禁止/,
/^$/,
/^\s*$/,
/^未登录$/,
/^账号已注销\s*勿cue$/,
/^account deleted$/i
];

let isInvalid = false;
for (let pattern of invalidPatterns) {
if (pattern.test(postText) || pattern.test(title) || pattern.test(forum)) {
isInvalid = true;
break;
}
}
if (isInvalid) return;

// 清理文本
let reply = postText
.replace(/\[quote\][\s\S]*?\[\/quote\]/g, '')
.replace(/\[@.*?\]/g, '')
.replace(/\[img\].*?\[\/img\]/g, '')
.replace(/\[url\].*?\[\/url\]/g, '')
.replace(/\[b\].*?\[\/b\]/g, '')
.replace(/\[color=.*?\].*?\[\/color\]/g, '')
.replace(/\[在主题中的回复\]/g, '')
.replace(/Reply to.*?\[\/b\]/g, '')
.replace(/\s+/g, ' ')
.trim();

if (reply.length < 10) return;

const cleanForum = forum.replace(/[\[\]]/g, '');
const cleanTitle = title.replace(/[\[\]]/g, '');

posts.push({
forum: cleanForum || "未知板块",
title: cleanTitle || "未知标题",
reply: reply
});
});

return posts;
}

function deduplicatePosts(posts) {
const seen = new Set();
const unique = [];
for (const post of posts) {
const key = `${post.forum}|${post.title}|${post.reply.substring(0, 50)}`;
if (!seen.has(key)) {
seen.add(key);
unique.push(post);
}
}
return unique;
}

function formatPosts(posts) {
if (posts.length === 0) return "";
let content = `共抓取 ${posts.length} 条有效回复：\n\n`;
posts.forEach((post, idx) => {
content += `[${idx + 1}] 【${post.forum}】${post.title}\n`;
content += `[用户回帖]${post.reply}\n\n`;
});
return content;
}

function fetchPost(url, host) {
return new Promise((resolve, reject) => {
GM_xmlhttpRequest({
method: "GET",
url: url,
timeout: 15000,
withCredentials: true,
headers: {
"User-Agent": navigator.userAgent,
"Referer": `https://${host}/`
},
onload: (res) => res.status === 200 ? resolve(res.responseText) : reject(new Error(`请求失败 ${res.status}`)),
onerror: () => reject(new Error("网络请求失败")),
ontimeout: () => reject(new Error("请求超时"))
});
});
}

function sleep(ms) {
return new Promise(resolve => setTimeout(resolve, ms));
}

// ===================== 豆包页面填充逻辑 =====================
function initDoubaoFillLogic() {
let currentFillId = null;

const INPUT_SELECTORS = [
'textarea.semi-input-textarea[placeholder="发消息..."]',
'textarea[data-testid="chat_input_input"]',
'div[contenteditable="true"][data-testid="chat_input_editor"]'
];

function findInput() {
for (let selector of INPUT_SELECTORS) {
const input = document.querySelector(selector);
if (input && input.offsetParent !== null && !input.disabled) {
return input;
}
}
return null;
}

function fillInput(input, content, fillId) {
const lastFilledId = GM_getValue(FILLED_FLAG_KEY, "0");
if (lastFilledId === fillId.toString()) return true;

try {
input.focus();
document.execCommand('selectAll', false);
document.execCommand('delete', false);
document.execCommand('insertText', false, content);
input.dispatchEvent(new Event('input', { bubbles: true }));
input.focus();

GM_setValue(FILLED_FLAG_KEY, fillId.toString());
return true;
} catch (err) {
console.error("=== [豆包] 填充错误：", err);
return false;
}
}

function tryFill() {
const content = GM_getValue(STORAGE_KEY, "");
const hasLock = GM_getValue(LOCK_KEY, "0") === "1";
const fillId = GM_getValue(FILLED_FLAG_KEY, "0");

if (!content || !hasLock) {
setTimeout(tryFill, RETRY_INTERVAL);
return;
}

const input = findInput();
if (!input) {
setTimeout(tryFill, RETRY_INTERVAL);
return;
}

if (fillId !== "0") return;

fillInput(input, content, Date.now());
}

window.addEventListener("message", (e) => {
if (e.data && e.data.type === "NGA_FILL" && e.data.content) {
GM_setValue(STORAGE_KEY, e.data.content);
GM_setValue(LOCK_KEY, "1");
GM_setValue(FILLED_FLAG_KEY, "0");
setTimeout(tryFill, 500);
}
});

window.addEventListener("DOMContentLoaded", () => {
setTimeout(tryFill, 1000);
});

setTimeout(tryFill, 500);
}
})();