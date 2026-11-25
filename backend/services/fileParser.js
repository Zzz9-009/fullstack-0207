/**
 * 姓名：王振旭 | 学号：24002120207 | 时间：2026-11-25 | 大模型：DeepSeek-V4.1-Flash
 * 功能：知识库文件解析，把 txt/md/doc/docx/ppt/pptx/pdf 统一转成纯文本
 */
const path = require("path");
const mammoth = require("mammoth");
const JSZip = require("jszip");
const WordExtractor = require("word-extractor");
const iconv = require("iconv-lite");
const { PDFParse } = require("pdf-parse");

// 允许上传的知识库文件扩展名
const WZX_ALLOWED_EXT = [".txt", ".md", ".csv", ".doc", ".docx", ".ppt", ".pptx", ".pdf"];
// 纯文本类文件直接按文本读取
const WZX_TEXT_EXT = [".txt", ".md", ".csv"];

// 功能：取小写扩展名，统一后面按扩展名分发解析
function wzx_extname(wzx_name) {
  return path.extname(String(wzx_name || "")).toLowerCase();
}

// 功能：判断文件是否属于知识库支持的类型
function wzx_isSupported(wzx_name) {
  return WZX_ALLOWED_EXT.indexOf(wzx_extname(wzx_name)) !== -1;
}

// 功能：修正 multipart 文件名乱码（busboy 按 latin1 解码，中文名会变成乱码）
function wzx_fixFilename(wzx_name) {
  const wzx_text = String(wzx_name || "");
  if (!wzx_text) {
    return "";
  }
  // 已经包含 latin1 以外的字符，说明本来就是正常字符串，直接返回
  if (/[^\u0000-\u00ff]/.test(wzx_text)) {
    return wzx_text;
  }
  const wzx_decoded = Buffer.from(wzx_text, "latin1").toString("utf8");
  return wzx_decoded.indexOf("\uFFFD") === -1 ? wzx_decoded : wzx_text;
}

// 功能：还原 XML 里的实体字符，避免 pptx 文本出现 &amp; 之类的残留
function wzx_decodeXml(wzx_text) {
  return String(wzx_text)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, function (wzx_m, wzx_code) {
      return String.fromCodePoint(Number(wzx_code));
    })
    .replace(/&amp;/g, "&");
}

