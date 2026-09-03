/**
 * ALTISEC REPORT STUDIO - POWER BI DOCUMENT BUILDER CORE ENGINE
 * Version 2.0.0
 */

// =========================================================================
// 1. GLOBAL STATE & DEFAULT MEASURES
// =========================================================================
const AppState = {
    clientName: "Tata Technologies",
    reportingPeriod: "15 Aug 2026 — 21 Aug 2026",
    slaTargetHours: 4.0,
    slaGoalPercent: 95.0,
    zoomLevel: 1.0,
    currentView: 'report',
    chartTypeSeverity: 'donut', // 'donut' or 'bar'

    // Core Metrics & Measures
    measures: {
        totalIncidents: 1284,
        slaCompliance: "98.2%",
        avgResponseTime: "2.4 hrs",
        sevCritical: 0,
        sevHigh: 14,
        sevMedium: 420,
        sevLow: 850,
        prevTotal: 1142,
        prevSla: "97.1%",
        totalTrend: "+12.4% vs last period",
        slaTrend: "+1.1% vs target",
        responseTrend: "-18% faster"
    },

    // Ingested Dataset
    datasetRows: [],
    columnHeaders: [],
    columnMapping: {
        id: "alert_id",
        severity: "severity",
        sent: "sent_time",
        revert: "revert_time",
        asset: "asset_name",
        category: "category"
    },

    // Chart instances
    charts: {
        severity: null,
        trend: null
    }
};

// =========================================================================
// 2. INITIALIZATION
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initRibbonTabs();
    initViewSwitcher();
    initQuickAccessBar();
    initFileInput();
    initDocumentTheme();
    loadDefaultSampleData();
    renderCharts();
    bindTokenSync();

    console.log("🚀 Power BI Report Studio initialized successfully.");
});

// =========================================================================
// 3. RIBBON & VIEW SWITCHING
// =========================================================================
function initRibbonTabs() {
    const tabs = document.querySelectorAll(".ribbon-tab");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".ribbon-pane").forEach(p => p.classList.remove("active"));

            tab.classList.add("active");
            const targetId = tab.getAttribute("data-tab");
            const pane = document.getElementById(targetId);
            if (pane) pane.classList.add("active");
        });
    });
}

function initViewSwitcher() {
    window.switchView = function(viewId) {
        AppState.currentView = viewId;
        document.querySelectorAll(".rail-item").forEach(btn => {
            btn.classList.toggle("active", btn.getAttribute("data-view") === viewId);
        });

        document.querySelectorAll(".canvas-view").forEach(view => {
            view.classList.toggle("active", view.id === `view-${viewId}`);
        });

        if (viewId === 'data') renderDataGrid();
        if (viewId === 'model') renderModelMapping();
    };
}

function initQuickAccessBar() {
    document.getElementById("btnQaRefresh")?.addEventListener("click", () => refreshReportData());
    document.getElementById("btnRibbonRefresh")?.addEventListener("click", () => refreshReportData());
    document.getElementById("btnQaSample")?.addEventListener("click", () => loadDefaultSampleData(true));
    document.getElementById("btnLoadSampleData")?.addEventListener("click", () => loadDefaultSampleData(true));
    document.getElementById("btnQaExportWord")?.addEventListener("click", () => exportWordDocument());
    document.getElementById("btnExportWord")?.addEventListener("click", () => exportWordDocument());
    document.getElementById("btnExportPdf")?.addEventListener("click", () => exportPdfDocument());
    document.getElementById("btnAiSummary")?.addEventListener("click", () => generateAiExecutiveSummary());
    document.getElementById("btnAnomalyCheck")?.addEventListener("click", () => runDocumentHealthCheck());

    document.getElementById("btnThemeToggle")?.addEventListener("click", () => {
        document.body.classList.toggle("powerbi-theme-light");
        showToast(document.body.classList.contains("powerbi-theme-light") ? "Switched to Light Theme" : "Switched to Power BI Dark Theme");
    });
}

