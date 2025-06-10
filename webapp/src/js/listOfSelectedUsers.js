import { updateResults, results } from './filterUsers';
window.getImportantUsers = getImportantUsers;

let importantListGender;
export let importantNameResults;

// Nutzer werden zu Listen hinzugefügt
export async function addToList (name, gender, silben) {
  const priorityDefaultValue = 1;

  const response = await fetch('/addUserToImportantUsers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, gender, silben, priorityDefaultValue })
  });

  if (!response.ok) {
    console.error('Error:', response.status);
  }
  getImportantUsers();
}

// Merkzetteleinträge werden geladen
export async function getImportantUsers () {
  importantListGender = document.getElementById('genderSelectedList').value;

  const response = await fetch('/listOfSelectedUsers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ importantListGender })
  });

  if (response.ok) {
    // Empfangen der Ergebnisse als JSON
    importantNameResults = await response.json();
    listOfSelectedUsers(importantNameResults);
  } else {
    console.error('Error:', response.status);
  }
}

// Lade die Einträge in den Merkzettel
function listOfSelectedUsers (importantNameResults) {
  const listItem = document.getElementById('selectedUserList');
  listItem.innerHTML = '';
  let i = 0;
  // Dynamische erzeugen der Elemente, zur Darstellung der Einträge, in index.html
  importantNameResults.forEach(user => {
    const listUser = document.createElement('li');
    listUser.textContent = `${user.Vorname}- ${user.Geschlecht} - ${user.Silbenanzahl} `;
    const removeButton = document.createElement('button');
    removeButton.textContent = '-';
    removeButton.addEventListener('click', () => deleteUserFromList(user.Vorname));
    const prioritySelection = document.createElement('select');
    prioritySelection.id = 'prioritySelection' + i;
    for (let priorityValue = 1; priorityValue <= 5; priorityValue++) {
      const priority = document.createElement('option');
      priority.text = priorityValue;
      priority.value = priorityValue;
      prioritySelection.append(priority);
    }
    prioritySelection[user.Prioritaet - 1].selected = true;
    prioritySelection.addEventListener('change', () => updateUserPriority(user.Vorname));
    listUser.append(removeButton);
    listUser.append(prioritySelection);
    listItem.append(listUser);
    i++;
  });
  updateResults(results);
}

// Nutzer werden von den Listen gelöscht
async function deleteUserFromList (userName) {
  const name = userName;
  const response = await fetch('/removeUserFromList', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name })
  });

  if (!response.ok) {
    console.error('Error:', response.status);
  }

  getImportantUsers();
}

// Ändere Priorität des Nutzers
async function updateUserPriority (userName) {
  let index;
  const name = userName;

  for (let i = 0; i <= importantNameResults.length - 1; i++) {
    if (importantNameResults[i].Vorname === userName) {
      index = i;
    }
  }

  const priority = document.getElementById('prioritySelection' + index).value;

  const response = await fetch('/updatePriority', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, priority })
  });

  if (!response.ok) {
    console.error('Error:', response.status);
  }

  getImportantUsers();
}
