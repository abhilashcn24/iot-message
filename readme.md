# WhatsApp Form Notification System

A simple Node.js + Express application that sends WhatsApp notifications using Twilio whenever a user submits a form with an optional image upload.

---

# Features

- Send WhatsApp messages using Twilio
- Upload and send images
- Simple frontend form
- Express backend
- Multer file upload support
- ngrok support for public access
- Environment variable support using dotenv

---

# Tech Stack

## Frontend
- HTML
- CSS
- JavaScript

## Backend
- Node.js
- Express.js

## Services
- Twilio WhatsApp API
- ngrok

## File Upload
- Multer

---

# Project Structure

```text
whatsapp-form-api/
│
├── uploads/
│
├── server.js
├── index.html
├── .env
├── package.json
├── package-lock.json
└── README.md
```

---

# Installation

## 1. Clone Project

```bash
git clone <your-repo-url>
```

OR create manually:

```bash
mkdir whatsapp-form-api
cd whatsapp-form-api
```

---

# Install Dependencies

```bash
npm install express cors dotenv twilio multer
```

---

# Create .env File

Create a `.env` file in the root folder.

Example:

```env
PORT=3000

TWILIO_ACCOUNT_SID=YOUR_ACCOUNT_SID

TWILIO_AUTH_TOKEN=YOUR_AUTH_TOKEN

TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

YOUR_WHATSAPP_NUMBER=whatsapp:+91XXXXXXXXXX
```

---

# Get Twilio Credentials

## Twilio Console

https://console.twilio.com

---

# Setup WhatsApp Sandbox

Open:

https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

You will get:
- Sandbox number
- Join code

Example:

```text
join-river-tree
```

Send the join code to:

```text
+14155238886
```

from your WhatsApp.

Without this step, messages will not send.

---

# Start Backend Server

```bash
node server.js
```

Expected output:

```text
🚀 Server running on port 3000
```

---

# Start ngrok

In another terminal:

```bash
ngrok http 3000
```

Example output:

```text
https://abc123.ngrok-free.app
```

Copy this URL.

---

# Update Frontend Fetch URL

Inside `index.html`

Find:

```javascript
fetch("https://YOUR-NGROK-URL.ngrok-free.app/submit-form")
```

Replace with your ngrok URL.

Example:

```javascript
fetch("https://abc123.ngrok-free.app/submit-form")
```

---

# Run Frontend

Open:

```text
index.html
```

OR use VS Code Live Server extension.

---

# How It Works

```text
Frontend Form
      ↓
Express Backend
      ↓
Multer Upload
      ↓
Twilio WhatsApp API
      ↓
WhatsApp Message + Image
```

---

# API Endpoint

## POST /submit-form

### Form Data

| Field   | Type |
|--------|------|
| name | text |
| email | text |
| phone | text |
| message | text |
| image | file |

---

# Supported Image Formats

Recommended:

- jpg
- jpeg
- png

Avoid:
- svg
- webp
- filenames with spaces or special characters

---

# Common Errors

## Invalid media URL(s)

Cause:
- Unsupported image
- Invalid filename
- localhost image URL

Fix:
- Use ngrok
- Use jpg/png
- Remove spaces from filenames

---

## Request aborted

Cause:
- Wrong frontend form submission
- Incorrect Content-Type

Fix:
- Use FormData
- Do not manually set Content-Type

---

# Example WhatsApp Message

```text
📩 New Form Submission

👤 Name: Abhilash

📧 Email: abc@gmail.com

📱 Phone: 9876543210

📝 Message:
Hello from form
```

Image is also attached if uploaded.

---

# Future Improvements

- MongoDB integration
- React frontend
- Cloudinary image storage
- Authentication
- Admin dashboard
- AI-based image analysis
- GPS tracking
- Real-time notifications
- Email notifications
- Deployment on Render/Railway

---

# Useful Commands

## Install dependencies

```bash
npm install
```

## Start server

```bash
node server.js
```

## Start ngrok

```bash
ngrok http 3000
```

---

# Dependencies

```json
{
  "cors": "^2.x",
  "dotenv": "^16.x",
  "express": "^4.x",
  "multer": "^1.x",
  "twilio": "^5.x"
}
```

---

# License

MIT License