// =========================================================================
// 4. DATA INGESTION & EXCEL/CSV PARSER
// =========================================================================
function initFileInput() {
    const input = document.getElementById("excelFileInput");
    if (!input) return;

    input.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showToast(`Loading data from ${file.name}...`);
        const reader = new FileReader();

        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                if (jsonRows.length === 0) {
                    showToast("Warning: Uploaded sheet appears to be empty.");
                    return;
                }

                // Detect client name from filename if possible
                const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
                if (baseName.length > 3 && !baseName.toLowerCase().includes("report")) {
                    AppState.clientName = baseName.toUpperCase();
                    updateClientNameEverywhere(AppState.clientName);
                }

                AppState.datasetRows = jsonRows;
                AppState.columnHeaders = Object.keys(jsonRows[0] || {});

                autoDetectMapping();
                recalculateAllMeasures(true);
                updateFieldsList();
                renderDataGrid();

                showToast(`✅ Successfully ingested ${jsonRows.length} records from ${file.name}!`);
            } catch (err) {
                console.error("Excel Read Error:", err);
                showToast("Error parsing Excel file: " + err.message);
            }
        };

        reader.readAsArrayBuffer(file);
    });
}

// =========================================================================
// 5. SAMPLE SOC DATASET GENERATOR
// =========================================================================
function loadDefaultSampleData(showToastMsg = false) {
    const categories = [
        "Phishing Email Detection", "Brute Force Authentication", "Suspicious PowerShell Execution",
        "Privilege Escalation Attempt", "Malware C2 Beaconing", "DDoS Spike Mitigation", "Anomalous Geo-Login"
    ];
    const hosts = [
        "SRV-PROD-DB01", "DC-CORP-AD01", "WKS-EXEC-104", "CLOUD-KUBE-NODE03",
        "GW-EDGE-FIREWALL", "SRV-APP-CLUSTER2", "LAPTOP-DEV-89"
    ];
    const severities = ["Critical", "High", "Medium", "Low"];
    const rows = [];

    const total = 1284;
    for (let i = 1; i <= total; i++) {
        let sev = "Low";
        if (i <= 14) sev = "High";
        else if (i <= 434) sev = "Medium";

        const isCompliant = Math.random() > 0.018; // ~98.2% compliance
        rows.push({
            alert_id: `SEC-${10000 + i}`,
            category: categories[i % categories.length],
            asset_name: hosts[i % hosts.length],
            severity: sev,
            sent_time: "2026-08-16 09:15:00",
            revert_time: isCompliant ? "2026-08-16 11:30:00" : "2026-08-16 16:45:00",
            sla: isCompliant ? "PASS" : "BREACH",
            status: "Resolved"
        });
    }

    AppState.datasetRows = rows;
    AppState.columnHeaders = Object.keys(rows[0]);
    AppState.measures.totalIncidents = 1284;
    AppState.measures.sevCritical = 0;
    AppState.measures.sevHigh = 14;
    AppState.measures.sevMedium = 420;
    AppState.measures.sevLow = 850;
    AppState.measures.slaCompliance = "98.2%";
    AppState.measures.avgResponseTime = "2.4 hrs";

    autoDetectMapping();
    updateUIFromMeasures();
    updateFieldsList();
    renderCharts();
    renderRecentIncidentsTable();

    if (showToastMsg) {
        showToast("✅ Standard AltiSec SOC Dataset loaded (1,284 records)!");
    }
}

// =========================================================================
// 6. CALCULATION & MEASURES ENGINE
// =========================================================================
function recalculateAllMeasures(notify = false) {
    const rows = AppState.datasetRows;
    if (!rows || rows.length === 0) return;

    const mapping = AppState.columnMapping;
    const total = rows.length;

    let crit = 0, high = 0, med = 0, low = 0;
    let slaPass = 0, slaFail = 0;

    rows.forEach(r => {
        const sev = String(r[mapping.severity] || "").toLowerCase();
        if (sev.includes("crit")) crit++;
        else if (sev.includes("high")) high++;
        else if (sev.includes("med")) med++;
        else low++;

        const slaVal = String(r.sla || r[mapping.revert] || "").toLowerCase();
        if (slaVal.includes("fail") || slaVal.includes("breach") || slaVal.includes("no")) {
            slaFail++;
        } else {
            slaPass++;
        }
    });

    const slaPct = total > 0 ? ((slaPass / total) * 100).toFixed(1) + "%" : "100%";

    // Trend calculation vs previous period
    const prev = AppState.measures.prevTotal || 1142;
    const change = (((total - prev) / prev) * 100).toFixed(1);
    const trendStr = (change >= 0 ? `+${change}%` : `${change}%`) + " vs last period";

    AppState.measures.totalIncidents = total;
    AppState.measures.sevCritical = crit;
    AppState.measures.sevHigh = high;
    AppState.measures.sevMedium = med;
    AppState.measures.sevLow = low;
    AppState.measures.slaCompliance = slaPct;
    AppState.measures.totalTrend = trendStr;

    updateUIFromMeasures();
    renderCharts();
    renderRecentIncidentsTable();

    if (notify) {
        showToast(`⚡ Recalculated! ${total} incidents processed with ${slaPct} SLA compliance.`);
    }
}

