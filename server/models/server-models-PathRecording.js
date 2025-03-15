const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Path Recording Schema
 * Stores GPS path recordings and associated audio data
 */
const PathRecordingSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  composition: {
    type: Schema.Types.ObjectId,
    ref: 'Composition',
    required: true
  },
  recordingId: {
    type: String,
    required: true,
    unique: true
  },
  path: [{
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    timeSinceStart: {
      type: Number,
      required: true
    },
    accuracy: {
      type: Number
    },
    alt: {
      type: Number
    }
  }],
  audioEvents: [{
    timestamp: {
      type: Date,
      required: true
    },
    timeSinceStart: {
      type: Number,
      required: true
    },
    activeRegions: [{
      regionId: {
        type: Schema.Types.ObjectId,
        ref: 'AudioRegion'
      },
      volume: {
        type: Number,
        default: 1.0
      },
      effects: {
        type: Object,
        default: {}
      }
    }]
  }],
  duration: {
    type: Number,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'error'],
    default: 'processing'
  },
  downloadUrl: {
    type: String
  },
  mapImageUrl: {
    type: String
  },
  expiresAt: {
    type: Date
  },
  error: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  stats: {
    totalDistance: {
      type: Number, // meters
      default: 0
    },
    averageSpeed: {
      type: Number, // meters per second
      default: 0
    },
    uniqueRegionsVisited: {
      type: Number,
      default: 0
    },
    downloadCount: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    device: {
      type: String
    },
    browser: {
      type: String
    },
    userAgent: {
      type: String
    },
    ipAddress: {
      type: String
    }
  }
});

// Index for quick lookups
PathRecordingSchema.index({ user: 1, createdAt: -1 });
PathRecordingSchema.index({ recordingId: 1 }, { unique: true });
PathRecordingSchema.index({ composition: 1 });

// Define virtual for whether the download is still valid
PathRecordingSchema.virtual('isDownloadValid').get(function() {
  if (!this.expiresAt) return false;
  return new Date() < this.expiresAt;
});

// Instance method to calculate total distance
PathRecordingSchema.methods.calculateTotalDistance = function() {
  if (!this.path || this.path.length < 2) return 0;
  
  let totalDistance = 0;
  
  for (let i = 1; i < this.path.length; i++) {
    const point1 = this.path[i - 1];
    const point2 = this.path[i];
    totalDistance += calculateDistance(
      point1.lat, point1.lng,
      point2.lat, point2.lng
    );
  }
  
  return totalDistance;
};

// Utility function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Pre-save hook to calculate statistics
PathRecordingSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('path')) {
    // Calculate total distance
    this.stats.totalDistance = this.calculateTotalDistance();
    
    // Calculate average speed (if duration > 0)
    if (this.duration > 0) {
      this.stats.averageSpeed = this.stats.totalDistance / (this.duration / 1000);
    }
    
    // Count unique regions visited (using set of region IDs)
    const uniqueRegions = new Set();
    this.audioEvents.forEach(event => {
      event.activeRegions.forEach(region => {
        if (region.regionId) {
          uniqueRegions.add(region.regionId.toString());
        }
      });
    });
    
    this.stats.uniqueRegionsVisited = uniqueRegions.size;
  }
  
  next();
});

const PathRecording = mongoose.model('PathRecording', PathRecordingSchema);

module.exports = PathRecording;