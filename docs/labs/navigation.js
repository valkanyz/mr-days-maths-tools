// Topic order follows the home catalogue. Broad classroom tools come before niche tools.
// Applied after all labs register, so earlier extension scripts cannot reorder the menu.
(()=>{
 const groups={
  "Number & finance": [
    "percentages",
    "ratios",
    "numberline",
    "decimals",
    "powers",
    "finance"
  ],
  "Algebra, functions & calculus": [
    "functions",
    "patterns",
    "tiles",
    "simultaneous",
    "inequalities",
    "binomial",
    "calculus",
    "integration"
  ],
  "Measurement & geometry": [
    "area",
    "angles",
    "measurement",
    "nets",
    "pythagoras",
    "trigonometry",
    "transformations",
    "bearings",
    "timezones"
  ],
  "Probability": [
    "arrays",
    "venn",
    "distributions",
    "counting"
  ],
  "Statistics": [
    "statistics",
    "sampling",
    "inference"
  ],
  "Matrices, vectors & complex numbers": [
    "vectors",
    "transitions",
    "complex",
    "vectors3"
  ],
  "Networks & optimisation": [
    "networks",
    "projects"
  ]
};
 const selected=$('activity').value;
 $('activity').innerHTML=Object.entries(groups).map(([topic,ids])=>`<optgroup label="${esc(topic)}">${ids.filter(id=>labs[id]).map(id=>`<option value="${id}">${esc(labs[id].title)}</option>`).join('')}</optgroup>`).join('');
 $('activity').value=selected;
})();
