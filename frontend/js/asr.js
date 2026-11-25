/*
  姓名：王振旭 | 学号：24002120207 | 时间：2026-11-25 | 大模型：DeepSeek-V4.1-Flash
  功能：语音识别页面交互，MediaRecorder 录音或选择音频文件后调用 /api/asr 转文字
*/

let wzx_asrRecorder = null;
let wzx_asrStream = null;
let wzx_asrChunks = [];
let wzx_asrTimerId = null;
let wzx_asrSeconds = 0;
let wzx_asrBlob = null;
let wzx_asrBlobName = "";
let wzx_asrBusy = false;

// 功能：把秒数格式化成 mm:ss，用于录音计时
function wzx_asrClock(wzx_second) {
  const wzx_m = String(Math.floor(wzx_second / 60)).padStart(2, "0");
  const wzx_s = String(wzx_second % 60).padStart(2, "0");
  return wzx_m + ":" + wzx_s;
}

// 功能：挑选当前浏览器支持的录音格式，返回 MIME 字符串
function wzx_asrPickMime() {
  const wzx_list = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  for (let wzx_i = 0; wzx_i < wzx_list.length; wzx_i += 1) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(wzx_list[wzx_i])) {
      return wzx_list[wzx_i];
    }
  }
  return "";
}

// 功能：根据 MIME 推断录音文件扩展名，保证后端能通过格式校验
function wzx_asrExtension(wzx_mime) {
  if (wzx_mime.indexOf("ogg") !== -1) {
    return ".ogg";
  }
  if (wzx_mime.indexOf("mp4") !== -1) {
    return ".m4a";
  }
  return ".webm";
}

// 功能：更新录音与识别按钮的可用状态
function wzx_asrSetButtons(wzx_recording) {
  document.getElementById("wzx_asrRecordBtn").disabled = wzx_recording || wzx_asrBusy;
  document.getElementById("wzx_asrStopBtn").disabled = !wzx_recording;
  document.getElementById("wzx_asrBtn").disabled = wzx_asrBusy;
}

// 功能：开始录音，成功后启动计时器，到 60 秒自动停止
async function wzx_asrStart() {
  const wzx_status = document.getElementById("wzx_asrRecordStatus");

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
    wzx_status.textContent = "当前浏览器不支持录音，请改用上传音频文件的方式。";
    return;
  }

  try {
    wzx_asrStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (wzx_error) {
    console.error("麦克风不可用：", wzx_error);
    wzx_status.textContent = "无法访问麦克风：" + wzx_error.message + "。可以改用下方上传音频文件。";
    return;
  }

  const wzx_mime = wzx_asrPickMime();
  wzx_asrChunks = [];
  wzx_asrRecorder = new MediaRecorder(wzx_asrStream, wzx_mime ? { mimeType: wzx_mime } : undefined);

  wzx_asrRecorder.ondataavailable = function (wzx_event) {
    if (wzx_event.data && wzx_event.data.size > 0) {
      wzx_asrChunks.push(wzx_event.data);
    }
  };

  wzx_asrRecorder.onstop = function () {
    const wzx_type = (wzx_asrRecorder && wzx_asrRecorder.mimeType) || "audio/webm";
    wzx_asrBlob = new Blob(wzx_asrChunks, { type: wzx_type });
    wzx_asrBlobName = "wzx-录音-" + new Date().toISOString().slice(11, 19).replace(/:/g, "") + wzx_asrExtension(wzx_type);

    const wzx_audio = document.getElementById("wzx_asrAudio");
    wzx_audio.src = URL.createObjectURL(wzx_asrBlob);
    wzx_audio.hidden = false;

    document.getElementById("wzx_asrFileStatus").textContent =
      "已录制 " + wzx_asrClock(wzx_asrSeconds) + "，点击「识别音频」即可转文字。";
    wzx_asrStopTracks();
    wzx_asrSetButtons(false);
  };

  wzx_asrSeconds = 0;
  document.getElementById("wzx_asrTimer").textContent = "00:00 / 01:00";
  document.getElementById("wzx_asrAudio").hidden = true;
  document.getElementById("wzx_asrDot").classList.add("wzx_record-dot--on");
  wzx_asrRecorder.start();
  wzx_asrSetButtons(true);
  wzx_status.textContent = "正在录音…请对着麦克风说话，60 秒后自动停止。";

  wzx_asrTimerId = setInterval(function () {
    wzx_asrSeconds += 1;
    document.getElementById("wzx_asrTimer").textContent = wzx_asrClock(wzx_asrSeconds) + " / 01:00";
    if (wzx_asrSeconds >= 60) {
      wzx_asrStop();
    }
  }, 1000);
}

