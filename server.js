const express = require("express");
const cheerio = require("cheerio");


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

        console.log(`Proxy request: ${url.href}`);

        const response = await fetch(url.href, {
            redirect: "follow",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
                "Accept":
                    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
        });

        console.log(`Upstream response: ${response.status}`);

        if (!response.ok) {
            return res.status(response.status).send(
                `Målsidan svarade med HTTP ${response.status}`
            );
        }

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("text/html")) {
            return res.status(415).send(
                "Den här versionen hanterar bara HTML."
            );
        }

const html = await response.text();
const $ = cheerio.load(html);

$("a[href]").each((_, element) => {
    const href = $(element).attr("href");

    try {
        if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
            return;
        }

        const absoluteUrl = new URL(href, url.href);

        if (["http:", "https:"].includes(absoluteUrl.protocol)) {
            $(element).attr(
                "href",
                `/proxy?url=${encodeURIComponent(absoluteUrl.href)}`
            );
        }
    } catch {
        // Ignore malformed URLs
    }
});

res.status(200);
res.set("Content-Type", "text/html; charset=utf-8");
res.send($.html());


    } catch (error) {
        console.error("Proxy error:", error);
        res.status(500).send("Kunde inte hämta sidan.");
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
