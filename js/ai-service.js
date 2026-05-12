/**
 * CircuitVision Debugger — AI 视觉识别核心服务
 * ============================================
 * 功能：PCB 元器件检测 & 焊接缺陷识别
 * 
 * 架构说明：
 * - 内置 YOLO 风格模拟检测引擎（纯前端，无需后端）
 * - 支持外部 API 接入（OpenAI Vision / 通义千问VL / 智谱GLM-4V 等）
 * - 预留模型切换接口，方便后续对接本地部署的 YOLOv8 / 多模态大模型
 */

// ================================================================
// 全局配置
// ================================================================
const AI_SERVICE_CONFIG = {
  mode: 'mock',             // 'mock' | 'api'
  apiType: 'openai',        // 'openai' | 'qwen' | 'glm' | 'custom'
  endpoint: 'https://api.openai.com/v1/chat/completions',
  apiKey: '',
  model: 'gpt-4o',
  temperature: 0.1,
  maxTokens: 4096,
};

// ================================================================
// 内置元器件库 & 缺陷类型库
// ================================================================
const COMPONENT_TYPES = {
  resistor:     { label: '电阻',    pkg: ['R', 'RN'],   colors: ['#8B4513', '#A0522D', '#D2691E'], icon: 'fa-solid fa-wave-square' },
  capacitor:    { label: '电容',    pkg: ['C', 'CE'],    colors: ['#4169E1', '#1E90FF', '#4682B4'], icon: 'fa-solid fa-bezier-curve' },
  diode:        { label: '二极管',  pkg: ['D', 'ZD'],    colors: ['#2F4F4F', '#696969', '#808080'], icon: 'fa-solid fa-arrow-right-long' },
  ic:           { label: '芯片/IC', pkg: ['U', 'IC'],    colors: ['#1a1a2e', '#16213e', '#0f3460'], icon: 'fa-solid fa-microchip' },
  connector:    { label: '接插件',  pkg: ['J', 'CN'],    colors: ['#C0C0C0', '#A9A9A9', '#D3D3D3'], icon: 'fa-solid fa-plug' },
  transistor:   { label: '三极管',  pkg: ['Q', 'T'],     colors: ['#3D5A80', '#293241', '#5C4033'], icon: 'fa-solid fa-arrow-trend-up' },
  inductor:     { label: '电感',    pkg: ['L', 'L'],     colors: ['#DEB887', '#D2B48C', '#BC8F8F'], icon: 'fa-solid fa-spinner' },
  led:          { label: 'LED',     pkg: ['LED', 'D'],   colors: ['#FF4500', '#32CD32', '#FFD700'], icon: 'fa-regular fa-lightbulb' },
  switch:       { label: '开关/按键', pkg: ['SW', 'S'],  colors: ['#4A4A4A', '#5C5C5C', '#6B6B6B'], icon: 'fa-solid fa-toggle-on' },
  crystal:      { label: '晶振',    pkg: ['Y', 'X'],     colors: ['#C0C0C0', '#E8E8E8', '#B0C4DE'], icon: 'fa-solid fa-clock' },
};

const DEFECT_TYPES = {
  solder_bridge:    { label: '焊锡短路',   severity: 'critical', risk: '高', desc: '相邻焊盘之间焊料连接造成短路' },
  cold_solder:      { label: '虚焊/冷焊',  severity: 'high',    risk: '较高', desc: '焊点未充分熔融，导电性差' },
  missing_solder:   { label: '漏焊',       severity: 'critical', risk: '高', desc: '焊盘未上锡，元件未连接' },
  tombstone:        { label: '立碑',       severity: 'high',    risk: '较高', desc: '元件一端翘起脱离焊盘' },
  polarity_rev:     { label: '极性接反',   severity: 'critical', risk: '高', desc: '有极性元件方向装反' },
  misalignment:     { label: '偏移',       severity: 'medium',  risk: '中', desc: '元件贴装位置偏离焊盘中心' },
  wrong_component:  { label: '错贴',       severity: 'critical', risk: '高', desc: '安装的元件型号与设计不符' },
  insufficient_solder: { label: '少锡',    severity: 'medium',  risk: '中', desc: '焊料量不足，连接强度不够' },
  excess_solder:    { label: '多锡',       severity: 'low',     risk: '低', desc: '焊料过多，可能影响外观和间距' },
  lifted_pad:       { label: '焊盘翘起',   severity: 'critical', risk: '高', desc: '焊盘从PCB基板脱落' },
};