// 功能：停止录音，清理计时器与麦克风轨道
function wzx_asrStop() {
  if (wzx_asrTimerId) {
    clearInterval(wzx_asrTimerId);
    wzx_asrTimerId = null;
  }
  document.getElementById("wzx_asrDot").classList.remove("wzx_record-dot--on");

  if (wzx_asrRecorder && wzx_asrRecorder.state !== "inactive") {
    wzx_asrRecorder.stop();
  } else {
    wzx_asrStopTracks();
    wzx_asrSetButtons(false);
  }

  const wzx_status = document.getElementById("wzx_asrRecordStatus");
  if (wzx_status.textContent.indexOf("正在录音") !== -1) {
    wzx_status.textContent = "录音已停止，可以重新录制，或直接点击「识别音频」。";
  }
}

// 功能：关闭麦克风轨道，避免浏览器一直显示录音中
function wzx_asrStopTracks() {
  if (wzx_asrStream) {
    wzx_asrStream.getTracks().forEach(function (wzx_track) {
      wzx_track.stop();
    });
    wzx_asrStream = null;
  }
}

// 功能：把录音或选中的音频文件发给 /api/asr 并展示识别结果
async function wzx_asrRecognize() {
  const wzx_result = document.getElementById("wzx_asrResult");
  const wzx_meta = document.getElementById("wzx_asrMeta");
  const wzx_file = document.getElementById("wzx_asrFile").files[0];

  if (wzx_asrBusy) {
    return;
  }

  let wzx_payload = wzx_file;
  let wzx_name = wzx_file ? wzx_file.name : "";

  if (!wzx_payload) {
    wzx_payload = wzx_asrBlob;
    wzx_name = wzx_asrBlobName;
  }

  if (!wzx_payload) {
    wzx_result.className = "wzx_result wzx_result--err";
    wzx_result.textContent = "请先录音或选择一个音频文件。";
    return;
  }
  if (wzx_payload.size > 20 * 1024 * 1024) {
    wzx_result.className = "wzx_result wzx_result--err";
    wzx_result.textContent = "音频超过 20MB，请剪短后再试。";
    return;
  }

  const wzx_form = new FormData();
  wzx_form.append("audio", wzx_payload, wzx_name);

  wzx_asrBusy = true;
  wzx_asrSetButtons(false);
  wzx_result.className = "wzx_result wzx_result--idle";
  wzx_result.textContent = "正在识别，请稍候…";
  wzx_meta.textContent = "";

  try {
    const wzx_response = await fetch("/api/asr", { method: "POST", body: wzx_form });
    const wzx_json = await wzx_response.json();
    console.log("语音识别返回：", wzx_json);

    if (wzx_json.code !== 0) {
      wzx_result.className = "wzx_result wzx_result--err";
      wzx_result.textContent = "识别失败：" + wzx_json.msg;
      return;
    }

    const wzx_data = wzx_json.data || {};
    wzx_result.className = "wzx_result wzx_result--ok";
    wzx_result.textContent = wzx_data.text || "没有识别出文字";

    const wzx_usage = wzx_data.usage || {};
    wzx_meta.textContent = "模型：" + (wzx_data.model || "未知") +
      " · 文件：" + (wzx_data.fileName || wzx_name) +
      (wzx_usage.seconds ? " · 时长：" + wzx_usage.seconds + " 秒" : "");
  } catch (wzx_error) {
    console.error("语音识别失败：", wzx_error);
    wzx_result.className = "wzx_result wzx_result--err";
    wzx_result.textContent = "网络异常，请确认后端已启动（http://localhost:8207）";
  } finally {
    wzx_asrBusy = false;
    wzx_asrSetButtons(false);
  }
}

// 功能：选择本地音频文件后更新提示文字
function wzx_asrFileChange() {
  const wzx_file = document.getElementById("wzx_asrFile").files[0];
  document.getElementById("wzx_asrFileStatus").textContent = wzx_file
    ? "已选择：" + wzx_file.name + " · " + Math.max(1, Math.round(wzx_file.size / 1024)) + " KB"
    : "支持 wav / mp3 / m4a / webm / ogg，单个文件不超过 20MB。";
}

// 功能：绑定录音、停止、识别与文件选择事件
function wzx_asrBind() {
  document.getElementById("wzx_asrRecordBtn").addEventListener("click", wzx_asrStart);
  document.getElementById("wzx_asrStopBtn").addEventListener("click", wzx_asrStop);
  document.getElementById("wzx_asrBtn").addEventListener("click", wzx_asrRecognize);
  document.getElementById("wzx_asrFile").addEventListener("change", wzx_asrFileChange);
}

wzx_asrBind();
