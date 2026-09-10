const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/proxy", async (req, res) => {
    const target = req.query.url;

    if (!target) {
        return res.status(400).send("Ingen URL angiven.");
    }

    try {
        const url = new URL(target);

        if (!["http:", "https:"].includes(url.protocol)) {
            return res.status(400).send("Ogiltigt protokoll.");
        }

        const response = await fetch(url);

        if (!response.ok) {
            return res.status(response.status).send(
                `Servern svarade med ${response.status}`
            );
        }

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("text/html")) {
            return res.status(415).send(
                "Den här enkla proxyn hanterar bara HTML."
            );
        }

        const html = await response.text();

        res.set("Content-Type", "text/html; charset=utf-8");
        res.send(html);

    } catch (error) {
        console.error(error);
        res.status(500).send("Kunde inte hämta sidan.");
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
