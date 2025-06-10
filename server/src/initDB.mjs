import sqlite3 from 'sqlite3';
import fileStream from 'fs';
import csvParser from 'csv-parser';
import syl from 'syllabificate';

// Verbindung zu der Datenbank erstellen
const db = new sqlite3.Database('server/database/PersonenListe.db', (err) => {
  if (err) console.error(err.message);
  else console.log('Connected to the SQLite database.');
});

if (!fileStream.existsSync('server/database/PersonenListe.db')) {
  db.run('CREATE TABLE USERS (Vorname TEXT, Geschlecht CHAR, Silbenanzahl TINYINT)');
  db.run('CREATE TABLE IMPORTANTUSERS (Vorname TEXT, Geschlecht CHAR, Silbenanzahl TINYINT, Prioritaet TINYINT)');
}

// Daten in die Datenbank Datei einschreiben
insertUserData(db);

// Funktion zum initialisieren der Namen aus der Datei in die Datenbank
function insertUserData (db) {
  const dataArray = [];

  fileStream.createReadStream('server/src/assets/PersonenListe.csv')
    .pipe(csvParser())
    .on('data', (data) => {
      // Datenverarbeitung
      const tmpData = data['vorname;geschlecht'];
      let inputName = tmpData.split(';')[0];
      const inputGender = tmpData.split(';')[1];
      inputName = inputName + ' ';
      dataArray.push({ inputName, inputGender });
    })

    // Erstellen der Transaktion
    .on('end', () => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const inputQuery = 'INSERT INTO USERS (Vorname, Geschlecht, Silbenanzahl) VALUES (?, ?, ?)';

        for (let i = 0; i < dataArray.length; i++) {
          db.run(inputQuery, [dataArray[i].inputName, dataArray[i].inputGender, syl.countSyllables(dataArray[i].inputName)], (err) => {
            if (err) {
              console.error('Error inserting data into the database:', err);
            }
          });
        }

        // Commiten der Transaktion
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('Error committing transaction:', err);
          } else {
            console.log('Data has successfully been input into the database!');
          }

          // Datenbank verbindung abbrechen
          db.close((err) => {
            if (err) console.error(err.message);
          });
        });
      });
    });
}
