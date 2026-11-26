# RAID OPS 独立站

- 始终中文沟通；面向海外玩家的页面正文使用自然英文。
- 品牌严格写 RAID OPS，正式域名严格使用 https://runandgun.games；不把关键词当作品牌改名。
- 不依赖原 tools-admin 仓库的模块、登录、API、数据库或环境密钥；后台仅作为迁移来源。
- 正文/辅助/按钮/标题字号统一使用 app/assets/site.css 的层级。按钮和链接不添加箭头。
- 新建 SEO 内容页按独立主内容统计至少800英文词，功能页和隐私页不靠重复正文补字数。
- 普通修改不自动生产构建或发布；明确授权后才能构建/上线。
- 默认预览 noindex；正式发布需显式 SITE_INDEXABLE=true。
- 游戏代码在 app/utils/ 和 app/components/game/RaidOpsGame.vue。保持已有操作和存档兼容性。
- 不将旧固定操作通关回放、定向引擎测试、浏览器实测混为同一种验收。
