# PortalX: one student per row result template

**Proposal for backend integration. These demonstration files are not wired into the live application.** All names, IDs and scores are synthetic. The sample score limits are 20 / 20 / 60; production must use the school's actual score configuration.

## Files to share with the backend developer

- `class-results-template-demo.xlsx`: the proposed teacher-facing workbook, with blank score cells and six example students already filled in.
- `class-results-filled-demo.xlsx`: the same workbook with example scores and calculated totals.
- `class-results-wide-demo.csv`: a flat-header alternative for CSV import/export. CSV cannot preserve grouped headers, frozen panes, formulas or editing protection.
- `normalized-results-example.json`: the filled workbook converted into one internal record per student and subject.
- `preview.html`: an interactive browser preview of the layout; local demo edits are not saved or submitted.
- `generate_examples.py`: dependency-free Python example generator. The backend can port this layout to its preferred spreadsheet library.

## What the teacher sees

| Student ID | Student name | Registration no. | Mathematics | | | | English language | | | |
|---|---|---|---|---|---|---|---|---|---|---|
| | | | CA1 | CA2 | Exam | Total | CA1 | CA2 | Exam | Total |
| student-001 | Ada Okafor | DEMO/001 | 12 | 11 | 35 | **58** | 13 | 12 | 37 | **62** |
| student-002 | Tunde Bello | DEMO/002 | 13 | 13 | 38 | **64** | 14 | 14 | 40 | **68** |

Each additional subject contributes **four columns**, without adding another student row. The example workbook has five subjects, so there are 23 columns: 3 identity columns + 5 × 4 score columns. The first three columns and the header rows stay frozen while scrolling.

The backend prefills the roster, subject groups and identifiers. Teachers enter only **CA1, CA2 and Exam**. Student identity cells, headers and Total cells are locked against accidental editing. Spreadsheet protection is a usability feature, not an authorization mechanism.

Totals appear only when all three scores are present. A legitimate score of **0** is included; a blank cell means **not entered**, not zero. Decimal scores are allowed in this proposal; use the school's agreed precision policy in production.

## Workbook structure: `portalx.class-results.wide.v1`

Sheet order:

1. `Enter scores`: the teacher's worksheet.
2. `Instructions`: short filling instructions.
3. `_metadata`: a hidden sheet describing the template.

`Enter scores` rows:

| Row | Content |
|---|---|
| 1 | Workbook title and demo label |
| 2 | Class, term and score maxima |
| 3 | Short instructions |
| 4, hidden | Machine-readable field keys, one per physical column |
| 5 | Merged subject group names; A:C are grouped as Student details |
| 6 | Visible column labels |
| 7 onward | One student per row |

The hidden machine-header row is the import contract. Do not parse visible subject names or use merged-cell labels as database identifiers.

```text
A4 = student_id
B4 = student_name
C4 = registration_number
D4 = subject:<math_subject_id>:ca1
E4 = subject:<math_subject_id>:ca2
F4 = subject:<math_subject_id>:exam
G4 = subject:<math_subject_id>:total
H4 = subject:<english_subject_id>:ca1
I4 = subject:<english_subject_id>:ca2
...
```

The examples use readable demo IDs. **Production must substitute actual database IDs** for students, subjects, class and term. Student names and registration numbers are display-only. Two students with the same name remain distinguishable by `student_id`; subject renaming does not break the import.

`_metadata` contains `template_version`, `class_id`, `term_id`, `roster_version`, `ca1_max`, `ca2_max`, `exam_max`, `machine_header_row`, `first_data_row`, and the subject ID/name map. Production should also include a backend-issued `template_id` tied to a stored roster/subject manifest. Generate `roster_version` from the actual class roster and subject assignments.

For CSV, use the machine keys as the single header row. Obtain class and term from the authenticated upload route/form. Do **not** export the decorative Excel rows into CSV. The CSV example is a separate supported format; teachers should download the backend's CSV template directly rather than using Excel's Save as CSV on this decorated workbook.

## Backend integration

