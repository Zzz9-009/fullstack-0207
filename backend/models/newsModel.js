/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-20 | 大模型：DeepSeek-V4.1-Flash
 * 功能：科技新闻表 wzx_news 的数据访问
 */
const { wzx_pool } = require("../config/db");

// 功能：按发布时间倒序查询全部新闻
async function wzx_findAllNews() {
  const [wzx_rows] = await wzx_pool.query(
    "SELECT id, title, summary, content, source, publish_time, cover_img " +
    "FROM wzx_news ORDER BY publish_time DESC, id DESC"
  );
  return wzx_rows;
}

module.exports = { wzx_findAllNews };
