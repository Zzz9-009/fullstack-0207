/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-25 | 大模型：DeepSeek-V4.1-Flash
 * 功能：语音识别接口，把音频转发给七牛 Qwen-Audio-3.0-ASR-Flash 并返回文字
 */
const path = require("path");
const multer = require("multer");
const wzx_config = require("../config/env");
const { wzx_ok, wzx_fail } = require("../utils/result");
const { wzx_fixFilename } = require("../services/fileParser");

// 支持的音频扩展名与对应 MIME
const WZX_AUDIO_TYPES = {
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".webm": "audio/webm",
  ".ogg": "audio/ogg",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
  ".amr": "audio/amr"
};

// 功能：上传中间件，音频放内存后整体转发，限制 20MB
const wzx_asrUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: function (wzx_req, wzx_file, wzx_cb) {
    const wzx_ext = path.extname(wzx_file.originalname || "").toLowerCase();
    if (!WZX_AUDIO_TYPES[wzx_ext]) {
      wzx_cb(new Error("不支持的音频格式：" + (wzx_ext || "未知") + "，请上传 wav/mp3/m4a/webm/ogg"));
      return;
    }
    wzx_cb(null, true);
  }
}).single("audio");

// 功能：把上游状态码翻译成中文提示
function wzx_mapStatus(wzx_status) {
  const wzx_map = {
    400: "音频参数不被接受，请确认格式与时长（建议 60 秒内的 wav/mp3）",
    401: "API Key 无效或已失效，请检查 backend/.env",
    402: "账户余额不足",
    404: "语音识别接口地址或模型名有误",
    413: "音频文件过大，请控制在 20MB 以内",
    429: "请求过于频繁，已被平台限流，等几秒再试"
  };
  return wzx_map[wzx_status] || "语音识别接口返回异常状态码 " + wzx_status;
}

// 功能：POST /api/asr，把音频原样 multipart 转发给七牛转写接口
async function wzx_transcribe(wzx_req, wzx_res) {
  if (!wzx_req.file) {
    wzx_fail(wzx_res, "请选择要识别的音频（表单字段名 audio）", 8001);
    return;
  }

  const wzx_qiniu = wzx_config.ai.providers.qiniu;
  if (!wzx_qiniu.apiKey) {
    wzx_fail(wzx_res, "后端未配置七牛 Key，请在 backend/.env 中填写 QINIU_API_KEY 后重启服务", 8002);
    return;
  }

  const wzx_ext = path.extname(wzx_req.file.originalname || "").toLowerCase();
  const wzx_mime = WZX_AUDIO_TYPES[wzx_ext] || "audio/wav";
  const wzx_name = wzx_fixFilename(wzx_req.file.originalname) || "audio" + wzx_ext;

  // Node 24 自带 FormData / Blob，直接拼 multipart，不需要额外依赖
  const wzx_form = new FormData();
  wzx_form.append("model", wzx_qiniu.asrModel);
  wzx_form.append("file", new Blob([wzx_req.file.buffer], { type: wzx_mime }), wzx_name);

  console.log(
    "[api/asr] 发送给语音模型：model=" + wzx_qiniu.asrModel +
    "，file=" + wzx_name +
    "，size=" + wzx_req.file.size + " 字节，" + wzx_mime
  );

  const wzx_controller = new AbortController();
  const wzx_timer = setTimeout(function () {
    wzx_controller.abort();
  }, 120000);

  try {
    const wzx_response = await fetch(wzx_qiniu.baseUrl + "/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + wzx_qiniu.apiKey },
      body: wzx_form,
      signal: wzx_controller.signal
    });

    const wzx_json = await wzx_response.json().catch(function () {
      return null;
    });

    console.log("[api/asr] 接收自语音模型的数据：\n" + JSON.stringify(wzx_json, null, 2));

    if (!wzx_response.ok) {
      wzx_fail(wzx_res, "七牛云：" + wzx_mapStatus(wzx_response.status), 8003);
      return;
    }

    const wzx_text = (wzx_json && wzx_json.text) || "";
    if (!wzx_text) {
      wzx_fail(wzx_res, "没有识别出文字，请确认音频中有清晰人声后重试", 8004);
      return;
    }

    wzx_ok(wzx_res, {
      text: wzx_text,
      fileName: wzx_name,
      audioSize: wzx_req.file.size,
      model: wzx_qiniu.asrModel,
      usage: (wzx_json && wzx_json.usage) || null
    }, "识别成功");
  } catch (wzx_error) {
    const wzx_aborted = wzx_error.name === "AbortError";
    console.error("[api/asr] 请求异常：", wzx_aborted ? "超时" : wzx_error.message);
    wzx_fail(wzx_res, wzx_aborted ? "语音识别超时，请缩短音频后重试" : "请求语音识别失败：" + wzx_error.message, 8005);
  } finally {
    clearTimeout(wzx_timer);
  }
}

module.exports = { wzx_asrUpload, wzx_transcribe };
