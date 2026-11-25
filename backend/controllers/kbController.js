/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-25 | 大模型：DeepSeek-V4.1-Flash
 * 功能：知识库管理（RAG）接口，负责文件上传解析、列表、删除与基于知识库的问答
 */
const path = require("path");
const multer = require("multer");
const wzx_config = require("../config/env");
const { wzx_ok, wzx_fail } = require("../utils/result");
const { wzx_parseFile, wzx_isSupported, wzx_fixFilename } = require("../services/fileParser");
const wzx_store = require("../services/kbStore");
const { wzx_search } = require("../services/retrieval");

// 功能：上传中间件，文件放内存便于直接解析，限制 20MB 且只收知识库支持的格式
const wzx_kbUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: function (wzx_req, wzx_file, wzx_cb) {
    if (!wzx_isSupported(wzx_file.originalname)) {
      wzx_cb(new Error("不支持的文件类型：" + path.extname(wzx_file.originalname) + "，可上传 txt/md/doc/docx/ppt/pptx/pdf"));
      return;
    }
    wzx_cb(null, true);
  }
}).single("file");

// 功能：选择问答用的平台，优先七牛，没配 Key 时退回硅基流动
function wzx_pickProvider() {
  const wzx_qiniu = wzx_config.ai.providers.qiniu;
  if (wzx_qiniu.apiKey) {
    return wzx_qiniu;
  }
  return wzx_config.ai.providers.siliconflow;
}

// 功能：把上游状态码翻译成中文提示
function wzx_mapStatus(wzx_status) {
  const wzx_map = {
    401: "API Key 无效或已失效，请检查 backend/.env",
    402: "账户余额不足",
    404: "模型名或接口地址有误",
    429: "请求过于频繁，已被平台限流，等几秒再试"
  };
  return wzx_map[wzx_status] || "大模型接口返回异常状态码 " + wzx_status;
}

// 功能：POST /api/kb/files，解析上传文件并切块入库，返回文件摘要
async function wzx_uploadFile(wzx_req, wzx_res) {
  if (!wzx_req.file) {
    wzx_fail(wzx_res, "请选择要上传的文件（表单字段名 file）", 6001);
    return;
  }

  try {
    // 浏览器上传的中文文件名会被按 latin1 解码，这里统一还原
    const wzx_name = wzx_fixFilename(wzx_req.file.originalname);
    const wzx_parsed = await wzx_parseFile({
      buffer: wzx_req.file.buffer,
      originalname: wzx_name
    });

    const wzx_storedName = wzx_store.wzx_saveUpload(wzx_req.file.buffer, wzx_name);
    const wzx_record = wzx_store.wzx_addFile({
      name: wzx_name,
      ext: wzx_parsed.ext,
      size: wzx_req.file.size,
      text: wzx_parsed.text,
      note: wzx_parsed.note,
      storedName: wzx_storedName
    });

    console.log(
      "[api/kb] 入库成功：" + wzx_record.name + "，类型 " + wzx_record.ext +
      "，提取 " + wzx_record.chars + " 字，切块 " + wzx_record.chunkCount + " 个"
    );
    wzx_ok(wzx_res, wzx_record, "解析并入库成功");
  } catch (wzx_error) {
    console.error("[api/kb] 解析失败：", wzx_error.message);
    wzx_fail(wzx_res, wzx_error.message, 6002);
  }
}

// 功能：GET /api/kb/files，返回知识库文件列表
function wzx_listFiles(wzx_req, wzx_res) {
  const wzx_files = wzx_store.wzx_listFiles();
  wzx_ok(wzx_res, { total: wzx_files.length, files: wzx_files }, "查询成功");
}

// 功能：DELETE /api/kb/files/:id，删除指定知识库文件
function wzx_deleteFile(wzx_req, wzx_res) {
  const wzx_removed = wzx_store.wzx_removeFile(String(wzx_req.params.id || ""));
  if (!wzx_removed) {
    wzx_fail(wzx_res, "没有找到该知识库文件，可能已被删除", 6003);
    return;
  }
  console.log("[api/kb] 删除成功：" + wzx_removed.name);
  wzx_ok(wzx_res, wzx_removed, "删除成功");
}

