/* Puzzle-Hunt Helper — shared app logic */
(function () {
  'use strict';

  // ---------------------------------------------------------------
  // Shared text-normalization helpers
  // ---------------------------------------------------------------
  // Harakat / tatweel / dagger alif range
  const HARAKAT_RE = /[\u064B-\u065F\u0670\u0640]/g;
  const ARABIC_RE = /[\u0600-\u06FF]/;
  const MUSNAD_RE = /[\u{10A60}-\u{10A7F}]/u;
  const MORSE_ONLY_RE = /^[.\-\s\/]*$/;

  function normalizeArabic(input) {
    return input
      .replace(HARAKAT_RE, '')
      .replace(/[\u0623\u0625\u0622\u0671]/g, '\u0627') // أإآٱ → ا
      .replace(/\u0629/g, '\u0647')                   // ة → ه
      .replace(/\u0649/g, '\u064A');                  // ى → ي
  }

  // ---------------------------------------------------------------
  // Morse
  // ---------------------------------------------------------------
  const MORSE_MAP = {
    'A': '.-',    'B': '-...',  'C': '-.-.',  'D': '-..',   'E': '.',
    'F': '..-.',  'G': '--.',   'H': '....',  'I': '..',    'J': '.---',
    'K': '-.-',   'L': '.-..',  'M': '--',    'N': '-.',    'O': '---',
    'P': '.--.',  'Q': '--.-',  'R': '.-.',   'S': '...',   'T': '-',
    'U': '..-',   'V': '...-',  'W': '.--',   'X': '-..-',  'Y': '-.--',
    'Z': '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
    '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.'
  };
  const MORSE_REVERSE = Object.fromEntries(
    Object.entries(MORSE_MAP).map(([k, v]) => [v, k])
  );

  function textToMorse(str) {
    return str
      .toUpperCase()
      .split(/(\s+)/)
      .map(chunk => {
        if (/^\s+$/.test(chunk)) return ' / ';
        return chunk
          .split('')
          .map(ch => MORSE_MAP[ch] || '')
          .filter(Boolean)
          .join(' ');
      })
      .join('')
      .replace(/\s*\/\s*/g, ' / ')
      .trim();
  }

  function morseToText(str) {
    return str
      .trim()
      .split(/\s*\/\s*/)
      .map(word =>
        word
          .trim()
          .split(/\s+/)
          .map(code => MORSE_REVERSE[code] || '')
          .join('')
      )
      .join(' ')
      .trim();
  }

  function isMorse(str) {
    const s = str.trim();
    if (!s) return false;
    return MORSE_ONLY_RE.test(s) && /[.\-]/.test(s);
  }

  function initMorse() {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const swapBtn = document.getElementById('swap-btn');

    function convert() {
      const val = input.value;
      if (!val.trim()) { output.value = ''; return; }
      output.value = isMorse(val) ? morseToText(val) : textToMorse(val);
    }

    input.addEventListener('input', convert);
    swapBtn.addEventListener('click', () => {
      const tmp = input.value;
      input.value = output.value;
      output.value = tmp;
      convert();
    });
  }

  // ---------------------------------------------------------------
  // Jummal
  // ---------------------------------------------------------------
  const JUMMAL_ABJADI = {
    'ا':1,  'ب':2,  'ج':3,  'د':4,  'ه':5,  'و':6,  'ز':7,  'ح':8,  'ط':9,
    'ي':10, 'ك':20, 'ل':30, 'م':40, 'ن':50, 'س':60, 'ع':70, 'ف':80, 'ص':90,
    'ق':100,'ر':200,'ش':300,'ت':400,'ث':500,'خ':600,'ذ':700,'ض':800,'ظ':900,'غ':1000
  };
  const JUMMAL_ALPHA = {
    'ا':1,  'ب':2,  'ت':3,  'ث':4,  'ج':5,  'ح':6,  'خ':7,  'د':8,  'ذ':9,  'ر':10,
    'ز':11, 'س':12, 'ش':13, 'ص':14, 'ض':15, 'ط':16, 'ظ':17, 'ع':18, 'غ':19, 'ف':20,
    'ق':21, 'ك':22, 'ل':23, 'م':24, 'ن':25, 'ه':26, 'و':27, 'ي':28
  };

  function initJummal() {
    const app = document.getElementById('jummal-app');
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const toggleBtn = document.getElementById('toggle-btn');
    const tableContainer = document.getElementById('table-container');

    const labelTotal = app.dataset.labelTotal;
    const labelWord = app.dataset.labelWord;
    const labelValue = app.dataset.labelValue;
    const labelMode = app.dataset.labelMode;
    const labelAbjadi = app.dataset.labelAbjadi;
    const labelAlpha = app.dataset.labelAlpha;

    let useAbjadi = true;

    function activeMap() { return useAbjadi ? JUMMAL_ABJADI : JUMMAL_ALPHA; }

    function compute() {
      const raw = input.value;
      if (!raw.trim()) { output.value = ''; return; }
      const map = activeMap();
      const words = normalizeArabic(raw).split(/\s+/).filter(Boolean);
      let total = 0;
      const lines = words.map(w => {
        let sum = 0;
        for (const ch of w) sum += (map[ch] || 0);
        total += sum;
        return `${w} = ${sum}`;
      });
      output.value = lines.join('\n') + '\n\n' + labelTotal + ' = ' + total;
    }

    function renderTable() {
      const map = activeMap();
      const entries = Object.entries(map);
      let html = '<table class="table table-sm table-bordered table-dark mb-0"><thead><tr>';
      html += `<th>${labelWord}</th><th>${labelValue}</th></tr></thead><tbody>`;
      for (const [letter, val] of entries) {
        html += `<tr><td>${letter}</td><td>${val}</td></tr>`;
      }
      html += '</tbody></table>';
      const modeLine = `<p class="text-secondary mb-2">${labelMode}: ${useAbjadi ? labelAbjadi : labelAlpha}</p>`;
      tableContainer.innerHTML = modeLine + html;
    }

    input.addEventListener('input', compute);
    toggleBtn.addEventListener('click', () => {
      useAbjadi = !useAbjadi;
      compute();
      renderTable();
    });

    renderTable();
  }

  // ---------------------------------------------------------------
  // Musnad
  // ---------------------------------------------------------------
  const MUSNAD_MAP = {
    'ه':'𐩠','ل':'𐩡','ح':'𐩢','م':'𐩣','ق':'𐩤','و':'𐩥','ش':'𐩦','ر':'𐩧','ب':'𐩨','ت':'𐩩',
    'س':'𐩪','ك':'𐩫','ن':'𐩬','خ':'𐩭','ص':'𐩮','ض':'𐩯','ف':'𐩰','ا':'𐩱','ع':'𐩲','ظ':'𐩳',
    'غ':'𐩴','د':'𐩵','ج':'𐩶','ط':'𐩷','ز':'𐩸','ذ':'𐩹','ي':'𐩺','ث':'𐩻'
  };
  const MUSNAD_REVERSE = Object.fromEntries(
    Object.entries(MUSNAD_MAP).map(([k, v]) => [v, k])
  );

  function normalizeForMusnad(str) {
    return normalizeArabic(str).replace(/\u0621/g, '\u0627'); // ء → ا
  }

  function arabicToMusnad(str) {
    const norm = normalizeForMusnad(str);
    let out = '';
    for (const ch of norm) out += (MUSNAD_MAP[ch] !== undefined ? MUSNAD_MAP[ch] : ch);
    return out;
  }

  function musnadToArabic(str) {
    let out = '';
    for (const ch of str) out += (MUSNAD_REVERSE[ch] !== undefined ? MUSNAD_REVERSE[ch] : ch);
    return out;
  }

  function initMusnad() {
    const app = document.getElementById('musnad-app');
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const swapBtn = document.getElementById('swap-btn');
    const tableContainer = document.getElementById('table-container');

    const labelArabic = app.dataset.labelArabic;
    const labelMusnad = app.dataset.labelMusnad;

    function convert() {
      const val = input.value;
      if (!val.trim()) {
        output.value = '';
        output.classList.remove('musnad-text');
        return;
      }
      let result;
      if (MUSNAD_RE.test(val)) {
        result = musnadToArabic(val);
        output.classList.remove('musnad-text');
      } else {
        result = arabicToMusnad(val);
        output.classList.add('musnad-text');
      }
      output.value = result;
    }

    function renderTable() {
      let html = '<table class="table table-sm table-bordered table-dark mb-0"><thead><tr>';
      html += `<th>${labelArabic}</th><th>${labelMusnad}</th></tr></thead><tbody>`;
      for (const [ar, mu] of Object.entries(MUSNAD_MAP)) {
        html += `<tr><td>${ar}</td><td class="musnad-text">${mu}</td></tr>`;
      }
      html += '</tbody></table>';
      tableContainer.innerHTML = html;
    }

    input.addEventListener('input', convert);
    swapBtn.addEventListener('click', () => {
      const tmp = input.value;
      input.value = output.value;
      output.value = tmp;
      // Re-apply class based on new input
      convert();
    });

    renderTable();
  }

  // ---------------------------------------------------------------
  // Romanitation
  // ---------------------------------------------------------------
  const ROMAN_MAP = {
    'ʾ':'ء','ʿ':'ع','ṯ':'ث','ḥ':'ح','ḫ':'خ','ḏ':'ذ','š':'ش','ṣ':'ص','ḍ':'ض','ṭ':'ط','ẓ':'ظ','ġ':'غ',
    'b':'ب','t':'ت','j':'ج','d':'د','r':'ر','z':'ز','s':'س','f':'ف','q':'ق','k':'ك',
    'l':'ل','m':'م','n':'ن','h':'ه','w':'و','y':'ي','a':'ا','i':'ي','u':'و'
  };
  // Reverse map — but since multiple roman keys map to ي (y,i) and و (w,u), we pick canonical
  const ROMAN_REVERSE = {
    'ء':'ʾ','ع':'ʿ','ث':'ṯ','ح':'ḥ','خ':'ḫ','ذ':'ḏ','ش':'š','ص':'ṣ','ض':'ḍ','ط':'ṭ','ظ':'ẓ','غ':'ġ',
    'ب':'b','ت':'t','ج':'j','د':'d','ر':'r','ز':'z','س':'s','ف':'f','ق':'q','ك':'k',
    'ل':'l','م':'m','ن':'n','ه':'h','و':'w','ي':'y','ا':'a'
  };

  function romanToArabic(str) {
    // Strip hyphens (separators)
    let s = str.replace(/-/g, '');
    // Sort keys by length descending to match longest first
    const keys = Object.keys(ROMAN_MAP).sort((a, b) => b.length - a.length);
    let out = '';
    let i = 0;
    while (i < s.length) {
      let matched = false;
      for (const key of keys) {
        if (s.substr(i, key.length) === key) {
          out += ROMAN_MAP[key];
          i += key.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        out += s[i];
        i++;
      }
    }
    return out;
  }

  function arabicToRoman(str) {
    const norm = str.replace(HARAKAT_RE, '');
    let out = '';
    for (const ch of norm) {
      if (ROMAN_REVERSE[ch] !== undefined) out += ROMAN_REVERSE[ch];
      else out += ch;
    }
    return out;
  }

  function initRoman() {
    const app = document.getElementById('roman-app');
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const swapBtn = document.getElementById('swap-btn');
    const tableContainer = document.getElementById('table-container');

    const labelRoman = app.dataset.labelRoman;
    const labelArabic = app.dataset.labelArabic;

    function convert() {
      const val = input.value;
      if (!val.trim()) { output.value = ''; return; }
      output.value = ARABIC_RE.test(val) ? arabicToRoman(val) : romanToArabic(val);
    }

    function renderTable() {
      let html = '<table class="table table-sm table-bordered table-dark mb-0"><thead><tr>';
      html += `<th>${labelRoman}</th><th>${labelArabic}</th></tr></thead><tbody>`;
      for (const [ro, ar] of Object.entries(ROMAN_MAP)) {
        html += `<tr><td>${ro}</td><td>${ar}</td></tr>`;
      }
      html += '</tbody></table>';
      tableContainer.innerHTML = html;
    }

    input.addEventListener('input', convert);
    swapBtn.addEventListener('click', () => {
      const tmp = input.value;
      input.value = output.value;
      output.value = tmp;
      convert();
    });

    renderTable();
  }

  // ---------------------------------------------------------------
  // Harakat / Text Analyzer
  // ---------------------------------------------------------------
  const HARAKAT_TYPES = {
    fatha:  '\u064E',
    damma:  '\u064F',
    kasra:  '\u0650',
    shadda: '\u0651',
    sukun:  '\u0652',
    tanFat: '\u064B',
    tanDam: '\u064C',
    tanKas: '\u064D'
  };
  const DOT_VALUES = {
    'ب':1,'ت':2,'ث':3,'ج':1,'خ':1,'ذ':1,'ز':1,'ش':3,'ض':1,
    'ظ':1,'غ':1,'ف':1,'ق':2,'ن':1,'ي':2,'ة':2
  };
  const HAMZA_FORMS = ['\u0621','\u0623','\u0625','\u0624','\u0626','\u0622'];
  const DOT_SUBSTITUTION = {
    'ب':'ٮ','ت':'ٮ','ث':'ٮ','ج':'ح','خ':'ح','ذ':'د','ز':'ر','ش':'س',
    'ض':'ص','ظ':'ط','غ':'ع','ف':'ڡ','ق':'ٯ','ن':'ں','ي':'ى','ة':'ه'
  };
  const HAMZA_NORMALIZE = {
    'أ':'ا','إ':'ا','آ':'ا','ٱ':'ا','ؤ':'و','ئ':'ى','ء':''
  };

  function stripHarakat(str) {
    return str.replace(HARAKAT_RE, '');
  }
  function removeDots(str) {
    const base = stripHarakat(str);
    let out = '';
    for (const ch of base) out += (DOT_SUBSTITUTION[ch] !== undefined ? DOT_SUBSTITUTION[ch] : ch);
    return out;
  }
  function oldStyle(str) {
    const step = removeDots(str);
    let out = '';
    for (const ch of step) out += (HAMZA_NORMALIZE[ch] !== undefined ? HAMZA_NORMALIZE[ch] : ch);
    return out;
  }

  function initHarakat() {
    const app = document.getElementById('harakat-app');
    const input = document.getElementById('input');
    const outA = document.getElementById('out-a');
    const outB = document.getElementById('out-b');
    const outC = document.getElementById('out-c');
    const stats = document.getElementById('stats');

    const labels = {
      words:    app.dataset.labelWords,
      lines:    app.dataset.labelLines,
      charsAll: app.dataset.labelCharsAll,
      charsNoSp:app.dataset.labelCharsNoSp,
      harakat:  app.dataset.labelHarakat,
      fatha:    app.dataset.labelFatha,
      damma:    app.dataset.labelDamma,
      kasra:    app.dataset.labelKasra,
      shadda:   app.dataset.labelShadda,
      sukun:    app.dataset.labelSukun,
      tanFat:   app.dataset.labelTanFat,
      tanDam:   app.dataset.labelTanDam,
      tanKas:   app.dataset.labelTanKas,
      dots:     app.dataset.labelDots,
      hamza:    app.dataset.labelHamza,
      copied:   app.dataset.labelCopied,
      copy:     app.dataset.labelCopy
    };

    function analyze() {
      const text = input.value;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const lines = text === '' ? 0 : text.split(/\n/).length;
      const charsAll = text.length;
      const charsNoSp = text.replace(/\s/g, '').length;

      const harakatCounts = {
        fatha:0, damma:0, kasra:0, shadda:0, sukun:0, tanFat:0, tanDam:0, tanKas:0
      };
      for (const ch of text) {
        if (ch === HARAKAT_TYPES.fatha)  harakatCounts.fatha++;
        else if (ch === HARAKAT_TYPES.damma)  harakatCounts.damma++;
        else if (ch === HARAKAT_TYPES.kasra)  harakatCounts.kasra++;
        else if (ch === HARAKAT_TYPES.shadda) harakatCounts.shadda++;
        else if (ch === HARAKAT_TYPES.sukun)  harakatCounts.sukun++;
        else if (ch === HARAKAT_TYPES.tanFat) harakatCounts.tanFat++;
        else if (ch === HARAKAT_TYPES.tanDam) harakatCounts.tanDam++;
        else if (ch === HARAKAT_TYPES.tanKas) harakatCounts.tanKas++;
      }
      const harakatTotal = Object.values(harakatCounts).reduce((a,b) => a+b, 0);

      let dots = 0;
      for (const ch of text) dots += (DOT_VALUES[ch] || 0);

      let hamza = 0;
      for (const ch of text) if (HAMZA_FORMS.includes(ch)) hamza++;

      const rows = [
        [labels.words, words],
        [labels.lines, lines],
        [labels.charsAll, charsAll],
        [labels.charsNoSp, charsNoSp],
        [labels.harakat, harakatTotal],
        ['— ' + labels.fatha,  harakatCounts.fatha],
        ['— ' + labels.damma,  harakatCounts.damma],
        ['— ' + labels.kasra,  harakatCounts.kasra],
        ['— ' + labels.shadda, harakatCounts.shadda],
        ['— ' + labels.sukun,  harakatCounts.sukun],
        ['— ' + labels.tanFat, harakatCounts.tanFat],
        ['— ' + labels.tanDam, harakatCounts.tanDam],
        ['— ' + labels.tanKas, harakatCounts.tanKas],
        [labels.dots, dots],
        [labels.hamza, hamza]
      ];
      let html = '<table class="table table-sm table-dark mb-0"><tbody>';
      for (const [k, v] of rows) {
        html += `<tr><td>${k}</td><td class="text-end">${v}</td></tr>`;
      }
      html += '</tbody></table>';
      stats.innerHTML = html;

      outA.value = stripHarakat(text);
      outB.value = removeDots(text);
      outC.value = oldStyle(text);
    }

    input.addEventListener('input', analyze);

    // Copy buttons
    document.querySelectorAll('[data-copy-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.copyTarget;
        const target = document.getElementById(targetId);
        if (!target) return;
        const text = target.value || '';
        const finish = () => {
          const original = labels.copy;
          btn.textContent = labels.copied;
          setTimeout(() => { btn.textContent = original; }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(finish).catch(() => {
            // Fallback
            target.select();
            document.execCommand('copy');
            finish();
          });
        } else {
          target.select();
          document.execCommand('copy');
          finish();
        }
      });
    });

    analyze();
  }

  // ---------------------------------------------------------------
  // Dispatch
  // ---------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    const tool = document.body.dataset.tool;
    switch (tool) {
      case 'morse':    initMorse();   break;
      case 'jummal':   initJummal();  break;
      case 'musnad':   initMusnad();  break;
      case 'roman':    initRoman();   break;
      case 'harakat':  initHarakat(); break;
      case 'home':     /* nothing */  break;
      default: break;
    }
  });
})();
