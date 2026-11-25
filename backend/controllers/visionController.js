/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-25 | 大模型：DeepSeek-V4.1-Flash
 * 功能：图像识别接口，上传图片后调用七牛视觉模型返回中文描述
 */
const path = require("path");
const multer = require("multer");
const wzx_config = require("../config/env");
const { wzx_ok, wzx_fail } = require("../utils/result");
const { wzx_fixFilename } = require("../services/fileParser");

// 支持的图片扩展名与对应的 MIME
const WZX_IMAGE_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".bmp": "image/bmp"
};

// 功能：上传中间件，图片放内存后转 base64，限制 10MB
const wzx_visionUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: function (wzx_req, wzx_file, wzx_cb) {
    const wzx_ext = path.extname(wzx_file.originalname || "").toLowerCase();
    if (!WZX_IMAGE_TYPES[wzx_ext]) {
      wzx_cb(new Error("不支持的图片格式：" + (wzx_ext || "未知") + "，请上传 png/jpg/jpeg/webp/gif/bmp"));
      return;
    }
    wzx_cb(null, true);
  }
}).single("image");

// 功能：把上游状态码翻译成中文提示
function wzx_mapStatus(wzx_status) {
  const wzx_map = {
    401: "API Key 无效或已失效，请检查 backend/.env",
    402: "账户余额不足",
    404: "模型名或接口地址有误",
    429: "请求过于频繁，已被平台限流，等几秒再试",
    502: "该视觉模型已下线或暂不可用"
  };
  return wzx_map[wzx_status] || "视觉模型返回异常状态码 " + wzx_status;
}

// 功能：POST /api/vision，图片转 data URL 后请求视觉模型，返回描述文本
async function wzx_describe(wzx_req, wzx_res) {
  if (!wzx_req.file) {
    wzx_fail(wzx_res, "请选择要识别的图片（表单字段名 image）", 7001);
    return;
  }

  const wzx_qiniu = wzx_config.ai.providers.qiniu;
  if (!wzx_qiniu.apiKey) {
    wzx_fail(wzx_res, "后端未配置七牛 Key，请在 backend/.env 中填写 QINIU_API_KEY 后重启服务", 7002);
    return;
  }

  const wzx_ext = path.extname(wzx_req.file.originalname || "").toLowerCase();
  const wzx_mime = WZX_IMAGE_TYPES[wzx_ext] || "image/png";
  const wzx_base64 = wzx_req.file.buffer.toString("base64");
  const wzx_dataUrl = "data:" + wzx_mime + ";base64," + wzx_base64;

  const wzx_payload = {
    model: wzx_qiniu.visionModel,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "请用简体中文详细描述这张图片：画面主体、场景环境、主要颜色、图中可见的文字（如有），并给出一句整体概括。控制在 250 字以内。"
          },
          { type: "image_url", image_url: { url: wzx_dataUrl } }
        ]
      }
    ],
    temperature: 0.3,
    max_tokens: 1000
  };

  // 日志里不打印完整 base64，避免控制台被刷屏
  const wzx_logPayload = JSON.parse(JSON.stringify(wzx_payload));
  wzx_logPayload.messages[0].content[1].image_url.url =
    "data:" + wzx_mime + ";base64,<" + wzx_base64.length + " 字符已省略>";
  console.log("[api/vision] 发送给视觉模型的数据：\n" + JSON.stringify(wzx_logPayload, null, 2));

  const wzx_controller = new AbortController();
  const wzx_timer = setTimeout(function () {
    wzx_controller.abort();
  }, 120000);

  try {
    const wzx_response = await fetch(wzx_qiniu.baseUrl + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + wzx_qiniu.apiKey
      },
      body: JSON.stringify(wzx_payload),
      signal: wzx_controller.signal
    });

    const wzx_json = await wzx_response.json().catch(function () {
      return null;
    });

    console.log("[api/vision] 接收自视觉模型的数据：\n" + JSON.stringify(wzx_json, null, 2));

    if (!wzx_response.ok) {
      wzx_fail(wzx_res, "七牛云：" + wzx_mapStatus(wzx_response.status), 7003);
      return;
    }

    const wzx_message = (wzx_json && wzx_json.choices && wzx_json.choices[0] && wzx_json.choices[0].message) || {};
    const wzx_text = wzx_message.content || wzx_message.reasoning_content || "";

    if (!wzx_text) {
      wzx_fail(wzx_res, "视觉模型没有返回有效描述，请换一张图片重试", 7004);
      return;
    }

    wzx_ok(wzx_res, {
      description: wzx_text,
      fileName: wzx_fixFilename(wzx_req.file.originalname),
      imageSize: wzx_req.file.size,
      model: (wzx_json && wzx_json.model) || wzx_qiniu.visionModel,
      usage: (wzx_json && wzx_json.usage) || null
    }, "识别成功");
  } catch (wzx_error) {
    const wzx_aborted = wzx_error.name === "AbortError";
    console.error("[api/vision] 请求异常：", wzx_aborted ? "超时" : wzx_error.message);
    wzx_fail(wzx_res, wzx_aborted ? "视觉模型响应超时，请稍后重试" : "请求视觉模型失败：" + wzx_error.message, 7005);
  } finally {
    clearTimeout(wzx_timer);
  }
}

module.exports = { wzx_visionUpload, wzx_describe };