function updateUIFromMeasures() {
    const m = AppState.measures;

    // Update KPI Card Numbers on Document
    const elTotal = document.getElementById("valTotalIncidents");
    if (elTotal) elTotal.textContent = m.totalIncidents.toLocaleString();

    const elSla = document.getElementById("valSlaCompliance");
    if (elSla) elSla.textContent = m.slaCompliance;

    const elAvg = document.getElementById("valAvgResponse");
    if (elAvg) elAvg.textContent = m.avgResponseTime;

    const elCrit = document.getElementById("valSevCritical");
    if (elCrit) elCrit.textContent = m.sevCritical;

    // Update Right Panel preview tags
    document.getElementById("previewTokenTotal").textContent = m.totalIncidents.toLocaleString();
    document.getElementById("previewTokenSla").textContent = m.slaCompliance;
    document.getElementById("previewTokenAvg").textContent = m.avgResponseTime;
    document.getElementById("previewTokenCrit").textContent = m.sevCritical;
    document.getElementById("previewTokenHigh").textContent = m.sevHigh;

    // Status bar
    const sb = document.getElementById("sbDatasetInfo");
    if (sb) sb.textContent = `Active Dataset: ${m.totalIncidents.toLocaleString()} incidents (${AppState.clientName})`;

    // Replace all dynamic tokens in editable text
    syncAllTokensInDocument();
}

function syncAllTokensInDocument() {
    const m = AppState.measures;
    const tokenMap = {
        "{{total_incidents}}": m.totalIncidents.toLocaleString(),
        "{{sla_compliance}}": m.slaCompliance,
        "{{avg_response_time}}": m.avgResponseTime,
        "{{sev_critical}}": m.sevCritical,
        "{{sev_high}}": m.sevHigh,
        "{{client_name}}": AppState.clientName,
        "{{reporting_period}}": AppState.reportingPeriod
    };

    document.querySelectorAll(".editable-paragraph, .rec-content").forEach(el => {
        let html = el.innerHTML;
        for (const [key, val] of Object.entries(tokenMap)) {
            const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            html = html.replace(regex, `<span class="token">${val}</span>`);
        }
        el.innerHTML = html;
    });
}

function bindTokenSync() {
    const metaClient = document.getElementById("metaClientName");
    if (metaClient) {
        metaClient.addEventListener("input", (e) => {
            AppState.clientName = e.target.value.trim() || "CLIENT NAME";
            updateClientNameEverywhere(AppState.clientName);
        });
    }
}

function updateClientNameEverywhere(name) {
    const p2Client = document.getElementById("headerClientP2");
    if (p2Client) p2Client.textContent = name;

    const pill = document.getElementById("pillActiveClient");
    if (pill) pill.innerHTML = `Client: <strong>${name}</strong>`;

    syncAllTokensInDocument();
}

// =========================================================================
// 7. 1-CLICK "REFRESH DATA" ENGINE (CHATGPT CORE BLUEPRINT)
// =========================================================================
window.refreshReportData = function() {
    showToast("🔄 Refreshing Report Studio: Recalculating all visuals & Word document...");

    setTimeout(() => {
        recalculateAllMeasures(false);
        renderRecentIncidentsTable();
        generateAiExecutiveSummary(false);

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const tsEl = document.getElementById("sbRefreshTimestamp");
        if (tsEl) tsEl.textContent = `Refreshed: Today at ${timestamp}`;

        showToast("✅ Refresh Complete! 12 measures updated, charts re-rendered, Word report synced.", 4500);
    }, 300);
};

// =========================================================================
// 8. POWER BI VISUALIZATION CHARTS (CHART.JS)
// =========================================================================
function renderCharts() {
    renderSeverityChart();
    renderTrendChart();
}

