# 骑行足迹地图 (OnelapMap)

> **"我的骑行足迹，点亮走过的每一公里"**

连接顽鹿运动账号，自动同步骑行记录，解析 FIT 文件提取 GPS 轨迹，在**高德地图**上叠加显示所有骑行路线，统计去重里程和个人路网覆盖率。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | 原生 HTML + CSS + JavaScript |
| 地图 | 高德地图 JS API v1.4.15 |
| FIT解析 | fit-file-parser (CDN) |
| 本地存储 | IndexedDB (痕迹持久化) |
| 路网数据 | OpenStreetMap Overpass API / 本地 JSON |
| 反向代理 | nginx (转发 API 到顽鹿后端) |

## 快速启动

### 方式一：直接打开 HTML

用任意 HTTP 服务器托管项目目录，例如：

```bash
# Python 简单服务器
cd D:/onelapMap
python -m http.server 8080
# 访问 http://localhost:8080
```

### 方式二：nginx 代理（推荐，支持 API 调用）

1. 确保 D:/onelapMap/temp/ 目录存在
2. 修改 `nginx.conf` 中 `proxy_pass` 指向正确的顽鹿 API 地址
3. 启动 nginx: `nginx -c D:/onelapMap/nginx.conf`

## 项目结构

```
D:/onelapMap/
├── index.html          # 主页面（地图 + 登录）
├── records.html        # 骑行记录列表页
├── css/style.css       # 全局样式（深色主题）
├── js/
│   ├── app.js              # 地图初始化、坐标转换(WGS-84→GCJ-02)
│   ├── login.js            # 顽鹿账号登录/token/API调用
│   ├── fit-parser.js       # FIT 文件解析（GPS轨迹提取）
│   ├── upload-handler.js   # 文件上传、远程 FIT 文件下载
│   ├── stats-calculator.js # 去重统计、点亮率计算
│   ├── track-storage.js    # IndexedDB 持久化存储
│   ├── road-data-api.js    # OpenStreetMap 路网数据 API
│   ├── share-handler.js    # "炫耀一下"展示模式
│   └── records.js          # 骑行记录列表渲染
├── data/
│   └── road-data.json      # 全国城市路网总里程数据
├── scripts/                # Python 数据提取脚本
├── nginx.conf              # nginx 反向代理配置
├── conf/
│   └── nginx.conf          # nginx 配置副本
└── docs/
    ├── PRD_骑行足迹地图_20260401.md
    └── 高德地图API配置说明.md
```

## 核心功能

- **顽鹿运动 API 对接** — 自动获取近 3 个月骑行记录
- **FIT 文件解析** — 提取 GPS 经纬度、速度、海拔、心率
- **轨迹叠加** — 所有骑行路线在地图上用黄色线条叠加
- **去重里程统计** — GPS 坐标按 ~1m 精度去重，避免同一路段重复计数
- **点亮率计算** — 骑行里程 / 该城市路网总里程
- **手动导入** — 支持本地 FIT 文件上传
- **成就卡片** — 覆盖里程、点亮率、本周新增

## 已知问题

1. **nginx 上游不可解析** — `rfs-web.rfsvr.net` DNS lookup 失败，需要替换为正确的顽鹿 API 地址
2. **API Secret 硬编码** — `login.js` 中的 secret 暴露在客户端，建议迁移到服务端签名
3. **CDN 依赖** — `cdn.jsdelivr.net` 在中国可能不稳定，建议备选 fallback 地址

## 许可

详见 LICENSE 文件。