Keep the current whole-class endpoints and workflow:

1. `GET /api/v1/results/template/class/{class_id}?term_id=...&format=xlsx`: build the wide workbook from the authorized class roster, assigned subjects and school score maxima. Excel should be the UI's recommended format.
2. `POST /api/v1/results/upload/class/{class_id}`: multipart `term_id`, `file`, and the existing principal on-behalf `reason`. Parse this new format, validate and save a **draft**. Return the existing `ClassResultUploadResponse`.
3. Existing GET submission and GET class-results endpoints continue returning metadata and normalized score records for frontend review.
4. Existing submit, approve and reject endpoints keep their current contracts and permissions.

Only the template generator and file parser need a new layout; a wide spreadsheet does not require a wide database. Convert every student/subject group into a record:

```json
{
  "student_id": "student-001",
  "subject_id": "sub-maths",
  "ca1_score": 12,
  "ca2_score": 11,
  "exam_score": 35,
  "total_score": 58
}
```

The example JSON contains all 30 records: 6 students × 5 subjects. Keep one unique result per student + subject + term (within the appropriate class/submission context).

### Validation rules

- Authorize the class, term and role against the logged-in user. Never trust editable workbook metadata for access control.
- Require a recognized template version, valid header keys, all expected student identity columns, and one complete CA1/CA2/Exam/Total group per expected subject. Reject duplicate machine keys, duplicate student IDs, unknown subjects, or students outside the class roster.
- Match by actual student and subject IDs. Never resolve identities from names or row positions. Do not silently drop extra columns, duplicate students or unknown subjects.
- Compare the supplied roster/template version with the server manifest. If the roster or subjects changed, reject with a clear request to download a fresh template; do not silently lose students or subjects.
- Reject missing or altered student IDs. Display name/registration changes must not update student records; report mismatches for correction.
- Accept finite numeric CA1/CA2/Exam values within the configured limits. Reject negative, oversized, text and formula input in score cells. File validation must enforce these rules even if spreadsheet validation is bypassed.
- **Recompute totals on the backend.** Do not evaluate workbook formulas, rely on cached formula results, or trust typed Total values. Ignore uploaded Total values and calculate from the three inputs.
- Proposed draft behavior: retain missing scores as `null` and expose incomplete cells for review. Reject invalid values atomically; do not partly save a failed upload. If the current backend does not support incomplete drafts, require all scores at upload and return explicit missing-cell errors instead.
- At submission, require every expected student/subject score to be complete. Any exemption policy must be explicit; never infer exemption from blank cells.
- Reupload should atomically replace the selected class/term draft with a new version, not append duplicates. Reject overwrites while submitted/approved and respect term locking. Use version checks to prevent two uploads overwriting each other unnoticed.
- Return actionable import errors with student name/ID, subject name/ID, component, cell address and the expected range. Example: `Ada Okafor / Mathematics / CA1 / D7: 24 exceeds the maximum of 20.` A structured `errors` array on failed uploads is a proposed API addition, not currently implemented by these artifacts.
- Apply file-size, row-count, column-count and decompression limits. Accept actual XLSX/CSV content; do not accept macros or executable formulas in editable score fields.

### Scaling to many subjects

Horizontal scrolling is deliberate: repeated student rows are eliminated. Frozen identity columns and alternating subject groups keep a wide class file navigable. Production should list only subjects assigned to the class and keep the same subject order across downloads.

For exceptionally large subject sets, the same contract can extend to several score sheets with distinct subject groups, provided `(student_id, subject_id)` appears exactly once and the manifest describes every sheet. That extension is **not part of v1**; don't let the parser silently ignore extra score sheets. Start with the single-sheet version to keep uploads predictable.

## Run and inspect

```sh
python docs/result-template/generate_examples.py
```

Open the blank example in Excel or a compatible spreadsheet app. Enter scores into the colored cells; totals should calculate. Use the filled example to discuss the desired layout with the backend developer. Neither file will be accepted by the live system until its parser is updated and production IDs are substituted.