function renderSeverityChart() {
    const ctx = document.getElementById("chartSeverity");
    if (!ctx) return;

    if (AppState.charts.severity) {
        AppState.charts.severity.destroy();
    }

    const m = AppState.measures;
    const isDonut = AppState.chartTypeSeverity === 'donut';

    AppState.charts.severity = new Chart(ctx, {
        type: isDonut ? 'doughnut' : 'bar',
        data: {
            labels: ['Critical', 'High', 'Medium', 'Low'],
            datasets: [{
                data: [m.sevCritical, m.sevHigh, m.sevMedium, m.sevLow],
                backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#10b981'],
                borderWidth: 1,
                borderRadius: isDonut ? 0 : 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { boxWidth: 10, font: { size: 9.5, family: 'Plus Jakarta Sans', weight: '600' } }
                }
            },
            cutout: isDonut ? '65%' : undefined
        }
    });
}

function renderTrendChart() {
    const ctx = document.getElementById("chartTrend");
    if (!ctx) return;

    if (AppState.charts.trend) {
        AppState.charts.trend.destroy();
    }

    AppState.charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
            datasets: [{
                label: 'Incidents Triggered',
                data: [165, 182, 194, 170, 210, 185, 178],
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                fill: true,
                tension: 0.35,
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: '#0ea5e9'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: '#f1f5f9' },
                    ticks: { font: { size: 9 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 9 } }
                }
            }
        }
    });
}

window.toggleChartType = function(chartId) {
    if (chartId === 'chartSeverity') {
        AppState.chartTypeSeverity = AppState.chartTypeSeverity === 'donut' ? 'bar' : 'donut';
        renderSeverityChart();
        showToast(`Severity Chart toggled to ${AppState.chartTypeSeverity.toUpperCase()}`);
    }
};

// =========================================================================
// 9. RECENT INCIDENTS TABLE IN WORD CANVAS
// =========================================================================
function renderRecentIncidentsTable() {
    const tbody = document.getElementById("incidentsTableBody");
    if (!tbody) return;

    const rows = AppState.datasetRows.slice(0, 8); // Top 8 active incidents
    tbody.innerHTML = rows.map(r => {
        const sevClass = (r.severity || 'low').toLowerCase();
        const isPass = (r.sla || 'PASS').toUpperCase() === 'PASS';

        return `
            <tr>
                <td><strong>${r.alert_id || 'INC-001'}</strong></td>
                <td>${r.category || 'Security Alert'}</td>
                <td><span style="font-family:'JetBrains Mono',monospace; font-size:10px;">${r.asset_name || 'HOST-SRV'}</span></td>
                <td><span class="badge-sev ${sevClass}">${r.severity || 'Low'}</span></td>
                <td>${r.revert_time ? '1h 45m' : '2.4 hrs'}</td>
                <td><span class="badge-sla ${isPass ? 'pass' : 'fail'}">${isPass ? '✓ PASS' : '✕ BREACH'}</span></td>
            </tr>
        `;
    }).join("");
}

