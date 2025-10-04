const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConfig() {
  // Create test transporter
  const testTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465, // or 587
    secure: true, // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD // We'll use app password
    }
  });

  try {
    // Verify connection
    await testTransporter.verify();
    console.log('Email configuration is valid');
    
    // Try sending a test email
    const info = await testTransporter.sendMail({
      from: `"Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: "Test Email",
      text: "If you receive this, email configuration is working"
    });
    
    console.log('Test email sent:', info.messageId);
  } catch (error) {
    console.error('Email configuration error:', error);
  }
}

testEmailConfig();