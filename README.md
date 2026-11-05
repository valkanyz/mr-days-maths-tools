# Mr Day’s maths tools

Interactive classroom tools for Years 7–12, including Essential, Applications, Methods and Specialist mathematics, plus teacher-hosted games and science simulations.

**[Open the live site](https://valkanyz.github.io/mr-days-maths-tools/)**

The site runs in a modern browser with no accounts or backend database. It uses static HTML, CSS and JavaScript, with no build step or package installation required. Search and course filters help teachers find activities; course tags indicate suggested audiences, not complete syllabus coverage.

## Classroom features

- Topic-grouped navigation, favourites and recently used activities.
- On supported labs: presentation mode, settings visibility, answer reveal, step-by-step teaching, undo/reset and shareable activity links.
- Diagram and table exports where available, with classroom annotation, image-copy and print tools on supported pages.
- Browser-local preferences and saved state. Editable links can include the entered data; check their contents before sharing student information.
- Teacher-hosted games designed for students to play on paper, without individual student score tracking.

## Recent additions and improvements

### Geometry Diagram Maker

[Open the maker](https://valkanyz.github.io/mr-days-maths-tools/geometry-maker/).

Create test diagrams with a white background, black lines and Arial text. Add triangles, quadrilaterals, circles, sectors, line segments, angles, parallel lines, free text and labelled points. Drag shapes, vertices and labels; nearby vertices snap together when moving points or whole shapes. Hold **Alt** to bypass snapping. **Add point** lets you click to place a point, then enter its label.

Angle arcs, right-angle marks, equal-side ticks and parallel arrows can be added independently. Measurements are entered labels: reshaping a diagram does not recalculate them. Undo/redo, browser saving, editable links, SVG/PNG exports, image copying and printing are included. Exports omit selection handles, snap indicators and the editing grid.

### Statistics

Single-variable displays include dot plots, histograms and box plots, alongside parallel box plots and a linked draggable data view. Two-variable data supports scatterplots, regression and residuals.

- Select box plots, histograms, dot plots or parallel box plots; the linked draggable view applies to the single box plot and scatterplot.
- **Show mean** toggles the mean indicator and summary.
- Outliers appear as **×** when enabled.
- Whiskers reach the most extreme observed non-outliers. Ends are open on sides with outliers and capped on sides without outliers.
- Turning off outlier crosses extends the whiskers to the minimum and maximum.
- **Show Q₁ − 1.5 × IQR and Q₃ + 1.5 × IQR** adds labelled dashed fences. The horizontal scale includes both fences.
- Quartiles use medians of the lower and upper halves, excluding the middle observation for odd sample sizes. Values exactly on a fence are not outliers.

### Functions and matrices

- **Patterns & Function Machines:** enter a function, starting with `2x+3`; watch animated operations and converging branches, then inspect input/output pairs. Place-value blocks and combined fractional blocks keep larger values readable. Random inputs progress through finer increments. Trigonometric functions support radians/degrees, suitable exact values and asymptotes, with graph bounds established before points accumulate.
- **Function Lab:** transformations, logarithms, original/inverse comparisons with relevant domain restrictions, tangents and signed integrals.
- **Matrices Lab:** matrix orders up to 4 × 4, arithmetic, transpose, powers, determinant, inverse, AX = B, transitions and 2D transformations. Bracketed inputs and output are arranged as an equation, with colour-matched working that can be hidden. Includes matrix-order comparison and transition playback.

### New investigations

- **Time Series:** centred moving averages, seasonal indices, deseasonalisation and model forecasts.
- **Circle Theorems:** draggable points and revealable angle relationships.
- **Volume & Capacity:** compare containers, fill and pour, convert cubic centimetres/millilitres/litres and account for spills.
- **Timetable & Journey Planner:** editable services, connections, transfer allowances and journey timelines.
- Other improvements include composite area/perimeter construction, rotatable nets, linked conditional-probability views, finance comparisons and guided network decisions.

## Activity catalogue

The following list follows the current homepage. Shared labs use `docs/labs/index.html` with an activity fragment, such as `#statistics`. Standalone labs have their own directories.

### Number & finance

- [Fraction Lab](docs/fraction-lab/)
- [Percentages Lab](docs/labs/#percentages)
- [Ratio & Rate Lab](docs/labs/#ratios)
- [Number Line Lab](docs/labs/#numberline)
- [Decimal Lab](docs/labs/#decimals)
- [Powers & Roots Lab](docs/labs/#powers)
- [Finance & Sequence Lab](docs/labs/#finance)

### Algebra, functions & calculus

- [Function Lab](docs/labs/#functions)
- [Equation Balance](docs/equation-balance/)
- [Patterns & Function Machines](docs/labs/#patterns)
- [Algebra Tiles](docs/labs/#tiles)
- [Linear Inequalities](docs/labs/#inequalities)
- [Binomial Expansion & Pascal’s Triangle](docs/labs/#binomial)
- [First Principles](docs/labs/#calculus)
- [Rectangle & Trapezium Rules](docs/labs/#integration)

### Measurement & geometry

- [Perimeter & Area Builder](docs/labs/#area)
- [Angle Lab](docs/labs/#angles)
- [Measurement & Scale Lab](docs/labs/#measurement)
- [Nets Lab](docs/labs/#nets)
- [Pythagoras Lab](docs/labs/#pythagoras)
- [Trigonometry Lab](docs/labs/#trigonometry)
- [Coordinates & Transformations](docs/labs/#transformations)
- [Bearings Lab](docs/labs/#bearings)
- [Time & Time Zones](docs/labs/#timezones)
- [Circle Theorems Lab](docs/labs/#circles)
- [Volume & Capacity Lab](docs/labs/#capacity)
- [Timetable & Journey Planner](docs/labs/#journeys)
- [Geometry Diagram Maker](docs/geometry-maker/)

### Probability

- [Dice Lab](docs/dice-lab/)
- [Coin Lab](docs/coin-lab/)
- [Probability Array Lab](docs/labs/#arrays)
- [Venn & Two-way Table Lab](docs/labs/#venn)
- [Tree Diagram Lab](docs/tree-lab/)
- [Distribution Lab](docs/labs/#distributions)
- [Plinko Probability Lab](docs/plinko-lab/)
- [Permutations & Combinations](docs/labs/#counting)

### Statistics

- [Statistics Lab](docs/labs/#statistics)
- [Sampling Lab](docs/labs/#sampling)
- [Confidence Interval Lab](docs/labs/#inference)
- [Time Series Lab](docs/labs/#timeseries)

### Matrices, vectors & complex numbers

- [Matrices Lab](docs/matrices-lab/)
- [Vectors & Transformations](docs/labs/#vectors)
- [Transition Matrix Lab](docs/labs/#transitions)
- [Complex Number Lab](docs/labs/#complex)
- [3D Vector Lab](docs/labs/#vectors3)

### Networks & optimisation

- [Network Lab](docs/labs/#networks)
- [Project Networks](docs/labs/#projects)

### Class games

- [Target Number Lab](docs/class-games/#target)
- [Multiplication Bingo Lab](docs/class-games/#bingo)
- [Risky Dice Lab](docs/class-games/#risk)
- [Pirate Game Lab](docs/class-games/#pirate)
- [Cray Pots Lab](docs/class-games/#cray)

### Science

- [Ecology Sampling Lab](docs/ecology-lab/)
- [Natural Selection Lab](docs/natural-selection-lab/)

The simultaneous-equations workshop remains in the source but is currently excluded from the public catalogue/menu.

## Run locally

From the repository root, start any static server, for example:

```sh
python -m http.server 8000 --directory docs
```

Open <http://localhost:8000/>. Most pages can also be opened directly from `docs/index.html`, but localhost or HTTPS is preferable for browser clipboard and Web Crypto features. Image copying may require browser permission; PNG/SVG downloads provide an alternative.

## Repository structure

| Location | Purpose |
|---|---|
| `docs/index.html` | Homepage, search, course filters and catalogue |
| `docs/labs/index.html` | Shared lab shell, core activities and initial controls |
| `docs/labs/*.js` | Mathematical models, activity extensions and interaction/rendering modules |
| `docs/classroom*.js`, `docs/classroom*.css` | Shared classroom controls and presentation tools |
| `docs/geometry-maker/` | Standalone test-diagram editor |
| `docs/matrices-lab/` | Standalone matrix workspace |
| Other `docs/*-lab/` directories | Standalone maths and science activities |
| `docs/class-games/` | Teacher-hosted classroom games |
| `tests/*.cjs` | Node.js calculation and rendering regression checks |

The shared lab extensions wrap existing setup/update functions. Preserve script order when editing the shell, and check both the base display and any linked or enhanced view affected by a change.

## Tests and checks

Run from the repository root with Node.js installed. No dependency installation is required.

Run every current suite:

```sh
node -e "const fs=require('node:fs'),cp=require('node:child_process'); for(const f of fs.readdirSync('tests').filter(f=>f.endsWith('.cjs')).sort()){console.log(f);cp.execFileSync(process.execPath,['tests/'+f],{stdio:'inherit'}); }"
```

For focused work, examples include:

```sh
node tests/labs.cjs
node tests/statistics-box.cjs
node tests/geometry-maker.cjs
node tests/matrices-lab.cjs
node tests/function-machine.cjs
node tests/classroom-models.cjs
```

The suites cover mathematical results and selected rendering/interaction rules; they do not replace browser checks. Check affected controls, reveal states, dragging and exports in a browser after UI changes. Use `git diff --check` before committing.

## Publishing

Repository: `valkanyz/mr-days-maths-tools`.

GitHub Pages serves **`main` → `/docs`**. Commit and push changes to the existing branch; retain the existing Pages configuration. Alternatively, publish `docs/` with any static hosting service, with no build command. Fragment routes work under the GitHub Pages project URL.

## Mathematical and modelling conventions

- **Precision:** calculations generally use JavaScript floating-point numbers. Display rounding does not imply exact arithmetic; exact-value notation is used where supported.
- **Statistics:** the median-of-halves quartile convention can differ from spreadsheet percentile functions. Outlier tests use strict 1.5 × IQR inequalities.
- **Finance:** rates are per period; interest is applied before end-of-period deposits/repayments. The models omit fees and taxes.
- **Sampling:** finite-population samples use replacement; repeated custom values provide weights. Normal confidence intervals use 1.96 and are approximate. The separate normal-population inference model assumes known population standard deviation.
- **Time series:** seasonal indices are normalised to average 1. Forecasts fit a straight line to deseasonalised data and then restore seasonality; they are model estimates.
- **Networks:** the basic network model uses positive-weight undirected edges. Project networks use directed dependencies and assume unlimited resources. Ties may have more than one valid solution.
- **Transitions:** transition matrices are column-stochastic.
- **Geometry:** the diagram maker uses manually entered measurements. Container illustrations are schematic; pouring conserves volume including spill. Intermediate net surfaces may overlap during unfolding.
- **Time zones:** the interactive map uses OpenFreeMap Positron vector tiles (OpenStreetMap data; online connection required, no API key) with geographic time-zone overlays from [Timezone Boundary Builder](https://github.com/evansiroky/timezone-boundary-builder), based on OpenStreetMap data. The outlines are approximate geographic representations of IANA zones, not definitive legal borders. The simplified 15° mode is a longitude teaching model, not a representation of actual zone boundaries. Local departure and arrival times are calculated using the browser's IANA data, including daylight saving. Map attribution is displayed in the map.
- **Journeys:** timetable results depend on the entered services and transfer assumptions; this is a classroom planner, not a live transport feed.
- **Science:** sampling and natural-selection activities are simplified teaching models. Their assumptions and limitations are explained within each lab.

## Curriculum context

The catalogue is organised for Western Australian classrooms. Topic order and course tags are teaching aids rather than an official teaching sequence or an assertion of full syllabus alignment.

- [WA Mathematics P–10](https://k10outline.scsa.wa.edu.au/home/wa-curriculum/learning-areas/mathematics/p-10-mat-curriculum)
- [Mathematics Essential](https://senior-secondary.scsa.wa.edu.au/syllabus-and-support-materials/mathematics/mathematics-essential)
- [Mathematics Applications](https://senior-secondary.scsa.wa.edu.au/syllabus-and-support-materials/mathematics/mathematics-applications)
- [Mathematics Methods](https://senior-secondary.scsa.wa.edu.au/syllabus-and-support-materials/mathematics/mathematics-methods)
- [Mathematics Specialist](https://senior-secondary.scsa.wa.edu.au/syllabus-and-support-materials/mathematics/mathematics-specialist)
