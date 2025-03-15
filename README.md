# EONTA - Enhanced Audio Installation Platform

EONTA is a web-based compositional utility for creating immersive audio environments using GPS-based audio authoring. The platform allows artists, composers, and novice technologists to build multi-track sound installations using interactive maps.

## New Features

### GPS Path Recording with Map Generation
- Record your journey through audio installations
- Receive a downloadable composition of your unique audio experience
- Get a visual map of your path alongside your audio
- Email sharing with detailed journey statistics

### Advanced Audio Boundary Transitions
- Multiple transition types (volume fade, filters, reverb, doppler, etc.)
- Customizable transition radii and fade durations
- Crossfades between overlapping regions
- Real-time audio processing using Web Audio API

## Technical Implementation

### Client-side Features
- React components for user interface
- Interactive map integration with Google Maps API
- Enhanced audio playback with advanced transition effects
- Path recording and visualization

### Server-side Features
- Path map generation from GPS coordinates
- Audio composition processing
- Enhanced email service with path maps and statistics
- Secure file storage with Amazon S3

## Setup and Installation

### Prerequisites
- Node.js 14+
- MongoDB
- AWS account for S3 storage
- Google Maps API key

### Installation
1. Clone the repository
   ```
   git clone https://github.com/yourusername/eonta.git
   cd eonta
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   # Server
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/eonta
   JWT_SECRET=your_jwt_secret
   
   # Google Maps
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   
   # AWS
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=your_aws_region
   S3_BUCKET_NAME=your_s3_bucket
   
   # Email
   EMAIL_HOST=smtp.example.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your_email_user
   EMAIL_PASSWORD=your_email_password
   EMAIL_FROM=noreply@example.com
   ```

4. Start the development server
   ```
   npm run dev
   ```

## Usage

### Creating a Sound Installation
1. Navigate to the map
2. Create boundaries using the polygon tool
3. Upload audio files for each boundary
4. Configure transition settings for each boundary
5. Save your composition

### Experiencing a Sound Installation
1. Open the composition on your mobile device
2. Walk through the installation to hear the audio
3. Use the Path Recorder to capture your journey
4. Receive a downloadable composition and path map

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

This project builds upon the original EONTA prototype developed as part of a Master's thesis in Music Technology at New York University's Steinhardt School.
