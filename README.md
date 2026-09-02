# 📊 AltiSec Report Studio — Power BI for Word Documents

> **A Document Intelligence & Reporting Studio that brings Power BI's visual data modeling and dynamic binding directly onto Microsoft Word (A4) documents.**

Transform your weekly and monthly reporting workflow (**Excel data + Viz 360 data + Power BI visuals + Word drafting**) into an automated, dynamic Word report studio with 1-click **Refresh** and direct **DOCX export**.

---

## 🚀 Key Highlights & Differences

| Feature | Legacy Reporting Tools | **AltiSec Report Studio (Power BI for Documents)** |
|---|---|---|
| **Canvas** | Fixed static grids or rigid templates | **Realistic A4 Word Document Pages** with margins, headers, and footers |
| **Interface** | Cluttered forms | **Office / Power BI Desktop Ribbon** + Left View Switcher + Right Visualizations & Fields Panes |
| **Visuals in Word** | Manually copied screenshots | **Native Power BI Visuals**: Dynamic KPI Cards, Clustered Bar Charts, Donut Charts, Line Trends, Tables |
| **Data Binding** | Manual retyping | **Dynamic Placeholders**: Tokens like `{{total_incidents}}`, `{{sla_compliance}}`, `{{client_name}}` auto-bind |
| **Refresh Engine** | Multi-hour manual overhaul | **1-Click `🔄 Refresh Data`**: Upload new sheet and all cards, charts, and tables update instantly |
| **Export** | Messy copy-pasting | **1-Click Direct Word (.docx) & PDF Export** |

---

## 🖥️ Layout & Views

1. **📄 Report View (Word Canvas)**:
   - Multi-page A4 document desk (`210mm × 297mm`).
   - Drag/drop and 1-click insert Power BI visuals (Cards, Charts, Tables, Callouts).
   - In-place rich text editing for executive summaries, analyst findings, and recommendations.

2. **📊 Data View (Excel Grid Explorer)**:
   - Full data table explorer with instant keyword filtering and record statistics.
   - Inspect ingested sheets from Excel (.xlsx, .xls) and CSV.

3. **🔗 Model View (Column Mapping Studio)**:
   - Smart visual column mapper connecting raw Excel headers (`alert_id`, `sent_time`, `revert_time`, `severity`, `asset_name`) to report dimensions.
   - Auto-detection heuristics and persistent mapping rules.

---

## 🛠️ Quick Start (Localhost)

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)

### Launch
Simply double-click:
```cmd
start.bat
```
Or run in terminal:
```bash
npm start
```

The application will open automatically at:
👉 **`http://localhost:8000`**

---

## 📦 Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3 with Power BI Desktop design system
- **Charting**: Chart.js
- **Spreadsheet Processing**: SheetJS (xlsx)
- **Document Export**: docx, FileSaver, html2pdf
- **Backend Server**: Node.js HTTP runtime

---

## 👤 Author
- **Geeta Jogi** ([@geet264](https://github.com/geet264))  
- AltiSec Technologies Pvt. Ltd.