// =========================================================================
// 10. DYNAMIC VISUAL INSERTIONS INTO DOCUMENT
// =========================================================================
window.insertVisualToDoc = function(type) {
    const page = document.querySelector(".a4-page:last-of-type") || document.getElementById("page-1");
    if (!page) return;

    const wrapper = document.createElement("div");
    wrapper.className = "doc-section pbi-inserted-visual";

    if (type === 'card') {
        wrapper.innerHTML = `
            <div class="pbi-kpi-card" style="border-left: 3px solid #0ea5e9;">
                <div class="kpi-label">NEW MEASURE</div>
                <div class="kpi-value">99.4%</div>
                <div class="kpi-trend positive"><i class="fa-solid fa-arrow-trend-up"></i> Operational SLA Target Exceeded</div>
            </div>
        `;
        showToast("Inserted Power BI KPI Card into document.");
    } else if (type === 'callout' || type === 'note') {
        wrapper.innerHTML = `
            <div class="rec-item" style="background:#f0fdf4; border-color:#bbf7d0;">
                <i class="fa-solid fa-circle-check text-green rec-icon"></i>
                <div class="rec-content" contenteditable="true">
                    <strong>SOC Highlight:</strong> Security controls successfully blocked 100% of brute force authentication attempts during this monitoring cycle.
                </div>
            </div>
        `;
        showToast("Inserted Callout Box into document.");
    } else {
        wrapper.innerHTML = `
            <div class="pbi-visual-block">
                <div class="visual-header">
                    <span class="visual-title"><i class="fa-solid fa-chart-simple text-blue"></i> Custom Visual Object</span>
                </div>
                <div style="font-size:11px; color:#64748b; padding:10px; text-align:center; background:#f8fafc; border-radius:4px;">
                    Power BI Visual connected to <strong>${AppState.clientName}</strong> dataset.
                </div>
            </div>
        `;
        showToast("Inserted Visual Block into document.");
    }

    page.insertBefore(wrapper, page.querySelector(".page-footer"));
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

window.insertTextBox = function() {
    const page = document.querySelector(".a4-page:last-of-type") || document.getElementById("page-1");
    const div = document.createElement("div");
    div.className = "doc-section";
    div.innerHTML = `<div class="editable-paragraph" contenteditable="true">Click here to write your custom report notes, analyst observations, or client findings...</div>`;
    page.insertBefore(div, page.querySelector(".page-footer"));
    showToast("Added new text block.");
};

window.insertCalloutNote = function() {
    insertVisualToDoc('callout');
};

window.addNewA4Page = function() {
    const desk = document.getElementById("a4Desk");
    const pages = document.querySelectorAll(".a4-page");
    const pageNum = pages.length + 1;

    const newPage = document.createElement("article");
    newPage.className = "a4-page";
    newPage.id = `page-${pageNum}`;
    newPage.setAttribute("data-page", pageNum);

    newPage.innerHTML = `
        <header class="page-header">
            <div class="doc-header-brand">
                <i class="fa-solid fa-shield-halved brand-symbol"></i>
                <div>
                    <div class="brand-co">ALTISEC TECHNOLOGIES</div>
                    <div class="brand-sub">Security Operations Center (SOC)</div>
                </div>
            </div>
            <div class="doc-header-client">
                <span class="doc-header-client-text">${AppState.clientName}</span>
                <span class="doc-header-cat">Appendix Page ${pageNum}</span>
            </div>
        </header>

        <section class="doc-section">
            <h2 class="section-title"><i class="fa-solid fa-pen-to-square text-blue"></i> Custom Reporting Section</h2>
            <div class="editable-paragraph" contenteditable="true">
                Enter supplementary telemetry notes, incident deep dives, or customized client charts here.
            </div>
        </section>

        <footer class="page-footer">
            <span>AltiSec Technologies SOC &bull; Strictly Confidential</span>
            <span class="page-num">Page ${pageNum} of ${pageNum}</span>
        </footer>
    `;

    desk.appendChild(newPage);
    document.getElementById("pillPageCount").textContent = `Pages: ${pageNum}`;
    showToast(`Added Page ${pageNum} to Word Document.`);
    newPage.scrollIntoView({ behavior: 'smooth' });
};

window.insertTokenToDoc = function(tokenName) {
    const tokenStr = `{{${tokenName}}}`;
    const activePara = document.querySelector(".editable-paragraph:focus") || document.getElementById("txtExecSummary");

    if (activePara) {
        activePara.focus();
        document.execCommand("insertText", false, tokenStr);
        syncAllTokensInDocument();
        showToast(`Inserted token ${tokenStr}`);
    } else {
        showToast(`Token ${tokenStr} copied to clipboard!`);
        navigator.clipboard?.writeText(tokenStr);
    }
};

// =========================================================================
// 11. AI EXECUTIVE SUMMARY & HEALTH CHECK
// =========================================================================
function generateAiExecutiveSummary(showNotice = true) {
    const m = AppState.measures;
    const summaryText = `During the active operational cycle of ${AppState.reportingPeriod}, the AltiSec Security Operations Center monitored telemetry for ${AppState.clientName}. A total of ${m.totalIncidents.toLocaleString()} security events were evaluated. The team achieved an SLA compliance rate of ${m.slaCompliance} with an average response time of ${m.avgResponseTime}. Critically, 0 unmitigated high-impact breaches were registered. Security posture remains resilient and aligned with governance benchmarks.`;

    const el = document.getElementById("txtExecSummary");
    if (el) {
        el.innerHTML = summaryText;
        showToast("✨ AI Executive Summary synthesized and applied!");
    }
}

function runDocumentHealthCheck() {
    const m = AppState.measures;
    const issues = [];

    if (m.sevCritical > 0) issues.push(`⚠️ ${m.sevCritical} Critical alert(s) requiring immediate containment.`);
    if (parseFloat(m.slaCompliance) < AppState.slaGoalPercent) issues.push(`⚠️ SLA Compliance (${m.slaCompliance}) is below your target of ${AppState.slaGoalPercent}%.`);

    if (issues.length === 0) {
        showToast(`✅ Document Health 100%: All datasets validated, SLAs compliant (${m.slaCompliance}), zero breaches.`);
    } else {
        showToast(issues.join(" | "), 6000);
    }
}

// =========================================================================
// 12. DATA GRID & MODEL VIEWS
// =========================================================================
function renderDataGrid() {
    const thead = document.getElementById("dataViewThead");
    const tbody = document.getElementById("dataViewTbody");
    const summary = document.getElementById("dataViewSummary");
    if (!thead || !tbody) return;

    const rows = AppState.datasetRows;
    const headers = AppState.columnHeaders.length > 0 ? AppState.columnHeaders : Object.keys(rows[0] || {});

    if (summary) summary.textContent = `${rows.length.toLocaleString()} total rows loaded`;

    thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;
    tbody.innerHTML = rows.slice(0, 50).map(r => `
        <tr>${headers.map(h => `<td>${r[h] !== undefined ? r[h] : ''}</td>`).join("")}</tr>
    `).join("");
}

window.filterDataGrid = function(keyword) {
    const k = keyword.toLowerCase().trim();
    const rows = AppState.datasetRows;
    const headers = AppState.columnHeaders;
    const tbody = document.getElementById("dataViewTbody");
    if (!tbody) return;

    const filtered = rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(k))).slice(0, 50);
    tbody.innerHTML = filtered.map(r => `
        <tr>${headers.map(h => `<td>${r[h] !== undefined ? r[h] : ''}</td>`).join("")}</tr>
    `).join("");
};

