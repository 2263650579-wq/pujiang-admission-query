"use strict";

const province = document.querySelector("#province");
const subject = document.querySelector("#subject");
const form = document.querySelector("#query-form");
const results = document.querySelector("#results");
let dataset = [];

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[char]));

const number = (value) => value === null ? "未公布" : new Intl.NumberFormat("zh-CN").format(value);

function fillSelect(element, values, placeholder) {
  element.replaceChildren(new Option(placeholder, ""));
  values.forEach((value) => element.add(new Option(value, value)));
}

function updateSubjects() {
  const selected = province.value;
  const subjects = [...new Set(dataset.filter((row) => row.province === selected).map((row) => row.subject))].sort();
  fillSelect(subject, subjects, subjects.length ? "请选择科类" : "暂无可用科类");
  subject.disabled = !subjects.length;
  results.replaceChildren();
}

function render(rows) {
  if (!rows.length) {
    results.innerHTML = '<div class="empty-state">暂未找到匹配记录，请更换科类或联系数据维护人员补充。</div>';
    return;
  }
  const sorted = [...rows].sort((a, b) => b.year - a.year || b.score - a.score);
  const cards = sorted.map((row) => `
    <article class="result-card" data-year="${row.year}">
      <div class="result-top"><span class="year-tag">${row.year} 年</span><span class="type-tag">${escapeHtml(row.type)}</span></div>
      <h4>${escapeHtml(row.group)} · ${escapeHtml(row.batch)}</h4>
      <p class="requirements">选科要求：${escapeHtml(row.requirements)}</p>
      <div class="numbers">
        <div><strong>${number(row.score)}</strong><span>最低分</span></div>
        <div><strong>${number(row.rank)}</strong><span>最低位次</span></div>
      </div>
      <a class="source-link" href="${escapeHtml(row.source)}" target="_blank" rel="noopener noreferrer">查看数据来源 ↗</a>
    </article>`).join("");
  results.innerHTML = `
    <div class="results-head">
      <div><h3>${escapeHtml(province.value)} · ${escapeHtml(subject.value)}</h3><p>共找到 ${rows.length} 条专业组记录</p></div>
      <span class="year-tag">2024—2025</span>
    </div>
    <div class="result-grid">${cards}</div>`;
}

province.addEventListener("change", updateSubjects);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  render(dataset.filter((row) => row.province === province.value && row.subject === subject.value));
});

const staticDataUrl = new URL("data/admissions.json", document.baseURI).href;
const dataUrl = location.hostname.endsWith("github.io") ? staticDataUrl : "/api/admissions";

fetch(dataUrl, { headers: { Accept: "application/json" } })
  .then((response) => {
    if (!response.ok) throw new Error("数据加载失败");
    return response.json();
  })
  .then((data) => {
    dataset = data.records;
    fillSelect(province, [...new Set(dataset.map((row) => row.province))].sort((a, b) => a.localeCompare(b, "zh-CN")), "请选择省份");
    document.querySelector("#province-count").textContent = new Set(dataset.map((row) => row.province)).size;
    document.querySelector("#record-count").textContent = dataset.length;
    document.querySelector("#updated-at").textContent = data.updatedAt.slice(0, 10);
  })
  .catch(() => {
    document.querySelector("#form-hint").textContent = "数据暂时无法加载，请稍后刷新重试。";
  });
