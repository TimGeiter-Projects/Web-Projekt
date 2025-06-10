import express from 'express';
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverDirectory = path.dirname(process.argv[1]);

const server = express();
const port = process.argv[2] || 8080;

server.use(express.static(join(__dirname, '../../webapp/dist')));
server.use(express.static(path.join(serverDirectory, '../../webapp/dist')));

server.get('/', (request, response) => {
  response.sendFile(join(__dirname, '../../webapp/dist/index.html'));
  response.sendFile(path.join(serverDirectory, '../../webapp/dist/index.html'));
});

server.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`);
});

const db = new sqlite3.Database('server/database/PersonenListe.db');
server.use(bodyParser.json());

// Anfrage der Einträge der Filterung aller Nutzer
server.post('/filterUsers', (req, res) => {
  const { gender, prefix, suffix, silben, sollp, solls, currentPage } = req.body;
  let filter = '';
  let countFilter = '';
  let params = [];

  // Filter erstellen
  if (gender !== '') {
    if (silben !== '') {
      filter +=
        'SELECT * FROM USERS WHERE Geschlecht = ? AND Silbenanzahl = ? AND ';
      countFilter +=
        'SELECT COUNT(*) as number FROM USERS WHERE Geschlecht = ? AND Silbenanzahl = ? AND ';
      params = [gender, silben];
    } else {
      filter += 'SELECT * FROM USERS WHERE Geschlecht = ? AND ';
      countFilter +=
        'SELECT COUNT(*) as number FROM USERS WHERE Geschlecht = ? AND ';
      params = [gender];
    }
  } else {
    if (silben !== '') {
      filter += 'SELECT * FROM USERS WHERE Silbenanzahl = ? AND ';
      countFilter += 'SELECT COUNT(*) as number FROM USERS WHERE Silbenanzahl = ? AND ';
      params = [silben];
    } else {
      filter += 'SELECT * FROM USERS WHERE ';
      countFilter += 'SELECT COUNT(*) as number FROM USERS WHERE ';
    }
  }

  // Pref/Suf einfügen, berücksichtigung ob includierend oder excludierend
  if (sollp === '+') {
    filter += 'Vorname LIKE ?';
    countFilter += 'Vorname LIKE ?';
    params.push(`${prefix}%`);
  } else {
    filter += 'Vorname NOT LIKE ?';
    countFilter += 'Vorname NOT LIKE ?';
    params.push(`${prefix}%`);
  }
  if (solls === '+') {
    filter += ' AND Vorname LIKE ?';
    countFilter += ' AND Vorname LIKE ?';
    params.push(`%${suffix} `);
  } else {
    filter += ' AND Vorname NOT LIKE ?';
    countFilter += ' AND Vorname NOT LIKE ?';
    params.push(`%${suffix} `);
  }

  // Beide Filter benutzen
  // Anfrage für die Anzahl der Einträge (deswegen get, get is für Abfrage bei denen man nur einen Eintrag erwartet)
  let numberOfEntries;
  db.get(countFilter, params, (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal Server Error');
      return;
    }
    numberOfEntries = row.number;
  });

  // Limiter der Anfrage (entryStart bis entryStart + 10)
  const entryStart = 10 * (currentPage - 1);
  filter += ' LIMIT 10 OFFSET ?';
  params.push(entryStart);

  console.log(filter);

  // Anfrage für die Einträge
  db.all(filter, params, (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Ausgabe der gefilterten Ergebnisse in der Konsole
    console.log('----- Namensliste -----');
    console.log(rows);
    console.log('-----------------------');

    // antwort
    res.json([rows, numberOfEntries]);
  });
});

// Anfrage der Einträge in Merkzettel
server.post('/listOfSelectedUsers', (req, res) => {
  const { importantListGender } = req.body;
  let filter = '';
  let params = [];

  if (importantListGender === 'm' || importantListGender === 'w') {
    filter += 'SELECT * FROM IMPORTANTUSERS WHERE Geschlecht = ? ORDER BY Prioritaet DESC';
    params = [importantListGender];
  } else {
    filter += 'SELECT * FROM IMPORTANTUSERS ORDER BY Prioritaet DESC';
  }

  console.log(filter);

  // Anfrage für die Einträge
  db.all(filter, params, (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(500).send('Internal Server Error');
      return;
    }

    // Ausgabe der gefilterten Ergebnisse in der Konsole
    console.log('----- Merkzettel -----');
    console.log(rows);
    console.log('-----------------------');

    // antwort
    res.json(rows);
  });
});

// Hinzufügen von Nutzern in den Merkzettel
server.post('/addUserToImportantUsers', (req, res) => {
  const { name, gender, silben, priorityDefaultValue } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    const inputQuery = 'INSERT INTO IMPORTANTUSERS (Vorname, Geschlecht, Silbenanzahl, Prioritaet) VALUES (?, ?, ?, ?)';

    db.run(inputQuery, [name, gender, silben, priorityDefaultValue], (err) => {
      if (err) {
        console.error('Error inserting data into the database:', err);
      }
    });

    // Commiten der Transaktion
    db.run('COMMIT', (err) => {
      if (err) {
        console.error('Error committing transaction:', err);
      } else {
        console.log('Data has successfully been input into the database!');
      }
    });
  });

  res.json();
});

// Nutzer von dem Merkzettel löschen
server.post('/removeUserFromList', (req, res) => {
  const { name } = req.body;

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    const inputQuery = 'DELETE FROM IMPORTANTUSERS WHERE Vorname = ?';

    db.run(inputQuery, [name], (err) => {
      if (err) {
        console.error('Error inserting data into the database:', err);
      }
    });

    // Commiten der Transaktion
    db.run('COMMIT', (err) => {
      if (err) {
        console.error('Error committing transaction:', err);
      } else {
        console.log('Data has successfully been removed from the database!');
      }
    });
  });

  res.json();
});

// Priorität von einem Nutzer im Merkzettel updaten
server.post('/updatePriority', (req, res) => {
  const { name, priority } = req.body;

  console.log(priority);

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    const inputQuery = 'UPDATE IMPORTANTUSERS SET Prioritaet = ? WHERE Vorname = ?';

    db.run(inputQuery, [priority, name], (err) => {
      if (err) {
        console.error('Error inserting data into the database:', err);
      }
    });

    // Commiten der Transaktion
    db.run('COMMIT', (err) => {
      if (err) {
        console.error('Error committing transaction:', err);
      } else {
        console.log('Data has successfully been updated from the database!');
      }
    });
  });

  res.json();
});
