
const { catagoryOption, blockOption } = require('./option');
const Unicode = require('./unicode.json');

let input = [];

function catagoryUpdate({ target: { checked } }, setIdx, optIdx) {
    catagoryOption[setIdx].opt[optIdx][2] = checked;
    generateInput();
}

function blockUpdate({ target: { checked } }, optIdx) {
    blockOption[optIdx][3] = checked;
    generateInput();
}

function generateInput() {
    const catChars = new Set(
        catagoryOption
        .flatMap(cat => cat.opt)
        .filter(opt => opt[2])
        .map(opt => opt[0])
        .flatMap(c => Unicode[c])
    );
    input = blockOption
        .filter(opt => opt[3])
        .flatMap(opt => Array.from({ length: opt[1] - opt[0] }, (x, i) => i + opt[0]))
        .filter(c => catChars.has(c));
    document.querySelector('fieldset.render input.chars').value = input.length;
}

function renderPreview() {
}

function exportIndex() {
}

function exportFont() {
}

const catagorySetTemplate = document.querySelector('section.catagory > template.set');
const catagoryOptTemplate = document.querySelector('section.catagory > template.opt');
const catagorySection = document.querySelector('section.catagory');
catagoryOption.forEach(({ set, opt }, idxSet) => {
    const s = catagorySetTemplate.content.cloneNode(true);
    s.querySelector('legend').textContent = `Catagory: ${set}`;
    opt.forEach(([name, desc, checked], idxOpt) => {
        const o = catagoryOptTemplate.content.cloneNode(true);
        o.querySelector('span').textContent = `${desc} (${name})`;
        o.querySelector('input').checked = checked;
        o.querySelector('input').addEventListener('change', e => catagoryUpdate(e, idxSet, idxOpt));
        s.querySelector('fieldset').appendChild(o);
    });
    catagorySection.appendChild(s);
});

const blockTemplate = document.querySelector('fieldset.block > template');
const blockField = document.querySelector('fieldset.block');
blockOption.forEach(([lower, upper, name, checked], idx) => {
    const o = blockTemplate.content.cloneNode(true);
    o.querySelector('span').textContent = name;
    o.querySelector('input').checked = checked;
    o.querySelector('input').addEventListener('change', e => blockUpdate(e, idx));
    blockField.appendChild(o);
});

document.querySelectorAll('fieldset.render input').forEach(input => {
    input.addEventListener('change', e => renderPreview());
});

generateInput();
renderPreview();

