import "dotenv/config";
import express from "express"


const app = express()

const PORT = process.env.PORT || 8080;

app.get("/health", (req, res) => {
    res.json({ message: "OK", timestamp: new Date() })
})

app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`)
})