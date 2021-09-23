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

// e.g. div = el('div', { ??? }, body)
el = (tag, attrs, parent) => create_element(tag, attrs, parent, 'http://www.w3.org/1999/xhtml');

line1 = document.getElementById('line1');
line2 = document.getElementById('line2');
curr_line = line1;

function newWord(str) {
  const div = el('div', { class: 'word item' }, curr_line);
  el('div', { class: 'text', textContent: str }, div);
  el('div', { class: 'rigid' }, div);
}

width = x => 'width: ' + x + 'px';

function newGlue(toMin, toNat, toMax, stretch) {
  const item = el('div', { class: 'glue item' }, el('div', { class: 'container' }, curr_line));
  el('div', { class: 'min glue', style: width(toMin) }, item);
  el('div', { class: 'nat glue', style: width(toNat) }, item);
  const ss = el('div', { class: 'stretch-shrink' }, el('div', { class: 'container' }, item));
  if (stretch < 0) {
    ss.parentElement.classList.add('shrink');
    ss.style.right = '0px'; ss.style.width = -stretch + 'px';
  } else {
    ss.parentElement.classList.add('stretch');
    ss.style.width = stretch + 'px';
  }
  el('div', { class: 'max glue', style: width(toMax) }, item);
  const advance = toMin + toNat + stretch;
  el('div', { class: 'spacer', style: width(advance) }, curr_line);
}

newWord('The');
newGlue(10, 10, 20, 100);
newWord('quick');
newGlue(10, 10, 20, 100);
newWord('brown');
newGlue(10, 10, 20, 100);
newWord('fox');

curr_line = line2;
newWord('The');
newGlue(40, 10, 20, -30);
newWord('quick');
newGlue(40, 10, 20, -30);
newWord('brown');
newGlue(40, 10, 20, -30);
newWord('fox');
