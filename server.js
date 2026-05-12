require("dotenv").config();

const express = require("express");
const cors = require("cors");
const twilio = require("twilio");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

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

    if (req.file) {
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
        req.file.filename
      }`;

      console.log("Image uploaded:", imageUrl);
    }

    /*
    |--------------------------------------------------------------------------
    | WHATSAPP MESSAGE
    |--------------------------------------------------------------------------
    */

    const whatsappMessage = `
📩 New Form Submission

👤 Name: ${name}

📧 Email: ${email}

📱 Phone: ${phone}

📝 Message:
${message}
`;

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

    if (imageUrl) {
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
      imageUrl,
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