// ================================================================
// 模拟检测引擎 — 生成逼真的 PCB 检测结果
// ================================================================
class MockDetectionEngine {

  /**
   * 对图片进行模拟 AI 检测
   * @param {HTMLImageElement} imageEl - 图片元素
   * @returns {Object} 检测结果
   */
  async detect(imageEl) {
    const img = imageEl;
    const W = img.naturalWidth || 800;
    const H = img.naturalHeight || 600;

    // 模拟处理延迟
    await this._simulateProgress();

    // 生成元器件检测结果
    const components = this._generateComponents(W, H);
    // 生成缺陷检测结果
    const defects = this._generateDefects(components, W, H);
    // 生成维修建议
    const repairs = this._generateRepairs(defects);
    // 计算统计指标
    const stats = this._calculateStats(components, defects);

    return {
      success: true,
      imageWidth: W,
      imageHeight: H,
      components,
      defects,
      repairs,
      stats,
      raw: null, // 存放API原始返回
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 模拟进度回调
   */
  async _simulateProgress() {
    const steps = [
      { pct: 15, text: '正在解析图像特征...' },
      { pct: 30, text: 'YOLO 目标检测中...' },
      { pct: 55, text: '元器件分类识别...' },
      { pct: 75, text: '焊接缺陷检测分析...' },
      { pct: 90, text: '生成维修建议...' },
    ];
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 300 + Math.random() * 400));
      if (typeof window.__onProgress === 'function') {
        window.__onProgress(step.pct, step.text);
      }
    }
  }

  /**
   * 生成模拟的元器件
   */
  _generateComponents(W, H) {
    const components = [];
    const types = Object.keys(COMPONENT_TYPES);
    const count = 8 + Math.floor(Math.random() * 15); // 8~22个元件

    // 生成一些结构化的元件排布，模拟真实PCB
    const layoutRegions = [
      // [x%, y%, w%, h%] 相对坐标
      { x: 5, y: 5, w: 25, h: 30, count: 0 },  // 左上区域
      { x: 35, y: 5, w: 30, h: 25, count: 0 },  // 中上
      { x: 70, y: 5, w: 25, h: 20, count: 0 },  // 右上
      { x: 5, y: 40, w: 20, h: 30, count: 0 },  // 左中
      { x: 30, y: 35, w: 40, h: 35, count: 0 }, // 中央（主芯片区）
      { x: 75, y: 35, w: 20, h: 30, count: 0 }, // 右中
      { x: 5, y: 75, w: 90, h: 20, count: 0 },  // 底部（接插件区）
    ];

    // 主芯片一定在中央
    components.push({
      id: 'comp-0',
      type: 'ic',
      label: 'IC',
      designator: 'U1',
      name: '主控芯片 STM32F103',
      confidence: 0.94 + Math.random() * 0.05,
      bbox: this._randBboxInRegion(W, H, 28, 22, 12, 8),
    });
    // 接插件在底部
    components.push({
      id: 'comp-1',
      type: 'connector',
      label: '接插件',
      designator: 'J1',
      name: '排针连接器 2×10',
      confidence: 0.91 + Math.random() * 0.08,
      bbox: this._randBboxInRegion(W, H, 10, 80, 40, 8),
    });
    components.push({
      id: 'comp-2',
      type: 'connector',
      label: '接插件',
      designator: 'J2',
      name: '电源端子',
      confidence: 0.89 + Math.random() * 0.08,
      bbox: this._randBboxInRegion(W, H, 55, 80, 25, 8),
    });

    // 随机布置其他元件
    const remaining = count - components.length;
    for (let i = 0; i < remaining; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const info = COMPONENT_TYPES[type];
      const regionIdx = Math.floor(Math.random() * layoutRegions.length);
      const region = layoutRegions[regionIdx];
      let x, y, w, h;

      if (type === 'ic') {
        // IC放在中央附近
        const r = { x: 30, y: 30, w: 40, h: 35 };
        x = r.x + Math.random() * (r.w - 15);
        y = r.y + Math.random() * (r.h - 10);
        w = 10 + Math.random() * 8;
        h = 6 + Math.random() * 6;
      } else if (type === 'resistor' || type === 'capacitor') {
        // 电阻电容排成行
        const row = Math.floor(Math.random() * 3);
        x = 5 + (i % 6) * 15;
        y = 45 + row * 12;
        w = 5 + Math.random() * 4;
        h = 3 + Math.random() * 2;
      } else {
        x = region.x + Math.random() * (region.w - 8);
        y = region.y + Math.random() * (region.h - 6);
        w = 4 + Math.random() * 8;
        h = 3 + Math.random() * 6;
      }

      const designatorNum = i + 10;
      components.push({
        id: `comp-${components.length}`,
        type,
        label: info.label,
        designator: `${info.pkg[0]}${designatorNum}`,
        name: `${info.label}`,
        confidence: 0.82 + Math.random() * 0.16,
        bbox: this._clampBbox((x / 100) * W, (y / 100) * H, (w / 100) * W, (h / 100) * H, W, H),
      });
    }

    return components;
  }

  /**
   * 生成模拟的缺陷
   */
  _generateDefects(components, W, H) {
    const defects = [];
    const defectTypes = Object.keys(DEFECT_TYPES);
    const count = 1 + Math.floor(Math.random() * 5); // 1~5个缺陷

    const usedComponents = new Set();

    for (let i = 0; i < count && i < components.length; i++) {
      // 随机选一个元件作为缺陷关联
      const compIdx = Math.floor(Math.random() * components.length);
      if (usedComponents.has(compIdx)) continue;
      usedComponents.add(compIdx);

      const comp = components[compIdx];
      const type = defectTypes[Math.floor(Math.random() * defectTypes.length)];
      const info = DEFECT_TYPES[type];
      const { x, y, w, h } = comp.bbox;

      // 缺陷框在元件框附近
      const dx = x + (Math.random() - 0.5) * w * 0.6;
      const dy = y + (Math.random() - 0.5) * h * 0.6;
      const dw = w * (0.3 + Math.random() * 0.5);
      const dh = h * (0.2 + Math.random() * 0.4);

      defects.push({
        id: `defect-${i}`,
        type,
        label: info.label,
        severity: info.severity,
        risk: info.risk,
        description: info.desc,
        confidence: 0.75 + Math.random() * 0.2,
        bbox: this._clampBbox(dx, dy, dw, dh, W, H),
        relatedComponent: comp.id,
        repairTime: `${10 + Math.floor(Math.random() * 40)}分钟`,
        tools: this._getRepairTools(type),
      });
    }

    return defects;
  }

  /**
   * 生成维修建议
   */
  _generateRepairs(defects) {
    if (defects.length === 0) {
      return [{
        step: 1,
        title: 'PCB 检测通过',
        content: '未检测到明显焊接缺陷，建议进行电性能测试验证功能完整性。',
        severity: 'ok',
      }];
    }

    const repairs = [];
    defects.forEach((defect, i) => {
      const severity = defect.severity === 'critical' ? 'high' : (defect.severity === 'high' ? 'warning' : 'low');
      const repair = {
        step: i + 1,
        title: `${defect.label} — ${defect.relatedComponent}`,
        content: '',
        severity,
        tools: defect.tools,
        time: defect.repairTime,
      };

      switch (defect.type) {
        case 'solder_bridge':
          repair.content = `【${defect.relatedComponent}】检测到焊锡短路。建议：① 使用放大镜检查相邻焊点间是否有焊料桥接；② 使用吸锡带或吸锡器清除多余焊料；③ 用酒精清洁后重新检查。`;
          break;
        case 'cold_solder':
          repair.content = `【${defect.relatedComponent}】检测到虚焊/冷焊。建议：① 使用烙铁重新加热焊点至充分熔融；② 适当补充助焊剂改善润湿；③ 确保加热时间足够（2-4秒）。`;
          break;
        case 'missing_solder':
          repair.content = `【${defect.relatedComponent}】检测到漏焊。建议：① 清洁焊盘和元件引脚；② 涂适量焊锡膏；③ 烙铁加热至焊料完全覆盖焊盘和引脚。`;
          break;
        case 'tombstone':
          repair.content = `【${defect.relatedComponent}】检测到立碑。建议：① 先加热翘起侧焊盘使元件平放；② 调整回流焊温度曲线；③ 检查焊盘设计是否对称。`;
          break;
        case 'polarity_rev':
          repair.content = `【${defect.relatedComponent}】检测到极性接反。建议：① 对照原理图确认元件正确方向；② 使用热风枪拆下元件；③ 重新按照丝印标记方向焊接。`;
          break;
        case 'misalignment':
          repair.content = `【${defect.relatedComponent}】检测到偏移。建议：① 用镊子轻轻调整元件位置；② 重新加热焊点固定；③ 确认贴片机对中精度。`;
          break;
        case 'wrong_component':
          repair.content = `【${defect.relatedComponent}】检测到错贴。建议：① 核对BOM表确认正确型号；② 拆下错误元件；③ 更换正确规格的元件重新焊接。`;
          break;
        default:
          repair.content = `【${defect.relatedComponent}】建议进行详细检查，使用万用表测量相关电气参数，对照原理图分析。`;
      }
      repairs.push(repair);
    });

    return repairs;
  }

  /**
   * 计算统计指标
   */
  _calculateStats(components, defects) {
    const totalComponents = components.length;
    const totalDefects = defects.length;
    const severityWeights = { critical: 25, high: 15, medium: 8, low: 3 };
    let score = 100;
    defects.forEach(d => { score -= severityWeights[d.severity] || 10; });
    const health = Math.max(0, Math.min(100, score));

    return {
      totalComponents,
      totalDefects,
      health,
      processingTime: 2.3 + Math.random() * 3.5,
    };
  }

  /** 工具函数：在指定区域内生成随机bbox */
  _randBboxInRegion(W, H, rx, ry, rw, rh) {
    const x = (rx + Math.random() * (rw - 10)) / 100 * W;
    const y = (ry + Math.random() * (rh - 5)) / 100 * H;
    const w = Math.max(20, rw / 100 * W * (0.3 + Math.random() * 0.4));
    const h = Math.max(15, rh / 100 * H * (0.3 + Math.random() * 0.4));
    return { x, y, w, h };
  }

  /** 工具函数：确保bbox在图片范围内 */
  _clampBbox(x, y, w, h, W, H) {
    return {
      x: Math.max(0, Math.min(x, W - 10)),
      y: Math.max(0, Math.min(y, H - 10)),
      w: Math.max(10, Math.min(w, W - x)),
      h: Math.max(10, Math.min(h, H - y)),
    };
  }

  /** 工具函数：获取维修工具 */
  _getRepairTools(defectType) {
    const toolMap = {
      solder_bridge: ['吸锡带', '助焊剂', '烙铁(350°C)', '放大镜'],
      cold_solder: ['烙铁(350°C)', '助焊剂', '焊锡丝', '热风枪'],
      missing_solder: ['焊锡丝', '助焊剂', '烙铁(350°C)', '酒精'],
      tombstone: ['热风枪', '镊子', '助焊剂', '焊锡膏'],
      polarity_rev: ['热风枪', '镊子', '焊锡丝', '助焊剂'],
      misalignment: ['镊子', '烙铁(350°C)', '助焊剂', '放大镜'],
      wrong_component: ['热风枪', '镊子', 'BOM表', '万用表'],
    };
    return toolMap[defectType] || ['烙铁', '镊子', '放大镜', '万用表'];
  }
}


