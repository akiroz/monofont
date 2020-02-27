
const { catagoryOption, blockOption } = require('./option');

const Unicode = {
    Ll: require('unicode-tables/category/Ll'),
    Lm: require('unicode-tables/category/Lm'),
    Lo: require('unicode-tables/category/Lo'),
    Lt: require('unicode-tables/category/Lt'),
    Lu: require('unicode-tables/category/Lu'),
    Nd: require('unicode-tables/category/Nd'),
    Nl: require('unicode-tables/category/Nl'),
    No: require('unicode-tables/category/No'),
    Pc: require('unicode-tables/category/Pc'),
    Pd: require('unicode-tables/category/Pd'),
    Pe: require('unicode-tables/category/Pe'),
    Pf: require('unicode-tables/category/Pf'),
    Pi: require('unicode-tables/category/Pi'),
    Po: require('unicode-tables/category/Po'),
    Ps: require('unicode-tables/category/Ps'),
    Sc: require('unicode-tables/category/Sc'),
    Sk: require('unicode-tables/category/Sk'),
    Sm: require('unicode-tables/category/Sm'),
    So: require('unicode-tables/category/So'),
};

let input = [];

function catagoryUpdate(event) {
    generateInput();
}

function blockUpdate(event) {
    generateInput();
}

function generateInput() {
    input = [];
}

function renderUpdate() {
    renderPreview();
}

function previewUpdate() {
    renderPreview();
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
        o.querySelector('input').setAttribute('data-set', idxSet);
        o.querySelector('input').setAttribute('data-opt', idxOpt);
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
    o.querySelector('input').setAttribute('data-opt', idx);
    blockField.appendChild(o);
});

generateInput();
renderPreview();

