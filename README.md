# CircuitVision Debugger — AI PCB 智能故障检测系统

```
██╗  ██╗██╗██████╗ ██████╗ ██╗   ██╗██╗███████╗██╗ ██████╗ ███╗   ██╗
██║  ██║██║██╔══██╗██╔══██╗██║   ██║██║██╔════╝██║██╔═══██╗████╗  ██║
███████║██║██████╔╝██████╔╝██║   ██║██║███████╗██║██║   ██║██╔██╗ ██║
██╔══██║██║██╔══██╗██╔══██╗╚██╗ ██╔╝██║╚════██║██║██║   ██║██║╚██╗██║
██║  ██║██║██║  ██║██║  ██║ ╚████╔╝ ██║███████║██║╚██████╔╝██║ ╚████║
╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝

        AI-Powered PCB Visual Inspection & Debugging System
```

## 📋 项目介绍

**CircuitVision Debugger** 是一款面向电子、电气、通信工程专业学生和硬件工程师的AI驱动的PCB(Printed Circuit Board)视觉诊断工具。用户只需上传PCB电路板实拍照片，AI即可自动完成元器件识别、焊接缺陷检测，并生成详细的故障排查指南和维修建议。

### 核心功能

| 功能模块 | 说明 |
|---------|------|
| 🖼️ **图片上传** | 支持拖拽、点击、粘贴上传PCB实物照片，实时预览与缩放 |
| 🔍 **AI视觉识别** | 自动识别电阻、电容、二极管、芯片、接插件等元器件 |
| ⚠️ **缺陷检测** | 检测焊锡短路、虚焊、漏焊、立碑、极性反、偏移、错贴等缺陷 |
| 📊 **智能分析** | 生成故障清单、风险等级评估、健康指数评分 |
| 🔧 **维修指导** | 针对每个缺陷输出详细的排查步骤、工具建议和维修方法 |
| 📤 **报告导出** | 支持 JSON / CSV / HTML 报告下载，一键分享 |

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────┐
│                  前端层 (Frontend)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ HTML5    │  │Tailwind  │  │   Vanilla JS     │  │
│  │ 语义结构 │  │ CSS 深色 │  │  响应式交互      │  │
│  └──────────┘  │ 科技主题  │  └──────────────────┘  │
│                └──────────┘                         │
├─────────────────────────────────────────────────────┤
│                 AI推理层 (AI Engine)                  │
│  ┌──────────────────────┐  ┌──────────────────────┐ │
│  │ 内置模拟引擎 (Mock)   │  │ 外部API引擎 (可选)    │ │
│  │ • YOLO风格目标检测    │  │ • OpenAI GPT-4o     │ │
│  │ • 规则化缺陷分析      │  │ • 通义千问VL        │ │
│  │ • 零部署开箱即用      │  │ • 智谱GLM-4V        │ │
│  └──────────────────────┘  │ • 自定义API接口      │ │
│                            └──────────────────────┘ │
├─────────────────────────────────────────────────────┤
│               存储层 (Storage)                        │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │ LocalStorage │  │ Blob/File    │                 │
│  │ 配置持久化    │  │ 图片&报告导出 │                 │
│  └──────────────┘  └──────────────┘                 │
└─────────────────────────────────────────────────────┘
```

### 技术栈

| 技术 | 用途 | 版本 |
|------|------|------|
| HTML5 | 页面结构 | - |
| Tailwind CSS 3 | 样式框架（CDN） | 3.x |
| Font Awesome 6 | 图标库（CDN） | 6.x |
| Vanilla JavaScript | 全部交互逻辑 | ES2020+ |
| Canvas API | 图片处理、截图导出 | - |
| LocalStorage | 配置持久化 | - |
| File API | 文件上传、拖拽 | - |

### AI 模型方案

**方案一（当前内置）：前端模拟引擎**
- YOLO 风格检测算法模拟
- 覆盖 10 种元器件类型 + 10 种缺陷类型
- 零依赖，打开即可体验

**方案二（预留）：对接真实AI模型**
- OpenAI GPT-4o Vision API
- 通义千问 VL (Qwen-VL-Plus)
- 智谱 GLM-4V
- 自定义 OpenAI 兼容接口
- 支持本地部署 YOLOv8

---

## 🚀 快速开始

### 方式一：直接打开（最简单）

```bash
# 克隆仓库
git clone https://github.com/your-username/circuitvision-debugger.git

# 进入目录
cd circuitvision-debugger

