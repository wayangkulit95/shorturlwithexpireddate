// Import dependencies
const express = require('express');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/shorturl', { useNewUrlParser: true, useUnifiedTopology: true });

// Define a schema for URL with expiration
const urlSchema = new mongoose.Schema({
    originalUrl: { type: String, required: true },
    shortUrl: { type: String, required: true },
    expiresAt: { type: Date, required: true }
});

// Create URL model
const Url = mongoose.model('Url', urlSchema);

app.use(express.json());

// Route to create a short URL
app.post('/shorten', async (req, res) => {
    const { originalUrl, expireInHours } = req.body;
    
    // Generate a short URL code
    const shortUrlCode = nanoid(8);
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expireInHours);

    const newUrl = new Url({
        originalUrl,
        shortUrl: shortUrlCode,
        expiresAt
    });

    await newUrl.save();
    res.json({ shortUrl: `http://your-vps-ip/${shortUrlCode}`, expiresAt });
});

// Route to redirect to the original URL
app.get('/:shortUrl', async (req, res) => {
    const { shortUrl } = req.params;
    const urlEntry = await Url.findOne({ shortUrl });

    if (!urlEntry) {
        return res.status(404).send('URL not found');
    }

    // Check if the URL has expired
    if (new Date() > urlEntry.expiresAt) {
        return res.status(410).send('This URL has expired');
    }

    // Redirect to the original URL if valid
    res.redirect(urlEntry.originalUrl);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
