CREATE DATABASE IF NOT EXISTS wzx_fullstack DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE wzx_fullstack;

DROP TABLE IF EXISTS wzx_news;
CREATE TABLE wzx_news (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  title VARCHAR(200) NOT NULL COMMENT '新闻标题',
  summary VARCHAR(500) NOT NULL DEFAULT '' COMMENT '摘要',
  content TEXT COMMENT '正文',
  source VARCHAR(80) NOT NULL DEFAULT '' COMMENT '来源',
  publish_time DATETIME NOT NULL COMMENT '发布时间',
  cover_img VARCHAR(500) NOT NULL DEFAULT '' COMMENT '封面图地址',
  PRIMARY KEY (id),
  KEY idx_publish_time (publish_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='科技新闻表';

INSERT INTO wzx_news (title, summary, content, source, publish_time, cover_img) VALUES
('国产大模型推理框架开源，单卡吞吐提升四成', '新框架针对长上下文场景重写了注意力计算，单卡吞吐比上一版提升约 40%，已在社区开放下载。', '该框架由国内团队开源，主打长上下文推理优化。实测在 32K 上下文下，单卡吞吐提升约 40%，显存占用下降 18%。项目采用 Apache-2.0 协议，提供与主流推理服务兼容的接口层。', '机器之心', '2026-11-19 09:30:00', ''),
('先进封装产能扩张，AI 芯片交付周期缩短至 12 周', '多家封测厂新增 2.5D 封装产线，AI 加速卡的平均交付周期从 20 周回落到 12 周。', '随着新产线投产，先进封装产能紧张的局面有所缓解。业内预计明年一季度产能利用率将维持在 85% 以上，交付周期有望进一步缩短。', '半导体观察', '2026-11-18 16:10:00', ''),
('全固态电池中试线投产，能量密度达到 400Wh/kg', '首条硫化物全固态电池中试线进入量产验证，单体能量密度达到 400Wh/kg，循环 800 次容量保持率 92%。', '中试线设计年产能 2GWh，当前良率约 76%。团队表示下一步将重点解决界面阻抗与低温性能问题，计划 2028 年装车验证。', '新能源周刊', '2026-11-17 11:05:00', ''),
('量子纠错新方案：逻辑比特错误率降至千分之一', '研究团队采用表面码与实时反馈结合的方案，将逻辑比特错误率降低到 10⁻³ 量级，为容错量子计算提供新路径。', '论文预印本显示，该方案在 49 个物理比特上实现了逻辑比特的错误率抑制，纠错周期缩短至 1.2 微秒。', '科学网', '2026-11-16 08:40:00', ''),
('首个城市级车路云一体化项目通过验收', '项目覆盖 320 个路口，路侧感知数据与云端调度打通，典型场景通行效率提升 22%。', '验收报告显示，项目在早晚高峰时段的平均通行时间下降 18%，事故预警平均提前 2.4 秒。', '智能交通报', '2026-11-15 19:25:00', ''),
('低轨卫星互联网完成组网测试，端到端时延低于 40ms', '一期组网卫星完成在轨测试，端到端时延稳定在 38ms 左右，支持偏远地区宽带接入。', '测试覆盖海洋、山地与极地三类场景，下行峰值速率达到 180Mbps，切换过程中的丢包率低于 0.3%。', '通信世界', '2026-11-14 10:15:00', ''),
('可降解电子皮肤实现量产，成本下降六成', '新工艺把柔性基底与电极一体化成型，单件成本较实验室阶段下降约 60%，已具备月产十万件能力。', '该电子皮肤可贴合关节曲面，拉伸 50% 后仍保持稳定信号，适用于康复监测与人机交互。', '生物医学工程', '2026-11-13 14:50:00', ''),
('开源机器人操作系统发布 2.0，支持多机协同', '2.0 版本重构了通信层，加入多机协同调度与可视化调试面板，首周下载量突破 5 万次。', '新版本提供统一的设备抽象层，支持异构机器人接入；官方同时发布三套仿真场景与迁移指南。', '开源中国', '2026-11-12 09:00:00', '');

DROP TABLE IF EXISTS wzx_gallery;
CREATE TABLE wzx_gallery (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  title VARCHAR(200) NOT NULL COMMENT '标题',
  description VARCHAR(500) NOT NULL DEFAULT '' COMMENT '描述',
  img_url VARCHAR(500) NOT NULL DEFAULT '' COMMENT '图片地址',
  category VARCHAR(50) NOT NULL DEFAULT '' COMMENT '分类',
  create_time DATETIME NOT NULL COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图文列表';

INSERT INTO wzx_gallery (title, description, img_url, category, create_time) VALUES
('光之穹顶', '环形灯阵在穹顶投下缓慢流动的光带，观众抬头即可看到光的呼吸。', '/images/gallery-1.svg', '建筑', '2026-11-19 10:00:00'),
('山海之间', '潮间带的纹理被抽象成层叠的山形，颜色随视角移动而变化。', '/images/gallery-2.svg', '自然', '2026-11-18 10:30:00'),
('城市脉冲', '把夜间车流的轨迹压缩成一条条发光线，构成城市的脉搏。', '/images/gallery-3.svg', '城市', '2026-11-17 11:15:00'),
('液态金属', '表面张力与反光共同塑造的形态，边界永远在移动。', '/images/gallery-4.svg', '抽象', '2026-11-16 14:20:00'),
('悬浮台阶', '没有支撑的台阶靠光影暗示重量，观众在视觉上被“抬”起来。', '/images/gallery-5.svg', '建筑', '2026-11-15 09:45:00'),
('极夜微光', '漫长的黑之后，地平线只留下一线青色。', '/images/gallery-6.svg', '自然', '2026-11-14 16:05:00'),
('网格矩阵', '重复的网格在透视中逐渐失序，形成节奏感。', '/images/gallery-7.svg', '抽象', '2026-11-13 13:30:00'),
('天际线', '把城市轮廓简化成剪影，只保留最锋利的那几条线。', '/images/gallery-8.svg', '城市', '2026-11-12 18:40:00');

SELECT COUNT(*) AS news_total FROM wzx_news;
SELECT COUNT(*) AS gallery_total FROM wzx_gallery;
