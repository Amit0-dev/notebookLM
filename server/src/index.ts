import { toNodeHandler } from "better-auth/node";
import "dotenv/config";
import express from "express"
import { auth } from "./lib/auth.js";


const app = express()
const PORT = process.env.PORT || 8080;

app.all('/api/auth/{*any}', toNodeHandler(auth));
app.use(express.json())


app.get("/health", (_req, res) => {
    res.json({ message: "OK", timestamp: new Date() })
})

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})