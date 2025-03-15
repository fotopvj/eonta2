const nodemailer = require('nodemailer');
const pathMapGenerator = require('./PathMapGenerator');

/**
 * Enhanced Email Service
 * Sends emails with audio compositions and path maps
 */
class EnhancedEmailService {
  constructor() {
    // Configure nodemailer
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  /**
   * Sends an enhanced email with both the audio download link and path map
   * @param {String} email - Recipient email address
   * @param {String} downloadUrl - URL for the audio composition download
   * @param {Date} expiresAt - Expiration date for the download link
   * @param {String} compositionTitle - Title of the original composition
   * @param {Object} recording - The path recording object
   * @param {Object} composition - The original composition object
   * @returns {Promise} - Result of sending the email
   */
  async sendEnhancedDownloadEmail(email, downloadUrl, expiresAt, compositionTitle, recording, composition) {
    try {
      // Generate the path map image
      const pathMapUrl = await pathMapGenerator.generatePathMapImage(recording, composition);
      
      // Format duration for display
      const durationMinutes = Math.floor(recording.duration / 1000 / 60);
      const durationSeconds = Math.floor((recording.duration / 1000) % 60);
      const formattedDuration = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
      
      // Format date
      const formattedDate = expiresAt.toLocaleDateString();
      
      // Calculate statistics for the email
      const distance = Math.round(recording.stats.totalDistance);
      const formattedDistance = distance < 1000 
        ? `${distance} meters` 
        : `${(distance / 1000).toFixed(2)} km`;
      
      const uniqueRegions = recording.stats.uniqueRegionsVisited;
      const startTime = new Date(recording.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = new Date(recording.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Compose email HTML
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #4a90e2; margin-bottom: 20px;">Your EONTA Journey</h1>
          
          <p>Thank you for experiencing <strong>${compositionTitle}</strong>!</p>
          
          <p>We've created a unique audio composition based on your journey through this sound installation. Below you'll find both your audio composition and a map of your path.</p>
          
          <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h2 style="font-size: 18px; margin-top: 0; color: #4a90e2;">Your Journey Stats</h2>
            <ul style="padding-left: 20px; line-height: 1.6;">
              <li><strong>Duration:</strong> ${formattedDuration} minutes</li>
              <li><strong>Distance traveled:</strong> ${formattedDistance}</li>
              <li><strong>Unique audio regions experienced:</strong> ${uniqueRegions}</li>
              <li><strong>Start time:</strong> ${startTime}</li>
              <li><strong>End time:</strong> ${endTime}</li>
            </ul>
          </div>
          
          <div style="margin: 30px 0;">
            <h2 style="font-size: 18px; color: #4a90e2;">Your Path Map</h2>
            ${pathMapUrl ? `
              <div style="text-align: center; margin: 15px 0;">
                <img src="${pathMapUrl}" alt="Map of your path" style="max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
                <p style="font-size: 12px; color: #666; margin-top: 8px;">Green marker: Starting point | Red marker: Ending point</p>
              </div>
            ` : `
              <p>We couldn't generate a map for your path, but your audio composition is still available below.</p>
            `}
          </div>
          
          <div style="background-color: #4a90e2; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
            <h2 style="font-size: 18px; color: white; margin-top: 0;">Download Your Composition</h2>
            <p style="color: white; opacity: 0.9; margin-bottom: 20px;">Click the button below to download your unique audio composition</p>
            <a href="${downloadUrl}" style="background-color: white; color: #4a90e2; display: inline-block; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Download Audio (MP3)</a>
            <p style="color: white; opacity: 0.8; font-size: 12px; margin-top: 15px;">This download link will expire on ${formattedDate}</p>
          </div>
          
          <div style="margin: 30px 0;">
            <h2 style="font-size: 18px; color: #4a90e2;">Share Your Experience</h2>
            <p>Want to share your EONTA journey with friends? Send them to the installation and encourage them to create their own unique path!</p>
            <p>Or share your composition on social media with hashtag #EONTAjourney</p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #666;">
            <p>We hope you enjoyed your immersive audio experience with EONTA. Feel free to create and share your own compositions!</p>
            <p>The EONTA Team</p>
          </div>
        </div>
      `;
      
      // Send the email
      const result = await this.transporter.sendMail({
        from: `"EONTA Music" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: `Your EONTA Journey: ${compositionTitle}`,
        html: emailHtml,
        attachments: pathMapUrl ? [
          {
            filename: 'path-map.png',
            path: pathMapUrl,
            cid: 'path-map' // This is used as reference in the HTML
          }
        ] : []
      });
      
      console.log(`Enhanced email sent to ${email} with download link and path map`);
      return result;
    } catch (error) {
      console.error('Error sending enhanced email:', error);
      throw error;
    }
  }
}

module.exports = new EnhancedEmailService();