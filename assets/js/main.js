function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// Open modal on click
document.querySelectorAll('.feature-card a').forEach(el => {
  el.addEventListener('click', function(e) {
    e.preventDefault();
    const modalId = this.getAttribute('href').substring(1);
    document.getElementById(modalId).style.display = 'flex';
  });
});

function switchLang(lang) {
  if (lang === 'zh') {
    window.location.href = 'index_zh.html';
  }
}