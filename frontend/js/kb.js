/*
  姓名：王振旭 | 学号：24002120207 | 时间：2026-11-25 | 大模型：DeepSeek-V4.1-Flash
  功能：知识库页面交互，文件上传解析、列表删除与基于知识库的问答
*/

let wzx_kbBusy = false;

// 功能：把字节数格式化成 KB / MB，用于文件列表展示
function wzx_kbSize(wzx_bytes) {
  if (wzx_bytes >= 1024 * 1024) {
    return (wzx_bytes / 1024 / 1024).toFixed(1) + " MB";
  }
  return Math.max(1, Math.round(wzx_bytes / 1024)) + " KB";
}

// 功能：切换上传/提问的忙碌状态，避免重复提交
function wzx_kbSetBusy(wzx_nextBusy, wzx_text) {
  wzx_kbBusy = wzx_nextBusy;
  document.getElementById("wzx_kbUploadBtn").disabled = wzx_nextBusy;
  document.getElementById("wzx_kbSendBtn").disabled = wzx_nextBusy;
  document.getElementById("wzx_kbStatus").textContent = wzx_text || (wzx_nextBusy ? "处理中…" : "就绪");
}

// 功能：拉取知识库文件列表并渲染
async function wzx_kbLoadFiles() {
  const wzx_list = document.getElementById("wzx_kbList");
  try {
    const wzx_response = await fetch("/api/kb/files");
    const wzx_json = await wzx_response.json();
    if (wzx_json.code !== 0) {
      wzx_list.innerHTML = "";
      wzx_list.appendChild(wzx_kbStateItem("读取失败：" + wzx_json.msg));
      return;
    }
    wzx_kbRenderFiles(wzx_json.data.files || []);
  } catch (wzx_error) {
    console.error("读取知识库失败：", wzx_error);
    wzx_list.innerHTML = "";
    wzx_list.appendChild(wzx_kbStateItem("网络异常，请确认后端已启动（http://localhost:8207）"));
  }
}

// 功能：生成一个只读的提示条目
function wzx_kbStateItem(wzx_text) {
  const wzx_item = document.createElement("li");
  wzx_item.className = "wzx_state";
  wzx_item.textContent = wzx_text;
  return wzx_item;
}

// 功能：把文件摘要渲染成带删除按钮的列表
function wzx_kbRenderFiles(wzx_files) {
  const wzx_list = document.getElementById("wzx_kbList");
  wzx_list.innerHTML = "";
  document.getElementById("wzx_kbCount").textContent = String(wzx_files.length);

  if (!wzx_files.length) {
    wzx_list.appendChild(wzx_kbStateItem("知识库还是空的，先上传一份文档吧。"));
    return;
  }

  wzx_files.forEach(function (wzx_file) {
    const wzx_item = document.createElement("li");
    wzx_item.className = "wzx_kb-item";

    const wzx_main = document.createElement("div");
    wzx_main.className = "wzx_kb-item-main";

    const wzx_name = document.createElement("p");
    wzx_name.className = "wzx_kb-name";
    wzx_name.textContent = wzx_file.name;

    const wzx_meta = document.createElement("p");
    wzx_meta.className = "wzx_kb-meta";
    wzx_meta.textContent =
      wzx_file.ext + " · " + wzx_kbSize(wzx_file.size) + " · " +
      wzx_file.chars + " 字 · " + wzx_file.chunkCount + " 个片段";

    wzx_main.appendChild(wzx_name);
    wzx_main.appendChild(wzx_meta);

    if (wzx_file.note) {
      const wzx_note = document.createElement("p");
      wzx_note.className = "wzx_kb-note";
      wzx_note.textContent = wzx_file.note;
      wzx_main.appendChild(wzx_note);
    }

    const wzx_delete = document.createElement("button");
    wzx_delete.className = "wzx_kb-del";
    wzx_delete.type = "button";
    wzx_delete.textContent = "删除";
    wzx_delete.setAttribute("data-wzx-id", wzx_file.id);
    wzx_delete.setAttribute("data-wzx-name", wzx_file.name);

    wzx_item.appendChild(wzx_main);
    wzx_item.appendChild(wzx_delete);
    wzx_list.appendChild(wzx_item);
  });
}

