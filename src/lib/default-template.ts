export const DEFAULT_TYPST_TEMPLATE = `#set page(
  paper: "a4",
  margin: (x: 2cm, y: 2.5cm),
)
#set text(
  font: "Liberation Sans",
  size: 11pt,
)

= Typst Document Generator

== Welcome
Welcome to the *Typst Document Generator & Dual-Engine PDF Exporter*!

This web application allows you to write plain text or Typst markup code and export your documents using **three distinct export mechanisms**:

1. *Download .typ Source*: Download raw Typst markup source file.
2. *Export PDF (WebAssembly)*: Instant client-side WASM compilation in your browser.
3. *Export PDF (CLI Engine)*: Serverless compilation using the official Typst CLI binary.

== Features & Syntax
Typst offers simple and powerful typesetting syntax:

- *Bold text* with asterisks and _italic text_ with underscores.
- Clean bullet lists and numbered sections.
- Inline styling like #text(fill: rgb("0066cc"), weight: "bold")[custom colored text].

== Equations & Formulas
Typst supports beautiful inline math $E = m c^2$ and block equations:

$ sum_(k=1)^n k = (n(n+1))/2 $

$ integral_0^infty e^(-x^2) d x = sqrt(pi)/2 $

#align(center)[
  #block(
    fill: luma(240),
    inset: 12pt,
    radius: 4pt,
    stroke: 0.5pt + luma(200)
  )[
    *Tip:* Select an export option above to download your compiled PDF!
  ]
]
`;
