/**
 * CircuitVision Debugger — 主应用逻辑
 * =====================================
 * 负责：状态管理、UI交互、事件绑定、标注渲染
 */

(function () {
  'use strict';

  // ================================================================
  // 应用状态
  // ================================================================
  const state = {
    imageFile: null,
    imageUrl: null,
    imageEl: null,
    zoomLevel: 1,
    result: null,
    isProcessing: false,
    settings: { ...AI_SERVICE_CONFIG },
  };

  // ================================================================
  // DOM 缓存（提升性能）
  // ================================================================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    dropZone: $('#drop-zone'),
    fileInput: $('#file-input'),
    dropOverlay: $('#drop-overlay'),
    previewArea: $('#preview-area'),
    previewImage: $('#preview-image'),
    fileName: $('#file-name-display'),
    fileSize: $('#file-size-display'),
    btnAnalyze: $('#btn-analyze'),
    btnRemove: $('#btn-remove'),
    imageContainer: $('#image-container'),
    annotationLayer: $('#annotation-layer'),
    emptyState: $('#empty-state'),
    progress: $('#analysis-progress'),
    progressText: $('#progress-text'),
    progressSubtext: $('#progress-subtext'),
    progressBar: $('#progress-bar'),
    resultsArea: $('#results-area'),
    resultImage: $('#result-image'),
    resultAnnotationLayer: $('#result-annotation-layer'),
    statComponents: $('#stat-components'),
    statDefects: $('#stat-defects'),
    statHealth: $('#stat-health'),
    statTime: $('#stat-time'),
    componentList: $('#component-list'),
    defectList: $('#defect-list'),
    componentCountBadge: $('#component-count-badge'),
    defectCountBadge: $('#defect-count-badge'),
    repairContent: $('#repair-content'),
    reportContent: $('#report-content'),
    toggleComponents: $('#toggle-components'),
    toggleDefects: $('#toggle-defects'),
    btnZoomIn: $('#btn-zoom-in'),
    btnZoomOut: $('#btn-zoom-out'),
    btnZoomReset: $('#btn-zoom-reset'),
    zoomLevel: $('#zoom-level'),
    // Modals
    settingsModal: $('#settings-modal'),
    aboutModal: $('#about-modal'),
    btnSettings: $('#btn-settings'),
    btnAbout: $('#btn-about'),
    modalCloses: $$('.modal-close'),
    // Settings
    modeBtns: $$('.mode-btn'),
    apiSettings: $('#api-settings'),
    mockSettings: $('#mock-settings'),
    apiType: $('#api-type'),
    apiEndpoint: $('#api-endpoint'),
    apiKey: $('#api-key'),
    apiModel: $('#api-model'),
    apiTemperature: $('#api-temperature'),
    apiMaxTokens: $('#api-max-tokens'),
    btnTestApi: $('#btn-test-api'),
    btnSaveSettings: $('#btn-save-settings'),
    toggleApiKey: $('#toggle-api-key'),
    // Tabs
    reportTabs: $$('.report-tab'),
    exportBtns: $$('.export-btn'),
    exportStatus: $('#export-status'),
  };

  // ================================================================
  // 初始化
  // ================================================================
  function init() {
    _loadSettings();
    _bindEvents();
    console.log('[CircuitVision] 应用初始化完成');
  }

  // ================================================================
  // 事件绑定
  // ================================================================
  function _bindEvents() {

    // --- 上传相关 ---
    dom.dropZone.addEventListener('click', () => dom.fileInput.click());
    dom.fileInput.addEventListener('change', onFileSelect);

    // 拖拽事件
    dom.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dom.dropZone.classList.add('drag-over'); });
    dom.dropZone.addEventListener('dragleave', () => dom.dropZone.classList.remove('drag-over'));
    dom.dropZone.addEventListener('drop', (e) => { e.preventDefault(); dom.dropZone.classList.remove('drag-over'); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); });

    // 粘贴上传
    document.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          handleFiles([item.getAsFile()]);
          break;
        }
      }
    });

    dom.btnRemove.addEventListener('click', resetUpload);
    dom.btnAnalyze.addEventListener('click', startAnalysis);

    // --- 缩放 ---
    dom.btnZoomIn.addEventListener('click', () => adjustZoom(0.2));
    dom.btnZoomOut.addEventListener('click', () => adjustZoom(-0.2));
    dom.btnZoomReset.addEventListener('click', () => setZoom(1));
    dom.imageContainer.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); adjustZoom(e.deltaY > 0 ? -0.1 : 0.1); }
    });

    // --- 标注图层切换 ---
    dom.toggleComponents.addEventListener('change', renderAnnotations);
    dom.toggleDefects.addEventListener('change', renderAnnotations);

    // --- 模态框 ---
    dom.btnSettings.addEventListener('click', () => openModal(dom.settingsModal));
    dom.btnAbout.addEventListener('click', () => openModal(dom.aboutModal));
    dom.modalCloses.forEach(btn => btn.addEventListener('click', closeAllModals));
    dom.settingsModal.addEventListener('click', (e) => { if (e.target === dom.settingsModal) closeAllModals(); });
    dom.aboutModal.addEventListener('click', (e) => { if (e.target === dom.aboutModal) closeAllModals(); });

    // --- 设置 ---
    dom.modeBtns.forEach(btn => btn.addEventListener('click', () => {
      dom.modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      dom.apiSettings.classList.toggle('hidden', mode !== 'api');
      dom.mockSettings.classList.toggle('hidden', mode !== 'mock');
    }));
    dom.toggleApiKey.addEventListener('click', () => {
      const input = dom.apiKey;
      input.type = input.type === 'password' ? 'text' : 'password';
      dom.toggleApiKey.querySelector('i').className = input.type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    });
    dom.btnTestApi.addEventListener('click', testApi);
    dom.btnSaveSettings.addEventListener('click', saveSettings);

    // --- 报告选项卡 ---
    dom.reportTabs.forEach(tab => tab.addEventListener('click', () => {
      dom.reportTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      $$('.tab-content').forEach(el => el.classList.add('hidden'));
      const content = document.getElementById(`tab-${target}`);
      if (content) content.classList.remove('hidden');
    }));

    // --- 导出 ---
    dom.exportBtns.forEach(btn => btn.addEventListener('click', () => {
      if (!state.result) { showExportStatus('请先完成AI分析', 'text-red-400'); return; }
      const fmt = btn.dataset.format;
      switch (fmt) {
        case 'json': ExportManager.toJSON(state.result); showExportStatus('✅ JSON 报告已导出', 'text-emerald-400'); break;
        case 'csv': ExportManager.toCSV(state.result); showExportStatus('✅ CSV 表格已导出', 'text-emerald-400'); break;
        case 'report': ExportManager.toHTML(state.result); showExportStatus('✅ HTML 报告已导出', 'text-emerald-400'); break;
        case 'image':
          ExportManager.toImage(dom.resultAnnotationLayer.parentElement)
            .then(() => showExportStatus('✅ 截图已保存', 'text-emerald-400'))
            .catch(err => showExportStatus(`❌ 截图失败: ${err.message}`, 'text-red-400'));
          break;
      }
    }));
  }

  // ================================================================
  // 文件上传处理
  // ================================================================
  function onFileSelect(e) {
    if (e.target.files.length) handleFiles(e.target.files);
  }

  function handleFiles(files) {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) {
      showToast('请选择图片文件（JPG/PNG/WebP/BMP）', 'error');
      return;
    }

    // 检查文件大小（限制 20MB）
    if (file.size > 20 * 1024 * 1024) {
      showToast('文件超过 20MB 限制，请压缩后上传', 'error');
      return;
    }

    state.imageFile = file;

    // 显示文件信息
    dom.fileName.textContent = file.name;
    dom.fileSize.textContent = _formatSize(file.size);

    // 读取并预览
    const reader = new FileReader();
    reader.onload = (e) => {
      state.imageUrl = e.target.result;
      dom.previewImage.src = state.imageUrl;
      dom.resultImage.src = state.imageUrl;

      // 等图片加载完成
      dom.previewImage.onload = () => {
        state.imageEl = dom.previewImage;
        dom.previewArea.classList.remove('hidden');
        dom.emptyState.classList.add('hidden');
        dom.resultsArea.classList.add('hidden');
        dom.annotationLayer.innerHTML = '';
        state.zoomLevel = 1;
        setZoom(1);
        dom.btnAnalyze.disabled = false;
      };
    };
    reader.readAsDataURL(file);
  }

  function resetUpload() {
    state.imageFile = null;
    state.imageUrl = null;
    state.imageEl = null;
    state.result = null;
    state.zoomLevel = 1;
    dom.fileInput.value = '';
    dom.previewArea.classList.add('hidden');
    dom.resultsArea.classList.add('hidden');
    dom.progress.classList.add('hidden');
    dom.emptyState.classList.remove('hidden');
    dom.annotationLayer.innerHTML = '';
    dom.resultAnnotationLayer.innerHTML = '';
    dom.previewImage.src = '';
    dom.resultImage.src = '';
    dom.btnAnalyze.disabled = true;
  }

  // ================================================================
  // 缩放控制
  // ================================================================
  function adjustZoom(delta) {
    const newZoom = Math.max(0.25, Math.min(4, state.zoomLevel + delta));
    setZoom(newZoom);
  }

  function setZoom(level) {
    state.zoomLevel = level;
    dom.previewImage.style.transform = `scale(${level})`;
    dom.previewImage.style.transformOrigin = 'center center';
    dom.zoomLevel.textContent = `${Math.round(level * 100)}%`;
    // 缩放时同步标注
    renderAnnotations();
  }

  // ================================================================
  // AI 分析流程
  // ================================================================
  async function startAnalysis() {
    if (state.isProcessing) return;
    if (!state.imageEl) { showToast('请先上传PCB图片', 'error'); return; }

    state.isProcessing = true;
    dom.btnAnalyze.disabled = true;
    dom.btnAnalyze.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 分析中...';
    dom.progress.classList.remove('hidden');
    dom.resultsArea.classList.add('hidden');

    try {
      // 进度回调
      const onProgress = (pct, text) => {
        dom.progressBar.style.width = `${pct}%`;
        dom.progressSubtext.textContent = text;
        if (pct < 30) dom.progressText.textContent = 'AI 视觉模型加载中...';
        else if (pct < 60) dom.progressText.textContent = '正在分析 PCB 图像...';
        else if (pct < 85) dom.progressText.textContent = '缺陷检测与分类...';
        else dom.progressText.textContent = '生成维修建议...';
      };

      // 执行检测
      const result = await runDetection(state.imageEl, onProgress);

      // 短暂延迟展示完成效果
      dom.progressBar.style.width = '100%';
      dom.progressText.textContent = '✅ 分析完成！';
      dom.progressSubtext.textContent = `识别到 ${result.components.length} 个元件，${result.defects.length} 处缺陷`;

      await new Promise(r => setTimeout(r, 600));

      state.result = result;

      // 渲染结果
      renderResults(result);
      dom.resultsArea.classList.remove('hidden');
      dom.progress.classList.add('hidden');

      showToast(`分析完成！健康指数: ${result.stats.health}%`, result.stats.health >= 60 ? 'success' : 'warning');

    } catch (err) {
      console.error('[CircuitVision] 分析出错:', err);
      dom.progressText.textContent = '❌ 分析失败';
      dom.progressSubtext.textContent = err.message;
      showToast(`分析失败: ${err.message}`, 'error');
      await new Promise(r => setTimeout(r, 1500));
      dom.progress.classList.add('hidden');
    } finally {
      state.isProcessing = false;
      dom.btnAnalyze.disabled = false;
      dom.btnAnalyze.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> 开始AI分析';
    }
  }

  // ================================================================
  // 渲染检测结果
  // ================================================================
  function renderResults(result) {
    // 统计卡片
    dom.statComponents.textContent = result.stats.totalComponents;
    dom.statDefects.textContent = result.stats.totalDefects;
    dom.statHealth.textContent = result.stats.health;
    dom.statTime.textContent = result.stats.processingTime.toFixed(1);

    // 元器件清单
    renderComponentList(result.components);
    // 缺陷清单
    renderDefectList(result.defects);
    // 维修建议
    renderRepairSteps(result.repairs);
    // 详细报告
    renderReport(result);
    // 标注
    renderResultAnnotations(result);

    // 切换标注图层显示状态
    dom.resultAnnotationLayer.style.display = 'block';
  }

  /** 渲染元器件清单 */
  function renderComponentList(components) {
    dom.componentList.innerHTML = '';
    dom.componentCountBadge.textContent = `${components.length} 个`;

    const typeColors = {
      resistor: '#CD853F', capacitor: '#4169E1', diode: '#696969', ic: '#4A90D9',
      connector: '#C0C0C0', transistor: '#3D5A80', inductor: '#DEB887',
      led: '#FFD700', switch: '#6B6B6B', crystal: '#B0C4DE',
    };

    components.forEach(c => {
      const div = document.createElement('div');
      div.className = 'component-item';
      const color = typeColors[c.type] || '#00d4ff';
      div.innerHTML = `
        <span class="component-dot" style="background:${color}"></span>
        <span class="text-gray-400 w-12 shrink-0">${c.designator}</span>
        <span class="text-gray-200 flex-1">${c.label}</span>
        <span class="text-gray-500 text-xs">${c.name}</span>
        <span class="text-accent text-xs font-mono">${(c.confidence * 100).toFixed(0)}%</span>
      `;
      dom.componentList.appendChild(div);
    });
  }

  /** 渲染故障清单 */
  function renderDefectList(defects) {
    dom.defectList.innerHTML = '';
    dom.defectCountBadge.textContent = `${defects.length} 处`;

    if (defects.length === 0) {
      dom.defectList.innerHTML = `<div class="text-center py-6 text-emerald-400 text-sm"><i class="fa-solid fa-circle-check mr-1.5"></i>未检测到缺陷，PCB 状态良好</div>`;
      return;
    }

    const severityIcons = { critical: 'fa-circle-exclamation', high: 'fa-triangle-exclamation', medium: 'fa-circle-info', low: 'fa-circle' };

    defects.forEach(d => {
      const div = document.createElement('div');
      div.className = 'defect-item';
      const sevClass = `severity-${d.severity}`;
      div.innerHTML = `
        <div class="${sevClass} shrink-0 mt-0.5"><i class="fa-solid ${severityIcons[d.severity] || 'fa-circle'}"></i></div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-200">${d.label}</span>
            <span class="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 ${sevClass}">${d.risk}</span>
          </div>
          <p class="text-xs text-gray-500 mt-0.5 truncate">${d.description} · ${d.repairTime}</p>
        </div>
        <div class="shrink-0 text-right">
          <div class="text-xs font-mono text-gray-500">${(d.confidence * 100).toFixed(0)}%</div>
          <div class="text-xs text-gray-600">${d.relatedComponent}</div>
        </div>
      `;
      div.addEventListener('click', () => {
        // 点击缺陷滚动到维修建议
        document.querySelector('[data-tab="repair"]').click();
        const steps = dom.repairContent.querySelectorAll('.repair-step');
        const idx = state.result.repairs.findIndex(r => r.title.includes(d.relatedComponent) || r.title.includes(d.label));
        if (steps[idx]) steps[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      dom.defectList.appendChild(div);
    });
  }

  /** 渲染维修步骤 */
  function renderRepairSteps(repairs) {
    dom.repairContent.innerHTML = '';

    if (!repairs || repairs.length === 0) {
      dom.repairContent.innerHTML = `<div class="text-center py-8 text-gray-500"><i class="fa-solid fa-check-circle text-emerald-400 text-2xl mb-2"></i><p>未检测到需要维修的缺陷</p></div>`;
      return;
    }

    repairs.forEach(r => {
      const div = document.createElement('div');
      div.className = `repair-step ${r.severity === 'high' ? 'repair-critical' : r.severity === 'warning' ? 'repair-warning' : ''}`;
      div.innerHTML = `
        <div class="repair-step-number">${r.step}</div>
        <div class="flex-1">
          <h4 class="text-sm font-semibold text-white mb-1">${r.title}</h4>
          <p class="text-sm text-gray-400 leading-relaxed">${r.content}</p>
          <div class="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
            <span><i class="fa-regular fa-clock mr-1"></i>${r.time || '待定'}</span>
            <span><i class="fa-solid fa-toolbox mr-1"></i>${(r.tools || []).join('、')}</span>
          </div>
        </div>
      `;
      dom.repairContent.appendChild(div);
    });
  }

  /** 渲染详细报告 */
  function renderReport(result) {
    dom.reportContent.innerHTML = '';

    const sections = [
      {
        title: '📊 检测概览',
        items: [
          ['图像尺寸', `${result.imageWidth} × ${result.imageHeight} px`],
          ['识别元器件', `${result.stats.totalComponents} 个`],
          ['检测缺陷', `${result.stats.totalDefects} 处`],
          ['健康指数', `${result.stats.health}%`],
          ['处理耗时', `${result.stats.processingTime.toFixed(1)} 秒`],
          ['检测时间', new Date(result.timestamp).toLocaleString('zh-CN')],
        ],
      },
      {
        title: '🔍 元器件分类统计',
        items: (() => {
          const counts = {};
          result.components.forEach(c => { counts[c.label] = (counts[c.label] || 0) + 1; });
          return Object.entries(counts).map(([k, v]) => [k, `${v} 个`]);
        })(),
      },
      {
        title: '⚠️ 缺陷严重程度分布',
        items: (() => {
          const sev = { critical: 0, high: 0, medium: 0, low: 0 };
          result.defects.forEach(d => { sev[d.severity]++; });
          return Object.entries(sev).map(([k, v]) => [
            { critical: '🔴 严重', high: '🟠 较高', medium: '🟡 中等', low: '⚪ 较低' }[k] || k,
            `${v} 处`,
          ]);
        })(),
      },
    ];

    if (result.defects.length === 0) {
      sections.push({
        title: '✅ 结论',
        items: [['', 'PCB 焊接质量良好，未检测到明显缺陷。建议进行电气性能测试验证。']],
      });
    } else {
      sections.push({
        title: '📋 综合结论',
        items: [
          ['总体评价', result.stats.health >= 80 ? 'PCB 状态良好，少量轻微问题建议修复' : result.stats.health >= 50 ? 'PCB 存在较多问题，建议全面检修' : 'PCB 存在严重问题，必须立即返修'],
          ['建议行动', result.defects.some(d => d.severity === 'critical') ? '立即停止使用，进行全面返修' : '按优先级逐步修复检测到的缺陷'],
        ],
      });
    }

    sections.forEach(s => {
      const div = document.createElement('div');
      div.className = 'mb-4';
      div.innerHTML = `<h4 class="text-sm font-semibold text-gray-200 mb-2">${s.title}</h4>
        <div class="bg-slate-900/50 rounded-lg p-3">
          ${s.items.map(([k, v]) => `<div class="flex justify-between py-1 text-sm ${k ? '' : ''}"><span class="text-gray-400">${k}</span><span class="text-gray-200 font-mono ${!k ? 'text-gray-400' : ''}">${v}</span></div>`).join('')}
        </div>`;
      dom.reportContent.appendChild(div);
    });
  }

  // ================================================================
  // 标注渲染（预览区 & 结果区）
  // ================================================================
  function renderAnnotations() {
    if (!state.imageEl || !state.result) return;
    renderResultAnnotations(state.result);
  }

  function renderResultAnnotations(result) {
    const layer = dom.resultAnnotationLayer;
    layer.innerHTML = '';

    const container = layer.parentElement;
    const containerRect = container.getBoundingClientRect();
    const img = container.querySelector('img');
    if (!img) return;

    // 计算图片在容器中的实际显示区域
    const imgRect = img.getBoundingClientRect();
    const scaleX = imgRect.width / result.imageWidth;
    const scaleY = imgRect.height / result.imageHeight;
    const offsetX = imgRect.left - containerRect.left;
    const offsetY = imgRect.top - containerRect.top;

    const showComps = dom.toggleComponents.checked;
    const showDefs = dom.toggleDefects.checked;

    // 渲染元器件标注
    if (showComps) {
      result.components.forEach(c => {
        const box = _createAnnotationBox(c, scaleX, scaleY, offsetX, offsetY, 'component');
        layer.appendChild(box);
      });
    }

    // 渲染缺陷标注
    if (showDefs) {
      result.defects.forEach(d => {
        const sevClass = d.severity === 'critical' || d.severity === 'high' ? 'defect' : 'warning';
        const box = _createAnnotationBox(d, scaleX, scaleY, offsetX, offsetY, sevClass);
        layer.appendChild(box);
      });
    }
  }

  function _createAnnotationBox(item, scaleX, scaleY, offsetX, offsetY, type) {
    const div = document.createElement('div');
    const b = item.bbox;
    div.className = `annotation-box type-${type}`;
    div.style.left = `${b.x * scaleX + offsetX}px`;
    div.style.top = `${b.y * scaleY + offsetY}px`;
    div.style.width = `${b.w * scaleX}px`;
    div.style.height = `${b.h * scaleY}px`;

    const labelText = item.designator || item.label || item.id;
    const conf = item.confidence ? `${(item.confidence * 100).toFixed(0)}%` : '';

    div.innerHTML = `<span class="annotation-label">${labelText} ${conf}</span>`;

    // 悬停显示详情
    div.addEventListener('mouseenter', () => {
      const detail = item.name || item.description || '';
      div.setAttribute('data-tooltip', detail);
    });

    return div;
  }

  // ================================================================
  // 模态框管理
  // ================================================================
  function openModal(el) {
    el.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeAllModals() {
    $$('.modal-overlay').forEach(el => el.classList.add('hidden'));
    document.body.style.overflow = '';
  }

  // ================================================================
  // 设置管理
  // ================================================================
  function _loadSettings() {
    try {
      const saved = localStorage.getItem('circuitvision_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(state.settings, parsed);
        AI_SERVICE_CONFIG.mode = parsed.mode || 'mock';
        AI_SERVICE_CONFIG.apiType = parsed.apiType || 'openai';
        AI_SERVICE_CONFIG.endpoint = parsed.endpoint || 'https://api.openai.com/v1/chat/completions';
        AI_SERVICE_CONFIG.apiKey = parsed.apiKey || '';
        AI_SERVICE_CONFIG.model = parsed.model || 'gpt-4o';
        AI_SERVICE_CONFIG.temperature = parsed.temperature || 0.1;
        AI_SERVICE_CONFIG.maxTokens = parsed.maxTokens || 4096;
      }
    } catch (e) { console.warn('加载设置失败', e); }

    // 同步UI
    dom.apiEndpoint.value = AI_SERVICE_CONFIG.endpoint;
    dom.apiModel.value = AI_SERVICE_CONFIG.model;
    dom.apiTemperature.value = AI_SERVICE_CONFIG.temperature;
    dom.apiMaxTokens.value = AI_SERVICE_CONFIG.maxTokens;

    if (AI_SERVICE_CONFIG.mode === 'api') {
      document.querySelector('.mode-btn[data-mode="api"]')?.click();
    }
  }

  function saveSettings() {
    const mode = document.querySelector('.mode-btn.active')?.dataset?.mode || 'mock';
    const settings = {
      mode,
      apiType: dom.apiType.value,
      endpoint: dom.apiEndpoint.value.trim(),
      apiKey: dom.apiKey.value.trim(),
      model: dom.apiModel.value.trim(),
      temperature: parseFloat(dom.apiTemperature.value) || 0.1,
      maxTokens: parseInt(dom.apiMaxTokens.value) || 4096,
    };

    try {
      localStorage.setItem('circuitvision_settings', JSON.stringify(settings));
      Object.assign(state.settings, settings);
      AI_SERVICE_CONFIG.mode = settings.mode;
      AI_SERVICE_CONFIG.apiType = settings.apiType;
      AI_SERVICE_CONFIG.endpoint = settings.endpoint;
      AI_SERVICE_CONFIG.apiKey = settings.apiKey;
      AI_SERVICE_CONFIG.model = settings.model;
      AI_SERVICE_CONFIG.temperature = settings.temperature;
      AI_SERVICE_CONFIG.maxTokens = settings.maxTokens;

      closeAllModals();
      showToast('配置已保存', 'success');
    } catch (e) {
      showToast('保存失败: ' + e.message, 'error');
    }
  }

  async function testApi() {
    const config = {
      endpoint: dom.apiEndpoint.value.trim(),
      apiKey: dom.apiKey.value.trim(),
      model: dom.apiModel.value.trim(),
    };
    dom.btnTestApi.disabled = true;
    dom.btnTestApi.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 测试中...';

    try {
      const result = await testApiConnection(config);
      if (result.ok) {
        showToast('✅ API 连接成功！', 'success');
        dom.btnTestApi.innerHTML = '<i class="fa-solid fa-check"></i> 连接成功';
      } else {
        showToast(`❌ 连接失败 (${result.status})`, 'error');
        dom.btnTestApi.innerHTML = '<i class="fa-solid fa-vial"></i> 测试连接';
      }
    } catch (err) {
      showToast(`❌ 连接失败: ${err.message}`, 'error');
      dom.btnTestApi.innerHTML = '<i class="fa-solid fa-vial"></i> 测试连接';
    }
    dom.btnTestApi.disabled = false;
  }

  // ================================================================
  // Toast 通知
  // ================================================================
  function showToast(message, type) {
    const colors = { success: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300', error: 'border-red-500/50 bg-red-500/10 text-red-300', warning: 'border-amber-500/50 bg-amber-500/10 text-amber-300' };
    const toast = document.createElement('div');
    toast.className = `fixed top-20 right-4 z-[200] px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl text-sm animate-slide-up ${colors[type] || colors.success}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
  }

  function showExportStatus(msg, cls) {
    dom.exportStatus.textContent = msg;
    dom.exportStatus.className = `mt-3 text-sm ${cls}`;
    setTimeout(() => { if (dom.exportStatus.textContent === msg) dom.exportStatus.textContent = ''; }, 4000);
  }

  // ================================================================
  // 工具函数
  // ================================================================
  function _formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  // ================================================================
  // 启动
  // ================================================================
  document.addEventListener('DOMContentLoaded', init);

})();