// 功能：上传选中的文件并显示解析结果
async function wzx_kbUpload() {
  const wzx_input = document.getElementById("wzx_kbFile");
  const wzx_msg = document.getElementById("wzx_kbUploadMsg");
  const wzx_file = wzx_input.files && wzx_input.files[0];

  if (!wzx_file) {
    wzx_msg.className = "wzx_result wzx_result--err";
    wzx_msg.textContent = "请先选择一个文件。";
    return;
  }
  if (wzx_file.size > 20 * 1024 * 1024) {
    wzx_msg.className = "wzx_result wzx_result--err";
    wzx_msg.textContent = "文件超过 20MB，请压缩或拆分后再上传。";
    return;
  }

  const wzx_form = new FormData();
  wzx_form.append("file", wzx_file);

  wzx_kbSetBusy(true, "正在解析并入库…");
  wzx_msg.className = "wzx_result wzx_result--idle";
  wzx_msg.textContent = "正在上传并解析：" + wzx_file.name;

  try {
    const wzx_response = await fetch("/api/kb/files", { method: "POST", body: wzx_form });
    const wzx_json = await wzx_response.json();

    if (wzx_json.code !== 0) {
      wzx_msg.className = "wzx_result wzx_result--err";
      wzx_msg.textContent = "上传失败：" + wzx_json.msg;
      return;
    }

    const wzx_data = wzx_json.data;
    wzx_msg.className = "wzx_result wzx_result--ok";
    wzx_msg.textContent = "入库成功：" + wzx_data.name + "，提取 " + wzx_data.chars +
      " 字，切成 " + wzx_data.chunkCount + " 个片段。" + (wzx_data.note ? "\n提示：" + wzx_data.note : "");
    wzx_input.value = "";
    wzx_kbLoadFiles();
  } catch (wzx_error) {
    console.error("上传失败：", wzx_error);
    wzx_msg.className = "wzx_result wzx_result--err";
    wzx_msg.textContent = "网络异常，请确认后端已启动（http://localhost:8207）";
  } finally {
    wzx_kbSetBusy(false);
  }
}

// 功能：删除指定知识库文件，成功后刷新列表
async function wzx_kbDelete(wzx_id, wzx_name) {
  if (!window.confirm("确定删除知识库文件「" + wzx_name + "」吗？")) {
    return;
  }
  try {
    const wzx_response = await fetch("/api/kb/files/" + encodeURIComponent(wzx_id), { method: "DELETE" });
    const wzx_json = await wzx_response.json();
    const wzx_msg = document.getElementById("wzx_kbUploadMsg");
    if (wzx_json.code !== 0) {
      wzx_msg.className = "wzx_result wzx_result--err";
      wzx_msg.textContent = "删除失败：" + wzx_json.msg;
      return;
    }
    wzx_msg.className = "wzx_result wzx_result--ok";
    wzx_msg.textContent = "已删除：" + wzx_name;
    wzx_kbLoadFiles();
  } catch (wzx_error) {
    console.error("删除失败：", wzx_error);
  }
}

// 功能：向问答区追加一条气泡，role 取 user / assistant / error
function wzx_kbAddBubble(wzx_role, wzx_text) {
  const wzx_log = document.getElementById("wzx_kbChat");
  const wzx_empty = document.getElementById("wzx_kbEmpty");
  if (wzx_empty) {
    wzx_empty.remove();
  }

  const wzx_item = document.createElement("div");
  wzx_item.className = "wzx_chat-msg wzx_chat-msg--" + wzx_role;

  const wzx_head = document.createElement("span");
  wzx_head.className = "wzx_chat-meta";
  wzx_head.textContent = wzx_role === "user" ? "我" : (wzx_role === "error" ? "系统提示" : "知识库助手");

  const wzx_body = document.createElement("p");
  wzx_body.className = "wzx_chat-text";
  wzx_body.textContent = wzx_text;

  wzx_item.appendChild(wzx_head);
  wzx_item.appendChild(wzx_body);
  wzx_log.appendChild(wzx_item);
  wzx_log.scrollTop = wzx_log.scrollHeight;
}

// 功能：显示“正在检索并思考…”占位气泡
function wzx_kbShowTyping() {
  const wzx_log = document.getElementById("wzx_kbChat");
  const wzx_item = document.createElement("div");
  wzx_item.className = "wzx_chat-msg wzx_chat-msg--assistant wzx_chat-msg--typing";
  wzx_item.id = "wzx_kbTyping";

  const wzx_head = document.createElement("span");
  wzx_head.className = "wzx_chat-meta";
  wzx_head.textContent = "知识库助手";

  const wzx_body = document.createElement("p");
  wzx_body.className = "wzx_chat-text";
  wzx_body.textContent = "正在检索知识库并思考…";

  wzx_item.appendChild(wzx_head);
  wzx_item.appendChild(wzx_body);
  wzx_log.appendChild(wzx_item);
  wzx_log.scrollTop = wzx_log.scrollHeight;
}

