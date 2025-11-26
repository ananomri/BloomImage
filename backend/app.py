from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import cv2
import numpy as np
from PIL import Image
import base64
import io
import os
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp', 'tiff', 'webp'}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Store images and history in memory
image_store = {}
history_store = {}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def image_to_base64(image):
    """Convert OpenCV image to base64 string"""
    _, buffer = cv2.imencode('.png', image)
    return base64.b64encode(buffer).decode('utf-8')

def base64_to_image(base64_string):
    """Convert base64 string to OpenCV image"""
    image_data = base64.b64decode(base64_string)
    nparr = np.frombuffer(image_data, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)

# Image Processing Functions
def convert_to_grayscale(image):
    """Convert image to grayscale"""
    if len(image.shape) == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return image

def apply_threshold(image, threshold_value):
    """Apply binary threshold"""
    gray = convert_to_grayscale(image) if len(image.shape) == 3 else image
    _, thresh = cv2.threshold(gray, threshold_value, 255, cv2.THRESH_BINARY)
    return thresh

def apply_adaptive_threshold(image, block_size=11, c=2):
    """Apply adaptive threshold"""
    gray = convert_to_grayscale(image) if len(image.shape) == 3 else image
    return cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                 cv2.THRESH_BINARY, block_size, c)

def apply_gaussian_blur(image, intensity=5):
    """Apply Gaussian blur"""
    ksize = int(intensity) if int(intensity) % 2 == 1 else int(intensity) + 1
    return cv2.GaussianBlur(image, (ksize, ksize), 0)

def resize_image(image, width, height):
    """Resize image to specified dimensions"""
    return cv2.resize(image, (int(width), int(height)))

def normalize_image(image):
    """Normalize image to 0-255 range"""
    return cv2.normalize(image, None, 0, 255, cv2.NORM_MINMAX)

def equalize_histogram(image):
    """Equalize histogram"""
    if len(image.shape) == 3:
        ycrcb = cv2.cvtColor(image, cv2.COLOR_BGR2YCrCb)
        ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
        return cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
    else:
        return cv2.equalizeHist(image)

def detect_edges_canny(image, low=50, high=150):
    """Detect edges using Canny"""
    gray = convert_to_grayscale(image) if len(image.shape) == 3 else image
    return cv2.Canny(gray, low, high)

def split_channels(image):
    """Split image into RGB channels"""
    if len(image.shape) == 3:
        b, g, r = cv2.split(image)
        return {'blue': b, 'green': g, 'red': r}
    return {'gray': image}

def geometric_transform(image, rotation=0, flip=None):
    """Apply geometric transformations"""
    result = image.copy()
    
    if rotation != 0:
        height, width = result.shape[:2]
        center = (width // 2, height // 2)
        matrix = cv2.getRotationMatrix2D(center, rotation, 1.0)
        result = cv2.warpAffine(result, matrix, (width, height))
    
    if flip == 'horizontal':
        result = cv2.flip(result, 1)
    elif flip == 'vertical':
        result = cv2.flip(result, 0)
    elif flip == 'both':
        result = cv2.flip(result, -1)
    
    return result

def detect_roi(image):
    """Detect regions of interest (contours and faces)"""
    result = image.copy()
    gray = convert_to_grayscale(image)
    
    # Detect contours
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Draw largest contours
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        cv2.rectangle(result, (x, y), (x + w, y + h), (255, 182, 193), 2)
    
    return result

def apply_beautify(image):
    """Apply soft beautification filter"""
    # Bilateral filter for smoothing while preserving edges
    smooth = cv2.bilateralFilter(image, 9, 75, 75)
    
    # Increase brightness slightly
    hsv = cv2.cvtColor(smooth, cv2.COLOR_BGR2HSV)
    hsv[:, :, 2] = cv2.add(hsv[:, :, 2], 15)
    result = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    
    return result

def flower_sketch_mode(image, intensity=1):
    """Convert edges into floral artistic strokes with pink/purple colors"""
    # Convert to grayscale
    gray = convert_to_grayscale(image)
    
    # Create a white canvas
    canvas = np.ones_like(image) * 255
    
    # Detect edges with multiple thresholds for variety
    edges1 = cv2.Canny(gray, 30, 100)
    edges2 = cv2.Canny(gray, 50, 150)
    edges3 = cv2.Canny(gray, 70, 200)
    
    # Define floral colors (pink and purple palette)
    colors = [
        (242, 209, 209),  # Rose poudré (BGR)
        (200, 162, 200),  # Lavande (BGR)
        (193, 182, 255),  # Rose-violet (BGR)
        (228, 176, 255),  # Rose clair (BGR)
        (180, 130, 230),  # Violet doux (BGR)
    ]
    
    # Apply artistic strokes with different edge intensities
    edge_layers = [edges1, edges2, edges3]
    
    for idx, edges in enumerate(edge_layers):
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            if cv2.contourArea(contour) > 10:  # Filter small noise
                # Choose color based on contour size
                color_idx = int(cv2.contourArea(contour) / 100) % len(colors)
                color = colors[color_idx]
                
                # Vary thickness based on layer and intensity
                thickness = max(1, int((3 - idx) * intensity))
                
                # Draw with slight randomness for hand-drawn effect
                if len(contour) > 5:
                    # Smooth contour
                    epsilon = 0.01 * cv2.arcLength(contour, True)
                    approx = cv2.approxPolyDP(contour, epsilon, True)
                    cv2.drawContours(canvas, [approx], -1, color, thickness, cv2.LINE_AA)
    
    # Add subtle texture overlay
    noise = np.random.normal(0, 3, canvas.shape).astype(np.uint8)
    canvas = cv2.add(canvas, noise)
    
    # Slight blur for softer appearance
    canvas = cv2.GaussianBlur(canvas, (3, 3), 0)
    
    return canvas

def generate_histogram(image):
    """Generate histogram data"""
    if len(image.shape) == 3:
        colors = ('b', 'g', 'r')
        hist_data = {}
        for i, color in enumerate(colors):
            hist = cv2.calcHist([image], [i], None, [256], [0, 256])
            hist_data[color] = hist.flatten().tolist()
        return hist_data
    else:
        hist = cv2.calcHist([image], [0], None, [256], [0, 256])
        return {'gray': hist.flatten().tolist()}

# API Endpoints
@app.route('/upload', methods=['POST'])
def upload_image():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'Oops 😔 aucune image n\'a été envoyée.'}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({'error': 'Oops 😔 aucune image sélectionnée.'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Oops 😔 ce fichier n\'est pas une image valide.'}), 400
        
        # Read image
        file_bytes = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        
        if image is None:
            return jsonify({'error': 'Oops 😔 impossible de lire cette image.'}), 400
        
        # Generate unique ID
        image_id = str(uuid.uuid4())
        
        # Store original image
        image_store[image_id] = {
            'original': image_to_base64(image),
            'current': image_to_base64(image),
            'filename': secure_filename(file.filename),
            'shape': image.shape,
            'uploaded_at': datetime.now().isoformat()
        }
        
        history_store[image_id] = []
        
        return jsonify({
            'success': True,
            'image_id': image_id,
            'filename': secure_filename(file.filename),
            'dimensions': {'width': image.shape[1], 'height': image.shape[0]},
            'channels': image.shape[2] if len(image.shape) == 3 else 1,
            'image': image_to_base64(image)
        })
    
    except Exception as e:
        return jsonify({'error': f'Erreur lors du téléchargement: {str(e)}'}), 500

