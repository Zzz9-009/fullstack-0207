/*
  姓名：王振旭 | 学号：24002120207 | 时间：2026-11-25 | 大模型：DeepSeek-V4.1-Flash
  功能：图像识别页面交互，本地预览图片并调用 /api/vision 返回描述
*/

let wzx_visionBusy = false;
let wzx_visionObjectUrl = "";

// 功能：更新识别按钮的忙碌状态与提示文字
function wzx_visionSetBusy(wzx_nextBusy, wzx_text) {
  wzx_visionBusy = wzx_nextBusy;
  document.getElementById("wzx_visionBtn").disabled = wzx_nextBusy;
  document.getElementById("wzx_visionStatus").textContent = wzx_text;
}

// 功能：选择图片后生成本地预览，并释放上一个预览占用的内存
function wzx_visionPreview() {
  const wzx_input = document.getElementById("wzx_visionFile");
  const wzx_image = document.getElementById("wzx_visionPreview");
  const wzx_caption = document.getElementById("wzx_visionCaption");
  const wzx_file = wzx_input.files && wzx_input.files[0];

  if (wzx_visionObjectUrl) {
    URL.revokeObjectURL(wzx_visionObjectUrl);
    wzx_visionObjectUrl = "";
  }

  if (!wzx_file) {
    wzx_image.hidden = true;
    wzx_image.removeAttribute("src");
    wzx_caption.textContent = "还没有选择图片";
    return;
  }

  wzx_visionObjectUrl = URL.createObjectURL(wzx_file);
  wzx_image.src = wzx_visionObjectUrl;
  wzx_image.hidden = false;
  wzx_caption.textContent = wzx_file.name + " · " + Math.max(1, Math.round(wzx_file.size / 1024)) + " KB";
}

// 功能：把选中的图片上传给 /api/vision 并展示描述
async function wzx_visionRecognize() {
  const wzx_input = document.getElementById("wzx_visionFile");
  const wzx_result = document.getElementById("wzx_visionResult");
  const wzx_meta = document.getElementById("wzx_visionMeta");
  const wzx_file = wzx_input.files && wzx_input.files[0];

  if (wzx_visionBusy) {
    return;
  }
  if (!wzx_file) {
    wzx_result.className = "wzx_result wzx_result--err";
    wzx_result.textContent = "请先选择一张图片。";
    return;
  }
  if (wzx_file.size > 10 * 1024 * 1024) {
    wzx_result.className = "wzx_result wzx_result--err";
    wzx_result.textContent = "图片超过 10MB，请压缩后再上传。";
    return;
  }

  const wzx_form = new FormData();
  wzx_form.append("image", wzx_file);

  wzx_visionSetBusy(true, "正在上传并识别，视觉模型通常需要几秒…");
  wzx_result.className = "wzx_result wzx_result--idle";
  wzx_result.textContent = "识别中，请稍候…";
  wzx_meta.textContent = "";

  try {
    const wzx_response = await fetch("/api/vision", { method: "POST", body: wzx_form });
    const wzx_json = await wzx_response.json();
    console.log("图像识别返回：", wzx_json);

    if (wzx_json.code !== 0) {
      wzx_result.className = "wzx_result wzx_result--err";
      wzx_result.textContent = "识别失败：" + wzx_json.msg;
      wzx_visionSetBusy(false, "识别失败");
      return;
    }

    const wzx_data = wzx_json.data || {};
    wzx_result.className = "wzx_result wzx_result--ok";
    wzx_result.textContent = wzx_data.description || "没有返回描述";

    const wzx_usage = wzx_data.usage || {};
    wzx_meta.textContent = "模型：" + (wzx_data.model || "未知") +
      " · 图片：" + (wzx_data.fileName || "") +
      (wzx_usage.total_tokens ? " · tokens：" + wzx_usage.total_tokens : "");
    wzx_visionSetBusy(false, "识别完成");
  } catch (wzx_error) {
    console.error("图像识别失败：", wzx_error);
    wzx_result.className = "wzx_result wzx_result--err";
    wzx_result.textContent = "网络异常，请确认后端已启动（http://localhost:8207）";
    wzx_visionSetBusy(false, "网络异常");
  }
}

// 功能：绑定图片选择与识别按钮
function wzx_visionBind() {
  document.getElementById("wzx_visionFile").addEventListener("change", wzx_visionPreview);
  document.getElementById("wzx_visionBtn").addEventListener("click", wzx_visionRecognize);
}

wzx_visionBind();
