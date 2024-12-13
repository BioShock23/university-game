const form = document.getElementById('auth-form');

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value;
  if (username) {
    localStorage.setItem('username', username);
    window.location.href = 'game.html';
  } else {
    alert('Пожалуйста, введите имя.');
  }
});

const showStatisticsPage = () => {
  window.location.href = 'statistics.html'
}

const showRulesModal = () => {
  document.getElementById('rules-modal').style.display = 'flex';
};

const closeRulesModal = () => {
  document.getElementById('rules-modal').style.display = 'none';
};