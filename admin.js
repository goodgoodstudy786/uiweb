const editor = document.querySelector("#site-json");
const statusEl = document.querySelector("#status");
const previewFrame = document.querySelector("#preview-frame");
const leadsTable = document.querySelector("#leads-table");
const leadsEmpty = document.querySelector("#leads-empty");
const uploadInput = document.querySelector("#upload-input");
const refreshLeadsBtn = document.querySelector("#refresh-leads-btn");
const tabButtons = Array.from(document.querySelectorAll("[data-preview]"));
const controls = {
  save: [document.querySelector("#save-btn"), document.querySelector("#save-btn-bottom")],
  format: [document.querySelector("#format-btn"), document.querySelector("#format-btn-bottom")],
  download: [document.querySelector("#download-btn"), document.querySelector("#download-btn-bottom")],
  reload: [document.querySelector("#reload-btn"), document.querySelector("#reload-btn-bottom")],
};

function setStatus(message, type = "info") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.status = type;
}

async function requestJson(url, options) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    const message = payload?.error || `请求失败：${response.status}`;
    throw new Error(message);
  }

  return payload;
}

async function loadSite() {
  const site = await requestJson("/api/site");
  editor.value = `${JSON.stringify(site, null, 2)}\n`;
  setStatus("内容已载入。", "success");
  return site;
}

async function saveSite() {
  let parsed = null;
  try {
    parsed = JSON.parse(editor.value);
  } catch (error) {
    setStatus(`JSON 解析失败：${error.message}`, "error");
    editor.focus();
    return;
  }

  await requestJson("/api/site", {
    method: "POST",
    body: JSON.stringify(parsed),
  });

  setStatus("已保存并发布。", "success");
  refreshPreview();
  loadLeads();
}

function refreshPreview(pathname = "/") {
  if (!previewFrame) return;
  const suffix = pathname.includes("?") ? "&" : "?";
  previewFrame.src = `${pathname}${suffix}t=${Date.now()}`;
}

function formatJson() {
  try {
    const parsed = JSON.parse(editor.value);
    editor.value = `${JSON.stringify(parsed, null, 2)}\n`;
    setStatus("JSON 已格式化。", "success");
  } catch (error) {
    setStatus(`JSON 解析失败：${error.message}`, "error");
  }
}

function downloadJson() {
  try {
    const parsed = JSON.parse(editor.value);
    const blob = new Blob([`${JSON.stringify(parsed, null, 2)}\n`], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "site.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("已下载 JSON。", "success");
  } catch (error) {
    setStatus(`JSON 解析失败：${error.message}`, "error");
  }
}

async function uploadImage(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });

  const result = await requestJson("/api/upload", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      dataUrl,
    }),
  });

  try {
    await navigator.clipboard.writeText(result.url);
    setStatus(`图片已上传，地址已复制：${result.url}`, "success");
  } catch {
    setStatus(`图片已上传：${result.url}`, "success");
  }
}

async function loadLeads() {
  if (!leadsTable || !leadsEmpty) return;

  try {
    const leads = await requestJson("/api/leads", { method: "GET" });
    const rows = Array.isArray(leads) ? leads : [];
    const body = leadsTable.querySelector("tbody");
    body.innerHTML = rows
      .slice(0, 20)
      .map(
        (item) => `
          <tr>
            <td>${new Date(item.submittedAt || Date.now()).toLocaleString("zh-CN")}</td>
            <td>${item.phone || ""}</td>
            <td>${item.source || ""}</td>
          </tr>
        `,
      )
      .join("");

    leadsEmpty.hidden = rows.length > 0;
    leadsTable.hidden = rows.length === 0;
  } catch (error) {
    leadsEmpty.textContent = `线索加载失败：${error.message}`;
    leadsEmpty.hidden = false;
    leadsTable.hidden = true;
  }
}

function switchPreview(pathname) {
  tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.preview === pathname);
  });
  refreshPreview(pathname);
}

controls.save.forEach((button) => button?.addEventListener("click", saveSite));
controls.format.forEach((button) => button?.addEventListener("click", formatJson));
controls.download.forEach((button) => button?.addEventListener("click", downloadJson));
controls.reload.forEach((button) =>
  button?.addEventListener("click", async () => {
    await loadSite();
    refreshPreview(tabButtons.find((button) => button.classList.contains("is-active"))?.dataset.preview || "/");
    loadLeads();
  }),
);

tabButtons.forEach((button) => {
  button.addEventListener("click", () => switchPreview(button.dataset.preview || "/"));
});

refreshLeadsBtn?.addEventListener("click", loadLeads);

uploadInput?.addEventListener("change", async () => {
  const file = uploadInput.files?.[0];
  uploadInput.value = "";
  if (!file) return;

  setStatus("正在上传图片…");
  try {
    await uploadImage(file);
  } catch (error) {
    setStatus(`上传失败：${error.message}`, "error");
  }
});

document.querySelector("#upload-btn")?.addEventListener("click", () => uploadInput?.click());

window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveSite().catch((error) => setStatus(`保存失败：${error.message}`, "error"));
  }
});

async function init() {
  await loadSite();
  switchPreview("/");
  await loadLeads();
  setStatus("后台已就绪。", "success");
}

init().catch((error) => {
  console.error(error);
  setStatus(`初始化失败：${error.message}`, "error");
});
