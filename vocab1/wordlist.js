// 単語リスト定義（ゲーム側と同一）
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

// ===== 状態 =====

let words = [];
let currentFile = "";

// ===== DOM =====

const listSelect  = document.getElementById("listSelect");
const rangeSelect = document.getElementById("rangeSelect");
const onlyWeakChk = document.getElementById("onlyWeak");
const filterBtn   = document.getElementById("filterBtn");
const tbody       = document.querySelector("#wordTable tbody");

// ===== 初期化 =====

init();

function init() {
  updateRangeSelect(listSelect.value);
  loadWords(listSelect.value);

  listSelect.addEventListener("change", () => {
    updateRangeSelect(listSelect.value);
    loadWords(listSelect.value);
  });

  filterBtn.addEventListener("click", applyFilter);
}

// ===== 単語リスト読み込み =====

function loadWords(file) {
  fetch(`data/${file}`)
    .then(res => res.json())
    .then(data => {
      words = data;
      currentFile = file;
      applyFilter(); // 自動表示
    })
    .catch(() => {
      alert("単語データを読み込めませんでした");
    });
}

// ===== 範囲セレクト更新 =====

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

// ===== フィルタ処理 =====

function applyFilter() {
  if (words.length === 0) return;

  const [min, max] = rangeSelect.value.split("-").map(Number);
  const onlyWeak = onlyWeakChk.checked;

  let list = words.filter(w => w.id >= min && w.id <= max);

  if (onlyWeak) {
    list = list.filter(isWeakWord);
  }

  // 苦手単語を上に
  list.sort((a, b) => {
    return Number(isWeakWord(b)) - Number(isWeakWord(a));
  });

  renderTable(list);
}

// ===== 苦手判定 =====

function getWordKey(word) {
  return `${currentFile}:${word.id}`;
}

function isWeakWord(word) {
  const stats = JSON.parse(localStorage.getItem("hsk_stats")) || {};
  const key = getWordKey(word);

  if (!stats[key]) return false;
  return stats[key].wrong > stats[key].correct;
}

// ===== 表描画 =====

function renderTable(list) {
  tbody.innerHTML = "";

  list.forEach(word => {
    const tr = document.createElement("tr");

    if (isWeakWord(word)) {
      tr.classList.add("weak");
    }

    tr.innerHTML = `
      <td>${word.id}</td>
      <td class="chinese">${word.hanzi}</td>
      <td>${word.pinyin}</td>
      <td>${word.ja}</td>
    `;

    tbody.appendChild(tr);
  });
}
