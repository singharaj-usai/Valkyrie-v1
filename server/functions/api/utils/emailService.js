const nodemailer = require('nodemailer');
const { google } = require('googleapis');

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://accounts.google.com/o/oauth2/auth'
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject('Failed to create access token :(');
      }
      resolve(token);
    });
  });

  const transporter = nodemailer.createTransport({
    //service: "gmail",
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_USERNAME,
      accessToken,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
  });

  return transporter;
};

const sendVerificationEmail = async (email, token, baseUrl) => {
  const verificationLink = `${baseUrl}/api/verify-email/${token}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USERNAME}>`,
    to: email,
    subject: 'Verify Your Email - Valkyrie',
    html: `
      <h1>Welcome to Valkyrie!</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationLink}">Verify Email</a>
    `,
  };

  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

const sendPasswordResetEmail = async (email, token, baseUrl) => {
  const resetLink = `${baseUrl}/reset-password.html?token=${token}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USERNAME}>`,
    to: email,
    subject: 'Reset Your Password - Valkyrie',
    html: `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
    `,
  };

  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
