let words = [];// 単語データ全体
let quizList = [];// 出題用単語リスト
let current = null;// 現在の出題単語
let currentFile = "";// 現在の単語リストファイル名
let quizQueue = []; // 出題順キュー
let currentIndex = 0;// 現在の出題インデックス
let correctCount = 0;// 正解数
let wrongList = []; // 不正解単語を保存
let answered = false;

// 単語リスト情報
const wordLists = {
  "hsk3_1_001_250.json": {
    max: 250,
    ranges: [
      [1, 50], [51, 100], [101, 150],
      [151, 200], [201, 250], [1, 250]
    ]
  },
  "hsk3_1_251_500.json": {
    max: 500,
    ranges: [
      [251, 300], [301, 350], [351, 400],
      [401, 450], [451, 500], [251, 500]
    ]
  },
  "hsk3_2_001_250.json": {
    max: 250,
    ranges: [
      [1, 50], [51, 100], [101, 200],
      [201, 250], [1, 250]
    ]
  },
  "hsk3_2_251_500.json": {
    max: 500,
    ranges: [
      [251, 300], [301, 350], [351, 400],
      [401, 450], [451, 500], [251, 500]
    ]
  },
  "hsk3_2_501_772.json": {
    max: 772,
    ranges: [
      [501, 550], [551, 600], [601, 650],
      [651, 700], [701, 772], [501, 772]
    ]
  }
};

// 単語リスト読み込み
const listSelect = document.getElementById("listSelect");
const rangeSelect = document.getElementById("rangeSelect");
listSelect.addEventListener("change", () => {
  loadWordList(listSelect.value);
});

function updateRangeSelect(file) {
  rangeSelect.innerHTML = "";
  wordLists[file].ranges.forEach(([min, max]) => {
    const opt = document.createElement("option");
    opt.value = `${min}-${max}`;
    opt.textContent =
      min === 1 && max === wordLists[file].max
        ? `1〜${max}（全部）`
        : `${min}〜${max}`;
    rangeSelect.appendChild(opt);
  });
}

// JSON読み込み
function loadWordList(file) {
  fetch(`data/${file}`)
    .then(res => res.json())
    .then(data => {
      words = data;
      currentFile = file;
      updateRangeSelect(file);
      console.log("読み込み完了:", file, words.length);
    })
    .catch(() => {
      alert("単語データを読み込めませんでした");
    });
}

loadWordList(listSelect.value);

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ゲーム開始
document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("nextBtn").addEventListener("click", nextQuestion);
// 不正解のみ復習
document.getElementById("retryWrongBtn")
  .addEventListener("click", retryWrong);

function startGame() {
  if (words.length === 0) return;

  const [min, max] = rangeSelect.value.split("-").map(Number);
  const weakOnly = document.getElementById("weakOnlyQuiz").checked;

  quizQueue = words.filter(w => {
    if (w.id < min || w.id > max) return false;
    if (weakOnly && !isWeakWord(w)) return false;
    return true;
  });

  if (quizQueue.length === 0) {
    alert("この条件に該当する単語がありません");
    return;
  }

  shuffle(quizQueue);

  currentIndex = 0;
  correctCount = 0;
  wrongList = [];
  current = null;

  document.getElementById("score").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  nextQuestion();
}

function nextQuestion() {
  answered = false;

  // 進捗表示
  document.getElementById("progress").textContent =
    `進捗：${currentIndex} / ${quizQueue.length}`;

  document.getElementById("result").textContent = "";
  document.getElementById("pinyin").textContent = "";
  document.getElementById("choices").innerHTML = "";

  // 前の問題が未回答なら不正解扱い
  if (!answered && current) {
    addWrong(current);
    updateStats(current, false);
  }

  // 終了判定
  if (currentIndex >= quizQueue.length) {
    showScore();
    return;
  }

  // 次の問題
  current = quizQueue[currentIndex];
  currentIndex++;

  document.getElementById("hanzi").textContent = current.hanzi;

  // 選択肢作成（日本語が完全一致する単語は除外）

  const choices = [current];
  const usedJa = new Set([current.ja]);

  while (choices.length < 4) {
    const random = words[Math.floor(Math.random() * words.length)];

    if (
      random.id === current.id ||
      usedJa.has(random.ja)
    ) {
      continue;
    }

    choices.push(random);
    usedJa.add(random.ja);
  }

  // シャッフル
  shuffle(choices);

  // 表示
  const area = document.getElementById("choices");
  choices.forEach(word => {
    const btn = document.createElement("button");
    btn.textContent = word.ja;
    btn.onclick = () => checkChoice(word);
    area.appendChild(btn);
  });
}

// localStorage に成績を保存・更新
function updateStats(wordId, isCorrect) {
  const key = "hsk_stats";
  const stats = JSON.parse(localStorage.getItem(key)) || {};

  if (!stats[wordId]) {
    stats[wordId] = { correct: 0, wrong: 0 };
  }

  if (isCorrect) {
    stats[wordId].correct++;
  } else {
    stats[wordId].wrong++;
  }

  localStorage.setItem(key, JSON.stringify(stats));
}

function addWrong(word) {
  if (!wrongList.some(w => w.id === word.id)) {
    wrongList.push(word);
  }
}

// 選択肢チェック
function checkChoice(selectedWord) {
  if (answered) return; // ★ 二重回答防止
    answered = true;

  if (selectedWord.id === current.id) {
    document.getElementById("result").textContent = "⭕ 正解！";
    correctCount++;
    updateStats(current, true);

    wrongList = wrongList.filter(
    w => getWordKey(w) !== getWordKey(current));
  } else {
    document.getElementById("result").textContent =
      `❌ 正解：${current.ja}`;
    addWrong(current);
    updateStats(current, false);
  }

  document.getElementById("pinyin").textContent =
    `拼音：${current.pinyin}`;
}


function showScore() {
  document.getElementById("game").classList.add("hidden");
  document.getElementById("score").classList.remove("hidden");

  const total = quizQueue.length;
  const correct = correctCount;
  const wrong = total - correct;
  const rate = Math.round((correct / total) * 100);

  document.getElementById("scoreText").textContent =
    `全${total}問中 正解${correct}問（正答率 ${rate}%）`;
}

// 不正解のみ復習
function retryWrong() {
  if (wrongList.length === 0) {
    alert("不正解の単語はありません 🎉");
    return;
  }

  quizQueue = [...wrongList];
  shuffle(quizQueue);
  currentIndex = 0;
  correctCount = 0;
  wrongList = [];

  document.getElementById("score").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  nextQuestion();
}


function getWordKey(word) {
  return `${currentFile}:${word.id}`;
}


function isWeakWord(word) {
  const stats = JSON.parse(localStorage.getItem("hsk_stats")) || {};
  const key = getWordKey(word);
  return stats[key] && stats[key].wrong > stats[key].correct;
}
