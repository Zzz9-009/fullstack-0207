/*
  姓名：王振旭 | 学号：24002120207 | 时间：2026-11-20 | 大模型：DeepSeek-V4.1-Flash
  功能：AI 聊天页交互，维护多轮 messages 数组并请求 /api/chat
*/

// 多轮对话：模型本身不记事，每次请求都把历史消息整串发过去
const wzx_messages = [
  { role: "system", content: "你是一个有用的助手，请用简体中文简洁准确地回答。" }
];

let wzx_busy = false;

// 功能：向聊天区追加一条消息气泡，role 取 user / assistant / error
function wzx_addBubble(wzx_role, wzx_text) {
  const wzx_log = document.getElementById("wzx_chatLog");
  const wzx_empty = document.getElementById("wzx_chatEmpty");
  if (wzx_empty) {
    wzx_empty.remove();
  }

  const wzx_item = document.createElement("div");
  wzx_item.className = "wzx_chat-msg wzx_chat-msg--" + wzx_role;

  const wzx_head = document.createElement("span");
  wzx_head.className = "wzx_chat-meta";
  wzx_head.textContent = wzx_role === "user" ? "我" : (wzx_role === "error" ? "系统提示" : "AI");

  const wzx_body = document.createElement("p");
  wzx_body.className = "wzx_chat-text";
  wzx_body.textContent = wzx_text;

  wzx_item.appendChild(wzx_head);
  wzx_item.appendChild(wzx_body);
  wzx_log.appendChild(wzx_item);
  wzx_scrollToBottom();
  return wzx_item;
}

// 功能：在聊天区显示“正在思考…”占位气泡
function wzx_showTyping() {
  const wzx_log = document.getElementById("wzx_chatLog");
  const wzx_item = document.createElement("div");
  wzx_item.className = "wzx_chat-msg wzx_chat-msg--assistant wzx_chat-msg--typing";
  wzx_item.id = "wzx_chatTyping";

  const wzx_head = document.createElement("span");
  wzx_head.className = "wzx_chat-meta";
  wzx_head.textContent = "AI";

  const wzx_body = document.createElement("p");
  wzx_body.className = "wzx_chat-text";
  wzx_body.textContent = "正在思考…";

  wzx_item.appendChild(wzx_head);
  wzx_item.appendChild(wzx_body);
  wzx_log.appendChild(wzx_item);
  wzx_scrollToBottom();
}

// 功能：移除“正在思考…”占位气泡
function wzx_hideTyping() {
  const wzx_typing = document.getElementById("wzx_chatTyping");
  if (wzx_typing) {
    wzx_typing.remove();
  }
}

// 功能：把聊天区滚动到底部，保证最新消息可见
function wzx_scrollToBottom() {
  const wzx_log = document.getElementById("wzx_chatLog");
  wzx_log.scrollTop = wzx_log.scrollHeight;
}

// 功能：切换发送中的界面状态，避免重复提交
function wzx_setBusy(wzx_nextBusy) {
  wzx_busy = wzx_nextBusy;
  const wzx_input = document.getElementById("wzx_chatInput");
  const wzx_send = document.getElementById("wzx_chatSend");
  const wzx_status = document.getElementById("wzx_chatStatus");
  wzx_input.disabled = wzx_nextBusy;
  wzx_send.disabled = wzx_nextBusy;
  wzx_status.textContent = wzx_nextBusy ? "正在思考…" : "就绪";
}

// 功能：把用户问题发给 /api/chat，成功后追加 AI 回答并写入历史
async function wzx_sendMessage(wzx_text) {
  const wzx_status = document.getElementById("wzx_chatStatus");

  wzx_addBubble("user", wzx_text);
  wzx_messages.push({ role: "user", content: wzx_text });
  wzx_setBusy(true);
  wzx_showTyping();

  try {
    const wzx_response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: wzx_messages })
    });
    const wzx_json = await wzx_response.json();
    console.log("聊天接口返回：", wzx_json);

    if (wzx_json.code !== 0) {
      wzx_hideTyping();
      wzx_messages.pop();
      wzx_addBubble("error", wzx_json.msg || "请求失败");
      wzx_status.textContent = "请求失败";
      return;
    }

    wzx_hideTyping();
    const wzx_data = wzx_json.data || {};
    wzx_messages.push({ role: "assistant", content: wzx_data.reply });
    wzx_addBubble("assistant", wzx_data.reply);
    document.getElementById("wzx_chatModel").textContent = "模型：" + (wzx_data.model || "未知");
    wzx_status.textContent = "已收到回答 · 历史消息 " + (wzx_messages.length - 1) + " 条";
  } catch (wzx_error) {
    console.error("聊天请求失败：", wzx_error);
    wzx_hideTyping();
    wzx_messages.pop();
    wzx_addBubble("error", "网络异常，请确认后端已启动（http://localhost:8207）");
    wzx_status.textContent = "网络异常";
  } finally {
    wzx_setBusy(false);
    document.getElementById("wzx_chatInput").focus();
  }
}

// 功能：绑定表单提交与 Enter 发送、Shift + Enter 换行
function wzx_bindEvents() {
  const wzx_form = document.getElementById("wzx_chatForm");
  const wzx_input = document.getElementById("wzx_chatInput");

  wzx_form.addEventListener("submit", function (wzx_event) {
    wzx_event.preventDefault();
    if (wzx_busy) {
      return;
    }
    const wzx_text = wzx_input.value.trim();
    if (!wzx_text) {
      document.getElementById("wzx_chatStatus").textContent = "请先输入问题";
      return;
    }
    wzx_input.value = "";
    wzx_sendMessage(wzx_text);
  });

  wzx_input.addEventListener("keydown", function (wzx_event) {
    if (wzx_event.key === "Enter" && !wzx_event.shiftKey) {
      wzx_event.preventDefault();
      wzx_form.requestSubmit();
    }
  });
}

wzx_bindEvents();
