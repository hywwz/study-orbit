# RepoLens：Long Code Arena 数据与评测说明

核查日期：2026-11-17。仅更新 RepoLens 课程，不迁移浏览器学习记录。

## 适用范围

Long Code Arena 包含六类长上下文代码任务：库调用代码生成、CI构建修复、项目级补全、提交信息生成、Bug定位、模块摘要。RepoLens 使用 **Bug Localization**：输入 GitHub Issue 与修复前仓库，输出需要改动的文件。它适合文件级定位；不自带函数级 gold，也不提供 SWE-bench 式补丁执行通过率。

数据版本：`f2bb26a1c3320ccc1d7b02d2630077ff327a80f6`。已核对数据卡及 py/train 首条实际记录：`electron/electron/8668/8555`，Issue 8555、PR 8668，`changed_files` 为字符串 `['script/lib/config.py']`。使用 `ast.literal_eval` 并验证为字符串列表，禁止 `eval`。

## 映射与划分

| 原始字段 | 课程内部字段/用途 |
| --- | --- |
| repo_owner + repo_name | repo |
| text_id | 来源标识，连同revision/config/split保存 |
| issue_title / issue_body / issue_url | 查询与来源 |
| base_sha | base_commit；只读索引快照 |
| pull_url | pr_url；只用于离线核查 |
| head_sha / diff / diff_url | 离线标注证据，禁止作为检索输入 |
| changed_files | 解析为 gold_files，多文件数组 |
| changed_symbols_count | 计数，不是函数标签 |
| 无对应字段 | gold_symbols：人工扩展标签，单独版本与分母 |

当前发布配置为 py/java/kt；基线旧README还提及mixed，本课程不依赖该配置。py按**改动文件**后缀划分。py/dev=4339条全集，py/test=50条人工核查样本，py/train=4289条其余样本。dev包含train与test，不能当独立验证集。练习调参用train，最终测试冻结test；旧样本与自采样本分别报告，禁止混入官方测试集。源码需从GitHub历史或官方repos归档另行获取，不能用当前main替代不可恢复的base_sha。

官方 changed_files 排除用于证明修复的测试文件。保留原标签；标注争议、重命名、路径不在候选快照等需列原因，不能静默修改标签。官方HFDataSource按语言及忽略测试的规则恢复候选文件并重算diff，复现官方得分时需固定基线版本与候选规则。

## 评测口径

候选按排名去重，取前5个不同文件P5；G为完整gold_files。Hit@5为至少命中一文件的题数/N；Recall@5为每题 `|P5∩G|/|G|` 的宏平均。二者在多文件标签时不同。函数级只评人工核查的gold_symbols子集。有效样本、排除数、预测失败数与原因都要报告；预测失败计0，排除规则提前冻结。

官方 quality_metrics.py 提供集合级 Precision、Recall、F1、FPR、All Correct、At Least One Correct 等，未固定Top5。课程TopK指标是自定义检索评测，不直接等于官方榜单，也不表示Bug已修复。已有实验数字须保留原数据版本和口径，不能将旧数字直接当作LCA测试结果。

## 参考来源

- [官方套件与六类任务](https://github.com/JetBrains-Research/lca-baselines)
- [官方数据卡、字段、划分和归档](https://huggingface.co/datasets/JetBrains-Research/lca-bug-localization)
- [Bug Localization任务与基线](https://github.com/JetBrains-Research/lca-baselines/tree/main/bug_localization)
- [官方数据加载器](https://github.com/JetBrains-Research/lca-baselines/blob/main/bug_localization/src/baselines/data_sources/hf_data_source.py)
- [官方评分函数](https://github.com/JetBrains-Research/lca-baselines/blob/main/bug_localization/src/baselines/metrics/quality_metrics.py)
- [论文](https://arxiv.org/abs/2406.11612)

兼容性：资源id `swe` 保留以兼容既有课程引用，显示标题与链接已切换；课程id、步骤数、进度/笔记存储键和导入导出结构均保留。仅提升课程资源缓存版本，不清理localStorage。课程内部base_commit作为适配别名保留，避免破坏现有RepoLens练习代码。
