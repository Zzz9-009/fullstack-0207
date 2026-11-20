/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-20 | 大模型：DeepSeek-V4.1-Flash
 * 功能：统一 JSON 响应格式 { code, msg, data }
 */

// 功能：返回成功响应，code 固定为 0
function wzx_ok(wzx_res, wzx_data, wzx_msg) {
  wzx_res.json({ code: 0, msg: wzx_msg || "成功", data: wzx_data === undefined ? null : wzx_data });
}

// 功能：返回失败响应，code 非 0，并附带错误信息
function wzx_fail(wzx_res, wzx_msg, wzx_code) {
  wzx_res.json({ code: wzx_code || 1, msg: wzx_msg || "失败", data: null });
}

module.exports = { wzx_ok, wzx_fail };
