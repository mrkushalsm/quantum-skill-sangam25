# Render Build Script
# This file tells Render how to build your backend application

# Install dependencies
npm install

# Run any build scripts if needed
# npm run build

# Create necessary directories
mkdir -p uploads/documents uploads/marketplace uploads/profiles uploads/others
mkdir -p logs

# Set proper permissions
chmod -R 755 uploads
chmod -R 755 logs
