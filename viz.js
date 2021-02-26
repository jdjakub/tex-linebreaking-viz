// ### UTILITIES

log = (...args) => { console.log(...args); return args ? args[0] : undefined };
final = arr => arr[arr.length-1]

// ### SVG UTILITIES (from my OROM / Id work)
attr_single = (elem, key, val_or_func) => {
  let old;
  if (key === 'textContent') old = elem.textContent;
  else old = elem.getAttribute(key);

  let value = typeof(val_or_func) === 'function' ? val_or_func(old) : val_or_func;
  if (key === 'textContent') elem.textContent = value;
  else if (value !== undefined) elem.setAttribute(key, value);

  return old;
};

// e.g. attr(rect, {stroke_width: 5, stroke: 'red'})
//      attr(rect, 'stroke', 'red')
//      attr(rect, 'height', h => h+32)
//      attr(rect, {fill: 'orange', height: h => h+32})
attr = (elem, key_or_dict, val_or_nothing) => {
  if (typeof(key_or_dict) === 'string') {
    let key = key_or_dict;
    let value = val_or_nothing;
    return attr_single(elem, key, value);
  } else {
    let dict = key_or_dict;
    for (let [k,v_or_f] of Object.entries(dict)) {
      let key = k.replace('_','-');
      attr_single(elem, key, v_or_f);
    }
  }
}

nums = (arr) => arr.map(x => +x);
attrs = (el, ...keys) => keys.map(k => attr(el, k));
props = (o,  ...keys) => keys.map(k => o[k]);

create_element = (tag, attrs, parent, namespace) => {
  let elem = document.createElementNS(namespace, tag);
  if (attrs !== undefined) attr(elem, attrs);
  if (parent === undefined) parent = window.svg;
  parent.appendChild(elem);
  return elem;
};

// e.g. rect = svgel('rect', {x: 5, y: 5, width: 5, height: 5}, svg)
svgel = (tag, attrs, parent) => create_element(tag, attrs, parent, 'http://www.w3.org/2000/svg');

svg = document.getElementById('svg');
g = svgel('g', {transform: 'translate(30,300)'}, svg);
r = svgel('rect', {class: 'desired-line', width: 500}, g);
c = svgel('circle', {cx: 0, cy: 0, r: 3, fill: 'red'}, g);
px = py = 0; // pen position
pen = (x,y) => { px = x; py = y; attr(c, {cx: x, cy: y});};
rpen = (x,y) => pen(px+x, py+y);
drop = y => rpen(0, +y);
rise = y => rpen(0, -y);
advance = x => rpen(+x, 0);

words = svgel('g', {transform: 'translate(0,30)', class: 'words'}, g);
bars = svgel('g', {transform: 'translate(0,40)', class: 'bars'}, g);
marks = svgel('g', {transform: 'translate(0,40)', class: 'marks'}, g);

function addWord(str) {
  const t = svgel('text', {x: px, textContent: str}, words);
  const width = t.getComputedTextLength();
  const tr = svgel('rect', {x: px, class: 'rigid', width}, bars);
  advance(width);
}

addWord('The');

function addGlue(min, nat, max, focus) {
  bars.appendChild(c); drop(5);
    svgel('rect', {class: 'spring', x: px, y: py, width: max}, bars);

    let [fo, fw] = [0,0];
    if (focus === 'stretch') [fo, fw] = [nat, max-nat];
    else if (focus === 'shrink') [fo, fw] = [min, nat-min];
    if (fw !== 0)
      svgel('rect', {class: 'spring focus', x: px+fo, y: py, width: fw}, bars);

    let x1 = x2 = px + min;
    svgel('line', {x1, x2, y1: py, y2: py+20, class: 'mark min'}, marks);
    x1 = x2 = px + nat;
    svgel('line', {x1, x2, y1: py, y2: py+20, class: 'mark nat'}, marks);
    x1 = x2 = px + max;
    svgel('line', {x1, x2, y1: py, y2: py+20, class: 'mark max'}, marks);
  rise(5); g.appendChild(c);
  advance(nat);
}

addGlue(10, 20, 40, 'stretch');
addWord('quick');
addGlue(10, 20, 40, 'shrink');
addWord('brown');
addGlue(10, 20, 40);
addWord('fox');
