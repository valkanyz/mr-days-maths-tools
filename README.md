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
- Sampling uses fair six-sided dice, replacement and a known population standard deviation. Normal confidence intervals use 1.96 and are approximate. The population mean is 3.5 and population variance is 35/12. Interval view shows the latest 30 samples; exports contain all retained samples (up to 10,000).
- Course tags are suggested classroom audiences, not a claim of full syllabus coverage. Teachers should select activities appropriate to their class.

## Curriculum references consulted

- WA Mathematics P–10: https://k10outline.scsa.wa.edu.au/home/wa-curriculum/learning-areas/mathematics/p-10-mat-curriculum
- Applications: https://senior-secondary.scsa.wa.edu.au/syllabus-and-support-materials/mathematics/mathematics-applications
- Methods: https://senior-secondary.scsa.wa.edu.au/syllabus-and-support-materials/mathematics/mathematics-methods
- Specialist: https://senior-secondary.scsa.wa.edu.au/syllabus-and-support-materials/mathematics/mathematics-specialist
