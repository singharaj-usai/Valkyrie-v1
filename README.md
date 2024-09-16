# AlphaBlox

## Description

AlphaBlox is your ultimate platform for creating and sharing immersive gaming experiences. Join us to relive your childhood memories and create new ones.

## Features

- **User Authentication**: Secure signup and login with email verification.
- **Profile Management**: Customize your profile with a blurb and profile image.
- **Messaging System**: Send and receive messages with other users.
- **Friend System**: Add friends and manage friend requests.
- **Game Creation**: Create and share your own games.
- **Responsive Design**: Built with Bootstrap for mobile-friendly layouts.
- **Maintenance Mode**: Easily toggle site availability.
- **More Coming Soon...**

## Technologies Used

- **Frontend**:
  - HTML5
  - CSS3 (Bootstrap, Bootswatch)
  - JavaScript (jQuery)
- **Backend**:
  - Node.js
  - Express.js
  - MongoDB
  - Mongoose
- **Other**:
  - Nodemailer
  - JSON Web Tokens (JWT)
  - dotenv

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/alphablox.git
   cd alphablox
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory and add the following:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   MAILCHIMP_API_KEY=your_mailchimp_api_key
   SENDGRID_API_KEY=your_sendgrid_api_key
   ```

4. **Create Admin User**

   ```bash
   npm run create-admin
   ```

5. **Run the application**

   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:3000`.

## Usage

- **Signup**: Create a new account to get started.
- **Login**: Access your account securely.
- **Profile**: Update your profile information.
- **Messages**: Communicate with other users.
- **Friends**: Manage your friend list.
- **Create Games**: Use the platform to create and share games.

## Deployment

AlphaBlox can be deployed using Vercel. Ensure that environment variables are set in the Vercel dashboard.
