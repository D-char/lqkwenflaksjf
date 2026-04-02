# 高德地图API配置说明

## 1. 申请API Key

访问高德开放平台控制台申请API Key：

https://console.amap.com/dev/key/app

### 申请步骤：

1. 注册/登录高德开放平台账号
2. 进入控制台 → 应用管理 → 我的应用
3. 点击"创建新应用"
4. 填写应用信息：
   - 应用名称：OnelapMap（或自定义）
   - 应用类型：出行/其他
5. 点击"添加Key"按钮，**关键配置**：
   - ⚠️ **服务平台**：必须选择 **"Web服务"**（不是"Web端"！）
   - ✅ **勾选服务**：地理/逆地理编码
6. 提交后获得Key（类似：`a1b2c3d4e5f6g7h8i9j0`）

### ⚠️ 重要：平台类型选择

**错误码 10009 (USERKEY_PLAT_NOMATCH) 原因**：Key的平台类型不匹配

高德有两种不同的API类型：
- **Web服务** - REST API调用（URL: `restapi.amap.com`）← **本项目使用此类型**
- **Web端(JS API)** - 前端JavaScript SDK（需要引入JS库）

本项目代码使用 `fetch` 调用 `https://restapi.amap.com/v3/geocode/regeo`，属于**Web服务API**，因此必须申请"Web服务"类型的Key。

## 2. 配置API Key

打开 `js/app.js` 文件，找到第15行：

```javascript
const AMAP_KEY = 'YOUR_AMAP_KEY_HERE'; // ← 替换为你的高德API Key
```

将 `YOUR_AMAP_KEY_HERE` 替换为你申请到的Key：

```javascript
const AMAP_KEY = 'a1b2c3d4e5f6g7h8i9j0'; // 你的实际Key
```

## 3. 验证配置

保存文件后刷新页面，打开浏览器控制台（F12）：

**正确配置**时会看到：
```
正在调用高德逆地理编码API: lat=36.16, lng=120.43
高德API返回完整数据: { ... }
✅ 成功提取城市名称: 青岛市
页面显示更新为: 青岛市
```

**未配置Key**时会看到：
```
⚠️ 请先配置高德地图API Key！访问 https://console.amap.com/dev/key/app 申请
```

## 4. API配额说明

高德地图Web服务API配额：
- 个人开发者：5000次/日
- 认证开发者：30000次/日
- 企业开发者：更高配额

本应用每次启动调用1次逆地理编码，配额充足。

## 5. 注意事项

- Key仅用于逆地理编码服务，无需其他服务权限
- Key可在本地测试和生产环境使用
- 如遇跨域问题，需在服务器端配置代理
- 高德API在中国访问稳定，无证书问题

## 6. 常见问题

**Q: Key申请失败？**
A: 确保勾选"地理/逆地理编码"服务权限

**Q: API返回错误？**
A: 检查Key是否正确、配额是否充足、网络是否正常

**Q: 显示"定位失败"？**
A: 可能是Key未配置或API调用失败，查看控制台日志