
const { catagoryOption, blockOption } = require('./option');
const Unicode = require('./unicode.json');

let input = [];
let indexOffset = 0;
let indexData = new Int32Array(0);
let outputData = new Uint8Array(0);

function catagoryUpdate({ target: { checked } }, setIdx, optIdx) {
    catagoryOption[setIdx].opt[optIdx][2] = checked;
    generateInput();
}

function blockUpdate({ target: { checked } }, optIdx) {
    const customInput = document.querySelector('fieldset.block input.custom');
    const catagoryInput = document.querySelectorAll('fieldset.catagory input.catagory');
    if(optIdx >= 0) {
        customInput.checked = false;
        catagoryInput.forEach(i => i.disabled = false);
        blockOption[optIdx][3] = checked;
        generateInput();
    } else if(customInput.checked) {
        document.querySelectorAll('fieldset.block input.block').forEach(i => i.checked = false);
        catagoryInput.forEach(i => i.disabled = true);
        blockOption.forEach(opt => opt[3] = false);
        generateInput(true);
    } else {
        generateInput();
    }
}

function generateInput(custom) {
    if(custom) {
        const chars = new Set(document.querySelector('fieldset.block textarea').value);
        input = [...chars].map(c => c.codePointAt(0));
    } else {
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
    }
    document.querySelector('fieldset.render input.chars').value = input.length;
    renderPreview();
}

function thresholdFilter({ width, height, data }, thres) {
    for(let i = 0; i < width * height; i++) {
        const a = data[i*4 + 3];
        data[i*4 + 3] = (a > thres) ? 255 : 0;
    }
}

async function renderPreview() {
    const renderBtn = document.querySelector('fieldset.render button.render');
    const inputs = [
        document.querySelector('fieldset.render input.width'),
        document.querySelector('fieldset.render input.height'),
        document.querySelector('fieldset.render input.anchorx'),
        document.querySelector('fieldset.render input.anchory'),
        document.querySelector('fieldset.render input.thres'),
        document.querySelector('fieldset.render input.font'),
        document.querySelector('fieldset.render input.size'),
        document.querySelector('fieldset.render input.indexlower'),
        document.querySelector('fieldset.render input.indexupper'),
        document.querySelector('fieldset.render input.test'),
    ];
    if(inputs.every(i => i.validity.valid) && input.length > 0) {
        render(true);
        renderBtn.disabled = false;
        renderBtn.textContent = `Render (${(outputData.length/1000).toFixed(1)}KB)`;
    } else {
        renderBtn.disabled = true;
        renderBtn.textContent = "Render";
    }
}

function hexInputValidate({ target }) {
    const valid = target.value.match(/[0-9A-F]{4}/);
    target.setCustomValidity(valid ? "" : "Invalid Hex");
}

