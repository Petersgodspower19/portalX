"""Generate the proposed PortalX result workbooks using Python's standard library.

All students, IDs, subjects and scores here are synthetic examples.
Run: python docs/result-template/generate_examples.py
"""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.sax.saxutils import escape
import csv
import json

OUT = Path(__file__).resolve().parent
SUBJECTS = [("sub-maths", "Mathematics"), ("sub-english", "English language"),
            ("sub-science", "Basic science"), ("sub-social", "Social studies"),
            ("sub-computer", "Computer studies")]
STUDENTS = [("student-001", "Ada Okafor", "DEMO/001"),
            ("student-002", "Tunde Bello", "DEMO/002"),
            ("student-003", "Zainab Musa", "DEMO/003"),
            ("student-004", "Chidi Eze", "DEMO/004"),
            ("student-005", "Amara Obi", "DEMO/005"),
            ("student-006", "David Adebayo", "DEMO/006")]
MAXIMUMS = [20, 20, 60]  # Examples only. Production must use school score configuration.
NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"


def column(n):
    name = ""
    while n:
        n, remainder = divmod(n - 1, 26)
        name = chr(65 + remainder) + name
    return name


def cell(ref, value, style=0, formula=None):
    if formula is not None:
        cached = f"<v>{value}</v>" if value != "" else "<v/>"
        return f'<c r="{ref}" s="{style}"><f>{escape(formula)}</f>{cached}</c>'
    if isinstance(value, (int, float)):
        return f'<c r="{ref}" s="{style}"><v>{value}</v></c>'
    return f'<c r="{ref}" s="{style}" t="inlineStr"><is><t>{escape(str(value))}</t></is></c>'


def row(n, cells, **attrs):
    attributes = " ".join(f'{key}="{value}"' for key, value in attrs.items())
    return f'<row r="{n}" {attributes}>{"".join(cells)}</row>'


def scores(student_index, subject_index):
    # Includes legitimate zero scores to demonstrate that zero is not missing.
    return [0 if student_index == 3 and subject_index == 1 else 12 + (student_index + subject_index) % 9,
            11 + (student_index * 2 + subject_index) % 10,
            35 + (student_index * 3 + subject_index * 2) % 26]


def keys():
    return ["student_id", "student_name", "registration_number"] + [
        f"subject:{subject_id}:{component}"
        for subject_id, _ in SUBJECTS for component in ["ca1", "ca2", "exam", "total"]]


STYLES = f'''<styleSheet xmlns="{NS}">
<fonts count="4"><font><sz val="11"/><color rgb="FF172B4D"/><name val="Calibri"/></font><font><b/><sz val="18"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FF2563EB"/><name val="Calibri"/></font></fonts>
<fills count="8"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF172B4D"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2563EB"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF1F5FB"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF4FF"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF5EE"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/></patternFill></fill></fills>
<borders count="2"><border/><border><left style="thin"><color rgb="FFDFE6EF"/></left><right style="thin"><color rgb="FFDFE6EF"/></right><top style="thin"><color rgb="FFDFE6EF"/></top><bottom style="thin"><color rgb="FFDFE6EF"/></bottom></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="10">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="4" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="7" borderId="1" xfId="0" applyAlignment="1" applyProtection="1"><alignment horizontal="center" vertical="center"/><protection locked="0"/></xf>
<xf numFmtId="0" fontId="0" fillId="5" borderId="1" xfId="0" applyAlignment="1" applyProtection="1"><alignment horizontal="center" vertical="center"/><protection locked="0"/></xf>
<xf numFmtId="0" fontId="3" fillId="6" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf>
</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>'''


