# Mr Day's Maths Tools

Thirty silent, static classroom mathematics tools. All run entirely in a modern browser without accounts, databases, paid services or external JavaScript dependencies.

## This update (23 October 2026)

Tree Diagram Lab now has independent switches for branch labels, combinations and probabilities. The Custom example defaults to Bottoms (Shorts/Pants), Top (Shirt/Jumper), and Accessory (Hat/Sunglasses). Names update while typing.

The homepage adds search and course filters. Twelve new activities are served by `docs/labs/index.html`, with the activity selected by the URL fragment:

| Fragment | Activity | Main features |
|---|---|---|
| `#functions` | Function Lab | Linear, quadratic, cubic, sine and exponential transformations; analytic tangents and signed integrals |
| `#statistics` | Statistics Lab | Box plots, histograms, dot plots, mean/median/quartiles, population/sample SD, scatterplots and least-squares regression |
| `#distributions` | Distribution Lab | Binomial and normal probabilities, selectable regions and shaded graphs |
| `#trigonometry` | Trigonometry Lab | Unit circle, right triangles and SAS cosine rule |
| `#finance` | Finance & Sequence Lab | Simple/compound interest, end-of-period deposits, loans, arithmetic/geometric sequences |
| `#vectors` | Vector & Matrix Lab | 2D addition/subtraction/scaling/projection; dot product; 2x2 transformations and determinants |
| `#complex` | Complex Number Lab | Argand diagram; addition, multiplication, division, powers and nth roots |
| `#networks` | Network Lab | Editable positive-weight undirected networks; Dijkstra and Kruskal solutions |
| `#arrays` | Probability Array Lab | Two fair dice; custom independent choices; event selection and sample spaces |
| `#measurement` | Measurement & Scale Lab | Areas, perimeters, solid surface areas/volumes and similar-shape scaling |
| `#ratios` | Ratio & Rate Lab | Sharing in ratios, speed conversions and unit-price comparisons |
| `#sampling` | Sampling Lab | Crypto-generated fair-die sample means, normal approximation and approximate confidence intervals |

Existing tools remain in `docs/dice-lab`, `docs/coin-lab`, `docs/equation-balance`, `docs/fraction-lab` and `docs/tree-lab`.

## Classroom feedback update

- Activity selector grouped by topic; inactive inputs hidden.
- Function Lab: draggable tangent, sine/cosine/tangent, degrees/radians, π axis labels, discontinuity-safe tangent rendering and integrals.
- Statistics: up to six parallel boxplots, outlier crosses or full-range whiskers, automatic/manual histogram width, integer frequency ticks.
- Distribution: integer successes ticks; normal μ ± 1σ/2σ/3σ presets (approximately 68/95/99.7%).
- Trigonometry: editable sides/angle, fixed-value constraints, separate unit circle controls, sine rule with both SSA solutions.
- Finance: pointer readout and up to five simultaneous sequences.
- Matrix presets: rotation, reflection, enlargement and shear; inverse transformation with singular-matrix validation.
- Complex numbers: Cartesian/polar input, subtraction and conjugation.
- Arrays: named outcomes directly in cells, with scrolling for large custom arrays.
- Measurement: 2D/3D selector and shaded rotatable cuboids, cylinders and spheres.
- Sampling: variable-face dice, fair coins and custom finite populations; changing settings resets samples.

Triangle constraints: right triangles allow one fixed value; general triangles allow two. With no locks, side edits preserve A and angle edits preserve c. Inconsistent changes restore the prior triangle. General SSA editing retains the nearest prior solution; dedicated sine-rule mode exposes both solutions. Custom sampling treats each entered item as equally likely (repeated values provide weights), with replacement. The 3D view uses orthographic projection, with mathematically calculated areas and volumes.

## Interaction refinements

- Trigonometry uses equal physical axis units and a square grid, with a right-angle marker. Drag A, B or C in right/general triangle mode. The right angle and checked fixed values are preserved; the view fits all vertices on release. Sine-rule examples retain their given-data controls.
- Measurement offers independent Show 2D and Show 3D switches, including simultaneous views with separate shape selections and shared dimensions/scale factor.
- Function Lab adds zoom in/out, reset view, and independent horizontal/vertical view ranges.
- Boxplot exports include Q1 − 1.5 IQR and Q3 + 1.5 IQR fences. Values exactly on either fence are not outliers; tests cover both boundaries.
- Unit prices have a labelled zero-based dollar scale, selectable common quantity units, and optional third option C.
- The former speed calculator is replaced by two journey comparisons: independent speeds, optional delayed start/stopping time, and a time slider on a shared distance–time graph.

## Local use

Unzip the package. Open `docs/index.html` in Chrome or Edge. The pages also work through any static web server. If a browser restricts Web Crypto on a local file, use localhost or HTTPS for Sampling Lab.

No build step or installation is needed. Hash links work on GitHub Pages project URLs.

## Publish the update

The existing repository is `valkanyz/mr-days-maths-tools`. GitHub Pages serves **main → /docs**.

Commit updates to the existing main branch. Its Pages workflow publishes the site automatically. Keep the existing Pages settings.

