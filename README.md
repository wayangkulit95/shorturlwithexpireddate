To run your URL shortener with expiration functionality on a VPS running Ubuntu 20.04 and ensure that URLs expire on a monthly basis, you need to:

1. **Set up the application** to handle URL shortening with expiration.
2. **Schedule a cleanup job** that runs monthly to remove expired URLs.
3. **Run the application in the background** using tools like **PM2** to keep the server running after you close the terminal.

### Step-by-Step Guide:

#### 1. **Set Up the Node.js Application (ShortURL with Expiration)**

First, you need to install Node.js and MongoDB on your Ubuntu VPS.

##### Install Node.js and MongoDB

1. **Update your package list:**

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Node.js:**

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Install MongoDB:**

   Add the MongoDB repository and install MongoDB:

   ```bash
   wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
   sudo apt update
   sudo apt install -y mongodb-org
   ```

4. **Start MongoDB and ensure it starts on boot:**

   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

5. **Install PM2** (optional but recommended to keep your Node.js app running in the background):

   ```bash
   sudo npm install -g pm2
   ```

##### Create Your Node.js ShortURL App

1. **Set up the project folder:**

   ```bash
   mkdir shorturl-expiry
   cd shorturl-expiry
   ```

2. **Initialize the project:**

   ```bash
   npm init -y
   ```

3. **Install necessary packages:**

   ```bash
   npm install express mongoose nanoid
   ```

4. **Create `server.js` file:**

   Here's a simple URL shortener application that sets the expiration of the URLs to 30 days (monthly expiration):

   ```bash
   nano server.js
   ```

   **Add the following code to `server.js`:**

   ```javascript
   const express = require('express');
   const mongoose = require('mongoose');
   const { nanoid } = require('nanoid');
   const app = express();

   mongoose.connect('mongodb://localhost:27017/shorturl', { useNewUrlParser: true, useUnifiedTopology: true });

   const urlSchema = new mongoose.Schema({
       originalUrl: { type: String, required: true },
       shortUrl: { type: String, required: true },
       createdAt: { type: Date, default: Date.now },
       expiresAt: { type: Date, required: true }
   });

   const Url = mongoose.model('Url', urlSchema);

   app.use(express.json());

   // Route to create a short URL with monthly expiration
   app.post('/shorten', async (req, res) => {
       const { originalUrl } = req.body;
       const shortUrlCode = nanoid(8);

       // Set expiration to 30 days from now
       const expiresAt = new Date();
       expiresAt.setDate(expiresAt.getDate() + 30);

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

       res.redirect(urlEntry.originalUrl);
   });

   // Start the server
   const PORT = process.env.PORT || 3000;
   app.listen(PORT, () => {
       console.log(`Server running on port ${PORT}`);
   });
   ```

5. **Save the file** and exit (in nano, press `CTRL + O`, then `ENTER`, and `CTRL + X`).

6. **Start the Node.js app:**

   Using **PM2** (recommended):

   ```bash
   pm2 start server.js
   pm2 save
   ```

   Using **Node.js** directly (not persistent after logout):

   ```bash
   node server.js
   ```

Now, your application is running, and it will create shortened URLs that expire after 30 days.

---

#### 2. **Set Up a Monthly Cleanup Job**

You will want to automatically remove expired URLs. This can be achieved using a **cron job** that runs a script to delete expired entries from the MongoDB database every month.

1. **Create a cleanup script** to delete expired URLs:

   Create a new file `cleanup.js`:

   ```bash
   nano cleanup.js
   ```

   **Add the following code:**

   ```javascript
   const mongoose = require('mongoose');

   // Connect to MongoDB
   mongoose.connect('mongodb://localhost:27017/shorturl', { useNewUrlParser: true, useUnifiedTopology: true });

   // Define the URL schema
   const urlSchema = new mongoose.Schema({
       originalUrl: String,
       shortUrl: String,
       createdAt: { type: Date, default: Date.now },
       expiresAt: { type: Date, required: true }
   });

   const Url = mongoose.model('Url', urlSchema);

   // Function to delete expired URLs
   async function deleteExpiredUrls() {
       const result = await Url.deleteMany({ expiresAt: { $lt: new Date() } });
       console.log(`${result.deletedCount} expired URLs deleted`);
       mongoose.connection.close();
   }

   deleteExpiredUrls();
   ```

   Save and exit (`CTRL + O`, then `ENTER`, and `CTRL + X`).

2. **Test the cleanup script:**

   Run the script manually to ensure it works:

   ```bash
   node cleanup.js
   ```

   It should delete any expired URLs from your MongoDB database and print how many were deleted.

3. **Schedule the cleanup script to run monthly:**

   Use **cron** to schedule the cleanup script to run once a month.

   Open the cron editor:

   ```bash
   crontab -e
   ```

   Add the following line to run the cleanup script on the first day of every month at midnight:

   ```bash
   0 0 1 * * /usr/bin/node /path/to/your/project/cleanup.js >> /path/to/your/project/cleanup.log 2>&1
   ```

   This schedules the cleanup script to run every month. Make sure to replace `/path/to/your/project/` with the actual path to your project directory.

4. **Save the cron job** and exit the editor.

---

### 3. **Access Your URL Shortener**

- To **create a short URL**, you can use tools like `curl` or Postman to send a POST request to your VPS:

   ```bash
   curl -X POST http://your-vps-ip:3000/shorten \
   -H "Content-Type: application/json" \
   -d '{"originalUrl": "https://example.com"}'
   ```

- To **access a shortened URL**, visit the short URL, for example:

   ```bash
   http://your-vps-ip/abcd1234
   ```

If the URL has expired, it will return a "410: URL has expired" message.

---

### Conclusion

1. **Node.js and MongoDB** handle your URL shortening with monthly expiration.
2. **PM2** keeps the app running in the background.
3. **Cron jobs** clean up expired URLs every month.

By following this guide, you have set up a fully functional short URL application that automatically manages and deletes expired URLs every month on an Ubuntu 20.04 VPS. Let me know if you encounter any issues!
