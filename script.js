let currentIndex = 0;
const answers = {};
let lastTypeCode = '';

const typeNames = {
    "ISTJ": "The Logistician", "ISFJ": "The Defender", "INFJ": "The Advocate", "INTJ": "The Architect",
    "ISTP": "The Virtuoso", "ISFP": "The Adventurer", "INFP": "The Mediator", "INTP": "The Thinker",
    "ESTP": "The Entrepreneur", "ESFP": "The Entertainer", "ENFP": "The Campaigner", "ENTP": "The Debater",
    "ESTJ": "The Executive", "ESFJ": "The Consul", "ENFJ": "The Protagonist", "ENTJ": "The Commander"
};

const quizScreen = document.getElementById('quiz');
const resultScreen = document.getElementById('result');

const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const retakeBtn = document.getElementById('retakeBtn');
const downloadBtn = document.getElementById('downloadBtn');

const qCounter = document.getElementById('qCounter');
const qText = document.getElementById('qText');
const scaleButtons = document.getElementById('scaleButtons');
const progressFill = document.getElementById('progressFill');

const SCALE_VALUES = [-3, -2, -1, 0, 1, 2, 3];

function showScreen(el) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
}

function renderQuestion() {
  const q = QUESTIONS[currentIndex];
  qCounter.textContent = `Question ${currentIndex + 1} of ${QUESTIONS.length}`;
  qText.textContent = q.text;
  progressFill.style.width = `${(currentIndex / QUESTIONS.length) * 100}%`;
  backBtn.disabled = currentIndex === 0;

  scaleButtons.innerHTML = '';
  SCALE_VALUES.forEach(val => {
    const btn = document.createElement('button');
    btn.className = 'scale-btn';
    btn.dataset.value = val;
    btn.setAttribute('aria-label', `Rate ${val}`);
    if (answers[q.id] === val) btn.classList.add('selected');
    btn.addEventListener('click', () => selectAnswer(q.id, val));
    scaleButtons.appendChild(btn);
  });
}

function selectAnswer(qid, val) {
  answers[qid] = val;
  renderQuestion();
  setTimeout(() => {
    if (currentIndex < QUESTIONS.length - 1) {
      currentIndex++;
      renderQuestion();
    } else {
      showResults();
    }
  }, 200);
}

backBtn.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
});

startBtn.addEventListener('click', () => {
  currentIndex = 0;
  showScreen(quizScreen);
  renderQuestion();
});

retakeBtn.addEventListener('click', () => {
  currentIndex = 0;
  for (const k in answers) delete answers[k];
  showScreen(quizScreen);
  renderQuestion();
});

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function scoreAxis(axisKey) {
  const model = MODEL_WEIGHTS[axisKey];
  let z = model.intercept;
  model.question_ids.forEach((qid, i) => {
    const val = answers[qid] ?? 0;
    z += model.coefficients[i] * val;
  });
  const prob = sigmoid(z);
  return { prob, letter: prob >= 0.5 ? model.positive_letter : model.negative_letter };
}

function showResults() {
  const axes = ['EI', 'SN', 'TF', 'JP'];
  let typeCode = '';
  const axisResults = [];

  axes.forEach(axis => {
    const { prob, letter } = scoreAxis(axis);
    typeCode += letter;
    const model = MODEL_WEIGHTS[axis];
    axisResults.push({
      letter,
      prob,
      positive_letter: model.positive_letter,
      negative_letter: model.negative_letter
    });
  });

  lastTypeCode = typeCode;

  const displayName = typeNames[typeCode] || (TYPE_INFO[typeCode] && TYPE_INFO[typeCode].name) || '';
  const desc = (TYPE_INFO[typeCode] && TYPE_INFO[typeCode].desc) || '';

  document.getElementById('typeCode').textContent = typeCode;
  document.getElementById('typeName').textContent = displayName;
  document.getElementById('typeDesc').textContent = desc;

  const axisBarsEl = document.getElementById('axisBars');
  axisBarsEl.innerHTML = '';
  axisResults.forEach(r => {
    const pct = Math.round(r.prob * 100);
    const fillPct = r.letter === r.positive_letter ? pct : 100 - pct;
    const row = document.createElement('div');
    row.className = 'axis-row';
    row.innerHTML = `
      <span class="axis-letter-left">${r.negative_letter} ${r.letter === r.negative_letter ? fillPct + '%' : ''}</span>
      <div class="axis-track">
        <div class="axis-fill" style="width:${fillPct}%; ${r.letter === r.positive_letter ? '' : 'margin-left:auto;'}"></div>
      </div>
      <span class="axis-letter-right">${r.positive_letter} ${r.letter === r.positive_letter ? fillPct + '%' : ''}</span>
    `;
    axisBarsEl.appendChild(row);
  });

  showScreen(resultScreen);
  setupShare(typeCode, displayName);
}

const SITE_URL = window.location.href.split('?')[0].split('#')[0];

function buildShareText(typeCode, typeName) {
  return `I got ${typeCode} - ${typeName} on Jerome's Mindprint Quiz! Try it yourself:`;
}

function setupShare(typeCode, typeName) {
  const shareBtn = document.getElementById('shareBtn');
  const shareFallback = document.getElementById('shareFallback');
  const shareWhatsapp = document.getElementById('shareWhatsapp');
  const shareTwitter = document.getElementById('shareTwitter');
  const shareCopy = document.getElementById('shareCopy');
  const copyConfirm = document.getElementById('copyConfirm');

  const text = buildShareText(typeCode, typeName);
  const fullMessage = `${text} ${SITE_URL}`;

  shareWhatsapp.href = `https://wa.me/?text=${encodeURIComponent(fullMessage)}`;
  shareTwitter.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullMessage)}`;

  shareBtn.onclick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Jerome's Mindprint Quiz", text, url: SITE_URL });
        return;
      } catch (err) {}
    }
    shareFallback.classList.toggle('visible');
  };

  shareCopy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(fullMessage);
      copyConfirm.textContent = 'Copied to clipboard';
      setTimeout(() => { copyConfirm.textContent = ''; }, 2000);
    } catch (err) {
      copyConfirm.textContent = 'Could not copy — select and copy manually';
    }
  };
}

downloadBtn.addEventListener('click', () => {
  const card = document.getElementById('resultCard');
  const watermark = card.querySelector('.card-watermark');

  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Preparing...';
  if (watermark) watermark.classList.add('visible');

  html2canvas(card, { backgroundColor: '#201827', scale: 2 })
    .then(canvas => {
      const link = document.createElement('a');
      link.download = `Jerome-Mindprint-${lastTypeCode}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    })
    .catch(() => {
      alert('Could not generate the image. Try again.');
    })
    .finally(() => {
      if (watermark) watermark.classList.remove('visible');
      downloadBtn.disabled = false;
      downloadBtn.textContent = 'Download Result';
    });
});
