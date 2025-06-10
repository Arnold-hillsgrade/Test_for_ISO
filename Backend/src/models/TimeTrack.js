import mongoose from 'mongoose';

const TimeTrackSchema = new mongoose.Schema({
    Task: {
        type: String,
        required: true
    },
    StartTime: {
        type: Date,
        required: true
    },
    EndTime: {
        type: Date,
        required: true
    },
    Duration: {
        type: String,
    },
    User: {
        type: String,
        required: true
    },
    Location: {
        type: String
    }
});

export default mongoose.model('TimeTrack', TimeTrackSchema);