async function render(preview) {
    const inputs = [
        document.querySelector('fieldset.render input.width'),
        document.querySelector('fieldset.render input.height'),
        document.querySelector('fieldset.render input.anchorx'),
        document.querySelector('fieldset.render input.anchory'),
        document.querySelector('fieldset.render input.thres'),
        document.querySelector('fieldset.render input.font'),
        document.querySelector('fieldset.render input.size'),
        document.querySelector('fieldset.render input.indexlower'),
        document.querySelector('fieldset.render input.indexupper'),
        document.querySelector('fieldset.render input.test'),
    ];
    const [
        width, height, anchorX, anchorY, onThres,
    ] = inputs.slice(0, 5).map(i => parseInt(i.value));
    const [
        fontFamily, fontSize, idxLower, idxUpper, testChar
    ] = inputs.slice(5).map(i => i.value);

    const renderCanvas = document.querySelector('canvas.render');
    const thresCanvas = document.querySelector('canvas.thres');
    renderCanvas.width = width;
    renderCanvas.height = height * 8;
    thresCanvas.width = width * 10;
    thresCanvas.height = height * 80;

    const renderCtx = renderCanvas.getContext('2d');
    const thresCtx = thresCanvas.getContext('2d');
    renderCtx.font = `${fontSize}px ${fontFamily}`;
    renderCtx.textAlign = 'center';
    renderCtx.textBaseline = 'middle';
    renderCtx.fillStyle = '#000';
    thresCtx.imageSmoothingEnabled = false;

    indexOffset = parseInt(idxLower, 16);
    indexData = new Int32Array(parseInt(idxUpper, 16) - indexOffset);
    indexData.fill(-1);
    outputData = new Uint8Array(width * height * input.length);

    if(!preview) {
        document.querySelector('fieldset.block textarea').disabled = true;
        document.querySelector('fieldset.render button.render').disabled = true;
        document.querySelectorAll('input').forEach(i => i.disabled = true);
    }

    const charList = preview ? [testChar.codePointAt(0)] : input;
    const [ p1, p2 ] = document.querySelectorAll('span.progress');
    const pBar = document.querySelector('div.progress > div.bar');
    let lastT = null;
    let fps = [];
    for(let i = 0; i < charList.length; i++) {
        const cp = charList[i];
        renderCtx.clearRect(0, 0, width, height * 8);
        renderCtx.fillText(String.fromCodePoint(cp), anchorX, anchorY);
        const t = await new Promise(r => requestAnimationFrame(r));
        if(lastT) fps.push(1000/(t - lastT));
        if(fps.length > 60) fps.shift();
        lastT = t;
        const image = renderCtx.getImageData(0, 0, width, height * 8);
        thresholdFilter(image, onThres);
        createImageBitmap(image).then(ib => {
            thresCtx.clearRect(0, 0, width * 10, height * 80);
            thresCtx.drawImage(ib, 0, 0, width * 10, height * 80);
        });
        if(!preview) {
            const pc = (((i+1) / charList.length) * 100).toFixed(2);
            const avgFps = fps.length === 60 ? (fps.reduce((a,b) => a+b) / fps.length).toFixed(1) : null;
            p1.textContent = `${pc}%` + (avgFps ? `, ${avgFps}fps` : '');
            p2.textContent = `${pc}%` + (avgFps ? `, ${avgFps}fps` : '');
            pBar.style.width = `calc(${pc}% - 2px)`;
            const outputOffset = i * width * height;
            if(indexOffset <= cp && cp < indexOffset + indexData.length) {
                indexData[cp - indexOffset] = outputOffset;
            }
            for(let row = 0; row < height; row++) {
                for(let col = 0; col < width; col ++) {
                    const pxOffset = [
                        row * width * 8 + width * 0 + col,
                        row * width * 8 + width * 1 + col,
                        row * width * 8 + width * 2 + col,
                        row * width * 8 + width * 3 + col,
                        row * width * 8 + width * 4 + col,
                        row * width * 8 + width * 5 + col,
                        row * width * 8 + width * 6 + col,
                        row * width * 8 + width * 7 + col,
                    ];
                    const byte = pxOffset
                        .map((off, idx) => (image.data[off * 4 + 3] ? 1 : 0) << idx)
                        .reduce((a,b) => a|b);
                    outputData[outputOffset + row * width + col] = byte;
                }
            }
        }
    }
    if(!preview) {
        const exportIndex = document.querySelector('a.exportIndex');
        const exportFont = document.querySelector('a.exportFont');
        exportIndex.style.color = '#000';
        exportIndex.style.border = '1px solid #000';
        exportIndex.download = 'font.index.bin';
        exportIndex.href = URL.createObjectURL(new Blob([ indexData.buffer ], { type: 'application/octet-stream' }));
        exportFont.style.color = '#000';
        exportFont.style.border = '1px solid #000';
        exportFont.download = 'font.data.bin';
        exportFont.href = URL.createObjectURL(new Blob([ outputData.buffer ], { type: 'application/octet-stream' }));
        // Reset
        document.querySelector('fieldset.block textarea').disabled = false;
        document.querySelector('fieldset.render button.render').disabled = false;
        document.querySelectorAll('input').forEach(i => i.disabled = false);
        blockUpdate({ target: document.querySelector('fieldset.block input.custom') }, -1);
    }
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

const blockTemplate = document.querySelector('section.block > template');
const blockField = document.querySelector('section.block');
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
document.querySelector('fieldset.render input.width')
    .addEventListener('change', ({ target }) => {
        if(target.validity.valid) {
            const half = Math.round(parseInt(target.value) / 2);
            document.querySelector('fieldset.render input.anchorx').value = half;
        }
    });
document.querySelector('fieldset.render input.height')
    .addEventListener('change', ({ target }) => {
        if(target.validity.valid) {
            const half = parseInt(target.value) * 4;
            document.querySelector('fieldset.render input.anchory').value = half;
        }
    });

document.querySelector('fieldset.block input.custom')
    .addEventListener('change', e => blockUpdate(e, -1));
document.querySelector('fieldset.block textarea')
    .addEventListener('change', e => blockUpdate(e, -1));

document.querySelector('fieldset.render input.indexlower')
    .addEventListener('input', hexInputValidate);
document.querySelector('fieldset.render input.indexupper')
    .addEventListener('input', hexInputValidate);

document.querySelector('button.render')
    .addEventListener('click', e => render());

generateInput();

