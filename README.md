I understand that this process might be overwhelming or not working for you as intended. Let's simplify things and focus on getting a URL shortener working step-by-step. I'll guide you through a very basic setup that should be easier to follow.

### Simple Setup for a URL Shortener on Debian 11

#### **Step 1: Basic Setup**

1. **Connect to Your VPS:**
   Make sure you are connected to your Debian 11 VPS via SSH.

2. **Update Your System:**
   First, update your package list and upgrade installed packages:

   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

3. **Install Node.js and npm:**
   If Node.js is not installed, run the following commands to install it:

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

4. **Verify the Installation:**
   Check the installed versions of Node.js and npm:

   ```bash
   node -v
   npm -v
   ```

#### **Step 2: Create Your URL Shortener Project**

1. **Create a Project Directory:**
   Create a directory for your project and navigate into it:

   ```bash
   mkdir shorturl && cd shorturl
   ```

2. **Initialize a New Node.js Project:**
   Run the following command to create a `package.json` file:

   ```bash
   npm init -y
   ```

3. **Install Required Packages:**
   Install `express`, `mongoose`, `nanoid`, and `body-parser`:

   ```bash
   npm install express mongoose nanoid body-parser
   ```

#### **Step 3: Create the Server File**

1. **Create the Server File:**
   Create a file named `server.js`:

   ```bash
   touch server.js
   ```

2. **Edit `server.js`:**
   Open `server.js` with a text editor (e.g., `nano`):

   ```bash
   nano server.js
   ```

   And paste in the following code:

   ```javascript
   import express from 'express';
   import mongoose from 'mongoose';
   import { nanoid } from 'nanoid';
   import bodyParser from 'body-parser';

   const app = express();
   const PORT = process.env.PORT || 3000;

   // Middleware
   app.use(bodyParser.json());

   // MongoDB connection (Replace with your MongoDB connection string)
   mongoose.connect('mongodb://localhost:27017/shorturl', {
       useNewUrlParser: true,
       useUnifiedTopology: true
   }).then(() => console.log('MongoDB connected'))
   .catch(err => console.error(err));

   // URL Schema
   const urlSchema = new mongoose.Schema({
       originalUrl: { type: String, required: true },
       shortUrl: { type: String, required: true },
       createdAt: { type: Date, default: Date.now, expires: '30d' } // Expires in 30 days
   });

   const Url = mongoose.model('Url', urlSchema);

   // Create Short URL
   app.post('/shorten', async (req, res) => {
       const { originalUrl } = req.body;
       const shortUrl = nanoid(8);
       const newUrl = new Url({ originalUrl, shortUrl });
       await newUrl.save();
       res.json({ originalUrl, shortUrl: `http://localhost:${PORT}/${shortUrl}` });
   });

   // Redirect to original URL
   app.get('/:shortUrl', async (req, res) => {
       const { shortUrl } = req.params;
       const urlEntry = await Url.findOne({ shortUrl });
       if (urlEntry) {
           res.redirect(urlEntry.originalUrl);
       } else {
           res.status(404).send('URL not found');
       }
   });

   // Start server
   app.listen(PORT, () => {
       console.log(`Server is running on http://localhost:${PORT}`);
   });
   ```

3. **Save and Exit:**
   If you are using `nano`, press `CTRL + X`, then `Y`, and then `Enter` to save the file.

#### **Step 4: Install and Start MongoDB (Optional)**

If MongoDB is not installed, install it:

1. **Install MongoDB:**

   ```bash
   sudo apt install -y mongodb
   ```

2. **Start MongoDB:**

   ```bash
   sudo systemctl start mongodb
   sudo systemctl enable mongodb
   ```

#### **Step 5: Run Your URL Shortener**

1. **Run the Server:**
   In the terminal, run your server:

   ```bash
   node server.js
   ```

2. **Test the Shortener:**
   Use tools like Postman or `curl` to test the API.

   - To **shorten a URL**, send a POST request to `http://localhost:3000/shorten` with a JSON body:

   ```json
   {
       "originalUrl": "https://www.example.com"
   }
   ```

   - To **access the shortened URL**, use the returned short URL in your browser or `curl`.

### Final Steps

- **Accessing the API**: You can test your API endpoints using Postman or `curl` commands.
  
- **Checking MongoDB**: Use the MongoDB shell or a GUI tool to check the entries in your database if needed.

### Troubleshooting

If you run into any specific issues, please share:
- The error message you encounter.
- The commands you executed.
- Your configuration details (like your `server.js` file, if you’ve modified it).

Let's tackle this together step by step. If something doesn’t work, just let me know where you’re stuck!
