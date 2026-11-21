// GTA VI Trophy Guide tracker — plain script, no modules, no network beyond this app's own files.
// Loads app/data/trophies.json and app/data/roadmap.json, renders the checklist, roadmap and
// missable views, saves progress in localStorage, and exports / imports progress as JSON.
(function () {
  'use strict';
  var STORE_KEY = 'gta6-trophy-guide-progress-v1';
  var trophies = [];
  var roadmap = null;
  var earned = {};

  function loadProgress() {
    try { earned = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {}; }
    catch (e) { earned = {}; }
  }
  function saveProgress() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(earned)); } catch (e) { /* storage full/blocked */ }
  }
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isStory(t) { return t.tags.indexOf('story') !== -1; }
  function spoilerOn() { return $('spoilerToggle').checked; }
  function displayName(t) {
    if (spoilerOn() && isStory(t) && !earned[t.id]) return '??? (story trophy — hidden by spoiler mode)';
    return t.name;
  }
  function displayDesc(t) {
    if (spoilerOn() && isStory(t) && !earned[t.id]) return 'Hidden until earned. Turn spoiler mode off to read it.';
    return t.description;
  }
  function trophyCard(t) {
    var li = document.createElement('li');
    li.className = 'trophy ' + t.grade + (earned[t.id] ? ' earned' : '');
    var badges = '<span class="grade ' + t.grade + '">' + t.grade + '</span>';
    if (t.missable) badges += ' <span class="badge">MISSABLE</span>';
    if (t.hidden) badges += ' <span class="badge hidden">HIDDEN</span>';
    var count = t.count ? '<p class="tcount">Target: ' + esc(String(t.count)) + '</p>' : '';
    var sources = t.sources.map(function (s) { return esc(s); }).join(' · ');
    li.innerHTML =
      '<label class="earn"><input type="checkbox" data-id="' + t.id + '"' + (earned[t.id] ? ' checked' : '') + '> Earned</label>' +
      '<header><h3 class="tname">' + esc(displayName(t)) + '</h3>' + badges + '</header>' +
      '<p class="tdesc">' + esc(displayDesc(t)) + '</p>' + count +
      '<p class="tguide">' + esc(t.guide) + '</p>' +
      '<p class="tsources">Sources: ' + sources + '</p>' +
      '<button type="button" class="open-detail" data-id="' + t.id + '">Guide details</button>';
    return li;
  }
  function currentFilter(list) {
    var kind = $('filterKind').value;
    var grade = $('filterGrade').value;
    var show = $('filterEarned').value;
    var q = $('search').value.trim().toLowerCase();
    return list.filter(function (t) {
      if (kind !== 'all' && t.tags.indexOf(kind) === -1) return false;
      if (grade !== 'all' && t.grade !== grade) return false;
      if (show === 'earned' && !earned[t.id]) return false;
      if (show === 'todo' && earned[t.id]) return false;
      if (q && t.name.toLowerCase().indexOf(q) === -1 && t.description.toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }
  function renderList() {
    var list = $('trophyList');
    list.innerHTML = '';
    var shown = currentFilter(trophies);
    shown.forEach(function (t) { list.appendChild(trophyCard(t)); });
    $('countLine').textContent = 'Showing ' + shown.length + ' of ' + trophies.length + ' trophies.';
    renderProgress();
  }
  function renderProgress() {
    var n = trophies.filter(function (t) { return earned[t.id]; }).length;
    var pct = trophies.length ? Math.round((n / trophies.length) * 100) : 0;
    $('progressFill').style.width = pct + '%';
    $('progressText').textContent = n + ' / ' + trophies.length + ' earned · ' + pct + '%' +
      (n === trophies.length && trophies.length ? ' — PLATINUM!' : '');
  }
  function renderRoadmap() {
    var box = $('roadmapList');
    box.innerHTML = '';
    if (!roadmap) return;
    roadmap.phases.forEach(function (ph) {
      var div = document.createElement('div');
      div.className = 'phase';
      var names = ph.trophies.map(function (id) {
        var t = trophies.find(function (x) { return x.id === id; });
        return t ? esc(t.name) + ' (' + t.grade + ')' : ('#' + id);
      }).join(', ');
      div.innerHTML = '<h3>' + esc(ph.name) + '</h3>' +
        '<p class="hours">Estimated time: ' + esc(ph.hours) + ' · ' + ph.trophies.length + ' trophies</p>' +
        '<p>' + esc(ph.goal) + '</p><p>' + names + '</p>';
      box.appendChild(div);
    });
  }
  function renderMissable() {
    var list = $('missableList');
    list.innerHTML = '';
    trophies.filter(function (t) { return t.missable; }).forEach(function (t) {
      list.appendChild(trophyCard(t));
    });
  }
  function showDetail(id) {
    var t = trophies.find(function (x) { return x.id === id; });
    if (!t) return;
    var sources = t.sources.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
    $('detailBody').innerHTML =
      '<h2>' + esc(displayName(t)) + '</h2>' +
      '<p><span class="grade ' + t.grade + '">' + t.grade + '</span>' +
      (t.missable ? ' <span class="badge">MISSABLE</span>' : '') +
      (t.hidden ? ' <span class="badge hidden">HIDDEN</span>' : '') + '</p>' +
      '<p class="tdesc">' + esc(displayDesc(t)) + '</p>' +
      (t.count ? '<p class="tcount">Target: ' + esc(String(t.count)) + '</p>' : '') +
      '<h3>Guide</h3><p>' + esc(t.guide) + '</p>' +
      '<h3>Sources</h3><ul>' + sources + '</ul>';
    $('detail').hidden = false;
  }
  function switchTab(which) {
    $('tabChecklist').classList.toggle('active', which === 'checklist');
    $('tabRoadmap').classList.toggle('active', which === 'roadmap');
    $('tabMissable').classList.toggle('active', which === 'missable');
    $('viewChecklist').hidden = which !== 'checklist';
    $('viewRoadmap').hidden = which !== 'roadmap';
    $('viewMissable').hidden = which !== 'missable';
  }
  function bind() {
    ['search', 'filterKind', 'filterGrade', 'filterEarned'].forEach(function (id) {
      $(id).addEventListener('input', renderList);
      $(id).addEventListener('change', renderList);
    });
    $('spoilerToggle').addEventListener('change', renderList);
    $('tabChecklist').addEventListener('click', function () { switchTab('checklist'); });
    $('tabRoadmap').addEventListener('click', function () { switchTab('roadmap'); renderRoadmap(); });
    $('tabMissable').addEventListener('click', function () { switchTab('missable'); renderMissable(); });
    $('detailClose').addEventListener('click', function () { $('detail').hidden = true; });
    document.addEventListener('change', function (ev) {
      var box = ev.target;
      if (box && box.matches('input[type="checkbox"][data-id]')) {
        var id = Number(box.getAttribute('data-id'));
        if (box.checked) earned[id] = true; else delete earned[id];
        saveProgress();
        renderList();
        renderMissable();
      }
    });
    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest ? ev.target.closest('.open-detail') : null;
      if (btn) showDetail(Number(btn.getAttribute('data-id')));
    });
    $('exportBtn').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify({ game: 'GTA VI', earned: Object.keys(earned).map(Number) }, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'gta6-trophy-progress.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    $('importBtn').addEventListener('click', function () { $('importFile').click(); });
    $('importFile').addEventListener('change', function (ev) {
      var file = ev.target.files && ev.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(String(reader.result));
          var ids = Array.isArray(data) ? data : data.earned;
          earned = {};
          ids.forEach(function (id) { earned[Number(id)] = true; });
          saveProgress(); renderList(); renderMissable();
        } catch (e) { alert('Could not import that file — it is not valid progress JSON.'); }
      };
      reader.readAsText(file);
      ev.target.value = '';
    });
    $('resetBtn').addEventListener('click', function () {
      if (confirm('Clear all earned trophies?')) { earned = {}; saveProgress(); renderList(); renderMissable(); }
    });
  }
  function init() {
    loadProgress();
    Promise.all([
      fetch('data/trophies.json').then(function (r) { return r.json(); }),
      fetch('data/roadmap.json').then(function (r) { return r.json(); })
    ]).then(function (parts) {
      trophies = parts[0].trophies || [];
      roadmap = parts[1];
      bind();
      renderList();
      renderRoadmap();
      renderMissable();
    }).catch(function (err) {
      $('countLine').textContent = 'Could not load the trophy data. Open this guide from its own server (node serve.ts).';
      console.error(err);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
