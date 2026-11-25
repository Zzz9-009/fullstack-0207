/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-25 | 大模型：DeepSeek-V4.1-Flash
 * 功能：知识库本地存储，用 backend/data/kb.json 保存文件与切块，不依赖 MySQL
 */
const fs = require("fs");
const path = require("path");

const WZX_DATA_DIR = path.join(__dirname, "..", "data");
const WZX_KB_FILE = path.join(WZX_DATA_DIR, "kb.json");
const WZX_UPLOAD_DIR = path.join(WZX_DATA_DIR, "kb-uploads");
const WZX_CHUNK_SIZE = 420;
const WZX_CHUNK_OVERLAP = 60;

// 功能：确保数据目录存在，首次运行时自动创建
function wzx_ensureDirs() {
  if (!fs.existsSync(WZX_DATA_DIR)) {
    fs.mkdirSync(WZX_DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(WZX_UPLOAD_DIR)) {
    fs.mkdirSync(WZX_UPLOAD_DIR, { recursive: true });
  }
}

// 功能：读取知识库 JSON，文件不存在或损坏时返回空结构，避免接口 500
function wzx_readStore() {
  wzx_ensureDirs();
  if (!fs.existsSync(WZX_KB_FILE)) {
    return { files: [] };
  }
  try {
    const wzx_raw = fs.readFileSync(WZX_KB_FILE, "utf8");
    const wzx_json = JSON.parse(wzx_raw);
    if (!wzx_json || !Array.isArray(wzx_json.files)) {
      return { files: [] };
    }
    return wzx_json;
  } catch (wzx_error) {
    console.error("[kb] kb.json 读取失败，按空知识库处理：", wzx_error.message);
    return { files: [] };
  }
}

// 功能：把知识库结构写回 kb.json，先写临时文件再重命名，降低写坏概率
function wzx_writeStore(wzx_store) {
  wzx_ensureDirs();
  const wzx_temp = WZX_KB_FILE + ".tmp";
  fs.writeFileSync(wzx_temp, JSON.stringify(wzx_store, null, 2), "utf8");
  fs.renameSync(wzx_temp, WZX_KB_FILE);
}

// 功能：按段落把长文本切成带重叠的小块，方便检索时只喂相关片段
function wzx_chunkText(wzx_text) {
  const wzx_paras = String(wzx_text || "")
    .split(/\n+/)
    .map(function (wzx_line) {
      return wzx_line.trim();
    })
    .filter(Boolean);

  const wzx_chunks = [];
  let wzx_buffer = "";

  function wzx_push(wzx_value) {
    const wzx_clean = wzx_value.trim();
    if (wzx_clean) {
      wzx_chunks.push(wzx_clean);
    }
  }

  wzx_paras.forEach(function (wzx_para) {
    if (wzx_para.length > WZX_CHUNK_SIZE) {
      wzx_push(wzx_buffer);
      wzx_buffer = "";
      const wzx_step = WZX_CHUNK_SIZE - WZX_CHUNK_OVERLAP;
      for (let wzx_i = 0; wzx_i < wzx_para.length; wzx_i += wzx_step) {
        wzx_push(wzx_para.slice(wzx_i, wzx_i + WZX_CHUNK_SIZE));
      }
      return;
    }

    const wzx_next = wzx_buffer ? wzx_buffer + "\n" + wzx_para : wzx_para;
    if (wzx_next.length > WZX_CHUNK_SIZE) {
      wzx_push(wzx_buffer);
      const wzx_tail = wzx_buffer.slice(Math.max(0, wzx_buffer.length - WZX_CHUNK_OVERLAP));
      wzx_buffer = wzx_tail + "\n" + wzx_para;
    } else {
      wzx_buffer = wzx_next;
    }
  });

  wzx_push(wzx_buffer);
  return wzx_chunks;
}

// 功能：生成短随机 id，供删除接口定位文件
function wzx_newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// 功能：把上传的原始文件落盘到 data/kb-uploads，返回保存后的文件名
function wzx_saveUpload(wzx_buffer, wzx_originalName) {
  wzx_ensureDirs();
  const wzx_safe = String(wzx_originalName || "file")
    .replace(/[\\/:*?"<>|\s]+/g, "_")
    .slice(-80);
  const wzx_storedName = Date.now().toString(36) + "-" + wzx_safe;
  fs.writeFileSync(path.join(WZX_UPLOAD_DIR, wzx_storedName), wzx_buffer);
  return wzx_storedName;
}

// 功能：列出知识库文件（不含切块正文），供前端表格展示
function wzx_listFiles() {
  return wzx_readStore().files.map(function (wzx_file) {
    return {
      id: wzx_file.id,
      name: wzx_file.name,
      ext: wzx_file.ext,
      size: wzx_file.size,
      chars: wzx_file.chars,
      chunkCount: wzx_file.chunks.length,
      note: wzx_file.note || "",
      createdAt: wzx_file.createdAt
    };
  });
}

// 功能：新增一个知识库文件，切块后写入 kb.json 并返回摘要
function wzx_addFile(wzx_input) {
  const wzx_store = wzx_readStore();
  const wzx_chunks = wzx_chunkText(wzx_input.text);
  if (!wzx_chunks.length) {
    throw new Error("解析结果为空，没有可入库的文本");
  }

  const wzx_record = {
    id: wzx_newId(),
    name: wzx_input.name,
    ext: wzx_input.ext,
    size: wzx_input.size,
    chars: wzx_input.text.length,
    note: wzx_input.note || "",
    storedName: wzx_input.storedName || "",
    createdAt: new Date().toISOString(),
    chunks: wzx_chunks
  };

  wzx_store.files.unshift(wzx_record);
  wzx_writeStore(wzx_store);

  return {
    id: wzx_record.id,
    name: wzx_record.name,
    ext: wzx_record.ext,
    size: wzx_record.size,
    chars: wzx_record.chars,
    chunkCount: wzx_chunks.length,
    note: wzx_record.note,
    createdAt: wzx_record.createdAt
  };
}

// 功能：删除指定知识库文件，同时清掉磁盘上的原始文件
function wzx_removeFile(wzx_id) {
  const wzx_store = wzx_readStore();
  const wzx_index = wzx_store.files.findIndex(function (wzx_file) {
    return wzx_file.id === wzx_id;
  });
  if (wzx_index === -1) {
    return null;
  }

  const wzx_removed = wzx_store.files.splice(wzx_index, 1)[0];
  wzx_writeStore(wzx_store);

  if (wzx_removed.storedName) {
    const wzx_path = path.join(WZX_UPLOAD_DIR, wzx_removed.storedName);
    fs.promises.unlink(wzx_path).catch(function () {});
  }
  return { id: wzx_removed.id, name: wzx_removed.name };
}

// 功能：把所有文件的切块摊平，附带文件名与序号，供检索打分
function wzx_allChunks() {
  const wzx_store = wzx_readStore();
  const wzx_list = [];
  wzx_store.files.forEach(function (wzx_file) {
    wzx_file.chunks.forEach(function (wzx_text, wzx_index) {
      wzx_list.push({
        fileId: wzx_file.id,
        fileName: wzx_file.name,
        index: wzx_index + 1,
        text: wzx_text
      });
    });
  });
  return wzx_list;
}

module.exports = {
  wzx_listFiles,
  wzx_addFile,
  wzx_removeFile,
  wzx_allChunks,
  wzx_saveUpload,
  wzx_chunkText
};
