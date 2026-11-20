/*
  姓名：王振旭 | 学号：24002120207 | 时间：2026-11-20 | 大模型：DeepSeek-V4.1-Flash
  功能：新闻列表页交互，拉取 /api/news 并渲染列表
*/

// 功能：把接口返回的时间字符串格式化为“年-月-日 时:分”
function wzx_formatTime(wzx_value) {
  if (!wzx_value) {
    return "时间未知";
  }
  const wzx_date = new Date(wzx_value);
  if (Number.isNaN(wzx_date.getTime())) {
    return String(wzx_value);
  }
  const wzx_pad = function (wzx_num) {
    return wzx_num < 10 ? "0" + wzx_num : String(wzx_num);
  };
  return wzx_date.getFullYear() + "-" + wzx_pad(wzx_date.getMonth() + 1) + "-" + wzx_pad(wzx_date.getDate()) +
    " " + wzx_pad(wzx_date.getHours()) + ":" + wzx_pad(wzx_date.getMinutes());
}

// 功能：根据新闻数组生成列表项并插入页面
function wzx_render(wzx_list) {
  const wzx_ul = document.getElementById("wzx_list");
  wzx_ul.innerHTML = "";

  wzx_list.forEach(function (wzx_item) {
    const wzx_li = document.createElement("li");
    wzx_li.className = "wzx_news-item";

    const wzx_meta = document.createElement("div");
    wzx_meta.className = "wzx_news-meta";

    const wzx_source = document.createElement("span");
    wzx_source.className = "wzx_badge";
    wzx_source.textContent = wzx_item.source || "未知来源";

    const wzx_time = document.createElement("span");
    wzx_time.textContent = wzx_formatTime(wzx_item.publish_time);

    wzx_meta.appendChild(wzx_source);
    wzx_meta.appendChild(wzx_time);

    const wzx_h3 = document.createElement("h3");
    wzx_h3.textContent = wzx_item.title || "（无标题）";

    const wzx_p = document.createElement("p");
    wzx_p.textContent = wzx_item.summary || wzx_item.content || "";

    wzx_li.appendChild(wzx_meta);
    wzx_li.appendChild(wzx_h3);
    wzx_li.appendChild(wzx_p);
    wzx_ul.appendChild(wzx_li);
  });
}

// 功能：请求新闻接口，处理成功、业务失败与网络异常三种情况
async function wzx_load() {
  const wzx_state = document.getElementById("wzx_state");
  document.getElementById("wzx_apiUrl").textContent = location.origin + "/api/news";

  try {
    const wzx_res = await fetch("/api/news");
    const wzx_json = await wzx_res.json();
    console.log("新闻接口返回：", wzx_json);

    if (wzx_json.code !== 0) {
      wzx_state.textContent = "读取失败：" + wzx_json.msg;
      wzx_state.style.color = "#ff8f6b";
      return;
    }

    const wzx_list = (wzx_json.data && wzx_json.data.list) || [];
    wzx_render(wzx_list);
    wzx_state.textContent = "共 " + wzx_list.length + " 条新闻 · 数据来自数据库表 wzx_news";
    wzx_state.style.color = "";
  } catch (wzx_error) {
    console.error("新闻请求失败：", wzx_error);
    wzx_state.textContent = "请求失败，请确认后端已启动（http://localhost:8207）";
    wzx_state.style.color = "#ff8f6b";
  }
}

wzx_load();
