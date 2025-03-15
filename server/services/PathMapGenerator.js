const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const AWS = require('aws-sdk');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

/**
 * Path Map Generator Service
 * Generates visual maps of user paths through audio installations
 */
class PathMapGenerator {
  /**
   * Generate a static map image using the Google Maps Static API
   * @param {Object} recording - The path recording object
   * @param {Object} composition - The composition object
   * @returns {Promise<string>} - The URL of the generated map image
   */
  async generatePathMapImage(recording, composition) {
    try {
      // Extract path coordinates from the recording
      const pathCoordinates = recording.path.map(point => `${point.lat},${point.lng}`);
      
      // If there are too many points for a URL, reduce the number of points
      // Google Maps Static API has URL length limitations
      const simplifiedPath = this.simplifyPath(pathCoordinates, 100); // Max 100 points
      
      // Create Google Maps Static API URL
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const mapCenter = composition.location.coordinates.join(',');
      const mapZoom = 15; // Adjust based on path size
      const mapSize = '600x400';
      const mapType = 'roadmap';
      
      // Create path parameter with color and weight
      const pathParam = `path=color:0x0000FFAA|weight:4|${simplifiedPath.join('|')}`;
      
      // Add markers for start (green) and end (red) points
      const startMarker = `markers=color:green|${pathCoordinates[0]}`;
      const endMarker = `markers=color:red|${pathCoordinates[pathCoordinates.length - 1]}`;
      
      // Construct the final URL
      const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${mapCenter}&zoom=${mapZoom}&size=${mapSize}&maptype=${mapType}&${pathParam}&${startMarker}&${endMarker}&key=${apiKey}`;
      
      // For higher security, we'll download the image and upload to our own S3 rather than sending Google Maps URL directly
      const imageResponse = await axios.get(staticMapUrl, { responseType: 'arraybuffer' });
      const tempFilePath = path.join(__dirname, '../temp', `path_${recording.recordingId}.png`);
      
      // Ensure temp directory exists
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Save to temp file
      fs.writeFileSync(tempFilePath, imageResponse.data);
      
      // Upload to S3
      const s3Key = `path-maps/${recording.recordingId}.png`;
      await s3.upload({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: fs.createReadStream(tempFilePath),
        ContentType: 'image/png',
        ACL: 'private'
      }).promise();
      
      // Generate pre-signed URL (valid for 7 days, same as audio)
      const imageUrl = s3.getSignedUrl('getObject', {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Expires: 7 * 24 * 60 * 60 // 7 days in seconds
      });
      
      // Remove temp file
      fs.unlinkSync(tempFilePath);
      
      return imageUrl;
    } catch (error) {
      console.error('Error generating path map image:', error);
      
      // If Google Maps API fails, generate a simple canvas path as fallback
      return this.generateFallbackPathImage(recording);
    }
  }
  
  /**
   * Simplifies a path to have fewer points while maintaining the general shape
   * @param {Array} path - Array of coordinate strings
   * @param {Number} maxPoints - Maximum number of points to keep
   * @returns {Array} - Simplified path
   */
  simplifyPath(path, maxPoints) {
    if (path.length <= maxPoints) {
      return path;
    }
    
    // Simple algorithm to reduce points - keep first, last, and evenly spaced points
    const result = [path[0]];
    const step = Math.floor(path.length / (maxPoints - 2));
    
    for (let i = step; i < path.length - step; i += step) {
      result.push(path[i]);
    }
    
    result.push(path[path.length - 1]);
    return result;
  }
  
  /**
   * Generates a fallback path image using HTML Canvas
   * @param {Object} recording - The path recording object
   * @returns {Promise<string>} - The URL of the generated image
   */
  async generateFallbackPathImage(recording) {
    try {
      // Extract path coordinates
      const pathPoints = recording.path.map(point => ({
        x: point.lng,
        y: point.lat
      }));
      
      // Find min/max coordinates to determine bounds
      const bounds = pathPoints.reduce((acc, point) => {
        return {
          minX: Math.min(acc.minX, point.x),
          maxX: Math.max(acc.maxX, point.x),
          minY: Math.min(acc.minY, point.y),
          maxY: Math.max(acc.maxY, point.y)
        };
      }, {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity
      });
      
      // Add padding
      const padding = 0.0002; // Approximately 20 meters in lat/lng
      bounds.minX -= padding;
      bounds.maxX += padding;
      bounds.minY -= padding;
      bounds.maxY += padding;
      
      // Create canvas
      const width = 600;
      const height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      
      // Fill background
      ctx.fillStyle = '#F0F0F0';
      ctx.fillRect(0, 0, width, height);
      
      // Function to convert geo coordinates to canvas coordinates
      const mapToCanvas = (x, y) => {
        const canvasX = ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * width;
        const canvasY = height - ((y - bounds.minY) / (bounds.maxY - bounds.minY)) * height;
        return { x: canvasX, y: canvasY };
      };
      
      // Draw path
      ctx.beginPath();
      const firstPoint = mapToCanvas(pathPoints[0].x, pathPoints[0].y);
      ctx.moveTo(firstPoint.x, firstPoint.y);
      
      for (let i = 1; i < pathPoints.length; i++) {
        const point = mapToCanvas(pathPoints[i].x, pathPoints[i].y);
        ctx.lineTo(point.x, point.y);
      }
      
      ctx.strokeStyle = 'rgba(0, 0, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw start point (green)
      const startPoint = mapToCanvas(pathPoints[0].x, pathPoints[0].y);
      ctx.beginPath();
      ctx.arc(startPoint.x, startPoint.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'green';
      ctx.fill();
      
      // Draw end point (red)
      const endPoint = mapToCanvas(pathPoints[pathPoints.length - 1].x, pathPoints[pathPoints.length - 1].y);
      ctx.beginPath();
      ctx.arc(endPoint.x, endPoint.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'red';
      ctx.fill();
      
      // Add title and legend
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#333';
      ctx.fillText('Your Path Through the Sound Installation', 20, 30);
      
      ctx.font = '12px Arial';
      ctx.fillStyle = '#333';
      ctx.fillText('Start Point', 30, height - 40);
      ctx.beginPath();
      ctx.arc(20, height - 36, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'green';
      ctx.fill();
      
      ctx.fillStyle = '#333';
      ctx.fillText('End Point', 100, height - 40);
      ctx.beginPath();
      ctx.arc(90, height - 36, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'red';
      ctx.fill();
      
      // Add timestamp
      ctx.fillStyle = '#666';
      ctx.font = '10px Arial';
      ctx.fillText(`Generated: ${new Date().toLocaleString()}`, 20, height - 15);
      
      // Ensure temp directory exists
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Save to temp file
      const tempFilePath = path.join(tempDir, `path_${recording.recordingId}.png`);
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(tempFilePath, buffer);
      
      // Upload to S3
      const s3Key = `path-maps/${recording.recordingId}.png`;
      await s3.upload({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Body: fs.createReadStream(tempFilePath),
        ContentType: 'image/png',
        ACL: 'private'
      }).promise();
      
      // Generate pre-signed URL (valid for 7 days, same as audio)
      const imageUrl = s3.getSignedUrl('getObject', {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
        Expires: 7 * 24 * 60 * 60 // 7 days in seconds
      });
      
      // Remove temp file
      fs.unlinkSync(tempFilePath);
      
      return imageUrl;
    } catch (error) {
      console.error('Error generating fallback path image:', error);
      return null; // Return null if all image generation fails
    }
  }
}

module.exports = new PathMapGenerator();