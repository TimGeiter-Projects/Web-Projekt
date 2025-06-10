import { addToList, importantNameResults } from './listOfSelectedUsers';
window.filterUsers = filterUsers;

let changePage = false;
let currentPage = 1;
const entriesPerPage = 10;
let gender;
let prefix;
let suffix;
let silben;
let sollp;
let solls;
export let results = '';

// Abrufen der Resultate, die der Filterung entsprechen
export async function filterUsers () {
  if (!changePage) {
    gender = document.getElementById('gender').value;
    prefix = document.getElementById('prefix').value;
    suffix = document.getElementById('suffix').value;
    silben = document.getElementById('silben').value;
    sollp = document.getElementById('sollp').value;
    solls = document.getElementById('solls').value;

    currentPage = 1;
  }

  const response = await fetch('/filterUsers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ gender, prefix, suffix, silben, sollp, solls, currentPage })
  });

  if (response.ok) {
    // Empfangen der Ergebnisse als JSON
    results = await response.json();
    updateResults(results);
    changePage = false;
  } else {
    console.error('Error:', response.status);
  }
}

// Ergebnisse werden in der Seite neu dargestellt
export function updateResults (results) {
  const resultList = document.getElementById('resultList');
  resultList.innerHTML = '';

  const resultsOfPage = results[0].slice(0, entriesPerPage);

  // Iterieren über die paginierten Ergebnisse und Hinzufügen zur Liste
  if (!(resultsOfPage.length === 0)) {
    resultsOfPage.forEach(user => {
      const listItem = document.createElement('li');
      listItem.textContent = `${user.Vorname}- ${user.Geschlecht} - ${user.Silbenanzahl} `;
      resultList.appendChild(listItem);
      const button = document.createElement('button');
      button.textContent = '+';
      let containsName = false;
      if (importantNameResults.length !== 0) {
        importantNameResults.forEach(importantUser => {
          if (importantUser.Vorname === user.Vorname) {
            containsName = true;
          }
        });
      }
      button.disabled = containsName;
      button.addEventListener('click', () => addToList(user.Vorname, user.Geschlecht, user.Silbenanzahl));
      listItem.appendChild(button);
    });

  // Wenn keine ergebnisse gefunden werden
  } else {
    const textBox = document.createElement('div');
    textBox.textContent = 'Keine Suchergebnisse gefunden!';
    resultList.append(textBox);
  }

  // Seitenindex updaten
  updatePageIndex(currentPage, Math.ceil(results[1] / entriesPerPage));
}

// Seitenindexe werden angezeigt und geupdated
function updatePageIndex (current, total) {
  if (total === 0) {
    total = 1;
  }
  if (total > 1) {
    total -= 1;
  }
  document.getElementById('pageInfo').textContent = `Page ${current} of ${total}`;
  if (current === 1) {
    document.getElementById('prevPage').disabled = true;
  } else {
    document.getElementById('prevPage').disabled = false;
  }
  if (current === total) {
    document.getElementById('nextPage').disabled = true;
  } else {
    document.getElementById('nextPage').disabled = false;
  }
}

// Drücken auf "Vorherige Seite" Knopf
document.getElementById('prevPage').addEventListener('click', () => {
  currentPage--;
  changePage = true;
  filterUsers();
});

// Drücken auf "Nächste Seite" Knopf
document.getElementById('nextPage').addEventListener('click', () => {
  currentPage++;
  changePage = true;
  filterUsers();
});
