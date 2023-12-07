const nodemailer = require('nodemailer');
const User = require('./middleware'); // Import the User model
require('dotenv').config();

const sendOTP = async (email) => {
  try {
    // Check if the user exists in the database

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Create a nodemailer transporter with SMTP settings
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
      },
    });

    // Define the email content
    const mailOptions = {
      from: {
        address: process.env.MAIL_FROM_ADDRESS,
        name: process.env.MAIL_FROM_NAME,
      },
      to: email,
      subject: 'OTP for Password Reset',
      text: `Your OTP for password reset is: ${otp}`,
    };

    // Send the OTP email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);

    return otp;
  } catch (error) {
    console.error('Error in sendOTP:', error);
    throw error;
  }
};

module.exports = sendOTP;
