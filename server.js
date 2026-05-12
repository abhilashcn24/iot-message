require("dotenv").config();

const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// So req.protocol is https when behind ngrok / reverse proxy (Twilio media URLs)
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/*
|--------------------------------------------------------------------------
| CREATE uploads FOLDER IF NOT EXISTS
|--------------------------------------------------------------------------
*/

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

/*
|--------------------------------------------------------------------------
| MAKE uploads PUBLIC
|--------------------------------------------------------------------------
| This allows images to be accessed using:
| http://localhost:3000/uploads/image.jpg
|
| OR with ngrok:
| https://your-ngrok-url/uploads/image.jpg
|--------------------------------------------------------------------------
*/

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/*
|--------------------------------------------------------------------------
| HOMEPAGE ROUTE
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

/*
|--------------------------------------------------------------------------
| MULTER STORAGE CONFIGURATION
|--------------------------------------------------------------------------
*/

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {

  const sanitizedName = file.originalname
    .replace(/\s+/g, "-")
    .replace(/[()]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "");

  const uniqueName = Date.now() + "-" + sanitizedName;

  cb(null, uniqueName);
},
});

const upload = multer({ storage });

/*
|--------------------------------------------------------------------------
| TWILIO CLIENT
|--------------------------------------------------------------------------
*/

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/** Base URL Twilio can reach (no trailing slash). Use your ngrok HTTPS origin, e.g. https://abc.ngrok-free.app */
function publicAppOrigin(req) {
  const fromEnv = process.env.PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  return `${req.protocol}://${req.get("host")}`;
}

function twilioCannotFetchMediaUrl(url) {
  try {
    const { hostname, protocol } = new URL(url);
    const h = hostname.toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h.endsWith(".local")) {
      return true;
    }
    if (
      /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)
    ) {
      return true;
    }
    if (protocol === "http:" && !h.endsWith("ngrok-free.app") && !h.endsWith("ngrok.io")) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

/*
|--------------------------------------------------------------------------
| FORM SUBMISSION ROUTE
|--------------------------------------------------------------------------
*/

app.post("/submit-form", upload.single("image"), async (req, res) => {
  try {
    console.log("Form received");

    const { name, email, phone, message } = req.body;

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | IMAGE URL
    |--------------------------------------------------------------------------
    */

    let imageUrl = null;
    let imageSkippedForTwilio = false;

    if (req.file) {
      const origin = publicAppOrigin(req);
      imageUrl = `${origin}/uploads/${req.file.filename}`;

      if (twilioCannotFetchMediaUrl(imageUrl)) {
        imageSkippedForTwilio = true;
        console.warn(
          "Image saved locally but not sent via Twilio (URL not public). Set PUBLIC_APP_URL to your HTTPS ngrok URL in .env."
        );
      } else {
        console.log("Image URL for Twilio:", imageUrl);
      }
    }

    /*
    |--------------------------------------------------------------------------
    | WHATSAPP MESSAGE
    |--------------------------------------------------------------------------
    */

    let whatsappMessage = `
📩 New Form Submission

👤 Name: ${name}

📧 Email: ${email}

📱 Phone: ${phone}

📝 Message:
${message}
`;

    if (imageSkippedForTwilio) {
      whatsappMessage += `\n\n📎 Photo uploaded on server: ${req.file.filename} (add PUBLIC_APP_URL for Twilio to attach it.)`;
    }

    /*
    |--------------------------------------------------------------------------
    | TWILIO MESSAGE OPTIONS
    |--------------------------------------------------------------------------
    */

    const messageOptions = {
      body: whatsappMessage,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: process.env.YOUR_WHATSAPP_NUMBER,
    };

    /*
    |--------------------------------------------------------------------------
    | ADD IMAGE IF EXISTS
    |--------------------------------------------------------------------------
    */

    if (imageUrl && !imageSkippedForTwilio) {
      messageOptions.mediaUrl = [imageUrl];
    }

    /*
    |--------------------------------------------------------------------------
    | SEND WHATSAPP MESSAGE
    |--------------------------------------------------------------------------
    */

    const response = await client.messages.create(messageOptions);

    console.log("WhatsApp sent:", response.sid);

    /*
    |--------------------------------------------------------------------------
    | SUCCESS RESPONSE
    |--------------------------------------------------------------------------
    */

    res.status(200).json({
      success: true,
      message: "WhatsApp message sent successfully",
      sid: response.sid,
      imageUrl: imageSkippedForTwilio ? null : imageUrl,
      imageNote: imageSkippedForTwilio
        ? "Set PUBLIC_APP_URL in .env (HTTPS ngrok origin) to attach photos on WhatsApp."
        : undefined,
    });
  } catch (error) {
    console.error("ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});