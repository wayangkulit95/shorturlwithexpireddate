Creating a short URL service with expiration dates on a Debian 11 VPS can be achieved using various programming languages and frameworks. Below, I'll provide a basic example using Python with the Flask framework, along with the necessary steps to set it up on your VPS.

### Step 1: Install Required Software

1. **Update the package list and install Python 3, pip, and virtualenv:**
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip python3-venv -y
   ```

2. **Install Flask and other required packages:**
   ```bash
   pip3 install Flask Flask-SQLAlchemy Flask-Migrate
   ```

### Step 2: Create the Short URL Script

1. **Create a project directory:**
   ```bash
   mkdir url_shortener
   cd url_shortener
   ```

2. **Create a virtual environment (optional but recommended):**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Create a new file named `app.py`:**
   ```bash
   touch app.py
   nano app.py
   ```

4. **Add the following code to `app.py`:**

   ```python
   from flask import Flask, request, redirect, jsonify
   from flask_sqlalchemy import SQLAlchemy
   from datetime import datetime, timedelta
   import string
   import random

   app = Flask(__name__)
   app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///urls.db'
   db = SQLAlchemy(app)

   class URL(db.Model):
       id = db.Column(db.Integer, primary_key=True)
       short_url = db.Column(db.String(10), unique=True, nullable=False)
       original_url = db.Column(db.String(255), nullable=False)
       expiry_date = db.Column(db.DateTime, nullable=False)

   db.create_all()

   def generate_short_url():
       return ''.join(random.choices(string.ascii_letters + string.digits, k=6))

   @app.route('/shorten', methods=['POST'])
   def shorten_url():
       data = request.get_json()
       original_url = data['url']
       expiry_minutes = data.get('expiry_minutes', 60)

       short_url = generate_short_url()
       expiry_date = datetime.now() + timedelta(minutes=expiry_minutes)

       new_url = URL(short_url=short_url, original_url=original_url, expiry_date=expiry_date)
       db.session.add(new_url)
       db.session.commit()

       return jsonify({'short_url': short_url, 'expiry_date': expiry_date.isoformat()})

   @app.route('/<short_url>')
   def redirect_to_url(short_url):
       url = URL.query.filter_by(short_url=short_url).first()
       if url and url.expiry_date > datetime.now():
           return redirect(url.original_url)
       else:
           return "URL not found or has expired", 404

   if __name__ == '__main__':
       app.run(host='0.0.0.0', port=5000)
   ```

### Step 3: Run the Application

1. **Run the Flask app:**
   ```bash
   python3 app.py
   ```

2. **Access the service:**
   The service will run on `http://<your_server_ip>:5000`. You can use tools like Postman or `curl` to test the endpoints.

### Step 4: Test the Short URL Creation

- **Create a short URL:**
  Send a POST request to `http://<your_server_ip>:5000/shorten` with a JSON body like:
  ```json
  {
      "url": "https://example.com",
      "expiry_minutes": 30
  }
  ```

- **Access the short URL:**
  If the generated short URL is `abc123`, you can access it via `http://<your_server_ip>:5000/abc123`.

### Step 5: Keep the Application Running

For production use, consider using a WSGI server like **Gunicorn** or **uWSGI** in combination with **Nginx**. Here's a brief overview:

1. **Install Gunicorn:**
   ```bash
   pip install gunicorn
   ```

2. **Run Gunicorn:**
   ```bash
   gunicorn -w 4 app:app -b 0.0.0.0:5000
   ```

3. **Set up Nginx** (optional for reverse proxy and serving static files).

### Final Note

This is a basic implementation. For a production environment, consider adding:

- Input validation and error handling.
- Authentication for creating short URLs.
- More persistent database options (e.g., PostgreSQL or MySQL).
- Logging and monitoring.
