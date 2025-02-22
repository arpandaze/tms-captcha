#!/bin/bash

# Clean and create directories
rm -rf dist-firefox
mkdir -p dist-firefox/assets

# Build individual files
echo "Building background script..."
parcel build src/background.firefox.ts --dist-dir dist-firefox --no-content-hash --no-source-maps --no-optimize

echo "Building content script..."
parcel build src/content-script.ts --dist-dir dist-firefox --no-content-hash --no-source-maps --no-optimize

echo "Building evaluate script..."
parcel build src/evaluate.ts --dist-dir dist-firefox --no-content-hash --no-source-maps --no-optimize

echo "Building data files..."
parcel build src/data/bold_data.json --dist-dir dist-firefox --no-content-hash --no-source-maps --no-optimize
parcel build src/data/slim_data.json --dist-dir dist-firefox --no-content-hash --no-source-maps --no-optimize

# Copy manifest and assets
echo "Copying manifest and assets..."
cp src/manifest.firefox.json dist-firefox/manifest.json
cp src/assets/* dist-firefox/assets/

# Create package.json for Firefox
echo "Creating package.json..."
cat > dist-firefox/package.json << EOL
{
  "name": "tmscaptcha",
  "version": "0.3.1",
  "description": "Extension to autofill captcha on Nepse TMS login page",
  "author": "Daze <dazehere@yandex.com>",
  "license": "MIT",
  "homepage": "https://github.com/arpandaze/tms-captcha"
}
EOL

# Create LICENSE file
echo "Creating LICENSE file..."
cat > dist-firefox/LICENSE << EOL
MIT License

Copyright (c) 2024 Daze <dazehere@yandex.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOL

echo "Build complete!"