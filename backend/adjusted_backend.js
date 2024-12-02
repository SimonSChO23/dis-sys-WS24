const http = require('http');

// Beispiel-Datenspeicher (In-Memory)
let dataStore = [
    { id: 1, name: "Item 1", amount: 2 },
    { id: 2, name: "Item 2", amount: 4}
  ];

// Utility-Funktion, um JSON-Antworten zu senden
const sendJsonResponse = (res, statusCode, data) => {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

// Routen-Handler
const requestHandler = async (req, res) => {
    const [path, query] = req.url.split('?');
    const method = req.method;

    try {
        if (path === '/api/shopping' && method === 'GET') {
            // Abrufen aller Shopping-Items
            sendJsonResponse(res, 200, dataStore);

        } else if (path === '/api/shopping' && method === 'POST') {
            // Hinzufügen oder Aktualisieren eines Shopping-Items
            let body = '';
            req.on('data', chunk => (body += chunk));
            req.on('end', async () => {
                const { name, amount } = JSON.parse(body);
                const newItem = { id: dataStore.length + 1, name, amount };
                dataStore.push(newItem);
                sendJsonResponse(res, 201, newItem);
            });

        } else if (path.startsWith('/api/shopping/') && method === 'PUT') {
            // Aktualisieren eines existierenden Shopping-Items
            const name = decodeURIComponent(path.split('/').pop());
            let body = '';
            req.on('data', chunk => (body += chunk));
            req.on('end', async () => {
                const { amount } = JSON.parse(body);
                const index = dataStore.findIndex((i) => i.name === name);

                if (index !== -1) {
                    dataStore[index] = { ...dataStore[index], ...{ name, amount} };
                    sendJsonResponse(res, 200, dataStore[index]);
                } else {
                    sendJsonResponse(res, 404, { message: 'Item nicht gefunden' });
                }
            });

        } else if (path.startsWith('/api/shopping/') && method === 'DELETE') {
            // Löschen eines Shopping-Items
            const name = decodeURIComponent(path.split('/').pop());
            const index = dataStore.findIndex((i) => i.name === name);

            if (index !== -1) {
                const deletedItem = dataStore.splice(index, 1);
                
                sendJsonResponse(res, 200, deletedItem[0]);
            } else {
                sendJsonResponse(res, 404, { message: 'Item nicht gefunden' });
            }
        } else {
            // 404 für nicht unterstützte Endpunkte
            sendJsonResponse(res, 404, { message: 'Route nicht gefunden' });
        }
    } catch (error) {
        console.error('Fehler:', error);
        sendJsonResponse(res, 500, { message: 'Interner Serverfehler', error: error.message });
    }
};

// HTTP-Server erstellen
const server = http.createServer(requestHandler);

// Server starten
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});