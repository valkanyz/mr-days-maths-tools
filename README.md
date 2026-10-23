# Mr Day's Maths Tools

Seventeen silent, static classroom mathematics tools. All run entirely in a modern browser without accounts, databases, paid services or external JavaScript dependencies.

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
