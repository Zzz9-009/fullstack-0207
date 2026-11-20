/*
  姓名：王振旭 | 学号：24002120207 | 时间：2026-11-20 | 大模型：DeepSeek-V4.1-Flash
  功能：数据库连接测试页交互，提交登录凭据并展示后端返回结果
*/

// 功能：切换结果框的状态样式与文字
function wzx_showResult(wzx_text, wzx_type) {
  const wzx_box = document.getElementById("wzx_result");
  wzx_box.textContent = wzx_text;
  wzx_box.className = "wzx_result wzx_result--" + wzx_type;
}

// 功能：提交表单，调用 /api/db-test 并根据返回码渲染成功或失败
async function wzx_submit(wzx_event) {
  wzx_event.preventDefault();

  const wzx_user = document.getElementById("wzx_user").value.trim();
  const wzx_password = document.getElementById("wzx_password").value;
  const wzx_button = document.getElementById("wzx_submit");

  wzx_button.disabled = true;
  wzx_showResult("正在连接数据库……", "idle");

  try {
    const wzx_res = await fetch("/api/db-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: wzx_user, password: wzx_password })
    });
    const wzx_json = await wzx_res.json();
    console.log("数据库测试返回：", wzx_json);

    if (wzx_json.code === 0) {
      const wzx_data = wzx_json.data || {};
      wzx_showResult(
        "连接成功\nMySQL 版本：" + (wzx_data.version || "未知") + "\n当前数据库：" + (wzx_data.database || "未选择"),
        "ok"
      );
    } else {
      console.error("数据库测试失败：", wzx_json.msg);
      wzx_showResult("连接失败\n" + wzx_json.msg, "err");
    }
  } catch (wzx_error) {
    console.error("请求失败：", wzx_error);
    wzx_showResult("请求失败，请确认后端已启动（http://localhost:8207）\n" + wzx_error.message, "err");
  } finally {
    wzx_button.disabled = false;
  }
}

document.getElementById("wzx_form").addEventListener("submit", wzx_submit);
