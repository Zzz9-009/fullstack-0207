/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-25 | 大模型：DeepSeek-V4.1-Flash
 * 功能：轻量检索，中文二元组 + 英文单词分词，按词频打分选出最相关的知识库片段
 */

// 常见虚词，参与打分只会带来噪声
const WZX_STOP = ["的", "了", "是", "在", "和", "有", "我", "你", "他", "她", "它", "这", "那", "吗", "呢", "啊", "呀", "吧", "们", "请", "问"];

// 功能：把句子切成检索 token：英文单词取整词，中文取单字 + 相邻二元组
function wzx_tokens(wzx_text) {
  const wzx_source = String(wzx_text || "").toLowerCase();
  const wzx_set = new Set();

  const wzx_ascii = /[a-z0-9][a-z0-9._-]*/g;
  let wzx_match = wzx_ascii.exec(wzx_source);
  while (wzx_match) {
    if (wzx_match[0].length >= 2) {
      wzx_set.add(wzx_match[0]);
    }
    wzx_match = wzx_ascii.exec(wzx_source);
  }

  const wzx_cjk = /[\u4e00-\u9fa5]+/g;
  wzx_match = wzx_cjk.exec(wzx_source);
  while (wzx_match) {
    const wzx_run = wzx_match[0];
    for (let wzx_i = 0; wzx_i < wzx_run.length; wzx_i += 1) {
      const wzx_char = wzx_run[wzx_i];
      if (WZX_STOP.indexOf(wzx_char) === -1) {
        wzx_set.add(wzx_char);
      }
      if (wzx_i + 1 < wzx_run.length) {
        wzx_set.add(wzx_run.slice(wzx_i, wzx_i + 2));
      }
    }
    wzx_match = wzx_cjk.exec(wzx_source);
  }

  return Array.from(wzx_set);
}

// 功能：统计 token 在文本中出现的次数
function wzx_count(wzx_haystack, wzx_needle) {
  let wzx_total = 0;
  let wzx_pos = wzx_haystack.indexOf(wzx_needle);
  while (wzx_pos !== -1) {
    wzx_total += 1;
    wzx_pos = wzx_haystack.indexOf(wzx_needle, wzx_pos + wzx_needle.length);
  }
  return wzx_total;
}

// 功能：对全部切块打分并返回前 topK 个命中片段
function wzx_search(wzx_question, wzx_chunks, wzx_topK) {
  const wzx_query = wzx_tokens(wzx_question);
  if (!wzx_query.length || !wzx_chunks.length) {
    return [];
  }

  const wzx_scored = wzx_chunks.map(function (wzx_chunk) {
    const wzx_lower = wzx_chunk.text.toLowerCase();
    let wzx_score = 0;
    wzx_query.forEach(function (wzx_token) {
      const wzx_hit = wzx_count(wzx_lower, wzx_token);
      if (wzx_hit > 0) {
        // 长词（二元组/英文单词）权重更高，词频做对数压缩避免重复刷分
        const wzx_weight = wzx_token.length > 1 ? 1.6 : 0.6;
        wzx_score += (1 + Math.log(wzx_hit)) * wzx_weight;
      }
    });
    return {
      fileId: wzx_chunk.fileId,
      fileName: wzx_chunk.fileName,
      index: wzx_chunk.index,
      text: wzx_chunk.text,
      score: wzx_score
    };
  });

  return wzx_scored
    .filter(function (wzx_item) {
      return wzx_item.score > 0;
    })
    .sort(function (wzx_a, wzx_b) {
      return wzx_b.score - wzx_a.score;
    })
    .slice(0, wzx_topK);
}

module.exports = { wzx_tokens, wzx_search };
