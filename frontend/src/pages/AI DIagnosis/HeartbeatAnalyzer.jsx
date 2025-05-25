import React, { useState } from 'react';
import { Upload, FileAudio, Heart, CheckCircle, AlertCircle, Loader2, AudioWaveform, Music, Volume2 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuthStore } from '../../store/authStore';

const HeartbeatAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [processingStage, setProcessingStage] = useState('idle'); // idle, uploading, accessing, processing, complete
  const [results, setResults] = useState(null);
  const { user } = useAuthStore();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (uploadedFile) => {
    const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/x-wav'];
    if (!validTypes.includes(uploadedFile.type)) {
      alert('Please upload a valid audio file (WAV, MP3)');
      return;
    }
    
    setFile(uploadedFile);
    startProcessing(uploadedFile);
  };

  const startProcessing = async (uploadedFile) => {
    setProcessingStage('uploading');
    
    // Simulate upload
    await new Promise(resolve => setTimeout(resolve, 1500));
    setProcessingStage('accessing');
    
    // Simulate accessing audio
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessingStage('processing');
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock results
    const mockResults = {
      condition: Math.random() > 0.5 ? 'Normal' : 'Abnormal',
      confidence: Math.floor(Math.random() * 20) + 80,
      bpm: Math.floor(Math.random() * 40) + 60,
      details: Math.random() > 0.5 ? 
        'Regular heart rhythm detected. No significant abnormalities found.' :
        'Irregular heart rhythm detected. Recommend consultation with a cardiologist.',
      timestamp: new Date().toLocaleString(),
      audioMetrics: {
        duration: "45.2 seconds",
        sampleRate: "44.1 kHz",
        quality: "High Quality",
        format: "WAV"
      },
      analysis: {
        rhythmType: Math.random() > 0.5 ? 'Sinus Rhythm' : 'Irregular Rhythm',
        murmurDetected: Math.random() > 0.7 ? 'Yes' : 'No',
        s1s2Clarity: Math.random() > 0.3 ? 'Clear' : 'Muffled',
        backgroundNoise: Math.random() > 0.6 ? 'Minimal' : 'Moderate'
      }
    };
    
    setResults(mockResults);
    setProcessingStage('complete');
  };

  const resetAnalysis = () => {
    setFile(null);
    setProcessingStage('idle');
    setResults(null);
  };

  const getProcessingMessage = () => {
    switch (processingStage) {
      case 'uploading':
        return 'Uploading audio file...';
      case 'accessing':
        return 'Accessing and loading audio data...';
      case 'processing':
        return 'Processing heartbeat patterns...';
      default:
        return '';
    }
  };

  const getProgressPercentage = () => {
    switch (processingStage) {
      case 'uploading':
        return 25;
      case 'accessing':
        return 50;
      case 'processing':
        return 75;
      case 'complete':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <DashboardLayout title="Heartbeat Analysis" role={user?.role}>
      <div className="min-h-full bg-gradient-to-br from-red-50 via-white to-pink-50">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-red-600 to-pink-700 text-white">
          <div className="px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Heartbeat Analysis Platform</h1>
                <p className="text-red-100 mt-1">Advanced cardiac audio analysis powered by AI</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          {processingStage === 'idle' && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Upload Area */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 h-full">
                  <div className="text-center mb-8">
                    <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileAudio className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Heartbeat Audio File</h2>
                    <p className="text-gray-600">Upload your heartbeat recording for professional analysis and diagnosis</p>
                  </div>
                  
                  <div
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                      dragActive 
                        ? 'border-red-400 bg-red-50 scale-105' 
                        : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-4">
                      <Upload className="w-16 h-16 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Drop heartbeat audio here</h3>
                        <p className="text-gray-500 mb-6">or click to browse from your device</p>
                      </div>
                      
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept="audio/*"
                        onChange={handleChange}
                      />
                      <label
                        htmlFor="file-upload"
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <FileAudio className="w-5 h-5 mr-3" />
                        Choose Audio File
                      </label>
                      
                      <div className="mt-6 text-sm text-gray-500 space-y-1">
                        <p className="font-medium">Supported formats:</p>
                        <p>WAV, MP3 (Max size: 50MB)</p>
                        <p className="text-xs">Recommended: Clear recording, minimal background noise</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Panel */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <AudioWaveform className="w-5 h-5 mr-2 text-red-600" />
                    Analysis Features
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Rhythm Detection</p>
                        <p className="text-sm text-gray-600">Identify regular and irregular heartbeats</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-pink-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Murmur Analysis</p>
                        <p className="text-sm text-gray-600">Detect heart murmurs and abnormal sounds</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Rate Calculation</p>
                        <p className="text-sm text-gray-600">Accurate heart rate measurement</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border border-red-200 p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <Music className="w-6 h-6 text-red-600" />
                    <h3 className="text-lg font-bold text-red-900">AI Audio Analysis</h3>
                  </div>
                  <p className="text-red-800 text-sm">
                    Our advanced AI algorithms analyze heartbeat audio patterns to detect irregularities, 
                    murmurs, and other cardiac abnormalities with high accuracy.
                  </p>
                </div>
              </div>
            </div>
          )}

          {(processingStage === 'uploading' || processingStage === 'accessing' || processingStage === 'processing') && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                {/* File Info */}
                <div className="flex items-center space-x-4 mb-8 p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                  <div className="bg-red-600 p-3 rounded-xl">
                    <FileAudio className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{file.name}</h3>
                    <p className="text-gray-600">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="mb-8">
                    <div className="relative w-32 h-32 mx-auto mb-6">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-200" />
                        <circle
                          cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" fill="none"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - getProgressPercentage() / 100)}`}
                          className="text-red-600 transition-all duration-1000 ease-out"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {getProcessingMessage()}
                      </h3>
                      <p className="text-gray-600">
                        Analyzing heartbeat patterns and audio characteristics
                      </p>
                    </div>
                    
                    <div className="max-w-md mx-auto">
                      <div className="bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-red-600 to-pink-600 h-3 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${getProgressPercentage()}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 mt-2">
                        <span>0%</span>
                        <span className="font-bold">{getProgressPercentage()}%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Processing Steps */}
                    <div className="flex justify-center space-x-8 mt-8">
                      {['Upload', 'Access', 'Process'].map((step, index) => (
                        <div key={step} className="flex flex-col items-center space-y-2">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                            index < ['uploading', 'accessing', 'processing'].indexOf(processingStage) ? 'bg-green-100 text-green-600 scale-110' :
                            ['uploading', 'accessing', 'processing'][index] === processingStage ? 'bg-red-100 text-red-600 animate-pulse scale-110' :
                            'bg-gray-100 text-gray-400'
                          }`}>
                            {index < ['uploading', 'accessing', 'processing'].indexOf(processingStage) ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : (
                              <div className="w-3 h-3 bg-current rounded-full" />
                            )}
                          </div>
                          <span className={`text-sm font-medium ${
                            index <= ['uploading', 'accessing', 'processing'].indexOf(processingStage) ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {processingStage === 'complete' && results && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Heartbeat Analysis Complete</h2>
                      <p className="text-gray-600">Audio processed successfully</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p className="font-medium">Analyzed: {results.timestamp}</p>
                    <p>Audio: {results.audioMetrics.duration} • {results.audioMetrics.quality}</p>
                  </div>
                </div>
              </div>

              {/* Primary Results */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <Heart className="w-6 h-6 mr-2 text-red-600" />
                    Diagnosis
                  </h3>
                  <div className={`p-6 rounded-xl border-2 ${
                    results.condition === 'Normal' 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                      : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                  }`}>
                    <div className={`text-3xl font-bold mb-2 ${
                      results.condition === 'Normal' ? 'text-green-700' : 'text-amber-700'
                    }`}>
                      {results.condition}
                    </div>
                    <div className="text-gray-600 font-medium mb-2">
                      Confidence: {results.confidence}%
                    </div>
                    <div className="text-sm text-gray-600">
                      Rhythm: {results.analysis.rhythmType}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <AudioWaveform className="w-6 h-6 mr-2 text-blue-600" />
                    Heart Rate
                  </h3>
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="text-3xl font-bold text-blue-700 mb-2">
                      {results.bpm} BPM
                    </div>
                    <div className="text-blue-600 font-medium mb-2">
                      Beats per minute
                    </div>
                    <div className="text-sm text-blue-600">
                      S1/S2 Clarity: {results.analysis.s1s2Clarity}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Analysis */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Detailed Audio Analysis</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                    <h4 className="font-bold text-gray-900 mb-2">Rhythm Type</h4>
                    <div className="text-lg font-bold text-purple-700">{results.analysis.rhythmType}</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-200">
                    <h4 className="font-bold text-gray-900 mb-2">Murmur Detected</h4>
                    <div className="text-lg font-bold text-pink-700">{results.analysis.murmurDetected}</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <h4 className="font-bold text-gray-900 mb-2">Sound Clarity</h4>
                    <div className="text-lg font-bold text-green-700">{results.analysis.s1s2Clarity}</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
                    <h4 className="font-bold text-gray-900 mb-2">Background Noise</h4>
                    <div className="text-lg font-bold text-amber-700">{results.analysis.backgroundNoise}</div>
                  </div>
                </div>
              </div>

              {/* Analysis Details */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <AlertCircle className="w-6 h-6 mr-2 text-blue-600" />
                  Analysis Details
                </h3>
                <div className={`p-6 rounded-xl border ${
                  results.condition === 'Normal' 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
                    : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                }`}>
                  <p className="text-gray-800 font-medium leading-relaxed mb-4">
                    {results.details}
                  </p>
                  <div className="text-sm text-gray-600">
                    <p><strong>Audio Quality:</strong> {results.audioMetrics.quality}</p>
                    <p><strong>Sample Rate:</strong> {results.audioMetrics.sampleRate}</p>
                    <p><strong>Duration:</strong> {results.audioMetrics.duration}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button className="flex-1 flex items-center justify-center px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <Volume2 className="w-5 h-5 mr-3" />
                  Download Audio Report
                </button>
                <button 
                  onClick={resetAnalysis}
                  className="flex-1 flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Upload className="w-5 h-5 mr-3" />
                  Analyze Another File
                </button>
              </div>

              {/* Disclaimer */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6">
                <p className="text-sm text-yellow-800">
                  <strong>Medical Disclaimer:</strong> This analysis is for informational purposes only. 
                  Please consult with a qualified healthcare professional for proper medical diagnosis and treatment.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 mt-12">
          <div className="px-6 py-4">
            <p className="text-center text-sm text-gray-500">
              For demonstration purposes only. This analysis should not replace professional medical consultation.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HeartbeatAnalyzer;