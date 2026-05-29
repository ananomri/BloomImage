# 🌸 BloomImage

A full-stack image processing application with a beautiful, intuitive interface for applying artistic filters, transformations, and effects to your images.

## ✨ Features

- **Image Conversion**: Convert images to grayscale and other color formats
- **Filtering**: Apply Gaussian blur, beautify effects, and various artistic filters
- **Artistic Effects**: 
  - 🌸 Flower Sketch Mode - Transform images into artistic flower sketches
  - 🎨 Floral art effects with customizable intensity
- **Thresholding**: Apply binary and adaptive thresholding for advanced image processing
- **Image Comparison**: Side-by-side comparison slider to view original vs. processed images
- **History Management**: Undo operations and view processing history
- **Download Results**: Save processed images to your device
- **Real-time Preview**: Instant visual feedback for all adjustments

## 🏗️ Project Structure

```
BloomImage/
├── backend/               # Flask Python API
│   ├── app.py            # Main Flask application
│   └── requirements.txt   # Python dependencies
├── frontend/             # React web application
│   ├── src/
│   │   ├── App.js       # Main React component
│   │   ├── App.css      # Application styles
│   │   └── index.js     # React entry point
│   ├── public/          # Static assets
│   └── package.json     # Node dependencies
└── README.md           # This file
```

## 🛠️ Technology Stack

### Backend
- **Flask** - Web framework
- **Flask-CORS** - Cross-Origin Resource Sharing
- **OpenCV** - Computer vision library for image processing
- **NumPy** - Numerical computing
- **Pillow** - Image processing library
- **Werkzeug** - WSGI utilities

### Frontend
- **React** - UI library
- **React Scripts** - Build tools
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Lucide React** - Icon library

## 📋 Requirements

- Python 3.8+
- Node.js 14+ and npm
- 20MB max file size for image uploads

## 🚀 Installation & Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Run the Flask server:
```bash
python app.py
```

The backend will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will open on `http://localhost:3000`

## 🎯 Usage

1. **Upload an Image**: Click the upload button and select an image (PNG, JPG, JPEG, BMP, TIFF, WebP)
2. **Select a Filter/Effect**: Browse through categories:
   - Conversion (grayscale, color space conversions)
   - Filtrage (blur, beautify effects)
   - Art Floral (flower sketch and artistic effects)
   - Seuillage (thresholding)
3. **Adjust Parameters**: Use sliders to customize effect intensity
4. **Compare Results**: Use the comparison slider to see before/after
5. **Undo/Redo**: Navigate through your editing history
6. **Download**: Save your final image to your device

## 📁 File Formats Supported

- PNG
- JPG / JPEG
- BMP
- TIFF
- WebP

Maximum file size: **20MB**

## 🔧 API Endpoints

### Image Upload
- `POST /api/upload` - Upload an image

### Image Processing
- `POST /api/process` - Apply filters and effects
- `GET /api/image/<image_id>` - Retrieve processed image
- `POST /api/undo` - Undo last operation
- `GET /api/history/<image_id>` - Get processing history

## 🌱 Available Filters

- **Grayscale**: Convert to grayscale
- **Gaussian Blur**: Apply blur with customizable intensity
- **Beautify**: Smooth and enhance skin tones
- **Flower Sketch**: Artistic flower sketch effect
- **Threshold**: Binary thresholding
- **Adaptive Threshold**: Context-aware thresholding

## 💾 Sample API Request

```bash
curl -X POST http://localhost:5000/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "image_id": "your_image_id",
    "operation": "grayscale"
  }'
```

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements!

## 📝 License

This project is open source and available under the MIT License.

---

Made with 🌸 for image enthusiasts
