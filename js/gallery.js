/*
  姓名：王振旭 | 学号：24002120207 | 时间：2026-11-20 | 大模型：DeepSeek-V4.1-Flash
  功能：图文列表页交互，拉取 /api/gallery 并渲染上图下文卡片
*/

// 功能：生成单张图文卡片，图片失败时替换为占位色块
function wzx_createCard(wzx_item) {
  const wzx_box = document.createElement("article");
  wzx_box.className = "wzx_photo";

  const wzx_img = document.createElement("img");
  wzx_img.className = "wzx_photo-img";
  wzx_img.src = wzx_item.img_url || "";
  wzx_img.alt = wzx_item.title || "图文卡片";
  wzx_img.loading = "lazy";

  // 功能：图片加载失败时移除 img，换成纯 CSS 渐变占位块
  wzx_img.onerror = function () {
    const wzx_ph = document.createElement("div");
    wzx_ph.className = "wzx_photo-img wzx_photo-img--fallback";
    wzx_ph.textContent = "图片加载失败";
    wzx_img.replaceWith(wzx_ph);
  };

  const wzx_body = document.createElement("div");
  wzx_body.className = "wzx_photo-body";

  const wzx_cat = document.createElement("span");
  wzx_cat.className = "wzx_photo-cat";
  wzx_cat.textContent = wzx_item.category || "未分类";

  const wzx_h3 = document.createElement("h3");
  wzx_h3.textContent = wzx_item.title || "（无标题）";

  const wzx_p = document.createElement("p");
  wzx_p.textContent = wzx_item.description || "";

  wzx_body.appendChild(wzx_cat);
  wzx_body.appendChild(wzx_h3);
  wzx_body.appendChild(wzx_p);

  wzx_box.appendChild(wzx_img);
  wzx_box.appendChild(wzx_body);
  return wzx_box;
}

// 功能：请求图文接口并渲染全部卡片
async function wzx_load() {
  const wzx_state = document.getElementById("wzx_state");
  document.getElementById("wzx_apiUrl").textContent = location.origin + "/api/gallery";

  try {
    const wzx_res = await fetch("/api/gallery");
    const wzx_json = await wzx_res.json();
    console.log("图文接口返回：", wzx_json);

    if (wzx_json.code !== 0) {
      wzx_state.textContent = "读取失败：" + wzx_json.msg;
      wzx_state.style.color = "#ff8f6b";
      return;
    }

    const wzx_list = (wzx_json.data && wzx_json.data.list) || [];
    const wzx_wrap = document.getElementById("wzx_gallery");
    wzx_wrap.innerHTML = "";
    wzx_list.forEach(function (wzx_item) {
      wzx_wrap.appendChild(wzx_createCard(wzx_item));
    });

    wzx_state.textContent = "共 " + wzx_list.length + " 条图文 · 数据来自数据库表 wzx_gallery";
    wzx_state.style.color = "";
  } catch (wzx_error) {
    console.error("图文请求失败：", wzx_error);
    wzx_state.textContent = "请求失败，请确认后端已启动（http://localhost:8207）";
    wzx_state.style.color = "#ff8f6b";
  }
}

wzx_load();
