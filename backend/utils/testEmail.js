const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '../.env') });

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const testEmail = async () => {
  try {
    // Verify environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('Email credentials are missing in .env file');
    }

    console.log('Creating transporter with Gmail settings...');

    // Use simple authentication instead of OAuth2
    const transporter = createTransporter();

    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Aishe System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Test - Email Configuration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a365d; text-align: center;">Email Configuration Test</h2>
          <p>If you received this email, your email configuration is working correctly.</p>
          <p>Test completed at: ${new Date().toLocaleString()}</p>
        </div>
      `
    });

    console.log('Test email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Test email failed:', error);
    return false;
  }
};

// Run test with better logging
const runTest = async () => {
  console.log('\nChecking environment variables...');
  console.log({
    EMAIL_USER: process.env.EMAIL_USER ? '✓ Set' : '✗ Missing',
    EMAIL_PASS: process.env.EMAIL_PASS ? '✓ Set' : '✗ Missing'
  });

  console.log('\nStarting email test...');
  const success = await testEmail();
  console.log('\nTest result:', success ? '✓ SUCCESS' : '✗ FAILED');
  process.exit(success ? 0 : 1);
};

runTest().catch(error => {
  console.error('\nTest error:', error);
  process.exit(1);
});