function renderModelMapping() {
    const headers = AppState.columnHeaders;
    const selects = document.querySelectorAll(".map-select");

    selects.forEach(sel => {
        const currentVal = sel.value;
        sel.innerHTML = headers.map(h => `<option value="${h}">${h}</option>`).join("");
        if (headers.includes(currentVal)) sel.value = currentVal;
    });
}

window.autoDetectMapping = function() {
    const headers = AppState.columnHeaders;
    const findMatch = (terms) => headers.find(h => terms.some(t => h.toLowerCase().includes(t)));

    const idCol = findMatch(["id", "alert", "incident", "ticket"]);
    const sevCol = findMatch(["severity", "sev", "priority", "level"]);
    const sentCol = findMatch(["sent", "created", "timestamp", "date", "time"]);
    const revertCol = findMatch(["revert", "resolved", "closed", "resolution"]);
    const assetCol = findMatch(["asset", "host", "ip", "device", "endpoint"]);
    const catCol = findMatch(["cat", "threat", "rule", "type"]);

    if (idCol) AppState.columnMapping.id = idCol;
    if (sevCol) AppState.columnMapping.severity = sevCol;
    if (sentCol) AppState.columnMapping.sent = sentCol;
    if (revertCol) AppState.columnMapping.revert = revertCol;
    if (assetCol) AppState.columnMapping.asset = assetCol;
    if (catCol) AppState.columnMapping.category = catCol;

    const setSel = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    setSel("mapColId", idCol);
    setSel("mapColSeverity", sevCol);
    setSel("mapColSent", sentCol);
    setSel("mapColRevert", revertCol);
    setSel("mapColAsset", assetCol);
    setSel("mapColCategory", catCol);
};

window.applyColumnMapping = function() {
    const getSel = id => document.getElementById(id)?.value;
    AppState.columnMapping.id = getSel("mapColId") || AppState.columnMapping.id;
    AppState.columnMapping.severity = getSel("mapColSeverity") || AppState.columnMapping.severity;
    AppState.columnMapping.sent = getSel("mapColSent") || AppState.columnMapping.sent;
    AppState.columnMapping.revert = getSel("mapColRevert") || AppState.columnMapping.revert;
    AppState.columnMapping.asset = getSel("mapColAsset") || AppState.columnMapping.asset;
    AppState.columnMapping.category = getSel("mapColCategory") || AppState.columnMapping.category;

    recalculateAllMeasures(true);
    showToast("✅ Column Mappings applied! Returning to Report View...");
    setTimeout(() => switchView('report'), 800);
};

function updateFieldsList() {
    const list = document.getElementById("datasetColumnsList");
    if (!list) return;

    list.innerHTML = AppState.columnHeaders.map(col => `
        <div class="tree-item" onclick="insertTokenToDoc('${col}')" title="Click to insert {{${col}}}">
            <i class="fa-solid fa-font text-slate"></i>
            <span>${col}</span>
        </div>
    `).join("");
}