# 直接用浏览器打开 index.html
start index.html    # Windows
open index.html     # macOS
xdg-open index.html # Linux
```

### 方式二：HTTP 服务器

```bash
# Python
python -m http.server 8080

# Node.js
npx serve . -p 8080

# 然后访问 http://localhost:8080
```

### 方式三：双击 `start.bat`（Windows）

按提示选择启动方式即可。

---

## 🎯 项目亮点（黑客松评审）

### 1. 技术创新
- **纯前端AI推理**：基于规则引擎模拟 YOLO 检测流程，无需后端即可展示完整 AI 检测链路
- **双引擎架构**：内置 Mock 引擎 + 外部 API 引擎无缝切换，支持从演示到生产的一键升级
- **增量标注渲染**：使用 DOM 元素叠加实现高性能标注，支持缩放、筛选、交互

### 2. 产品完整性
- 覆盖"上传 → 检测 → 分析 → 诊断 → 导出"完整闭环
- 支持 10 种元器件识别、10 种缺陷检测
- 自动生成分级维修建议和详细分析报告
- 4 种导出格式（JSON / CSV / HTML / 图片）

### 3. 用户体验
- 深色科技风 UI，沉浸式竞赛视觉体验
- 玻璃态设计语言，流畅交互动画
- 响应式布局，完美适配 PC / 平板 / 手机
- 拖拽、点击、粘贴三重上传方式
- 实时进度反馈，分析过程可视化

### 4. 工程化设计
- 模块化代码架构（ai-service / export / app 三层分离）
- 完善的错误处理和用户反馈
- 配置持久化存储
- 适配国内网络环境（CDN 镜像兼容）

---

## 🗺️ 后续开发路线

### Phase 1: 增强检测能力
- [ ] 集成 ONNX Runtime Web 实现浏览器端 YOLOv8 推理
- [ ] 增加更多元器件类型（电感、变压器、保险丝等）
- [ ] 提高缺陷检测精度和召回率
- [ ] 支持多图批量分析

### Phase 2: 智能诊断升级
- [ ] 接入知识图谱，提供更精准的故障原因分析
- [ ] 基于历史数据的学习优化
- [ ] 电路原理图对比功能
- [ ] 3D PCB X光图像分析

### Phase 3: 协作与平台化
- [ ] 用户系统和团队协作
- [ ] 检测记录云端存储
- [ ] 移动端 App（Flutter / React Native）
- [ ] API 开放平台

### Phase 4: 生产级部署
- [ ] Docker 容器化部署
- [ ] K8s 集群支持
- [ ] CI/CD 流水线
- [ ] 性能监控和日志系统

---

## 📁 项目结构

```
circuitvision-debugger/
├── index.html          # 主页面（单页应用）
├── css/
│   └── style.css       # 自定义样式（深色科技风）
├── js/
│   ├── app.js          # 主应用逻辑（交互、渲染、状态管理）
│   ├── ai-service.js   # AI检测引擎（Mock + API）
│   └── export.js       # 导出功能模块
├── assets/             # 静态资源（预留）
├── start.bat           # Windows 快速启动脚本
├── .gitignore
└── README.md
```

---

## 🛠️ 模型训练优化指南

### YOLOv8 训练流程

```bash
# 1. 安装
pip install ultralytics

# 2. 准备数据集（推荐使用 PCB-A Dataset 或自行标注）
# 格式:
#   images/train/
#   images/val/
#   labels/train/
#   labels/val/

# 3. 训练
yolo train model=yolov8n.pt data=pcb_dataset.yaml epochs=100 imgsz=640

# 4. 导出为 ONNX
yolo export model=runs/detect/train/weights/best.pt format=onnx

# 5. 集成到本项目
# 在 ai-service.js 中添加 ONNX Runtime Web 推理逻辑
```

### 数据集推荐
- **[PCB-A Dataset](https://www.kaggle.com/datasets)** - PCB 缺陷检测公开数据集
- **自制数据集**：使用 LabelImg 标注，建议 500+ 张/类

---

## ⚙️ API 配置说明

项目支持外部 AI API，在界面右上角 → API配置 中进行设置。

### 支持的 API

| 提供商 | 端点 | 模型 |
|--------|------|------|
| OpenAI | `https://api.openai.com/v1/chat/completions` | gpt-4o / gpt-4o-mini |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` | qwen-vl-plus |
| 智谱GLM | `https://open.bigmodel.cn/api/paas/v4/chat/completions` | glm-4v |

---

## 📄 许可证

MIT License © 2026 CircuitVision Team

---

*Made with ❤️ for AI Hackathon*
