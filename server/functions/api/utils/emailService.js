const mailchimp = require('@mailchimp/mailchimp_marketing');

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
});

const sendVerificationEmail = async (email, token, baseUrl) => {
  const verificationLink = `${baseUrl}/api/verify-email/${token}`;

  try {
    const response = await mailchimp.messages.send({
      message: {
        subject: 'Verify Your Email - Alphablox',
        html: `
          <h1>Welcome to Alphablox!</h1>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationLink}">Verify Email</a>
        `,
        from_email: 'noreply@alphablox.com',
        from_name: 'Alphablox',
        to: [{ email: email }],
      },
    });

    console.log('Verification email sent successfully');
    return response;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

module.exports = { sendVerificationEmail };