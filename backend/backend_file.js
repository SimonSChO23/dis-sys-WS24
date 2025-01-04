const http = require("http");
const { Pool } = require("pg");

// Utility-Funktion, um JSON-Antworten zu senden
const sendJsonResponse = (res, statusCode, data) => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://hse24:password@shoppingdb:5432/shoppingdb",
});

const createTableQuery = `
    CREATE TABLE IF NOT EXISTS shopping_items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      amount INTEGER NOT NULL
    );
    INSERT INTO shopping_items (name, amount) VALUES ('Item 1', 2);
    INSERT INTO shopping_items (name, amount) VALUES ('Item 2', 33);
  `;

const initDatabase = async () => {
  console.log("Checking and initializing the database...");
  try {
    // Stellt sicher, dass die Datenbank verfügbar ist
    await waitForDatabase();
    console.log("Database connection verified.");

    // Führt den SQL-Befehl zum Erstellen der Tabellen aus
    await pool.query(createTableQuery);
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing the database:", error);
  }
};

const waitForDatabase = async (
  options = { maxRetries: 5, delayInMs: 3000 }
) => {
  for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
    try {
      await pool.query("SELECT 1");
      console.log("Database connection established.");
      return;
    } catch (err) {
      if (attempt === options.maxRetries) {
        console.error("Database connection could not be established.");
        throw err;
      }
      console.log(
        `Database not ready, retrying... (${attempt}/${options.maxRetries})`
      );
      await new Promise((resolve) => setTimeout(resolve, options.delayInMs));
    }
  }
  throw new Error(
    "Database connection could not be established after multiple retries."
  );
};

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

// Routen-Handler
const requestHandler = async (req, res) => {
  const [path, query] = req.url.split("?");
  const method = req.method;

  try {
    if (path === "/api/shopping" && method === "GET") {
      // Abrufen aller Shopping-Items
      const result = await pool.query("SELECT * FROM shopping_items");
      sendJsonResponse(res, 200, result.rows);
    } else if (path === "/api/shopping" && method === "POST") {
      // Hinzufügen oder Aktualisieren eines Shopping-Items
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        const { name, amount } = JSON.parse(body);
        const existName = await pool.query(
          "SELECT * FROM shopping_items WHERE name = $1",
          [name]
        );
        if (existName.rowCount === 0 && isPositiveInteger(amount)) {
          const result = await pool.query(
            "INSERT INTO shopping_items (name, amount) VALUES ($1, $2) RETURNING *",
            [name, amount]
          );
          sendJsonResponse(res, 201, result.rows);
        } else {
          sendJsonResponse(res, 404, {
            message: "Item existiert bereits oder falscher Betrag eingegeben!",
          });
        }
      });
    } else if (path.startsWith("/api/shopping/") && method === "PUT") {
      // Aktualisieren eines existierenden Shopping-Items
      const name = decodeURIComponent(path.split("/").pop());
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        const { amount } = JSON.parse(body);
        if (isPositiveInteger(amount)) {
          const result = await pool.query(
            "UPDATE shopping_items SET amount = $1 WHERE name = $2 RETURNING *",
            [amount, name]
          );
          if (result.rowCount === 1) {
            sendJsonResponse(res, 200, result.rows);
          } else {
            sendJsonResponse(res, 404, {
              message: "Item konnte nicht gefunden werden oder!",
            });
          }
        } else {
          sendJsonResponse(res, 404, {
            message: "Falscher Betrag eingegeben!",
          });
        }
      });
    } else if (path.startsWith("/api/shopping/") && method === "DELETE") {
      // Löschen eines Shopping-Items
      const name = decodeURIComponent(path.split("/").pop());
      const result = await pool.query(
        "DELETE FROM shopping_items WHERE name = $1 RETURNING *",
        [name]
      );
      if (result.rowCount === 1) {
        sendJsonResponse(res, 200, result.rows);
      } else {
        sendJsonResponse(res, 404, {
          message: "Item konnte nicht gelöscht werden!",
        });
      }
    } else {
      // 404 für nicht unterstützte Endpunkte
      sendJsonResponse(res, 404, { message: "Route nicht gefunden" });
    }
  } catch (error) {
    console.error("Fehler:", error);
    sendJsonResponse(res, 500, {
      message: "Interner Serverfehler",
      error: error.message,
    });
  }
};

// HTTP-Server erstellen
const server = http.createServer(requestHandler);

// Server starten
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
  initDatabase();
});
