// ### UTILITIES
DEBUG = () => { debugger; };
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
newGlue(10, 10, 20, 0);
newWord('quick');
newGlue(10, 10, 20, 0);
newWord('brown');
newGlue(10, 10, 20, 0);
newWord('fox');

curr_line = line2;
newWord('The');
newGlue(40, 10, 20, -30);
newWord('quick');
newGlue(40, 10, 20, -30);
newWord('brown');
newGlue(40, 10, 20, -30);
newWord('fox');

clwidth = e => e.getBoundingClientRect().width;
Array.prototype.sum = function() {
  return this.reduce((acc, w) => acc + w,0);
}

function distribute(line) {
  const total_space = clwidth(line.querySelector('.desired-line'));
  const total_words = Array.from(line.querySelectorAll('.rigid'))
    .map(clwidth).sum();
  const ideal_glue = Array.from(line.querySelectorAll('.min.glue, .nat.glue'))
    .map(clwidth).sum();
  const total_glue = total_space - total_words;
  const excess_glue = total_glue - ideal_glue;
  if (excess_glue >= 0.0) { // stretch
    const total_stretchability = Array.from(line.querySelectorAll('.max.glue'))
      .map(clwidth).sum();
    Array.from(line.querySelectorAll('.glue.item')).forEach(item => {
      const stretchability = clwidth(item.querySelector('.max.glue'));
      const proportion = stretchability / total_stretchability;
      const actual_stretch = excess_glue * proportion;
      // update stretch bar
      item.querySelector('.stretch-shrink').style.width = actual_stretch+'px';
      const nat_glue = clwidth(item.querySelector('.min.glue'))
                     + clwidth(item.querySelector('.nat.glue'));
      const actual_glue = nat_glue + actual_stretch;
      // update .spacer
      item.parentElement.nextElementSibling.style.width = actual_glue+'px';
    });
    const stretch_amt = line.querySelector('.stretch-amt');
    const denom = line.querySelector('.denom');
    const quotient = line.querySelector('.quotient');
    stretch_amt.textContent = Math.round(excess_glue);
    denom.textContent = Math.round(total_stretchability);
    const ratio = excess_glue / total_stretchability;
    quotient.textContent = ratio.toPrecision(2);
  } else { // shrink
    throw "Oops";
  }
}