def results_sheet(filled):
    last = column(3 + len(SUBJECTS) * 4)
    rows = [row(1, [cell("A1", "PortalX / Class results — DEMONSTRATION", 1)], ht=36, customHeight=1),
            row(2, [cell("A2", "Example class: JSS 1 A    |    Term: First term    |    Example maximums: CA1 20 / CA2 20 / Exam 60", 2)], ht=28, customHeight=1),
            row(3, [cell("A3", "Enter scores only. Leave unknown scores blank. Totals calculate automatically. Student details and headers are locked to prevent accidental edits.", 9)], ht=32, customHeight=1),
            row(4, [cell(f"{column(i)}4", key) for i, key in enumerate(keys(), 1)], hidden=1),
            row(5, [cell("A5", "STUDENT DETAILS", 3)] + [cell(f"{column(4 + i * 4)}5", name, 3 if i % 2 else 4) for i, (_, name) in enumerate(SUBJECTS)], ht=30, customHeight=1)]
    headings = ["Student ID", "Student name", "Registration no."] + [name for _ in SUBJECTS for name in ["CA1 / 20", "CA2 / 20", "Exam / 60", "Total / 100"]]
    rows.append(row(6, [cell(f"{column(i)}6", heading, 5) for i, heading in enumerate(headings, 1)], ht=26, customHeight=1))
    for index, student in enumerate(STUDENTS):
        n = index + 7
        cells = [cell(f"{column(i)}{n}", value, 5) for i, value in enumerate(student, 1)]
        for subject_index, _ in enumerate(SUBJECTS):
            start = 4 + subject_index * 4
            values = scores(index, subject_index) if filled else ["", "", ""]
            for offset, value in enumerate(values):
                cells.append(cell(f"{column(start + offset)}{n}", value, 6 if subject_index % 2 else 7))
            score_range = f"{column(start)}{n}:{column(start + 2)}{n}"
            formula = f'IF(COUNT({score_range})=3,SUM({score_range}),"")'
            cells.append(cell(f"{column(start + 3)}{n}", sum(values) if filled else "", 8, formula))
        rows.append(row(n, cells, ht=28, customHeight=1))
    merges = [f"A1:{last}1", f"A2:{last}2", f"A3:{last}3", "A5:C5"] + [f"{column(4+i*4)}5:{column(7+i*4)}5" for i in range(len(SUBJECTS))]
    validations = []
    for i in range(len(SUBJECTS)):
        for offset, maximum in enumerate(MAXIMUMS):
            c = column(4 + i * 4 + offset)
            validations.append(f'<dataValidation type="decimal" operator="between" allowBlank="1" showInputMessage="1" showErrorMessage="1" errorStyle="stop" errorTitle="Check this score" error="Enter a number from 0 to {maximum}." promptTitle="Enter a score" prompt="0 to {maximum}; leave blank if not yet entered." sqref="{c}7:{c}{6+len(STUDENTS)}"><formula1>0</formula1><formula2>{maximum}</formula2></dataValidation>')
    return f'''<worksheet xmlns="{NS}"><dimension ref="A1:{last}{6+len(STUDENTS)}"/><sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane xSplit="3" ySplit="6" topLeftCell="D7" activePane="bottomRight" state="frozen"/><selection pane="bottomRight" activeCell="D7" sqref="D7"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="22"/><cols><col min="1" max="1" width="20" customWidth="1"/><col min="2" max="2" width="25" customWidth="1"/><col min="3" max="3" width="20" customWidth="1"/><col min="4" max="{3+len(SUBJECTS)*4}" width="12" customWidth="1"/></cols><sheetData>{''.join(rows)}</sheetData><sheetProtection sheet="1" objects="1" scenarios="1" selectLockedCells="0" selectUnlockedCells="0"/><mergeCells count="{len(merges)}">{''.join(f'<mergeCell ref="{ref}"/>' for ref in merges)}</mergeCells><dataValidations count="{len(validations)}">{''.join(validations)}</dataValidations><pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape"/></worksheet>'''


def simple_sheet(values):
    return f'<worksheet xmlns="{NS}"><cols><col min="1" max="1" width="32" customWidth="1"/><col min="2" max="2" width="100" customWidth="1"/></cols><sheetData>{"".join(row(i, [cell(f"{column(j)}{i}", value, 9) for j, value in enumerate(values_row, 1)], ht=32, customHeight=1) for i, values_row in enumerate(values, 1))}</sheetData></worksheet>'