// 功能：移除思考占位气泡
function wzx_kbHideTyping() {
  const wzx_typing = document.getElementById("wzx_kbTyping");
  if (wzx_typing) {
    wzx_typing.remove();
  }
}

// 功能：清空并渲染本次回答引用的知识库片段
function wzx_kbRenderSources(wzx_sources) {
  const wzx_box = document.getElementById("wzx_kbSources");
  wzx_box.innerHTML = "";

  if (!wzx_sources || !wzx_sources.length) {
    return;
  }

  const wzx_title = document.createElement("h3");
  wzx_title.className = "wzx_panel-subtitle";
  wzx_title.textContent = "引用来源（" + wzx_sources.length + " 个片段）";
  wzx_box.appendChild(wzx_title);

  wzx_sources.forEach(function (wzx_source) {
    const wzx_item = document.createElement("div");
    wzx_item.className = "wzx_src";

    const wzx_head = document.createElement("p");
    wzx_head.className = "wzx_src-head";
    wzx_head.textContent = wzx_source.fileName + " · 第 " + wzx_source.index + " 段 · 得分 " + wzx_source.score;

    const wzx_preview = document.createElement("p");
    wzx_preview.className = "wzx_src-preview";
    wzx_preview.textContent = wzx_source.preview;

    wzx_item.appendChild(wzx_head);
    wzx_item.appendChild(wzx_preview);
    wzx_box.appendChild(wzx_item);
  });
}

// 功能：把问题发给 /api/kb/chat，渲染回答与引用来源
async function wzx_kbAsk(wzx_question) {
  wzx_kbAddBubble("user", wzx_question);
  wzx_kbRenderSources([]);
  wzx_kbSetBusy(true, "正在检索知识库…");
  wzx_kbShowTyping();

  try {
    const wzx_response = await fetch("/api/kb/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: wzx_question, topK: 4 })
    });
    const wzx_json = await wzx_response.json();
    console.log("知识库问答返回：", wzx_json);

    wzx_kbHideTyping();

    if (wzx_json.code !== 0) {
      wzx_kbAddBubble("error", wzx_json.msg || "请求失败");
      wzx_kbSetBusy(false, "请求失败");
      return;
    }

    const wzx_data = wzx_json.data || {};
    wzx_kbAddBubble("assistant", wzx_data.answer || "没有返回内容");
    wzx_kbRenderSources(wzx_data.sources);
    wzx_kbSetBusy(false, "已回复 · 命中 " + (wzx_data.hitCount || 0) + " 个片段 · " + (wzx_data.provider || "未知") + " " + (wzx_data.model || ""));
  } catch (wzx_error) {
    console.error("知识库问答失败：", wzx_error);
    wzx_kbHideTyping();
    wzx_kbAddBubble("error", "网络异常，请确认后端已启动（http://localhost:8207）");
    wzx_kbSetBusy(false, "网络异常");
  }
}

// 功能：绑定上传按钮、文件列表删除、表单提交与快捷问题
function wzx_kbBind() {
  document.getElementById("wzx_kbUploadBtn").addEventListener("click", wzx_kbUpload);

  document.getElementById("wzx_kbList").addEventListener("click", function (wzx_event) {
    const wzx_button = wzx_event.target.closest("[data-wzx-id]");
    if (!wzx_button) {
      return;
    }
    wzx_kbDelete(wzx_button.getAttribute("data-wzx-id"), wzx_button.getAttribute("data-wzx-name"));
  });

  const wzx_form = document.getElementById("wzx_kbForm");
  const wzx_input = document.getElementById("wzx_kbQuestion");

  wzx_form.addEventListener("submit", function (wzx_event) {
    wzx_event.preventDefault();
    if (wzx_kbBusy) {
      return;
    }
    const wzx_text = wzx_input.value.trim();
    if (!wzx_text) {
      document.getElementById("wzx_kbStatus").textContent = "请先输入问题";
      return;
    }
    wzx_input.value = "";
    wzx_kbAsk(wzx_text);
  });

  wzx_input.addEventListener("keydown", function (wzx_event) {
    if (wzx_event.key === "Enter" && !wzx_event.shiftKey) {
      wzx_event.preventDefault();
      wzx_form.requestSubmit();
    }
  });

  document.querySelector(".wzx_chat-tips").addEventListener("click", function (wzx_event) {
    const wzx_button = wzx_event.target.closest("[data-wzx-question]");
    if (!wzx_button || wzx_kbBusy) {
      return;
    }
    wzx_kbAsk(wzx_button.getAttribute("data-wzx-question"));
  });

  wzx_kbLoadFiles();
}

wzx_kbBind();
