# 🎮 挂机RPG游戏 - 完整部署教程

## 目录

1. [方案一：Vercel 免费部署（推荐新手）](#方案一vercel-免费部署)
2. [方案二：Vercel + Supabase（带真实后端）](#方案二vercel--supabase)
3. [方案三：云服务器部署（完全自主）](#方案三云服务器部署)

---

## 方案一：Vercel 免费部署

> 💰 **成本：0元/永久**
> 
> ⏱️ **时间：5分钟**

### 步骤 1：注册 GitHub

1. 访问 https://github.com
2. 点击 "Sign up" 注册账号
3. 验证邮箱

### 步骤 2：创建仓库

1. 登录 GitHub
2. 点击右上角 "+" → "New repository"
3. 仓库名填：`idle-rpg-game`
4. 选择 "Public"
5. 点击 "Create repository"

### 步骤 3：上传代码

**方法A：使用 GitHub Desktop（推荐新手）**

1. 下载安装 GitHub Desktop：https://desktop.github.com
2. 用 GitHub 账号登录
3. Clone 你的仓库到本地
4. 把项目文件复制进去
5. Commit 并 Push

**方法B：使用 Git 命令行**

```bash
# 初始化
git init
git add .
git commit -m "初始化RPG游戏"
git branch -M main
git remote add origin https://github.com/你的用户名/idle-rpg-game.git
git push -u origin main
```

### 步骤 4：部署到 Vercel

1. 访问 https://vercel.com
2. 点击 "Sign Up" → 选择 "Continue with GitHub"
3. 授权后，点击 "Add New..." → "Project"
4. 选择你的 `idle-rpg-game` 仓库
5. 点击 "Deploy"
6. 等待 1-2 分钟，部署完成！

### 步骤 5：获得链接

部署成功后，你会获得一个链接：
```
https://idle-rpg-game-你的用户名.vercel.app
```

**这就是你的游戏链接！** 可以分享给任何人！

---

## 方案二：Vercel + Supabase

> 💰 **成本：0元/月**
> 
> ⏱️ **时间：15分钟**
> 
> 🎯 **功能：真正的排行榜、数据持久化**

### 步骤 1：注册 Supabase

1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 用 GitHub 账号登录
4. 创建组织（Organization）
5. 创建项目（Project），选择免费套餐

### 步骤 2：创建数据表

在 Supabase 控制台的 SQL Editor 中执行：

```sql
-- 排行榜表
CREATE TABLE leaderboard (
  id SERIAL PRIMARY KEY,
  player_name VARCHAR(50) NOT NULL,
  class_id VARCHAR(20) NOT NULL,
  level INTEGER DEFAULT 1,
  total_kills INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 允许匿名读取
GRANT SELECT ON leaderboard TO anon;
GRANT INSERT ON leaderboard TO anon;
```

### 步骤 3：获取 API 密钥

在 Supabase 控制台：
1. 点击 "Settings" → "API"
2. 复制 "Project URL"
3. 复制 "anon public" key

### 步骤 4：配置环境变量

在 Vercel 项目设置中添加：
```
NEXT_PUBLIC_SUPABASE_URL=你的Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon key
```

### 步骤 5：更新代码

代码已准备好，部署后会自动连接数据库！

---

## 方案三：云服务器部署

> 💰 **成本：50-100元/年**
> 
> ⏱️ **时间：30分钟**
> 
> 🎯 **优势：完全自主控制**

### 推荐：便宜云服务器

| 平台 | 配置 | 价格 |
|------|------|------|
| 阿里云学生机 | 2核2G | ~100元/年 |
| 腾讯云学生机 | 2核2G | ~100元/年 |
| 华为云学生机 | 2核2G | ~99元/年 |

### 部署步骤

```bash
# 1. 连接服务器
ssh root@你的服务器IP

# 2. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. 安装 PM2（进程管理）
npm install -g pm2

# 4. 上传代码（可以用 scp 或 git clone）
git clone https://github.com/你的用户名/idle-rpg-game.git
cd idle-rpg-game

# 5. 安装依赖
npm install

# 6. 构建
npm run build

# 7. 启动
pm2 start npm --name "rpg-game" -- start

# 8. 设置开机自启
pm2 startup
pm2 save
```

### 配置域名（可选）

1. 购买域名（阿里云/腾讯云，约 50元/年）
2. 解析到服务器 IP
3. 配置 Nginx 反向代理
4. 申请免费 SSL 证书

---

## 🎯 推荐路线

```
新手 → 方案一（Vercel免费）
      ↓
想学更多 → 方案二（加数据库）
      ↓
想完全掌控 → 方案三（自己服务器）
```

---

## ❓ 常见问题

**Q: Vercel 免费版有什么限制？**
A: 100GB 流量/月，个人网站完全够用

**Q: Supabase 免费版够用吗？**
A: 500MB 数据库 + 5GB 流量，排行榜绰绰有余

**Q: 服务器需要什么配置？**
A: 1核1G 就够了，但建议 2核2G

**Q: 域名必须买吗？**
A: 不需要，Vercel 提供免费域名

---

## 📞 需要帮助？

告诉我你卡在哪一步，我可以详细指导！
