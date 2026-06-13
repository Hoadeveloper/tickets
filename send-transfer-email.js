// send-transfer-email.js  (run with: node send-transfer-email.js [recipient])
import nodemailer from "nodemailer";
import fs from "fs/promises";

console.log("Script started…");

// === GMAIL CREDENTIALS (env wins; fallback to constants) ===
const GMAIL_USER = process.env.GMAIL_USER || "olaiwolah14@gmail.com";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "mxlqqclqabsymvac"; // 16 chars, no spaces
const RECIPIENT = process.argv[2] || "olaiwolah11@gmail.com"; // CLI arg > fallback

try {
  console.log("Loading template…");
  const htmlTemplate = await fs.readFile("./transfer-email.html", "utf8");

  // ---- Event data (edit these or wire to your server flow) ----
  const sender_name = "Clinton Robert";
  const event_title = "Rilo Kiley — Live in Concert";
  const event_date  = "Thu, Sep 11, 2025";
  const event_time  = "7:00 PM";
  const venue_name  = "Roxian Theatre";
  const venue_city  = "McKees Rocks, PA";
  // Put a real image URL if you want a thumbnail in the email:
  const image_url   = "https://s1.ticketm.net/dam/a/6a3/70eaea85-e3c5-4975-924e-ebde32e266a3_RETINA_PORTRAIT_3_2.jpg";
  const accept_url  = "https://example.com/accept?token=abc123";

  // Build email HTML
  const html = htmlTemplate
    .replace(/{{sender_name}}/g, sender_name)
    .replace(/{{event_title}}/g, event_title)
    .replace(/{{event_date}}/g, event_date)
    .replace(/{{event_time}}/g, event_time)
    .replace(/{{venue_name}}/g, venue_name)
    .replace(/{{venue_city}}/g, venue_city)
    .replace(/{{image_url}}/g, image_url)
    .replace(/{{accept_url}}/g, accept_url)
    .replace(/{{current_year}}/g, String(new Date().getFullYear()))
    // Tickets table rows (Sec BLCNTR, Row H, Seats 108–109)
    .replace(
      /{{#each tickets}}[\s\S]*{{\/each}}/g,
      `<tr><td style="padding:10px 12px;border-top:1px solid #e5e7eb;">BLCNTR</td>
           <td style="padding:10px 12px;border-top:1px solid #e5e7eb;">H</td>
           <td style="padding:10px 12px;border-top:1px solid #e5e7eb;">108</td></tr>
       <tr><td style="padding:10px 12px;border-top:1px solid #e5e7eb;">BLCNTR</td>
           <td style="padding:10px 12px;border-top:1px solid #e5e7eb;">H</td>
           <td style="padding:10px 12px;border-top:1px solid #e5e7eb;">109</td></tr>`
    );

  console.log("Creating transporter…");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
  });

  console.log("Verifying Gmail login…");
  await transporter.verify();
  console.log("✓ Gmail login OK.");

  console.log("Sending email…");
  const info = await transporter.sendMail({
    from: `"Ticketmaster" <${GMAIL_USER}>`,
    to: RECIPIENT,
    subject: `Ticket Transfer: ${event_title} — ${event_date} • Accept your tickets`,
    html
  });

  console.log("✓ Message sent:", info.messageId);
} catch (err) {
  console.error("❌ FAILED:", err?.message || err);
}