// 功能：统一换行、压缩空白行、去掉控制字符，保证入库文本干净
function wzx_normalize(wzx_text) {
  return String(wzx_text || "")
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map(function (wzx_line) {
      return wzx_line.replace(/[ \t]+/g, " ").trim();
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// 功能：读取 txt/md/csv，UTF-8 乱码比例过高时自动按 GBK 再解一次
function wzx_readText(wzx_buffer) {
  let wzx_text = wzx_buffer.toString("utf8").replace(/^\uFEFF/, "");
  const wzx_bad = (wzx_text.match(/\uFFFD/g) || []).length;
  if (wzx_bad > 0 && wzx_bad / wzx_text.length > 0.02) {
    wzx_text = iconv.decode(wzx_buffer, "gbk");
  }
  return { text: wzx_text, note: "" };
}

// 功能：用 mammoth 提取 docx 正文
async function wzx_readDocx(wzx_buffer) {
  const wzx_result = await mammoth.extractRawText({ buffer: wzx_buffer });
  return { text: wzx_result.value || "", note: "" };
}

// 功能：用 word-extractor 提取旧版 doc 正文
async function wzx_readDoc(wzx_buffer) {
  const wzx_extractor = new WordExtractor();
  const wzx_doc = await wzx_extractor.extract(wzx_buffer);
  return {
    text: wzx_doc.getBody() || "",
    note: "doc 为旧版二进制格式，正文已尽力提取，图文混排内容可能有缺失，建议另存为 docx"
  };
}

// 功能：解压 pptx 后逐页抽取 <a:t> 文本，按“第 N 页”分段
async function wzx_readPptx(wzx_buffer) {
  const wzx_zip = await JSZip.loadAsync(wzx_buffer);
  const wzx_slides = Object.keys(wzx_zip.files)
    .filter(function (wzx_name) {
      return /^ppt\/slides\/slide\d+\.xml$/.test(wzx_name);
    })
    .sort(function (wzx_a, wzx_b) {
      const wzx_na = Number(wzx_a.match(/slide(\d+)\.xml$/)[1]);
      const wzx_nb = Number(wzx_b.match(/slide(\d+)\.xml$/)[1]);
      return wzx_na - wzx_nb;
    });

  if (!wzx_slides.length) {
    throw new Error("没有在 pptx 中找到幻灯片内容");
  }

  const wzx_blocks = [];
  for (let wzx_i = 0; wzx_i < wzx_slides.length; wzx_i += 1) {
    const wzx_xml = await wzx_zip.files[wzx_slides[wzx_i]].async("string");
    const wzx_pieces = [];
    const wzx_re = /<a:t[^>]*>([\s\S]*?)<\/a:t>/g;
    let wzx_match = wzx_re.exec(wzx_xml);
    while (wzx_match) {
      const wzx_piece = wzx_decodeXml(wzx_match[1]).trim();
      if (wzx_piece) {
        wzx_pieces.push(wzx_piece);
      }
      wzx_match = wzx_re.exec(wzx_xml);
    }
    if (wzx_pieces.length) {
      wzx_blocks.push("【第 " + (wzx_i + 1) + " 页】\n" + wzx_pieces.join("\n"));
    }
  }
  return { text: wzx_blocks.join("\n\n"), note: "" };
}

// 功能：旧版 ppt 没有现成解析库，按 UTF-16LE 扫描可读字符并去重（尽力提取）
function wzx_readPptLegacy(wzx_buffer) {
  const wzx_found = [];
  const wzx_re = /[\u4e00-\u9fa5A-Za-z0-9][\u4e00-\u9fa5A-Za-z0-9，。、；：！？“”‘’（）《》%+\-_.·\s]{3,}/g;
  // 旧版 Office 文本多以 UTF-16LE 存放，偏移 0 和 1 各扫一遍防止错位
  for (let wzx_shift = 0; wzx_shift < 2; wzx_shift += 1) {
    const wzx_raw = wzx_buffer.slice(wzx_shift).toString("utf16le");
    let wzx_match = wzx_re.exec(wzx_raw);
    while (wzx_match) {
      const wzx_seg = wzx_match[0].replace(/\s+/g, " ").trim();
      const wzx_cjk = (wzx_seg.match(/[\u4e00-\u9fa5]/g) || []).length;
      if (wzx_cjk >= 2 || wzx_seg.length >= 12) {
        wzx_found.push(wzx_seg);
      }
      wzx_match = wzx_re.exec(wzx_raw);
    }
  }
  const wzx_seen = {};
  const wzx_lines = wzx_found.filter(function (wzx_item) {
    if (wzx_seen[wzx_item]) {
      return false;
    }
    wzx_seen[wzx_item] = true;
    return true;
  });
  return {
    text: wzx_lines.join("\n"),
    note: "ppt 为旧版二进制格式，已按文本流尽力提取，版式与图表无法还原，建议另存为 pptx"
  };
}

// 功能：用 pdf-parse 提取 PDF 文字层，扫描版 PDF 会提示没有可读文字
async function wzx_readPdf(wzx_buffer) {
  const wzx_parser = new PDFParse({ data: new Uint8Array(wzx_buffer) });
  try {
    const wzx_result = await wzx_parser.getText({ pageJoiner: "" });
    return { text: wzx_result.text || "", note: "" };
  } finally {
    await wzx_parser.destroy().catch(function () {});
  }
}

// 功能：解析入口，按扩展名分发到对应解析器并返回纯文本与提示
async function wzx_parseFile(wzx_file) {
  const wzx_ext = wzx_extname(wzx_file.originalname);
  if (WZX_ALLOWED_EXT.indexOf(wzx_ext) === -1) {
    throw new Error("不支持的文件类型：" + (wzx_ext || "未知"));
  }

  let wzx_result;
  if (WZX_TEXT_EXT.indexOf(wzx_ext) !== -1) {
    wzx_result = wzx_readText(wzx_file.buffer);
  } else if (wzx_ext === ".docx") {
    wzx_result = await wzx_readDocx(wzx_file.buffer);
  } else if (wzx_ext === ".doc") {
    wzx_result = await wzx_readDoc(wzx_file.buffer);
  } else if (wzx_ext === ".pptx") {
    wzx_result = await wzx_readPptx(wzx_file.buffer);
  } else if (wzx_ext === ".ppt") {
    wzx_result = wzx_readPptLegacy(wzx_file.buffer);
  } else {
    wzx_result = await wzx_readPdf(wzx_file.buffer);
  }

  const wzx_text = wzx_normalize(wzx_result.text);
  if (!wzx_text) {
    throw new Error(
      "没有从文件中提取到可读文字" +
        (wzx_ext === ".pdf" ? "，扫描版 PDF 需要先做 OCR" : "，请检查文件是否损坏或另存为 docx/pptx")
    );
  }

  return {
    text: wzx_text,
    ext: wzx_ext,
    note: wzx_result.note || ""
  };
}

module.exports = {
  wzx_extname,
  wzx_isSupported,
  wzx_fixFilename,
  wzx_parseFile,
  wzx_normalize
};
