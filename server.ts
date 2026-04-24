import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory "Database" (Resets on server restart without persistent DB)
let students_data: any[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/data", (req, res) => {
    res.json(students_data);
  });

  app.post("/api/submit", (req, res) => {
    const newEntry = req.body;
    // Update existing if same student and prayer on same date
    const index = students_data.findIndex(e => e.studentName === newEntry.studentName && e.prayer === newEntry.prayer && e.date === newEntry.date);
    if (index !== -1) {
      students_data[index] = { ...students_data[index], ...newEntry };
    } else {
      students_data.push(newEntry);
    }
    res.status(201).json({ status: "success" });
  });

  app.delete("/api/entry/:id", (req, res) => {
    students_data = students_data.filter(e => e.id !== req.params.id);
    res.json({ status: "deleted" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.argv.includes("--build")) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
