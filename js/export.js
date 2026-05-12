/**
 * CircuitVision Debugger — 导出功能模块
 * ======================================
 * 支持：JSON / CSV / HTML报告 / 截图导出
 */

const ExportManager = {

  /**
   * 导出检测结果为 JSON 文件
   * @param {Object} result - 检测结果对象
   */
  toJSON(result) {
    const data = {
      project: 'CircuitVision Debugger',
      version: '1.0.0',
      timestamp: result.timestamp || new Date().toISOString(),
      stats: result.stats,
      summary: {
        imageWidth: result.imageWidth,
        imageHeight: result.imageHeight,
        totalComponents: result.components.length,
        totalDefects: result.defects.length,
        healthScore: result.stats?.health || 100,
      },
      components: result.components.map(c => ({
        id: c.id,
        type: c.type,
        label: c.label,
        designator: c.designator,
        name: c.name,
        confidence: +(c.confidence * 100).toFixed(1) + '%',
        position: {
          x: Math.round(c.bbox.x),
          y: Math.round(c.bbox.y),
          width: Math.round(c.bbox.w),
          height: Math.round(c.bbox.h),
        },
      })),
      defects: result.defects.map(d => ({
        id: d.id,
        type: d.type,
        label: d.label,
        severity: d.severity,
        risk: d.risk,
        description: d.description,
        confidence: +(d.confidence * 100).toFixed(1) + '%',
        position: {
          x: Math.round(d.bbox.x),
          y: Math.round(d.bbox.y),
          width: Math.round(d.bbox.w),
          height: Math.round(d.bbox.h),
        },
        relatedComponent: d.relatedComponent,
        repairTime: d.repairTime,
        tools: d.tools,
      })),
      repairs: result.repairs.map(r => ({
        step: r.step,
        title: r.title,
        content: r.content,
        severity: r.severity,
        time: r.time,
        tools: r.tools,
      })),
    };

    this._downloadFile(
      JSON.stringify(data, null, 2),
      `circuitvision-report-${this._timestamp()}.json`,
      'application/json'
    );
  },

  /**
   * 导出检测结果为 CSV 格式
   */
  toCSV(result) {
    // 元器件CSV
    const compHeaders = ['编号', '类型', '标号', '名称', '置信度', '位置X', '位置Y', '宽度', '高度'];
    const compRows = result.components.map(c => [
      c.id, c.label, c.designator, c.name,
      (c.confidence * 100).toFixed(1) + '%',
      Math.round(c.bbox.x), Math.round(c.bbox.y),
      Math.round(c.bbox.w), Math.round(c.bbox.h),
    ]);

    // 缺陷CSV
    const defHeaders = ['编号', '类型', '缺陷名称', '严重程度', '风险', '描述', '置信度', '位置X', '位置Y', '关联元件', '维修时间'];
    const defRows = result.defects.map(d => [
      d.id, d.type, d.label, d.severity, d.risk, d.description,
      (d.confidence * 100).toFixed(1) + '%',
      Math.round(d.bbox.x), Math.round(d.bbox.y),
      d.relatedComponent, d.repairTime,
    ]);

    const escCsv = v => `"${String(v || '').replace(/"/g, '""')}"`;

    let csv = '=== CircuitVision Debugger 检测报告 ===\n';
    csv += `生成时间,${result.timestamp || new Date().toISOString()}\n`;
    csv += `健康指数,${result.stats?.health || 100}%\n\n`;
    csv += '--- 元器件清单 ---\n';
    csv += compHeaders.join(',') + '\n';
    compRows.forEach(r => csv += r.map(escCsv).join(',') + '\n');
    csv += '\n--- 故障缺陷清单 ---\n';
    csv += defHeaders.join(',') + '\n';
    defRows.forEach(r => csv += r.map(escCsv).join(',') + '\n');

    this._downloadFile(
      '\uFEFF' + csv,
      `circuitvision-report-${this._timestamp()}.csv`,
      'text/csv;charset=utf-8'
    );
  },

  /**
   * 导出为 HTML 格式报告
   */
  toHTML(result) {
    const t = result.timestamp ? new Date(result.timestamp).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN');
    const health = result.stats?.health || 100;
    const healthColor = health >= 80 ? '#10b981' : health >= 50 ? '#f59e0b' : '#ef4444';

    const compRows = result.components.map(c => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #333;">${c.designator}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #333;">${c.label}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #333;">${c.name}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #333;">${(c.confidence * 100).toFixed(1)}%</td>
      </tr>`).join('');

    const defRows = result.defects.map(d => {
      const sevColor = d.severity === 'critical' ? '#ef4444' : d.severity === 'high' ? '#f97316' : d.severity === 'medium' ? '#eab308' : '#6b7280';
      return `<tr>
        <td style="padding:6px 10px;border-bottom:1px solid #333;">${d.label}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #333;color:${sevColor};">${d.risk}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #333;">${d.description}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #333;">${d.relatedComponent}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #333;">${d.repairTime}</td>
      </tr>`;
    }).join('');

    const repairItems = result.repairs.map(r => `
      <div style="margin-bottom:12px;padding:12px 16px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:3px solid ${r.severity === 'high' ? '#ef4444' : r.severity === 'warning' ? '#f59e0b' : '#10b981'};">
        <h4 style="margin:0 0 6px;color:#00d4ff;font-size:14px;">步骤 ${r.step}: ${r.title}</h4>
        <p style="margin:0;color:#aaa;font-size:13px;line-height:1.6;">${r.content}</p>
        <p style="margin:6px 0 0;color:#666;font-size:12px;">预计耗时: ${r.time || '待定'} | 工具: ${(r.tools || []).join('、')}</p>
      </div>`).join('');

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>CircuitVision 检测报告</title>
<style>
  body{font-family:'Inter',system-ui,sans-serif;background:#080c1a;color:#e5e7eb;margin:0;padding:20px;line-height:1.6;}
  .container{max-width:900px;margin:0 auto;}
  h1{color:#00d4ff;font-size:24px;border-bottom:1px solid #1f2937;padding-bottom:12px;}
  h2{color:#fff;font-size:18px;margin-top:24px;}
  .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;background:rgba(0,212,255,0.15);color:#00d4ff;}
  table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;}
  th{text-align:left;padding:8px 10px;border-bottom:2px solid #1f2937;color:#9ca3af;font-weight:600;}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:16px 0;}
  .stat-box{padding:16px;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.06);text-align:center;}
  .stat-value{font-size:28px;font-weight:700;color:#fff;}
  .stat-label{font-size:12px;color:#6b7280;margin-top:4px;}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #1f2937;font-size:12px;color:#6b7280;}
</style></head>
<body><div class="container">
  <h1>🖥  CircuitVision Debugger — PCB检测报告</h1>
  <p style="color:#9ca3af;">生成时间: ${t} &nbsp;|&nbsp; <span class="badge">健康指数: ${health}%</span></p>

  <div class="stats">
    <div class="stat-box"><div class="stat-value">${result.components.length}</div><div class="stat-label">识别元器件</div></div>
    <div class="stat-box"><div class="stat-value" style="color:${result.defects.length > 0 ? '#ef4444' : '#10b981'}">${result.defects.length}</div><div class="stat-label">检测缺陷</div></div>
    <div class="stat-box"><div class="stat-value" style="color:${healthColor}">${health}%</div><div class="stat-label">健康指数</div></div>
  </div>

  <h2>📋 元器件清单</h2>
  <table><thead><tr><th>标号</th><th>类型</th><th>名称</th><th>置信度</th></tr></thead><tbody>${compRows}</tbody></table>

  ${result.defects.length > 0 ? `<h2>⚠️  故障缺陷清单</h2>
  <table><thead><tr><th>缺陷类型</th><th>风险等级</th><th>描述</th><th>关联元件</th><th>预计维修时间</th></tr></thead><tbody>${defRows}</tbody></table>` : ''}

  <h2>🔧 维修建议</h2>
  ${repairItems}

  <div class="footer">
    <p>Generated by CircuitVision Debugger v1.0.0 | AI-Powered PCB Visual Inspection</p>
    <p>${new Date().toISOString()}</p>
  </div>
</div></body></html>`;

    this._downloadFile(html, `circuitvision-report-${this._timestamp()}.html`, 'text/html;charset=utf-8');
  },

  /**
   * 截图导出 — 将带标注的图像导出为图片
   * @param {HTMLElement} containerEl - 包含图片和标注的容器
   */
  toImage(containerEl) {
    return new Promise((resolve, reject) => {
      try {
        // 使用 canvas 合并图片与标注
        const img = containerEl.querySelector('img');
        if (!img) { reject(new Error('未找到图片')); return; }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const rect = containerEl.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // 绘制背景
        ctx.fillStyle = '#080c1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制图片
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 绘制水印
        ctx.fillStyle = 'rgba(0,212,255,0.3)';
        ctx.font = '12px Inter, sans-serif';
        ctx.fillText('CircuitVision Debugger', 10, 20);

        // 导出
        canvas.toBlob(blob => {
          if (!blob) { reject(new Error('截图生成失败')); return; }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `circuitvision-snapshot-${ExportManager._timestamp()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          resolve();
        }, 'image/png');
      } catch (err) {
        reject(err);
      }
    });
  },

  /** 下载文件 */
  _downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /** 生成时间戳文件名 */
  _timestamp() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}${String(d.getSeconds()).padStart(2,'0')}`;
  },
};
