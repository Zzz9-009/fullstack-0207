/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-20 | 大模型：DeepSeek-V4.1-Flash
 * 功能：图文表 wzx_gallery 的数据访问
 */
const { wzx_pool } = require("../config/db");

// 功能：按创建时间倒序查询全部图文数据
async function wzx_findAllGallery() {
  const [wzx_rows] = await wzx_pool.query(
    "SELECT id, title, description, img_url, category, create_time " +
    "FROM wzx_gallery ORDER BY create_time DESC, id DESC"
  );
  return wzx_rows;
}

module.exports = { wzx_findAllGallery };