// 功能：POST /api/kb/chat，检索知识库片段后拼进提示词，回答并返回引用来源
async function wzx_ask(wzx_req, wzx_res) {
  const wzx_body = wzx_req.body || {};
  const wzx_question = String(wzx_body.question || "").trim();

  if (!wzx_question) {
    wzx_fail(wzx_res, "请输入问题", 6004);
    return;
  }
  if (wzx_question.length > 500) {
    wzx_fail(wzx_res, "问题太长，请控制在 500 字以内", 6005);
    return;
  }

  const wzx_chunks = wzx_store.wzx_allChunks();
  if (!wzx_chunks.length) {
    wzx_fail(wzx_res, "知识库为空，请先上传知识库文件", 6006);
    return;
  }

  const wzx_topK = Math.min(Math.max(Number(wzx_body.topK) || 4, 1), 8);
  const wzx_hits = wzx_search(wzx_question, wzx_chunks, wzx_topK);

  if (!wzx_hits.length) {
    wzx_ok(wzx_res, {
      answer: "知识库中没有检索到与这个问题相关的内容，请换一种问法，或先上传包含该主题的文件。",
      sources: [],
      hitCount: 0,
      model: null,
      usage: null
    }, "未命中知识库");
    return;
  }

  const wzx_provider = wzx_pickProvider();
  if (!wzx_provider.apiKey) {
    wzx_fail(wzx_res, "后端未配置可用的模型 Key，请在 backend/.env 中填写 QINIU_API_KEY 后重启服务", 6007);
    return;
  }

  const wzx_context = wzx_hits.map(function (wzx_hit, wzx_i) {
    return "【资料" + (wzx_i + 1) + "】来源：" + wzx_hit.fileName + "\n" + wzx_hit.text;
  }).join("\n\n");

  const wzx_messages = [
    {
      role: "system",
      content: "你是知识库问答助手。只能依据用户提供的【资料】回答，禁止编造资料以外的信息；" +
        "资料中没有答案时，直接回答“知识库中没有找到相关信息”。回答使用简体中文，条理清晰，" +
        "涉及数字、时间、价格时必须与资料完全一致。"
    },
    {
      role: "user",
      content: "【资料】\n" + wzx_context + "\n\n【问题】\n" + wzx_question + "\n\n请只依据上面的资料回答。"
    }
  ];

  const wzx_payload = {
    model: wzx_provider.model,
    messages: wzx_messages,
    temperature: 0.2,
    max_tokens: 1024
  };

  // 课程要求：控制台同时打印发给大模型的完整数据
  console.log("[api/kb] 发送给大模型的数据：\n" + JSON.stringify(wzx_payload, null, 2));

  const wzx_controller = new AbortController();
  const wzx_timer = setTimeout(function () {
    wzx_controller.abort();
  }, 120000);

  try {
    const wzx_response = await fetch(wzx_provider.baseUrl + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + wzx_provider.apiKey
      },
      body: JSON.stringify(wzx_payload),
      signal: wzx_controller.signal
    });

    const wzx_json = await wzx_response.json().catch(function () {
      return null;
    });

    // 课程要求：控制台同时打印大模型返回的完整数据
    console.log("[api/kb] 接收自大模型的数据：\n" + JSON.stringify(wzx_json, null, 2));

    if (!wzx_response.ok) {
      wzx_fail(wzx_res, wzx_provider.name + "：" + wzx_mapStatus(wzx_response.status), 6008);
      return;
    }

    const wzx_message = (wzx_json && wzx_json.choices && wzx_json.choices[0] && wzx_json.choices[0].message) || {};
    const wzx_answer = wzx_message.content || wzx_message.reasoning_content || "";

    if (!wzx_answer) {
      wzx_fail(wzx_res, "大模型没有返回有效内容，请稍后重试", 6009);
      return;
    }

    wzx_ok(wzx_res, {
      answer: wzx_answer,
      sources: wzx_hits.map(function (wzx_hit) {
        return {
          fileId: wzx_hit.fileId,
          fileName: wzx_hit.fileName,
          index: wzx_hit.index,
          score: Number(wzx_hit.score.toFixed(2)),
          preview: wzx_hit.text.slice(0, 90) + (wzx_hit.text.length > 90 ? "…" : "")
        };
      }),
      hitCount: wzx_hits.length,
      model: (wzx_json && wzx_json.model) || wzx_provider.model,
      provider: wzx_provider.name,
      usage: (wzx_json && wzx_json.usage) || null
    }, "回答成功");
  } catch (wzx_error) {
    const wzx_aborted = wzx_error.name === "AbortError";
    console.error("[api/kb] 请求异常：", wzx_aborted ? "超时" : wzx_error.message);
    wzx_fail(wzx_res, wzx_aborted ? "大模型响应超时，请稍后重试" : "请求大模型失败：" + wzx_error.message, 6010);
  } finally {
    clearTimeout(wzx_timer);
  }
}

module.exports = {
  wzx_kbUpload,
  wzx_uploadFile,
  wzx_listFiles,
  wzx_deleteFile,
  wzx_ask
};
