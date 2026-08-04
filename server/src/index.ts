import { toNodeHandler } from "better-auth/node";
import "dotenv/config";
import express from "express"
import { auth } from "./lib/auth.js";
import cors from "cors"
import { registerRoutes } from "./routes/index.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";


const app = express()
const PORT = process.env.PORT || 8080;
const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000"

app.use(
    cors({
        origin: clientUrl,
        credentials: true,
    })
)

app.all('/api/auth/{*any}', toNodeHandler(auth));
app.use(express.json())


app.get("/health", (_req, res) => {
    res.json({ message: "OK", timestamp: new Date() })
})

registerRoutes(app);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})