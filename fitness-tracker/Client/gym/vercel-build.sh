#!/bin/bash

# Print working directory for debugging
echo "Current directory: $(pwd)"

# Navigate to the client directory
cd fitness-tracker/Client/gym || exit 1
echo "Changed to client directory: $(pwd)"

# Install dependencies
echo "Installing dependencies..."
npm install || exit 1

# Build the React app
echo "Building React app..."
npm run build || exit 1

# Create output directory and copy files
echo "Setting up Vercel output directory..."
mkdir -p ../../.vercel/output/static

# Copy build files to Vercel output
echo "Copying build files to Vercel output..."
cp -r dist/* ../../.vercel/output/static/

# Create config.json
echo "Creating Vercel config.json..."
echo '{"version":3,"routes":[{"src":"/api/(.*)","dest":"/api/$1"},{"handle":"filesystem"},{"src":"/(.*)\\.(.*)","dest":"/$1.$2"},{"src":"/(.*)/(.*)","dest":"/$1/$2"},{"src":"/(.*)","dest":"/index.html"}]}' > ../../.vercel/output/config.json

# Success message
echo "Build completed successfully!"
ls -la ../../.vercel/output/static/ 