To install a URL shortening service with expiration dates on a Debian 11 VPS, you can create your own simple URL shortener using Node.js with Express and MongoDB, or you can use an existing open-source project. Here, I'll guide you through setting up a basic URL shortener from scratch. 

### Step-by-Step Guide to Create a URL Shortener with Expiration Dates

#### Prerequisites
1. **Node.js**: Ensure that you have Node.js installed on your Debian 11 system.
2. **MongoDB**: You can install MongoDB locally or use a cloud database service.
3. **npm**: This usually comes with Node.js.

#### Step 1: Update Your System
First, ensure your Debian system is up to date:

```bash
sudo apt update
sudo apt upgrade -y
```

#### Step 2: Install Node.js and npm
If you haven't installed Node.js and npm, you can do so with the following commands:

```bash
# Install curl if not already installed
sudo apt install -y curl

# Install Node.js from NodeSource (LTS version 18)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

#### Step 3: Install MongoDB
You can install MongoDB using the following commands:

```bash
# Import the public key used by the package management system
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# Create a list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/debian bullseye/mongodb-org/5.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Reload the local package database
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org
```

After installing MongoDB, start and enable it:

```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Step 4: Set Up Your URL Shortener Project
1. **Create a project directory**:

   ```bash
   mkdir shorturl && cd shorturl
   ```

2. **Initialize a new Node.js project**:

   ```bash
   npm init -y
   ```

3. **Install Required Packages**:

   ```bash
   npm install express mongoose nanoid body-parser dotenv
   ```

   - `express`: Framework for building web applications.
   - `mongoose`: MongoDB object modeling tool.
   - `nanoid`: For generating unique IDs.
   - `body-parser`: Middleware to parse incoming request bodies.
   - `dotenv`: For managing environment variables.

#### Step 5: Create the Main Application File
1. **Create a file named `server.js`**:

   ```bash
   touch server.js
   ```

2. **Edit `server.js` and add the following code**:

```javascript
import express from 'express';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// URL Schema
const urlSchema = new mongoose.Schema({
    originalUrl: String,
    shortUrl: String,
    createdAt: { type: Date, default: Date.now, expires: '30d' }, // URL expires in 30 days
});

const Url = mongoose.model('Url', urlSchema);

// Create Short URL
app.post('/shorten', async (req, res) => {
    const { originalUrl } = req.body;

    const shortUrl = nanoid(8); // Generate a short ID
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

#### Step 6: Set Up Environment Variables
1. **Create a `.env` file in your project directory**:

```bash
touch .env
```

2. **Edit the `.env` file and add your MongoDB connection string**:

```
MONGODB_URI=mongodb://localhost:27017/shorturl
PORT=3000
```

#### Step 7: Start Your Server
Run your server:

```bash
node server.js
```

You should see `Server is running on http://localhost:3000`.

### Step 8: Test Your URL Shortener
You can test the URL shortener using tools like Postman or cURL.

1. **Shorten a URL**:

   Use the following JSON payload in your POST request to `http://localhost:3000/shorten`:

   ```json
   {
       "originalUrl": "https://www.example.com"
   }
   ```

   You should receive a response with the original URL and the shortened URL.

2. **Access the Shortened URL**:

   In your browser or using a cURL command, visit the shortened URL returned in the response to verify it redirects to the original URL.

### Conclusion
You now have a basic URL shortener set up on your Debian 11 VPS with expiration dates for the shortened URLs. The URLs will automatically expire 30 days after they are created, thanks to the `expires` property in the Mongoose schema. 

If you encounter any issues or need further customization, feel free to ask!
