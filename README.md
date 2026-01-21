Im Rahmen eines Teamprojektes wurde eine Web-Anwendung zur Suche und Verwaltung von Vornamen entwickelt. Die Anwendung besteht aus einer Browser-App und einem Node.js/Express-Server mit REST-API und persistenter Datenhaltung. Nutzer können Namen gefiltert durchsuchen, paginiert anzeigen lassen und auf einem Merkzettel speichern, priorisieren oder entfernen. Die initiale Datenbasis wird aus einer CSV-Datei erzeugt, wobei die Silbenanzahl der Namen automatisch berechnet wird.

#Tech Stack
Frontend:
    HTML5, CSS (Less)
    JavaScript (ESM, gebundelt mit esbuild)

Backend:
    Node.js
    Express (REST-API)

Datenbank:
    MongoDB
    Build & Tooling:
    npm
    esbuild
    less / lessc
    semistandard (Linting)

Datenverarbeitung:
    CSV-Import per Node.js-Skript
    syllabificate zur Silbenanzahl-Berechnung

Laufzeitumgebung:
    Moderne Browser (Chrome, Firefox)
