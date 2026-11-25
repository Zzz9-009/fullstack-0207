/*
  姓名：王振旭 | 学号：24002120207 | 时间：2026-11-25 | 大模型：DeepSeek-V4.1-Flash
  功能：在线客服页交互，客服人设 + 平台切换 + 多轮对话
*/

// 客服人设：把 system 消息换掉，同一个接口就从“AI 聊天”变成“在线客服”
const wzx_serviceSystem = "你是中华美食街的在线客服小食。只能回答下列三类问题，" +
  "并且只能使用【事实库】中给出的内容，数字不得改写、不得补充事实库以外的信息：" +
  "【事实库】" +
  "1) 营业时间：每天 10:00—22:00，节假日不休；" +
  "2) 招牌菜：小笼包、牛肉面、酸辣粉、糖醋里脊，人均 45 元；" +
  "3) 配送范围：门店 3 公里内配送，30 分钟送达，满 39 元免配送费。 " +
  "除此之外的问题（闲聊、其他品牌、写代码、内部信息等）一律不外答，" +
  "统一礼貌回复：“这个问题我这边暂时无法回答，欢迎在页面下方留言，门店会在营业时间内回复您。” " +
  "回答控制在 80 字以内，语气亲切。";

const wzx_serviceMessages = [{ role: "system", content: wzx_serviceSystem }];

let wzx_serviceBusy = false;

// 功能：向客服对话区追加一条气泡，role 取 user / assistant / error
function wzx_serviceAddBubble(wzx_role, wzx_text) {
  const wzx_log = document.getElementById("wzx_serviceLog");
  const wzx_empty = document.getElementById("wzx_serviceEmpty");
  if (wzx_empty) {
    wzx_empty.remove();
  }

  const wzx_item = document.createElement("div");
  wzx_item.className = "wzx_chat-msg wzx_chat-msg--" + wzx_role;

  const wzx_head = document.createElement("span");
  wzx_head.className = "wzx_chat-meta";
  wzx_head.textContent = wzx_role === "user" ? "我" : (wzx_role === "error" ? "系统提示" : "客服小食");

  const wzx_body = document.createElement("p");
  wzx_body.className = "wzx_chat-text";
  wzx_body.textContent = wzx_text;

  wzx_item.appendChild(wzx_head);
  wzx_item.appendChild(wzx_body);
  wzx_log.appendChild(wzx_item);
  wzx_serviceScrollBottom();
}

// 功能：显示“正在思考…”占位气泡
function wzx_serviceShowTyping() {
  const wzx_log = document.getElementById("wzx_serviceLog");
  const wzx_item = document.createElement("div");
  wzx_item.className = "wzx_chat-msg wzx_chat-msg--assistant wzx_chat-msg--typing";
  wzx_item.id = "wzx_serviceTyping";

  const wzx_head = document.createElement("span");
  wzx_head.className = "wzx_chat-meta";
  wzx_head.textContent = "客服小食";

  const wzx_body = document.createElement("p");
  wzx_body.className = "wzx_chat-text";
  wzx_body.textContent = "正在思考…";

  wzx_item.appendChild(wzx_head);
  wzx_item.appendChild(wzx_body);
  wzx_log.appendChild(wzx_item);
  wzx_serviceScrollBottom();
}

// 功能：移除“正在思考…”占位气泡
function wzx_serviceHideTyping() {
  const wzx_typing = document.getElementById("wzx_serviceTyping");
  if (wzx_typing) {
    wzx_typing.remove();
  }
}

// 功能：滚动客服对话区到底部
function wzx_serviceScrollBottom() {
  const wzx_log = document.getElementById("wzx_serviceLog");
  wzx_log.scrollTop = wzx_log.scrollHeight;
}

