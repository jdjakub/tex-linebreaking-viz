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

/*
box w; min w; nat w; max w; stretch w; box w ...
*/

line = {
  width: 500,
  blocks: ['The', [10,10,20,105], 'quick', [10,10,20,105], 'brown', [10,10,20,105], 'fox'],
  spatial: undefined,
};

canvas = {
};
canvas.elem = document.getElementById('canvas');
canvas.ctx = canvas.elem.getContext('2d');

// Hi-DPI stuff
dpr = window.devicePixelRatio || 1;
bcr = canvas.elem.getBoundingClientRect();
canvas.elem.width = bcr.width * dpr;
canvas.elem.height = bcr.height * dpr;
canvas.ctx.scale(dpr, dpr);
canvas.elem.style.width = bcr.width + 'px';
canvas.elem.style.height = bcr.height + 'px';

drop = y => canvas.ctx.translate(0, +y);
rise = y => drop(-y);
advance = x => canvas.ctx.translate(+x, 0);
back = x => advance(-x);

canvas.ctx.font = '16px serif';

function rnd() {
  const LH = 10;
  const c = canvas.ctx;
  c.clearRect(0, 0, canvas.elem.width, canvas.elem.height);
  c.save();

  c.fillStyle = 'lightgray';
  c.fillRect(0, 0, line.width, LH); drop(LH);

  drop(40);
  line.spatial = [];

  for (let block of line.blocks) {
    if (typeof block === 'string') {
      const metrics = c.measureText(block);
      const w = metrics.width;
      line.spatial.push(w);
      c.fillStyle = 'black';
      c.fillText(block, 0, 0);
      drop(10);
        c.fillRect(0, 0, w, LH*1.5); advance(w);
      rise(10);
    } else {
      const [toMin, toNat, toMax, stretch] = block;
      c.fillStyle = 'lightgray';
      drop(10);
        c.fillStyle = 'lightgray';
        c.fillRect(0, 0, toMin, LH*2); advance(toMin);
        c.fillRect(0, 0, toNat, LH*2); advance(toNat);
        c.fillRect(0, 0, toMax, LH*2);
        drop(LH/2);
          if (stretch < 0) {
            c.fillStyle = '#2599ff';
            c.fillRect(stretch, 0, -stretch, LH);
          } else {
            c.fillStyle = 'orange';
            c.fillRect(0, 0, stretch, LH);
          }
        rise(LH/2); back(toNat);
        c.fillStyle = 'black';
        c.fillRect(-1, 0, 1, LH*2); advance(toNat);
        c.fillRect(-1, 0, 2, LH*2); advance(toMax);
        c.fillRect(-1, 0, 1, LH*2); back(toMax);
        advance(stretch);
      rise(10);
      line.spatial.push(block);
    }
  }

  c.restore();
}

function pick(x,y) {
  for (let i=0; i<line.spatial.length; i++) {
    const block = line.spatial[i];
    if (typeof block === 'number') {
      x -= block; if (x < 0) return [i];
    } else {
      const [toMin, toNat, toMax, stretch] = block;
      x -= toMin; if (x < 0) return [i, 0];
      x -= toNat; if (x < 0) return [i, 1];
      x -= toMax; if (x < 0) return [i, 2];
      x -= stretch; if (x < 0) return [i, 3];
    }
  }
  return [];
}

dragging = [];
compensating = [];

canvas.elem.onmousedown = e => {
  const [x,y] = [e.clientX-bcr.x, e.clientY-bcr.y];
  const [i,j] = pick(x,y);
  dragging = [i,j];
  if (i !== undefined && i > 0 && i < line.spatial.length-1) {
    if (j === 3) {
      if (i + 2 > line.spatial.length-1) compensating = [i-2, 3];
      else compensating = [i+2, 3];
    }
  }
};

canvas.elem.onmouseup = e => {
  dragging = []; compensating = [];
};

canvas.elem.onmousemove = e => {
  const [dx,dy] = [e.movementX, e.movementY];
  const [i,j] = dragging;
  const [ci,cj] = compensating;
  if (i !== undefined && j !== undefined) {
    line.spatial[i][j] += dx;
  }
  if (ci != undefined && cj !== undefined) {
    line.spatial[ci][cj] -= dx;
  }
  rnd();
};

rnd();