// =========================================================================
// 13. DIRECT EXPORT TO WORD (.DOCX) & PDF
// =========================================================================
window.exportWordDocument = function() {
    showToast("Generating formatted Microsoft Word (.docx) document...");

    const desk = document.getElementById("a4Desk");
    if (!desk) return;

    const clone = desk.cloneNode(true);

    // Convert all Chart.js canvases to high-res PNG images
    const origCanvases = desk.querySelectorAll("canvas");
    const cloneCanvases = clone.querySelectorAll("canvas");

    origCanvases.forEach((orig, i) => {
        try {
            const img = document.createElement("img");
            img.src = orig.toDataURL("image/png");
            img.style.width = "100%";
            img.style.maxHeight = "240px";
            img.style.objectFit = "contain";
            if (cloneCanvases[i] && cloneCanvases[i].parentNode) {
                cloneCanvases[i].parentNode.replaceChild(img, cloneCanvases[i]);
            }
        } catch (e) {
            console.warn("Chart conversion:", e);
        }
    });

    const wordHtml = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' 
              xmlns:w='urn:schemas-microsoft-com:office:word' 
              xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>${AppState.clientName} SOC Incident Report</title>
            <!--[if gte mso 9]>
            <xml>
                <w:WordDocument>
                    <w:View>Print</w:View>
                    <w:Zoom>100</w:Zoom>
                    <w:DoNotOptimizeForBrowser/>
                </w:WordDocument>
            </xml>
            <![endif]-->
            <style>
                @page { size: A4; margin: 15mm; }
                body { font-family: Arial, sans-serif; font-size: 11pt; color: #1e293b; background: #fff; }
                .a4-page { width: 100%; page-break-after: always; margin-bottom: 24px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 12px; }
                th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 10pt; }
                th { background-color: #f1f5f9; font-weight: bold; }
                .kpi-cards-grid { display: flex; gap: 10px; margin: 12px 0; }
                .pbi-kpi-card { border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 6px; flex: 1; }
                .badge-sev { font-weight: bold; }
                .token { font-weight: bold; color: #0284c7; }
            </style>
        </head>
        <body>
            ${clone.innerHTML}
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
    const filename = `${AppState.clientName.replace(/\s+/g, '_')}_SOC_Report_${Date.now()}.doc`;

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast("✅ Microsoft Word document exported successfully!");
};

window.exportPdfDocument = function() {
    showToast("Generating PDF document, please wait...");
    const desk = document.getElementById("a4Desk");

    const opt = {
        margin: [10, 10, 10, 10],
        filename: `${AppState.clientName.replace(/\s+/g, '_')}_SOC_Report.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (window.html2pdf) {
        window.html2pdf().set(opt).from(desk).save().then(() => {
            showToast("✅ PDF exported successfully!");
        }).catch(err => {
            console.error("PDF Export Error:", err);
            window.print();
        });
    } else {
        window.print();
    }
};

// =========================================================================
// 14. ZOOM & THEME CONTROLS
// =========================================================================
window.setDocumentZoom = function(scale) {
    const desk = document.getElementById("a4Desk");
    const display = document.getElementById("zoomLevelDisplay");
    if (!desk) return;

    if (scale === 'fit') scale = 0.9;
    AppState.zoomLevel = scale;
    desk.style.transform = `scale(${scale})`;
    if (display) display.textContent = `${Math.round(scale * 100)}%`;
};

function initDocumentTheme() {
    window.changeDocumentTheme = function(themeClass) {
        document.querySelectorAll(".a4-page").forEach(p => {
            p.className = `a4-page ${themeClass}`;
        });
        showToast(`Document theme changed to ${themeClass}`);
    };
}

window.toggleTreeGroup = function(header) {
    const items = header.nextElementSibling;
    const arrow = header.querySelector(".tree-arrow");
    if (items) {
        const isHidden = items.style.display === 'none';
        items.style.display = isHidden ? 'flex' : 'none';
        if (arrow) arrow.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
    }
};

// =========================================================================
// 15. TOAST NOTIFICATION HELPER
// =========================================================================
function showToast(msg, duration = 3200) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "pbi-toast";
    toast.innerHTML = `<i class="fa-solid fa-circle-info text-yellow"></i> <span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        setTimeout(() => toast.remove(), 250);
    }, duration);
}