// 功能：切换发送中的界面状态，防止重复提交
function wzx_serviceSetBusy(wzx_nextBusy) {
  wzx_serviceBusy = wzx_nextBusy;
  document.getElementById("wzx_serviceInput").disabled = wzx_nextBusy;
  document.getElementById("wzx_serviceSend").disabled = wzx_nextBusy;
  document.getElementById("wzx_serviceStatus").textContent = wzx_nextBusy ? "正在思考…" : "就绪";
}

// 功能：把问题与所选平台发给 /api/chat，追加客服回答并写入历史
async function wzx_serviceSend(wzx_text) {
  const wzx_status = document.getElementById("wzx_serviceStatus");
  const wzx_provider = document.getElementById("wzx_serviceProvider").value;

  wzx_serviceAddBubble("user", wzx_text);
  wzx_serviceMessages.push({ role: "user", content: wzx_text });
  wzx_serviceSetBusy(true);
  wzx_serviceShowTyping();

  try {
    const wzx_response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: wzx_serviceMessages, provider: wzx_provider, temperature: 0.2 })
    });
    const wzx_json = await wzx_response.json();
    console.log("客服接口返回：", wzx_json);

    if (wzx_json.code !== 0) {
      wzx_serviceHideTyping();
      wzx_serviceMessages.pop();
      wzx_serviceAddBubble("error", wzx_json.msg || "请求失败");
      wzx_status.textContent = "请求失败";
      return;
    }

    wzx_serviceHideTyping();
    const wzx_data = wzx_json.data || {};
    wzx_serviceMessages.push({ role: "assistant", content: wzx_data.reply });
    wzx_serviceAddBubble("assistant", wzx_data.reply);
    document.getElementById("wzx_serviceModel").textContent =
      "平台：" + (wzx_data.provider ? wzx_data.provider.name : "未知") + " · " + (wzx_data.model || "未知模型");
    wzx_status.textContent = "已回复 · 历史消息 " + (wzx_serviceMessages.length - 1) + " 条";
  } catch (wzx_error) {
    console.error("客服请求失败：", wzx_error);
    wzx_serviceHideTyping();
    wzx_serviceMessages.pop();
    wzx_serviceAddBubble("error", "网络异常，请确认后端已启动（http://localhost:8207）");
    wzx_status.textContent = "网络异常";
  } finally {
    wzx_serviceSetBusy(false);
    document.getElementById("wzx_serviceInput").focus();
  }
}

// 功能：绑定表单提交、Enter 发送、快捷问题按钮与平台切换
function wzx_serviceBindEvents() {
  const wzx_form = document.getElementById("wzx_serviceForm");
  const wzx_input = document.getElementById("wzx_serviceInput");

  wzx_form.addEventListener("submit", function (wzx_event) {
    wzx_event.preventDefault();
    if (wzx_serviceBusy) {
      return;
    }
    const wzx_text = wzx_input.value.trim();
    if (!wzx_text) {
      document.getElementById("wzx_serviceStatus").textContent = "请先输入问题";
      return;
    }
    wzx_input.value = "";
    wzx_serviceSend(wzx_text);
  });

  wzx_input.addEventListener("keydown", function (wzx_event) {
    if (wzx_event.key === "Enter" && !wzx_event.shiftKey) {
      wzx_event.preventDefault();
      wzx_form.requestSubmit();
    }
  });

  document.getElementById("wzx_serviceTips").addEventListener("click", function (wzx_event) {
    const wzx_button = wzx_event.target.closest("[data-wzx-question]");
    if (!wzx_button || wzx_serviceBusy) {
      return;
    }
    wzx_input.value = wzx_button.getAttribute("data-wzx-question");
    wzx_form.requestSubmit();
  });

  document.getElementById("wzx_serviceProvider").addEventListener("change", function (wzx_event) {
    const wzx_name = wzx_event.target.options[wzx_event.target.selectedIndex].text;
    document.getElementById("wzx_serviceModel").textContent = "平台：" + wzx_name.split(" · ")[0];
  });
}

wzx_serviceBindEvents();