def workbook(filled=False):
    metadata = [("template_version", "portalx.class-results.wide.v1"), ("class_id", "demo-class-jss1a"), ("term_id", "demo-term-first"), ("roster_version", "demo-roster-v1"), ("ca1_max", 20), ("ca2_max", 20), ("exam_max", 60), ("machine_header_row", 4), ("first_data_row", 7)] + [(subject_id, name) for subject_id, name in SUBJECTS]
    instructions = [("PORTALX / HOW TO USE", "Demonstration only. All IDs, people and scores are synthetic."),
                    ("1. Check your class and term", "Production templates must be generated for your actual class roster and subjects."),
                    ("2. One student = one row", "Find the student on the left; enter CA1, CA2 and Exam across each subject group."),
                    ("3. Enter scores only", "Example limits: CA1 20, CA2 20, Exam 60. Real limits come from school settings."),
                    ("4. Zero is a real score", "Leave missing scores blank. Never use 0 to mean missing."),
                    ("5. Totals are automatic", "Total appears only when all three scores are present. Do not type totals."),
                    ("6. Scroll without losing names", "The first three columns and the headers stay visible as you scroll."),
                    ("7. Save as .xlsx", "Upload the completed workbook to save a draft. Review the saved scores before submitting."),
                    ("8. Correcting results", "Edit scores in your workbook and upload a replacement draft after any requested corrections."),
                    ("Important", "Do not insert/delete students or subject groups. Ask the school for a fresh template when the roster changes."),
                    ("Integration status", "This is a proposed format for backend integration, not the existing live API template.")]
    path = OUT / ("class-results-filled-demo.xlsx" if filled else "class-results-template-demo.xlsx")
    with ZipFile(path, "w", ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + ''.join(f'<Override PartName="/xl/worksheets/sheet{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' for i in [1, 2, 3]) + '</Types>')
        archive.writestr("_rels/.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        archive.writestr("xl/workbook.xml", f'<workbook xmlns="{NS}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView activeTab="0"/></bookViews><sheets><sheet name="Enter scores" sheetId="1" r:id="rId1"/><sheet name="Instructions" sheetId="2" r:id="rId2"/><sheet name="_metadata" sheetId="3" state="hidden" r:id="rId3"/></sheets><calcPr calcMode="auto" fullCalcOnLoad="1"/></workbook>')
        archive.writestr("xl/_rels/workbook.xml.rels", '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + ''.join(f'<Relationship Id="rId{i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{i}.xml"/>' for i in [1, 2, 3]) + '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>')
        archive.writestr("xl/styles.xml", STYLES)
        archive.writestr("xl/worksheets/sheet1.xml", results_sheet(filled))
        archive.writestr("xl/worksheets/sheet2.xml", simple_sheet(instructions))
        archive.writestr("xl/worksheets/sheet3.xml", simple_sheet(metadata))
    return path


def write_preview():
    groups = ''.join(f'<th colspan="4" class="subject group{i % 2}">{escape(name)}</th>' for i, (_, name) in enumerate(SUBJECTS))
    headers = '<th class="fixed id">Student ID</th><th class="fixed name">Student name</th><th class="fixed reg">Registration no.</th>' + ''.join('<th>CA1 <small>/20</small></th><th>CA2 <small>/20</small></th><th>Exam <small>/60</small></th><th class="total">Total <small>/100</small></th>' for _ in SUBJECTS)
    body = []
    for i, student in enumerate(STUDENTS):
        cells = [f'<td class="fixed {kind}">{escape(value)}</td>' for kind, value in zip(['id', 'name', 'reg'], student)]
        for j, (_, subject_name) in enumerate(SUBJECTS):
            demo = scores(i, j)
            cells.extend(f'<td class="group{j % 2}"><input type="number" min="0" max="{MAXIMUMS[k]}" step="any" data-demo="{demo[k]}" data-group="{i}-{j}" aria-label="{escape(student[1])}, {escape(subject_name)}, {label}" placeholder="—"></td>' for k, label in enumerate(['CA1', 'CA2', 'Exam']))
            cells.append(f'<td class="total" data-total="{i}-{j}">—</td>')
        body.append('<tr>' + ''.join(cells) + '</tr>')
    html = '''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>PortalX / Results template proposal</title><style>
*{box-sizing:border-box}body{margin:0;background:#f4f7fb;color:#172b4d;font-family:Segoe UI,Arial,sans-serif}header{padding:32px max(24px,5vw);background:radial-gradient(ellipse at 0 100%,#285998,transparent 70%),#101f38;color:white}.brand{font-size:23px;font-weight:700;letter-spacing:-1px}.brand small{display:block;font-size:10px;font-weight:400;color:#aec6e7;letter-spacing:1px;margin-top:7px}.hero{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-top:38px}.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#aacaff}h1{font-size:36px;letter-spacing:-1.4px;margin:12px 0 14px}header p{color:#bacce4;line-height:1.8;font-size:13px;max-width:570px;margin:0}.badge{font-size:11px;padding:10px 14px;border:1px solid #ffffff30;border-radius:8px;white-space:nowrap}main{padding:30px max(24px,5vw)}.summary{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px}.summary span{background:white;border:1px solid #dfe6ef;border-radius:8px;padding:13px 18px;font-size:12px}.summary strong{color:#2563eb;margin-right:6px}.card{background:white;border:1px solid #dfe6ef;border-radius:14px;overflow:hidden;box-shadow:0 4px 18px #172b4d04}.toolbar{padding:22px 24px;display:flex;justify-content:space-between;gap:18px;align-items:center}h2{font-size:16px;margin:0 0 7px}.toolbar p{font-size:11px;color:#697a91;margin:0;line-height:1.7}.buttons{display:flex;gap:8px;flex-wrap:wrap}button,a.download{font-family:inherit;text-decoration:none;display:inline-flex;justify-content:center;align-items:center;border:1px solid #dfe6ef;border-radius:7px;padding:10px 14px;color:#53657e;background:white;font-size:11px;cursor:pointer}.download.primary{color:white;background:#2563eb;border-color:#2563eb}button:hover,a.download:hover{filter:brightness(.96)}.scroll{max-height:530px;overflow:auto;border-top:1px solid #dfe6ef}table{border-collapse:separate;border-spacing:0;table-layout:fixed;width:2180px;font-size:12px}th,td{height:55px;padding:10px 12px;border-right:1px solid #dfe6ef;border-bottom:1px solid #dfe6ef;white-space:nowrap;text-align:center}thead th{position:sticky;top:0;z-index:4;height:42px;background:#edf2f8;color:#53657e;font-size:10px}thead tr:first-child th{height:44px;background:#172b4d;color:white;font-size:12px}thead tr:nth-child(2) th{top:44px}.subject.group0{background:#2563eb}.fixed{position:sticky;background:#f5f8fc;z-index:2;text-align:left}.id{left:0;width:120px;font-size:10px;color:#697a91}.name{left:120px;width:220px;font-weight:600}.reg{left:340px;width:160px;font-size:11px;color:#697a91;border-right:2px solid #c8d7ed}thead th.fixed{z-index:6}.identity{position:sticky;left:0;z-index:7!important;text-align:left}.group0{background:#f1f7ff}.group1{background:#fff}.total{background:#eaf5ee;color:#327457;font-weight:650;border-right:2px solid #c8d7ed}input{font-family:inherit;width:100%;max-width:58px;text-align:center;border:1px solid transparent;border-radius:5px;background:transparent;color:#172b4d;font-size:12px;padding:7px 2px;-moz-appearance:textfield}input::-webkit-inner-spin-button,input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input:focus{background:white;outline:2px solid #93b4f4;border-color:#2563eb}input:invalid{border:1px solid #c85555;background:#fff0f0}small{font-weight:400;color:#8491a5}.legend{display:flex;gap:22px;padding:18px 24px;flex-wrap:wrap;font-size:11px;color:#697a91}.legend span::before{content:'';display:inline-block;width:10px;height:10px;margin-right:7px;border:1px solid #d7e2f1;background:#f1f7ff;border-radius:3px}.legend span:last-child::before{background:#eaf5ee}.note{font-size:12px;color:#697a91;line-height:1.8;margin:22px 0}.note strong{color:#53657e}.links{display:flex;gap:10px;flex-wrap:wrap}footer{margin-top:25px;color:#8491a5;font-size:10px}@media(max-width:700px){h1{font-size:29px}.hero,.toolbar{align-items:start;flex-direction:column}main{padding:22px 16px}.toolbar{padding:20px}.badge{display:none}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
</style></head><body><header><div class="brand">PortalX<small>ACADEMIC OPERATIONS</small></div><div class="hero"><div><span class="eyebrow">Result template / Design proposal</span><h1>Every student. One row.</h1><p>A clear class-wide mark sheet. Enter scores across subject groups, keep student details in view, and let totals do the maths.</p></div><span class="badge">Wide format · v1 proposal</span></div></header><main><div class="summary"><span><strong>6</strong>example students</span><span><strong>5</strong>subject groups</span><span><strong>3</strong>scores per subject</span><span><strong>0</strong>repeated student rows</span></div><section class="card"><div class="toolbar"><div><h2>JSS 1 A / First term</h2><p>Scroll sideways to see more subjects. Student identity columns stay fixed.</p></div><div class="buttons"><button id="fill">Show sample scores</button><button id="clear">Clear scores</button><a class="download primary" href="class-results-template-demo.xlsx">Download Excel example</a></div></div><div class="scroll" tabindex="0" role="region" aria-label="Scrollable class mark sheet"><table><colgroup><col style="width:120px"><col style="width:220px"><col style="width:160px">''' + '<col style="width:84px">' * (len(SUBJECTS) * 4) + '''</colgroup><thead><tr><th colspan="3" class="identity">STUDENT DETAILS / prefilled by the school</th>''' + groups + '</tr><tr>' + headers + '</tr></thead><tbody>' + ''.join(body) + '''</tbody></table></div><div class="legend"><span>Enter CA1, CA2 and Exam scores</span><span>Totals are calculated, not entered</span></div></section><p class="note"><strong>Demonstration only.</strong> Names, IDs and score limits are examples. These browser edits are not saved. The backend will populate real students, subjects and school score limits. A blank score is missing; zero is a real score.</p><div class="links"><a class="download" href="class-results-filled-demo.xlsx">Download filled example</a><a class="download" href="README.md">Backend integration guide</a><a class="download" href="class-results-wide-demo.csv">Flat CSV alternative</a><a class="download" href="normalized-results-example.json">Parsed JSON example</a></div><footer>PortalX · Proposed format for backend integration</footer></main><script>
function calculate(){document.querySelectorAll('[data-total]').forEach(total=>{const inputs=[...document.querySelectorAll('[data-group="'+total.dataset.total+'"]')];const complete=inputs.every(input=>input.value!==''&&input.validity.valid);total.textContent=complete?Number(inputs.reduce((sum,input)=>sum+Number(input.value),0).toFixed(2)):'—';});}
document.querySelectorAll('input').forEach(input=>input.addEventListener('input',calculate));
document.getElementById('fill').addEventListener('click',()=>{document.querySelectorAll('input').forEach(input=>input.value=input.dataset.demo);calculate();});
document.getElementById('clear').addEventListener('click',()=>{document.querySelectorAll('input').forEach(input=>input.value='');calculate();});
</script></body></html>'''
    (OUT / "preview.html").write_text(html, encoding="utf-8")


if __name__ == "__main__":
    for filled in [False, True]:
        print(workbook(filled).name)
    with (OUT / "class-results-wide-demo.csv").open("w", newline="", encoding="utf-8-sig") as stream:
        writer = csv.writer(stream)
        writer.writerow(keys())
        for index, student in enumerate(STUDENTS):
            values = list(student)
            for subject_index, _ in enumerate(SUBJECTS):
                subject_scores = scores(index, subject_index)
                values.extend(subject_scores + [sum(subject_scores)])
            writer.writerow(values)
    example = {"template_version": "portalx.class-results.wide.v1", "class_id": "demo-class-jss1a", "term_id": "demo-term-first", "results": [{"student_id": student[0], "subject_id": subject[0], "ca1_score": scores(i, j)[0], "ca2_score": scores(i, j)[1], "exam_score": scores(i, j)[2], "total_score": sum(scores(i, j))} for i, student in enumerate(STUDENTS) for j, subject in enumerate(SUBJECTS)]}
    (OUT / "normalized-results-example.json").write_text(json.dumps(example, indent=2) + "\n", encoding="utf-8")
    write_preview()
