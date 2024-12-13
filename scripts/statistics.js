function displayStatistics() {
  const statsBody = document.getElementById('statsBody');

  const stats = JSON.parse(localStorage.getItem('gameResults')) || [];

  stats.sort((a, b) => b.score - a.score);
  statsBody.innerHTML = '';
  
  if (stats.length > 0) {
    stats.forEach(stat => {
      const row = document.createElement('tr');

      const nameCell = document.createElement('td');
      nameCell.textContent = stat.name;

      const scoreCell = document.createElement('td');
      scoreCell.textContent = stat.score;

      row.appendChild(nameCell);
      row.appendChild(scoreCell);
      statsBody.appendChild(row);
    });
  }
  else {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.textContent = "Нет данных";
    
    row.appendChild(nameCell);
    statsBody.appendChild(row);
  }
}

window.onload = displayStatistics;
