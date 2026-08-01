// ---- State ----
let currentIndex = 0;
const answers = {}; // question id -> value (-3..3)
let lastTypeCode = ''; // NEW: store for download filename

// ---- MBTI Type Names - NEW ----
const typeNames = {
    "ISTJ": "The Logistician", "ISFJ": "The Defender", "INFJ": "The Advocate", "INTJ": "The Architect",
    "ISTP": "The Virtuoso", "ISFP": "The Adventurer", "INFP": "The Mediator", "INTP": "The Thinker",
    "ESTP": "The Entrepreneur", "ESFP": "The Entertainer", "ENFP": "The Campaigner", "ENTP": "The Debater",
    "ESTJ": "The Executive", "ESFJ": "The Consul", "ENFJ": "The Protagonist", "ENTJ": "The Commander"
};

// ---- Elements ----
const introScreen = document.getElementById('intro');
const quizScreen = document.getElementById('quiz');
const resultScreen = document.getElementById('result');

const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const retakeBtn = document.getElementById('retakeBtn');
const downloadBtn = document.getElementById('downloadBtn'); // NEW

const qCounter = document.getElementById('qCounter');
const qText = document.getElementById('qText');
const scaleButtons = document.getElementById('scaleButtons');
const progressFill = document.getElementById('progressFill');

const SCALE_VALUES = [-3, -2, -1, 0, 1, 2, 3];

// ---- Screen switching ----
function showScreen(el) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
}

// ---- Render a question ----
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

// ---- Scoring using the trained logistic regression weights ----
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function scoreAxis(axisKey) {
  const model = MODEL_WEIGHTS[axisKey];
  let z = model.intercept;
  model.question_ids.forEach((qid, i) => {
    const val = answers[qid]?? 0;
    z += model.coefficients[i] * val;
  });
  const prob = sigmoid(z);
  return { prob, letter: prob >= 0.5? model.positive_letter : model.negative_letter };
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
      axis,
      letter,
      prob,
      positive_letter: model.positive_letter,
      negative_letter: model.negative_letter
    });
  });

  lastTypeCode = typeCode; // NEW: save for download

  // CHANGED THIS LINE - Now shows "INTJ - The Architect"
  const typeName = typeNames[typeCode] || '';
  document.getElementById('typeCode').textContent = `${typeCode} - ${typeName}`;

  const info = TYPE_INFO[typeCode] || { name: '', desc: '' };
  document.getElementById('typeName').textContent = info.name;
  document.getElementById('typeDesc').textContent = info.desc;

  const axisBarsEl = document.getElementById('axisBars');
  axisBarsEl.innerHTML = '';
  axisResults.forEach(r => {
    const pct = Math.round(r.prob * 100);
    const displayPct = r.letter === r.positive_letter? pct : 100 - pct;
    const row = document.createElement('div');
    row.className = 'axis-row';
    // #5 FEATURE: Added % labels
    row.innerHTML = `
      <span class="axis-letter-left">${r.negative_letter} ${r.letter === r.negative_letter? displayPct + '%' : ''}</span>
      <div class="axis-track">
        <div class="axis-fill" style="width:${r.letter === r.positive_letter? pct : 100 - pct}%; ${r.letter === r.positive_letter? '' : 'margin-left:auto;'}"></div>
      </div>
      <span class="axis-letter-right">${r.positive_letter} ${r.letter === r.positive_letter? displayPct + '%' : ''}</span>
    `;
    axisBarsEl.appendChild(row);
  });

  showScreen(resultScreen);
  setupShare(typeCode, info.name);
}

const SITE_URL = window.location.href.split('?')[0].split('#')[0];

function buildShareText(typeCode, typeName) {
  const name = typeNames[typeCode] || '';
  return `I got ${typeCode} - ${name} on Jerome's Mindprint Quiz! 🧠✨ Try it yourself:`;
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

// #6 FEATURE: Download Result as Image
downloadBtn.addEventListener('click', () => {
  const resultCard = document.getElementById('result');
  html2canvas(resultCard, { backgroundColor: '#0f0f1a', scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    link.download = `Jerome-Mindprint-${lastTypeCode}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
});
