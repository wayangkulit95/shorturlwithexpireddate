To install and create a URL shortener with expiration functionality on a VPS (Virtual Private Server), you can use a basic stack (like PHP and MySQL) or more advanced frameworks (like Node.js, Python/Django, or Laravel) depending on your preference.

For this example, I'll guide you through setting up a URL shortener using **Node.js** with an expiration date functionality, deploying it on a VPS.

### 1. VPS Setup

1. **Access your VPS** via SSH:
   ```bash
   ssh root@your-vps-ip
   ```

2. **Update your VPS packages**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Install Node.js** (LTS version):
   ```bash
   curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

4. **Install MongoDB** (for storing URLs):
   ```bash
   sudo apt install -y mongodb
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   ```

### 2. Create the URL Shortener with Expiration Feature

We will use **Node.js** and **Express** for the server, and **MongoDB** for storing the shortened URLs with an expiration date.

#### 1. Initialize the Node.js Project

1. Create a directory for your project:
   ```bash
   mkdir shorturl-expiry
   cd shorturl-expiry
   ```

2. Initialize a new Node.js project:
   ```bash
   npm init -y
   ```

3. Install the required dependencies:
   ```bash
   npm install express mongoose nanoid
   ```

#### 2. Create a Simple URL Shortener with Expiration

1. Create the main file `server.js`:

```javascript
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
```

#### 3. Testing the Application

1. Save the file and run the server:
   ```bash
   node server.js
   ```

2. **Shorten a URL**:

   - Use a tool like `curl` or Postman to send a POST request to create a shortened URL.
   
   Example `curl` command:
   ```bash
   curl -X POST http://your-vps-ip:3000/shorten \
   -H "Content-Type: application/json" \
   -d '{"originalUrl": "https://www.example.com", "expireInHours": 2}'
   ```

   - The response will give you a shortened URL with an expiration date.

3. **Redirect** to the original URL:

   Navigate to `http://your-vps-ip/shorturlcode` in your browser. If the URL is still valid, it will redirect to the original one, or it will show a "URL has expired" message if the expiration time has passed.

### 3. Configure Nginx (Optional)

To make your application more robust, you might want to use **Nginx** as a reverse proxy.

1. **Install Nginx**:
   ```bash
   sudo apt install nginx
   ```

2. **Configure Nginx** to proxy requests to your Node.js app:

   Open the Nginx configuration file for your domain or IP:
   ```bash
   sudo nano /etc/nginx/sites-available/default
   ```

   Add the following configuration:

   ```nginx
   server {
       listen 80;
       server_name your-vps-ip;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Restart Nginx**:
   ```bash
   sudo systemctl restart nginx
   ```

Now your app should be accessible through `http://your-vps-ip/` and handle short URLs with expiration functionality.

### 4. Conclusion

You have successfully created a URL shortener with expiration functionality and deployed it on a VPS. By using MongoDB to store URLs and their expiration times, your system can check whether a shortened URL has expired before redirecting users.
