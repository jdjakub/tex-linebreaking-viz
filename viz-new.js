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

lines = document.getElementById('lines');
curr_line = undefined;

width = x => 'width: ' + x + 'px';

function newLine() {
  curr_line = el('div', { class: 'line' }, lines);
  el('div', { class: 'desired-line', style: width(600) }, curr_line);
  const ratio = el('span', { class: 'ratio' }, curr_line);
  ratio.innerHTML = '<span class="stretch-amt numer">300</span>/<span class="denom">60</span> = <span class="quotient">5.0</span>';
}

function newWord(str) {
  const div = el('div', { class: 'word item' }, curr_line);
  el('div', { class: 'text', textContent: str }, div);
  el('div', { class: 'rigid' }, div);
}

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
  const total_stretch = total_glue - ideal_glue;
  if (total_stretch >= 0.0) { // stretch
    const total_stretchability = Array.from(line.querySelectorAll('.max.glue'))
      .map(clwidth).sum();
    Array.from(line.querySelectorAll('.glue.item')).forEach(item => {
      const stretchability = clwidth(item.querySelector('.max.glue'));
      const proportion = stretchability / total_stretchability;
      const actual_stretch = total_stretch * proportion;
      // update stretch bar
      const bar = item.querySelector('.stretch-shrink');
      bar.parentElement.classList.add('stretch');
      bar.parentElement.classList.remove('shrink');
      bar.style.width = actual_stretch+'px';
      bar.style.right = null;
      // update .spacer
      const nat_glue = clwidth(item.querySelector('.min.glue'))
                     + clwidth(item.querySelector('.nat.glue'));
      const actual_glue = nat_glue + actual_stretch;
      item.parentElement.nextElementSibling.style.width = actual_glue+'px';
    });
    const stretch_amt = line.querySelector('.numer');
    const denom = line.querySelector('.denom');
    const quotient = line.querySelector('.quotient');
    stretch_amt.textContent = Math.round(total_stretch);
    stretch_amt.classList.add('stretch-amt'); stretch_amt.classList.remove('shrink-amt');
    denom.textContent = Math.round(total_stretchability);
    const ratio = total_stretch / total_stretchability;
    quotient.textContent = ratio.toPrecision(2);
    return ratio;
  } else { // shrink
    const total_shrink = -total_stretch;
    const total_shrinkability = Array.from(line.querySelectorAll('.nat.glue'))
      .map(clwidth).sum();
    Array.from(line.querySelectorAll('.glue.item')).forEach(item => {
      const shrinkability = clwidth(item.querySelector('.nat.glue'));
      const proportion = shrinkability / total_shrinkability;
      const actual_shrink = total_shrink * proportion;
      // update shrink bar
      const bar = item.querySelector('.stretch-shrink');
      bar.parentElement.classList.add('shrink');
      bar.parentElement.classList.remove('stretch');
      bar.style.width = actual_shrink+'px';
      bar.style.right = '0px';
      // update .spacer
      const nat_glue = clwidth(item.querySelector('.min.glue'))
                     + clwidth(item.querySelector('.nat.glue'));
      const actual_glue = nat_glue - actual_shrink;
      item.parentElement.nextElementSibling.style.width = actual_glue+'px';
    });
    const shrink_amt = line.querySelector('.numer');
    const denom = line.querySelector('.denom');
    const quotient = line.querySelector('.quotient');
    shrink_amt.textContent = Math.round(total_stretch);
    shrink_amt.classList.add('shrink-amt'); shrink_amt.classList.remove('stretch-amt');
    denom.textContent = Math.round(total_shrinkability);
    const ratio = total_stretch / total_shrinkability;
    quotient.textContent = ratio.toPrecision(2);
    return ratio;
  }
}

paragraph = `
In olden times when wishing still helped one, there lived a king whose daughters
were all beautiful; and the youngest was so beautiful that the sun itself, which
has seen so much, was astonished whenever it shone in her face. Close by the
king’s castle lay a great dark forest, and under an old lime-tree in the forest
was a well, and when the day was very warm, the king’s child went out into the
forest and sat down by the side of the cool fountain; and when she was bored she
took a golden ball, and threw it up on high and caught it; and this ball was her
favorite plaything.
`;
words = paragraph.trim().split('\n').flatMap(l => l.split(' '));
std_glue = [10, 20, 20, 0];

let next_i = 0;

function next(doBreak=false) {
  if (1+next_i > words.length) return;
  if (doBreak) newLine();
  else newGlue(...std_glue);
  newWord(words[next_i++]);
  return distribute(curr_line);
}

function undo() {
  const word = curr_line.querySelector('.word.item:last-child');
  if (word) {
    word.previousElementSibling.remove(); // spacer
    word.previousElementSibling.remove(); // glue
    word.remove();
    next_i--;
  }
  return distribute(curr_line);
}

// To be used with ratio between -1 and 1
function mark_feasible() {
  const word = curr_line.querySelector('.word.item:last-child');
  if (word) {
    word.querySelector('.rigid').classList.toggle('feasible');
  }
}

function first_fit() {
  while (true) {
    next(true);
    let ratio;
    do { ratio = next(); } while (ratio !== undefined && ratio > 1.0);
    if (ratio === undefined) break;
  }
  newGlue(0,0,10000,0); distribute(curr_line) // end paragraph
}

function best_fit() {
  while (true) {
    next(true);
    let ratio;
    do { ratio = next(); } while (ratio !== undefined && ratio >= 0.0);
    if (ratio === undefined) break;
    const ratio2 = undo(); // wait! go back a sec (to stretch case)
    if (-ratio < ratio2) next(); // shrunk is better; restore shrunk line
    // otherwise stretched is better
  }
  newGlue(0,0,10000,0); distribute(curr_line) // end paragraph
}
