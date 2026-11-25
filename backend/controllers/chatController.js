/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-20 | 大模型：DeepSeek-V4.1-Flash
 * 功能：AI 聊天接口控制器，代理硅基流动大模型请求，Key 只保留在后端
 */
const wzx_config = require("../config/env");
const { wzx_ok, wzx_fail } = require("../utils/result");

// 功能：把上游状态码翻译成给用户看的中文提示
function wzx_mapStatus(wzx_status) {
  const wzx_map = {
    401: "API Key 无效或已失效，请检查 backend/.env 中对应平台的 Key",
    402: "账户余额不足，请先到平台领取免费额度或充值",
    404: "模型名或接口地址有误，请核对 SILICONFLOW_MODEL 与 SILICONFLOW_BASE_URL",
    429: "请求过于频繁，已被平台限流，稍等几秒再试"
  };
  return wzx_map[wzx_status] || "大模型接口返回异常状态码 " + wzx_status;
}

// 功能：校验前端传来的对话数组，只接受 role 为 user/assistant/system 的文本消息
function wzx_checkMessages(wzx_messages) {
  if (!Array.isArray(wzx_messages) || wzx_messages.length === 0) {
    return "messages 必须是非空数组";
  }
  const wzx_roles = ["user", "assistant", "system"];
  for (let i = 0; i < wzx_messages.length; i += 1) {
    const wzx_item = wzx_messages[i];
    if (!wzx_item || wzx_roles.indexOf(wzx_item.role) === -1) {
      return "第 " + (i + 1) + " 条消息的 role 不合法";
    }
    if (typeof wzx_item.content !== "string" || wzx_item.content.trim() === "") {
      return "第 " + (i + 1) + " 条消息的 content 不能为空";
    }
  }
  return "";
}

// 功能：POST /api/chat，按 provider 选择平台，携带 Key 转发 messages 并原样返回回答
async function wzx_chat(wzx_req, wzx_res) {
  const wzx_ai = wzx_config.ai;
  const wzx_providerKey = String((wzx_req.body && wzx_req.body.provider) || wzx_ai.defaultProvider).toLowerCase();
  const wzx_provider = wzx_ai.providers[wzx_providerKey];

  if (!wzx_provider) {
    wzx_fail(wzx_res, "不支持的平台：" + wzx_providerKey + "，可选 siliconflow 或 qiniu", 5008);
    return;
  }

  if (!wzx_provider.apiKey) {
    wzx_fail(wzx_res, "后端未配置" + wzx_provider.name + "的 Key，请在 backend/.env 中填写并重启服务", 5003);
    return;
  }

  const wzx_errorText = wzx_checkMessages(wzx_req.body && wzx_req.body.messages);
  if (wzx_errorText) {
    wzx_fail(wzx_res, wzx_errorText, 5004);
    return;
  }

  const wzx_controller = new AbortController();
  const wzx_timer = setTimeout(function () {
    wzx_controller.abort();
  }, wzx_ai.timeout);

  try {
    const wzx_response = await fetch(wzx_provider.baseUrl + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + wzx_provider.apiKey
      },
      body: JSON.stringify({
        model: wzx_provider.model,
        messages: wzx_req.body.messages,
        temperature: typeof wzx_req.body.temperature === "number" ? wzx_req.body.temperature : 0.7,
        max_tokens: typeof wzx_req.body.maxTokens === "number" ? wzx_req.body.maxTokens : 1024
      }),
      signal: wzx_controller.signal
    });

    const wzx_json = await wzx_response.json().catch(function () {
      return null;
    });

    if (!wzx_response.ok) {
      console.error("[api/chat] 上游失败：", wzx_provider.name, wzx_response.status, JSON.stringify(wzx_json));
      wzx_fail(wzx_res, wzx_provider.name + "：" + wzx_mapStatus(wzx_response.status), 5005);
      return;
    }

    const wzx_reply = wzx_json && wzx_json.choices && wzx_json.choices[0] &&
      wzx_json.choices[0].message && wzx_json.choices[0].message.content;

    if (!wzx_reply) {
      console.error("[api/chat] 返回结构异常：", JSON.stringify(wzx_json));
      wzx_fail(wzx_res, "大模型没有返回有效内容，请稍后重试", 5006);
      return;
    }

    console.log("[api/chat] 成功，平台：" + wzx_provider.name + "，模型：" + wzx_provider.model + "，消息数：" + wzx_req.body.messages.length);
    wzx_ok(wzx_res, {
      reply: wzx_reply,
      provider: { key: wzx_providerKey, name: wzx_provider.name },
      model: wzx_json.model || wzx_provider.model,
      usage: wzx_json.usage || null
    }, "回答成功");
  } catch (wzx_error) {
    const wzx_aborted = wzx_error.name === "AbortError";
    console.error("[api/chat] 请求异常：", wzx_aborted ? "超时" : wzx_error.message);
    wzx_fail(wzx_res, wzx_aborted ? "大模型响应超时，请稍后重试" : "请求大模型失败：" + wzx_error.message, 5007);
  } finally {
    clearTimeout(wzx_timer);
  }
}

module.exports = { wzx_chat };
