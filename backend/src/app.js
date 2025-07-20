const express = require('express');
const cors = require('cors');
const path = require('path');
const uploadRouter = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!require('fs').existsSync(uploadsDir)) {
    require('fs').mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use('/api/upload', uploadRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false,
        error: 'Something went wrong!'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 