// ================================================================
// 外部 API 检测引擎 — 对接多模态大模型
// ================================================================
class ApiDetectionEngine {

  constructor(config) {
    this.config = config;
  }

  /**
   * 使用外部API进行检测
   * @param {HTMLImageElement} imageEl
   * @returns {Promise<Object>}
   */
  async detect(imageEl) {
    const base64 = this._imageToBase64(imageEl);

    const systemPrompt = `你是一位专业的PCB视觉检测专家。请分析这张PCB电路板照片，完成以下任务：
1. 识别所有可见的电子元器件（电阻、电容、二极管、芯片、接插件等）
2. 检测焊接缺陷（短路、虚焊、漏焊、立碑、极性反、偏移等）
3. 给出维修建议

请严格按照以下JSON格式返回结果（不要包含markdown代码块标记）：
{
  "components": [
    { "id": "comp-1", "type": "resistor", "label": "电阻", "designator": "R1", "name": "贴片电阻 10kΩ", "confidence": 0.95, "bbox": { "x": 100, "y": 200, "w": 40, "h": 20 } }
  ],
  "defects": [
    { "id": "def-1", "type": "solder_bridge", "label": "焊锡短路", "severity": "critical", "risk": "高", "description": "R1与R2之间焊料桥接", "confidence": 0.88, "bbox": { "x": 120, "y": 210, "w": 15, "h": 10 }, "relatedComponent": "comp-1", "repairTime": "20分钟", "tools": ["吸锡带", "助焊剂", "烙铁"] }
  ],
  "repairs": [
    { "step": 1, "title": "焊锡短路 — R1", "content": "建议...", "severity": "high", "tools": ["吸锡带"], "time": "20分钟" }
  ]
}`;

    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: '请分析此PCB照片中的元件和缺陷：' },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'high' } },
            ],
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // 尝试提取JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('API返回格式异常，未找到有效JSON');

    const result = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      imageWidth: imageEl.naturalWidth,
      imageHeight: imageEl.naturalHeight,
      components: result.components || [],
      defects: result.defects || [],
      repairs: result.repairs || [],
      stats: this._calculateStats(result.components || [], result.defects || []),
      raw: data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 将图片转为 Base64
   */
  _imageToBase64(img) {
    const canvas = document.createElement('canvas');
    // 压缩到最大 2048px
    const maxDim = 2048;
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w *= ratio;
      h *= ratio;
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
  }

  _calculateStats(components, defects) {
    const severityWeights = { critical: 25, high: 15, medium: 8, low: 3 };
    let score = 100;
    defects.forEach(d => { score -= severityWeights[d.severity] || 10; });
    return {
      totalComponents: components.length,
      totalDefects: defects.length,
      health: Math.max(0, Math.min(100, score)),
      processingTime: 0,
    };
  }
}


// ================================================================
// 统一检测接口
// ================================================================
const mockEngine = new MockDetectionEngine();
let apiEngine = null;

/**
 * 主检测函数 — 根据配置自动选择引擎
 * @param {HTMLImageElement} imageEl
 * @param {Function} onProgress - 进度回调 (percent, text)
 * @returns {Promise<Object>}
 */
async function runDetection(imageEl, onProgress) {
  if (typeof onProgress === 'function') {
    window.__onProgress = onProgress;
  }

  if (AI_SERVICE_CONFIG.mode === 'api' && AI_SERVICE_CONFIG.apiKey) {
    if (!apiEngine) {
      apiEngine = new ApiDetectionEngine(AI_SERVICE_CONFIG);
    }
    return await apiEngine.detect(imageEl);
  }

  // 默认使用模拟引擎
  return await mockEngine.detect(imageEl);
}

/**
 * 测试API连接
 */
async function testApiConnection(config) {
  try {
    const resp = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5,
      }),
    });
    return { ok: resp.ok, status: resp.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
