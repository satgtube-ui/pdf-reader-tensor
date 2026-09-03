# HTML Study Library

An ultra-light static website for browsing self-contained HTML study notes and flowcharts.

## Add a note

1. Upload the `.html` file into `public/notes` (subfolders are supported).
2. Commit and push it to `main`.
3. Vercel automatically rebuilds the library page and adds the note.

The displayed note name comes from its HTML `<title>`. If there is no title, the filename is used.

## Subject groups

Place related files in a subfolder of `public/notes`. The first folder name becomes the group heading on the homepage; files directly in `public/notes` appear under **Other notes**. Search matches subjects as well as note titles and filenames.

The **EMBRYOLOGY** group lives in `public/notes/embryology`. It contains front matter (`00`) and chapters `01`–`22`, named after their chapters. Numeric filename prefixes keep chapters in reading order. Only the selected note loads when opened; the homepage does not preload the chapter files.

The original Pharyngeal Arches URL redirects to its new location in EMBRYOLOGY.

The **BIOCHEMISTRY** group lives in `public/notes/biochemistry`. The initial import contains completed chapters `01`–`20`, verified against the source batch completion records on 3 September 2026. In-progress chapters are not published. Later completed flowcharts can be added to this folder using the same numbered chapter filenames.

No framework, packages, database, login, or server is required.