Alternatively, upload the contents of `docs/` to any static hosting service. Set the publish directory to `docs`, with no build command.

## Tests

With Node.js installed:

```
node tests/expansion.cjs
node tests/labs.cjs
node tests/tree-lab.cjs
node tests/fraction-lab.cjs
node tests/equation-balance.cjs
node tests/dice-lab.cjs
node tests/coin-lab.cjs
```

The new tests cover independent expected values and identities for statistics, regression, binomial/normal distributions, analytic derivatives and integrals, loan payoff behaviour, vector products, complex roots, shortest paths and spanning trees. Browser checks cover every new activity, including custom array cell selection, sampling, results and the tree visibility switches.

## Model conventions

- Statistics quartiles use medians of halves, excluding the middle observation for odd n. This differs from some spreadsheet percentile conventions.
- Normal probabilities use a numerical CDF approximation; displays are rounded.
- Finance rates are per period. Interest is applied before end-of-period deposits/repayments. Fees and taxes are not modelled. Full precision is retained internally.
- Networks are undirected with positive weights; one solution is shown when ties occur.
- Sampling uses the selected finite population, replacement and its known population standard deviation. Normal confidence intervals use 1.96 and are approximate. For the default six-sided die the mean is 3.5 and population variance is 35/12. Interval view shows the latest 30 samples; exports contain all retained samples (up to 10,000).
- Course tags are suggested classroom audiences, not a claim of full syllabus coverage. Teachers should select activities appropriate to their class.

## Curriculum references consulted

- WA Mathematics P–10: https://k10outline.scsa.wa.edu.au/home/wa-curriculum/learning-areas/mathematics/p-10-mat-curriculum
- Applications: https://senior-secondary.scsa.wa.edu.au/syllabus-and-support-materials/mathematics/mathematics-applications
- Methods: https://senior-secondary.scsa.wa.edu.au/syllabus-and-support-materials/mathematics/mathematics-methods
- Specialist: https://senior-secondary.scsa.wa.edu.au/syllabus-and-support-materials/mathematics/mathematics-specialist


## Thirteen additional investigations

The new module `docs/labs/expansion.js` adds the following hash routes to the existing lab shell. All appear in the topic-grouped activity menu and homepage course filters.

| Route | Activity |
|---|---|
| #tiles | Signed draggable algebra tiles, zero pairs, rectangle expansion and square completion |
| #angles | Parallel lines, draggable triangles and regular polygons |
| #venn | Two/three named sets, draggable objects, linked A/B table and conditional events |
| #simultaneous | Guided elimination, generated problems, substitution and checking |
| #pythagoras | Side squares, triple snapping and rigid four-triangle area rearrangement |
| #numberline | Directed signed operations and open/closed inequalities |
| #counting | Enumerated permutations/combinations with optional repetition |
| #inequalities | Equivalent operations and number-line solutions |
| #integration | Adjustable rectangle/trapezium strip widths |
| #calculus | First-principles limit, polynomial expansion and simplification |
| #vectors3 | Rotatable 3D vectors, projection, cross products and line/plane intersection |
| #projects | Directed task networks, earliest/latest times, critical tasks and float |
| #transitions | Two/three-category transition matrices and repeated population changes |
| #inference | Repeated normal-population confidence intervals with known sigma |
| #nets | Six fully unfolding solids, including cylinder |

The existing network, vector/matrix, statistics and measurement labs link directly to their extensions.

### Scope and conventions

- Algebra tiles stay on a bounded snap grid. Generated completing-square problems use even positive x coefficients; free tiles support signed expressions.
- Angle diagrams use coloured arcs and independently selected relationships. Triangle vertices remain draggable.
- Venn defaults to shaded events and region counts. Elements are assigned independently and uniformly among regions; optional objects are draggable. The table summarises A/B and highlights corresponding event cells.
- Simultaneous equations is a guided elimination workshop with generated integer-solution problems and step reveals.
- Linear inequalities applies reversible operations and automatically reverses signs for negative multiplication/division.
- Pythagoras includes triple snapping and rigid triangle rearrangement. Cross-sections and the square-root number-line view have been removed.
- Permutations/combinations shows formulas and appends outcomes in batches of 120 while scrolling. CSV exports outcomes loaded so far.
- First principles expands custom polynomials up to degree 3. Numerical integration is separate, with adjustable widths, shortened final strips, signed areas and a 1,000-strip limit.
- 3D vectors supports drag-to-orbit and a separate vector-tip editing mode.
- Nets includes cube, cuboid, triangular/pentagonal prisms, square pyramid and cylinder. Every solid unfolds; the camera turns face-on at the flat endpoint. Intermediate surfaces may overlap.
- Project networks has five editable examples, supports up to 18 tasks and assumes unlimited resources.
- Transition matrices are column-stochastic; confidence intervals assume a normal population and known sigma.

### Verification

Run `node tests/expansion.cjs` and the other six test suites. Browser checks cover revised controls, all default activities, alternative nets, angle modes, Venn shading, triple selection, worked derivatives, signed inequalities and numerical integration.
