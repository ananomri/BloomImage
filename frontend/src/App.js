import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sliders, Sparkles, RotateCw, Scissors, BarChart3, Undo2, Download, Eye, EyeOff, Flower2, Leaf } from 'lucide-react';

const BloomImage = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [imageId, setImageId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const fileInputRef = useRef(null);

  const API_URL = 'http://localhost:5000';

  const categories = [
    {
      id: 'conversion',
      name: 'Conversion',
      icon: '🖼️',
      operations: [
        { id: 'grayscale', name: 'Niveaux de gris', params: [] }
      ]
    },
    {
      id: 'filtrage',
      name: 'Filtrage',
      icon: '✨',
      operations: [
        { id: 'blur', name: 'Flou Gaussien', params: [{ name: 'intensity', label: 'Intensité', type: 'slider', min: 1, max: 15, step: 2, default: 5 }] },
        { id: 'beautify', name: '💝 Mode Beautify', params: [] }
      ]
    },
    {
      id: 'artistic',
      name: '🌺 Art Floral',
      icon: '🎨',
      operations: [
        { id: 'flower_sketch', name: '🌸 Flower Sketch Mode', params: [
          { name: 'intensity', label: 'Intensité des traits', type: 'slider', min: 1, max: 3, default: 1 }
        ]}
      ]
    },
    {
      id: 'seuillage',
      name: 'Seuillage',
      icon: '🎚️',
      operations: [
        { id: 'threshold', name: 'Seuillage binaire', params: [{ name: 'value', label: 'Seuil', type: 'slider', min: 0, max: 255, default: 127 }] },
        { id: 'adaptive_threshold', name: 'Seuillage adaptatif', params: [
          { name: 'block_size', label: 'Taille bloc', type: 'number', min: 3, max: 51, step: 2, default: 11 },
          { name: 'c', label: 'Constante', type: 'number', min: 0, max: 20, default: 2 }
        ]}
      ]
    },
    {
      id: 'transformations',
      name: 'Transformations',
      icon: '🔄',
      operations: [
        { id: 'rotate', name: 'Rotation', params: [{ name: 'angle', label: 'Angle', type: 'slider', min: -180, max: 180, default: 0 }] },
        { id: 'flip', name: 'Retournement', params: [
          { name: 'direction', label: 'Direction', type: 'select', options: ['horizontal', 'vertical', 'both'], default: 'horizontal' }
        ]}
      ]
    },
    {
      id: 'histogramme',
      name: 'Histogramme',
      icon: '📊',
      operations: [
        { id: 'equalize', name: 'Égalisation', params: [] },
        { id: 'normalize', name: 'Normalisation', params: [] }
      ]
    },
    {
      id: 'edges',
      name: 'Détection Contours',
      icon: '✂️',
      operations: [
        { id: 'canny', name: 'Canny', params: [
          { name: 'low', label: 'Seuil bas', type: 'slider', min: 0, max: 200, default: 50 },
          { name: 'high', label: 'Seuil haut', type: 'slider', min: 0, max: 300, default: 150 }
        ]},
        { id: 'roi', name: 'ROI Detection', params: [] }
      ]
    }
  ];

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setImageId(data.image_id);
        setUploadedImage(`data:image/png;base64,${data.image}`);
        setProcessedImage(`data:image/png;base64,${data.image}`);
        setCurrentPage('workspace');
      } else {
        setError(data.error || 'Erreur lors du téléchargement');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur 🍃');
    } finally {
      setLoading(false);
    }
  };

  const applyOperation = async (operationId, params = {}) => {
    if (!imageId) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_id: imageId,
          operation: operationId,
          params: params
        })
      });

      const data = await response.json();

      if (response.ok) {
        setProcessedImage(`data:image/png;base64,${data.image}`);
      } else {
        setError(data.error || 'Erreur lors du traitement');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur 🍃');
    } finally {
      setLoading(false);
    }
  };

  const undoOperation = async () => {
    if (!imageId) return;

    try {
      const response = await fetch(`${API_URL}/undo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: imageId })
      });

      const data = await response.json();

      if (response.ok) {
        setProcessedImage(`data:image/png;base64,${data.image}`);
      }
    } catch (err) {
      console.error('Erreur undo:', err);
    }
  };

  const resetImage = async () => {
    if (!imageId) return;

    try {
      const response = await fetch(`${API_URL}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: imageId })
      });

      const data = await response.json();

      if (response.ok) {
        setProcessedImage(`data:image/png;base64,${data.image}`);
        setActiveCategory(null);
      }
    } catch (err) {
      console.error('Erreur reset:', err);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'bloomimage_processed.png';
    link.click();
  };

  const OperationPanel = ({ operation }) => {
    const [params, setParams] = useState({});

    useEffect(() => {
      const defaults = {};
      operation.params.forEach(param => {
        defaults[param.name] = param.default;
      });
      setParams(defaults);
    }, [operation]);

    const handleParamChange = (name, value) => {
      setParams(prev => ({ ...prev, [name]: value }));
    };

    return (
      <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-2xl p-6 shadow-lg border border-emerald-200/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Leaf className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-emerald-800">{operation.name}</h3>
        </div>
        
        {operation.params.map(param => (
          <div key={param.name} className="mb-4">
            <label className="block text-sm font-medium text-emerald-700 mb-2">
              {param.label}
            </label>
            
            {param.type === 'slider' && (
              <div>
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step || 1}
                  value={params[param.name] || param.default}
                  onChange={(e) => handleParamChange(param.name, parseInt(e.target.value))}
                  className="w-full h-2 bg-emerald-100 rounded-lg cursor-pointer accent-emerald-600"
                />
                <span className="text-sm text-emerald-600 font-medium">{params[param.name] || param.default}</span>
              </div>
            )}
            
            {param.type === 'number' && (
              <input
                type="number"
                min={param.min}
                max={param.max}
                step={param.step || 1}
                value={params[param.name] || param.default}
                onChange={(e) => handleParamChange(param.name, parseInt(e.target.value))}
                className="w-full px-4 py-2 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none bg-white/80"
              />
            )}
            
            {param.type === 'select' && (
              <select
                value={params[param.name] || param.default}
                onChange={(e) => handleParamChange(param.name, e.target.value)}
                className="w-full px-4 py-2 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:outline-none bg-white/80"
              >
                {param.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
          </div>
        ))}

        <button
          onClick={() => applyOperation(operation.id, params)}
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 rounded-xl font-medium hover:from-emerald-600 hover:to-green-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? 'Traitement...' : 'Appliquer'}
        </button>
      </div>
    );
  };

  if (currentPage === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
        {/* Arabesque Pattern Background */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0c16.569 0 30 13.431 30 30 0 16.569-13.431 30-30 30C13.431 60 0 46.569 0 30 0 13.431 13.431 0 30 0zm0 10c-11.046 0-20 8.954-20 20s8.954 20 20 20 20-8.954 20-20-8.954-20-20-20z' fill='%23059669' fill-opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>

        <div className="max-w-5xl mx-auto px-6 py-16 relative z-10">
          {/* Header with Bismillah */}
          <div className="text-center mb-12 animate-fadeIn">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Flower2 className="w-8 h-8 text-emerald-600 animate-pulse" />
              <p className="text-xl text-emerald-700 font-serif italic">بِسْمِ ٱللَّٰهِ</p>
              <Leaf className="w-8 h-8 text-green-600 animate-pulse" />
            </div>
            
            <h1 className="text-7xl font-bold mb-3 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent" style={{ fontFamily: 'Georgia, serif' }}>
              BloomImage
            </h1>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) {
                const event = { target: { files: [file] } };
                handleFileSelect(event);
              }
            }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-20 border-4 border-dashed border-emerald-300 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all shadow-2xl relative overflow-hidden group"
          >
            {/* Decorative corner flowers */}
            <div className="absolute top-4 left-4 text-4xl opacity-20 group-hover:opacity-40 transition-opacity">🌸</div>
            <div className="absolute top-4 right-4 text-4xl opacity-20 group-hover:opacity-40 transition-opacity">🌿</div>
            <div className="absolute bottom-4 left-4 text-4xl opacity-20 group-hover:opacity-40 transition-opacity">🍃</div>
            <div className="absolute bottom-4 right-4 text-4xl opacity-20 group-hover:opacity-40 transition-opacity">🌺</div>
            
            <div className="text-center relative z-10">
              <Upload className="w-24 h-24 mx-auto mb-6 text-emerald-500 group-hover:scale-110 transition-transform" />
              <h2 className="text-3xl font-semibold text-emerald-800 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                Glissez votre image ici
              </h2>
              <p className="text-gray-600 text-lg mb-2">ou cliquez pour sélectionner</p>
              <p className="text-sm text-emerald-600 mt-4 font-medium">PNG, JPG, JPEG, BMP, TIFF • Max 20MB</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {error && (
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl text-red-700 text-center shadow-md">
              {error}
            </div>
          )}

          {loading && (
            <div className="mt-8 text-center">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600"></div>
              <p className="mt-4 text-emerald-700 font-medium text-lg">Chargement en douceur...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative">
      {/* Subtle Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0c16.569 0 30 13.431 30 30 0 16.569-13.431 30-30 30C13.431 60 0 46.569 0 30 0 13.431 13.431 0 30 0zm0 10c-11.046 0-20 8.954-20 20s8.954 20 20 20 20-8.954 20-20-8.954-20-20-20z' fill='%23059669' fill-opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }}></div>

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-md border-b border-emerald-200 relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flower2 className="w-8 h-8 text-emerald-600" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent" style={{ fontFamily: 'Georgia, serif' }}>
                  BloomImage
                </h1>
                <p className="text-xs text-emerald-600 italic">بِسْمِ ٱللَّٰهِ</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-all shadow-sm font-medium"
              >
                {showComparison ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showComparison ? 'Masquer' : 'Comparer'}
              </button>
              
              <button
                onClick={undoOperation}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-100 text-teal-700 rounded-xl hover:bg-teal-200 transition-all shadow-sm font-medium"
              >
                <Undo2 className="w-4 h-4" />
                Annuler
              </button>
              
              <button
                onClick={resetImage}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all shadow-sm font-medium"
              >
                Réinitialiser
              </button>
              
              <button
                onClick={downloadImage}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all shadow-md font-medium"
              >
                <Download className="w-4 h-4" />
                Télécharger
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6 relative z-10">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-5 sticky top-8 border border-emerald-100">
            <div className="flex items-center gap-2 mb-5">
              <Leaf className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide">Outils</h3>
            </div>
            
            {categories.map(category => (
              <div key={category.id} className="mb-2">
                <button
                  onClick={() => setActiveCategory(activeCategory === category.id ? null : category.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg scale-105'
                      : 'text-emerald-800 hover:bg-emerald-50 border border-transparent hover:border-emerald-200'
                  }`}
                >
                  <span className="text-xl">{category.icon}</span>
                  <span>{category.name}</span>
                </button>
                
                {activeCategory === category.id && (
                  <div className="mt-2 ml-6 space-y-1 animate-fadeIn">
                    {category.operations.map(op => (
                      <button
                        key={op.id}
                        onClick={() => {
                          if (op.params.length === 0) {
                            applyOperation(op.id);
                          }
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all border border-transparent hover:border-emerald-200"
                      >
                        {op.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl text-red-700 shadow-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Image Display */}
            <div className="lg:col-span-2">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-emerald-100">
                {showComparison ? (
                  <div className="relative">
                    <div className="relative overflow-hidden rounded-xl shadow-inner bg-gradient-to-br from-emerald-50 to-green-50" style={{ height: '500px' }}>
                      <div className="absolute inset-0">
                        <img src={uploadedImage} alt="Original" className="w-full h-full object-contain" />
                      </div>
                      <div
                        className="absolute inset-0"
                        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                      >
                        <img src={processedImage} alt="Processed" className="w-full h-full object-contain" />
                      </div>
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-green-600 cursor-ew-resize z-10 shadow-lg"
                        style={{ left: `${sliderPosition}%` }}
                        onMouseDown={(e) => {
                          const container = e.currentTarget.parentElement;
                          
                          const handleMouseMove = (moveEvent) => {
                            const rect = container.getBoundingClientRect();
                            const newPos = ((moveEvent.clientX - rect.left) / rect.width) * 100;
                            setSliderPosition(Math.max(0, Math.min(100, newPos)));
                          };
                          
                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
                        }}
                      >
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl border-2 border-emerald-500 flex items-center justify-center">
                          <Leaf className="w-5 h-5 text-emerald-600" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-4 text-sm text-emerald-700 font-medium">
                      <span className="flex items-center gap-1">
                        <Flower2 className="w-4 h-4" />
                        Original
                      </span>
                      <span className="flex items-center gap-1">
                        Traité
                        <Sparkles className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden shadow-inner bg-gradient-to-br from-emerald-50 to-green-50" style={{ height: '500px' }}>
                    <img
                      src={processedImage}
                      alt="Image"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Controls Panel */}
            <div className="space-y-6">
              {activeCategory && categories.find(c => c.id === activeCategory)?.operations.map(operation => (
                operation.params.length > 0 && (
                  <OperationPanel key={operation.id} operation={operation} />
                )
              ))}
              
              {!activeCategory && (
                <div className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl p-10 shadow-xl text-center border border-emerald-100">
                  <Flower2 className="w-20 h-20 mx-auto mb-4 text-emerald-400 animate-pulse" />
                  <h3 className="text-xl font-semibold text-emerald-800 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                    Sélectionnez un outil
                  </h3>
                  <p className="text-emerald-600 text-sm italic">
                    Choisissez une catégorie dans le menu de gauche pour commencer votre création
                  </p>
                  <div className="mt-6 flex justify-center gap-2 text-2xl opacity-40">
                    <span>🌿</span>
                    <span>🌸</span>
                    <span>🍃</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BloomImage;