@app.route('/process', methods=['POST'])
def process_image():
    try:
        data = request.json
        image_id = data.get('image_id')
        operation = data.get('operation')
        params = data.get('params', {})
        
        if image_id not in image_store:
            return jsonify({'error': 'Image non trouvée'}), 404
        
        # Get current image
        current_base64 = image_store[image_id]['current']
        image = base64_to_image(current_base64)
        
        # Save to history before processing
        history_store[image_id].append(current_base64)
        
        # Apply operation
        if operation == 'grayscale':
            result = convert_to_grayscale(image)
        elif operation == 'threshold':
            result = apply_threshold(image, params.get('value', 127))
        elif operation == 'adaptive_threshold':
            result = apply_adaptive_threshold(image, params.get('block_size', 11), params.get('c', 2))
        elif operation == 'blur':
            result = apply_gaussian_blur(image, params.get('intensity', 5))
        elif operation == 'resize':
            result = resize_image(image, params.get('width', 500), params.get('height', 500))
        elif operation == 'normalize':
            result = normalize_image(image)
        elif operation == 'equalize':
            result = equalize_histogram(image)
        elif operation == 'canny':
            result = detect_edges_canny(image, params.get('low', 50), params.get('high', 150))
        elif operation == 'rotate':
            result = geometric_transform(image, params.get('angle', 0))
        elif operation == 'flip':
            result = geometric_transform(image, 0, params.get('direction', 'horizontal'))
        elif operation == 'roi':
            result = detect_roi(image)
        elif operation == 'beautify':
            result = apply_beautify(image)
        elif operation == 'flower_sketch':
            result = flower_sketch_mode(image, params.get('intensity', 1))
        else:
            return jsonify({'error': 'Opération non reconnue'}), 400
        
        # Update current image
        result_base64 = image_to_base64(result)
        image_store[image_id]['current'] = result_base64
        
        return jsonify({
            'success': True,
            'image': result_base64,
            'operation': operation,
            'dimensions': {'width': result.shape[1], 'height': result.shape[0]}
        })
    
    except Exception as e:
        return jsonify({'error': f'Erreur lors du traitement: {str(e)}'}), 500

@app.route('/histogram', methods=['POST'])
def get_histogram():
    try:
        data = request.json
        image_id = data.get('image_id')
        
        if image_id not in image_store:
            return jsonify({'error': 'Image non trouvée'}), 404
        
        current_base64 = image_store[image_id]['current']
        image = base64_to_image(current_base64)
        
        hist_data = generate_histogram(image)
        
        return jsonify({
            'success': True,
            'histogram': hist_data
        })
    
    except Exception as e:
        return jsonify({'error': f'Erreur lors du calcul de l\'histogramme: {str(e)}'}), 500

@app.route('/undo', methods=['POST'])
def undo_operation():
    try:
        data = request.json
        image_id = data.get('image_id')
        
        if image_id not in image_store:
            return jsonify({'error': 'Image non trouvée'}), 404
        
        if not history_store[image_id]:
            return jsonify({'error': 'Aucune action à annuler'}), 400
        
        # Restore previous state
        previous = history_store[image_id].pop()
        image_store[image_id]['current'] = previous
        
        return jsonify({
            'success': True,
            'image': previous
        })
    
    except Exception as e:
        return jsonify({'error': f'Erreur lors de l\'annulation: {str(e)}'}), 500

@app.route('/reset', methods=['POST'])
def reset_image():
    try:
        data = request.json
        image_id = data.get('image_id')
        
        if image_id not in image_store:
            return jsonify({'error': 'Image non trouvée'}), 404
        
        # Reset to original
        original = image_store[image_id]['original']
        image_store[image_id]['current'] = original
        history_store[image_id] = []
        
        return jsonify({
            'success': True,
            'image': original
        })
    
    except Exception as e:
        return jsonify({'error': f'Erreur lors de la réinitialisation: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)