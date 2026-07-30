let currentIndex = 0;
const answers = {};

const quizScreen = document.getElementById('quiz');
const resultScreen = document.getElementById('result');

const startBtn = document.getElementById('startBtn');
const backBtn = document.getElementById('backBtn');
const retakeBtn = document.getElementById('retakeBtn');

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

  document.getElementById('typeCode').textContent = typeCode;
  const info = TYPE_INFO[typeCode] || { name: '', desc: '' };
  document.getElementById('typeName').textContent = info.name;
  document.getElementById('typeDesc').textContent = info.desc;

  const axisBarsEl = document.getElementById('axisBars');
  axisBarsEl.innerHTML = '';
  axisResults.forEach(r => {
    const pct = Math.round(r.prob * 100);
    const fillPct = r.letter === r.positive_letter ? pct : 100 - pct;
    const row = document.createElement('div');
    row.className = 'axis-row';
    row.innerHTML = `
      <span class="axis-letter-left">${r.negative_letter}</span>
      <div class="axis-track">
        <div class="axis-fill" style="width:${fillPct}%; ${r.letter === r.positive_letter ? '' : 'margin-left:auto;'}"></div>
      </div>
      <span class="axis-letter-right">${r.positive_letter}</span>
    `;
    axisBarsEl.appendChild(row);
  });

  showScreen(resultScreen);
}
