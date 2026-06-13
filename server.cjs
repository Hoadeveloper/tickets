// server.cjs  — simple backend that sends your transfer email
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json()); // parse JSON bodies

// ==== YOUR GMAIL (sender) — use your app password (16 chars, no spaces)
const GMAIL_USER = "olaiwolah14@gmail.com";
const GMAIL_APP_PASSWORD = "mxlqqclqabsymvac";

// Load the email template once at startup
const templatePath = path.join(__dirname, "transfer-email.html");
const baseTemplate = fs.readFileSync(templatePath, "utf8");

// Nodemailer transporter (Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
});

// Serve static files from the project root
app.use(express.static(path.join(__dirname)));

// Health check
app.get("/", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

// Send-email endpoint
app.post("/send-ticket", async (req, res) => {
  try {
    // If no accept_url is provided by the client, fall back to your local page.
    // Tip: if you use VS Code Live Server the default is usually 127.0.0.1:5500
    const DEFAULT_ACCEPT_URL = "https://www.ticketmaster.com/accept?token=demo123";

    const {
      sender_name = "Sender",
      event_title = "Sample Event",
      event_date = "",
      event_time = "",
      venue_name = "",
      venue_city = "",
      image_url = "",
      accept_url, // may be undefined
      recipient = "olaiwolah11@gmail.com",
      tickets = [{ sec: "29", row: "E", seat: "1" }, { sec: "29", row: "E", seat: "2" }]
    } = req.body || {};

    const resolvedAcceptUrl = accept_url && String(accept_url).trim()
      ? accept_url
      : DEFAULT_ACCEPT_URL;

    // Fill placeholders in template
    let html = baseTemplate
      .replace(/{{sender_name}}/g, sender_name)
      .replace(/{{event_title}}/g, event_title)
      .replace(/{{event_date}}/g, event_date)
      .replace(/{{event_time}}/g, event_time)
      .replace(/{{venue_name}}/g, venue_name)
      .replace(/{{venue_city}}/g, venue_city)
      .replace(/{{image_url}}/g, image_url || "https://via.placeholder.com/240x240?text=Event")
      .replace(/{{accept_url}}/g, resolvedAcceptUrl)
      .replace(/{{current_year}}/g, String(new Date().getFullYear()));

    // Render tickets table rows
    const rows = tickets.map(t =>
      `<tr>
         <td style="padding:10px 12px;border-top:1px solid #e5e7eb;">${t.sec}</td>
         <td style="padding:10px 12px;border-top:1px solid #e5e7eb;">${t.row}</td>
         <td style="padding:10px 12px;border-top:1px solid #e5e7eb;">${t.seat}</td>
       </tr>`
    ).join("");
    html = html.replace(/{{#each tickets}}[\s\S]*{{\/each}}/g, rows);

    // Send the email
    await transporter.verify(); // fail fast if login bad
    const info = await transporter.sendMail({
      from: `"Ticketmaster" <${GMAIL_USER}>`,
      to: recipient,
      subject: `Ticket Transfer: ${event_title} • Accept your tickets`,
      html
    });

    res.json({ success: true, messageId: info.messageId });
  } catch (err) {
    console.error("SEND ERROR:", err);
    res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
