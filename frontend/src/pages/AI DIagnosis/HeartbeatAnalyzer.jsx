import React, { useState } from 'react';
import { Upload, FileAudio, Heart, CheckCircle, AlertCircle, Loader2, AudioWaveform, Music, Download } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuthStore } from '../../store/authStore';
import jsPDF from 'jspdf';

const HeartbeatAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [processingStage, setProcessingStage] = useState('idle'); // idle, uploading, accessing, processing, complete
  const [results, setResults] = useState(null);
  const { user } = useAuthStore();
  const [fileError, setFileError] = useState(null);

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
    setFileError(null);
    const isWav = uploadedFile.type === 'audio/wav' || uploadedFile.type === 'audio/x-wav' || uploadedFile.name.toLowerCase().endsWith('.wav');
    if (!isWav) {
      setFile(null);
      setResults(null);
      setProcessingStage('idle');
      setFileError('Please upload a WAV audio file (.wav) for heartbeat analysis.');
      return;
    }
    setFile(uploadedFile);
    startProcessing(uploadedFile);
  };

  const getAudioMetadata = async (file) => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.src = url;
      
      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration;
        URL.revokeObjectURL(url);
        resolve({
          duration: duration ? `${duration.toFixed(1)} seconds` : "Unknown",
          sampleRate: "44.1 kHz", // Default, API doesn't return this
          quality: "High Quality",
          format: "WAV"
        });
      });
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url);
        resolve({
          duration: "Unknown",
          sampleRate: "44.1 kHz",
          quality: "High Quality",
          format: "WAV"
        });
      });
    });
  };

  const predictHeartbeat = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('http://localhost:5016/predict', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  };

  const startProcessing = async (uploadedFile) => {
    try {
      setFileError(null);
      setProcessingStage('uploading');
      
      // Get audio metadata
      const audioMetrics = await getAudioMetadata(uploadedFile);
      setProcessingStage('accessing');
      
      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      setProcessingStage('processing');
      
      // Call the API
      const apiResponse = await predictHeartbeat(uploadedFile);
      
      // Format results based on API response
      // API returns probability of "Abnormal" (0-1)
      const abnormalProbability = apiResponse.probability || 0;
      const prediction = apiResponse.prediction || 'Unknown';
      const isNormal = prediction === 'Normal';
      // Calculate confidence: if Normal, use (1 - prob), if Abnormal, use prob
      const confidence = Math.round((isNormal ? (1 - abnormalProbability) : abnormalProbability) * 100);
      
      // Medical advice based on prediction
      const advice = isNormal
        ? {
            message: 'Your heartbeat analysis shows normal results. However, if you experience any symptoms like chest pain, shortness of breath, dizziness, or irregular heartbeat, please consult with a healthcare professional immediately.',
            recommendations: [
              'Continue regular health checkups',
              'Maintain a healthy lifestyle with regular exercise',
              'Monitor your heart health regularly',
              'If you notice any changes or symptoms, seek medical attention'
            ]
          }
        : {
            message: 'Your heartbeat analysis indicates abnormal patterns. It is strongly recommended that you consult with a cardiologist or visit a hospital for a comprehensive evaluation.',
            recommendations: [
              'Schedule an appointment with a cardiologist as soon as possible',
              'If experiencing chest pain, shortness of breath, or severe symptoms, go to the emergency room immediately',
              'Avoid strenuous activities until evaluated by a healthcare professional',
              'Keep a record of any symptoms you experience',
              'Follow up with your primary care physician'
            ]
          };
      
      const results = {
        condition: prediction,
        confidence: confidence,
        timestamp: new Date().toLocaleString(),
        audioMetrics: audioMetrics,
        advice: advice
      };
      
      setResults(results);
      setProcessingStage('complete');
    } catch (error) {
      console.error('Error processing heartbeat:', error);
      setFileError(error.message || 'Failed to process heartbeat audio. Please try again.');
      setProcessingStage('idle');
      setFile(null);
      setResults(null);
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setProcessingStage('idle');
    setResults(null);
  };

  const generatePDFReport = () => {
    if (!results) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 20;
    const lineHeight = 7;
    const sectionSpacing = 10;

    // Colors
    const primaryColor = results.condition === 'Normal' ? [76, 175, 80] : [255, 152, 0];
    const bgColor = results.condition === 'Normal' ? [232, 245, 233] : [255, 243, 224];

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Heartbeat Analysis Report', margin, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${results.timestamp}`, margin, 35);

    yPosition = 50;

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Analysis Result Section
    doc.setFillColor(...bgColor);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 35, 3, 3, 'F');
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Analysis Result', margin + 5, yPosition + 10);
    
    doc.setFontSize(20);
    doc.setTextColor(...primaryColor);
    doc.text(results.condition, margin + 5, yPosition + 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Confidence: ${results.confidence}%`, margin + 5, yPosition + 28);

    yPosition += 45;

    // Audio File Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Audio File Information', margin, yPosition);
    yPosition += lineHeight;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Duration: ${results.audioMetrics.duration}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Format: ${results.audioMetrics.format}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Quality: ${results.audioMetrics.quality}`, margin, yPosition);
    yPosition += sectionSpacing;

    // Medical Advice Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Medical Advice', margin, yPosition);
    yPosition += lineHeight + 2;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const adviceLines = doc.splitTextToSize(results.advice.message, pageWidth - 2 * margin);
    doc.text(adviceLines, margin, yPosition);
    yPosition += (adviceLines.length * lineHeight) + sectionSpacing;

    // Recommendations
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Recommendations:', margin, yPosition);
    yPosition += lineHeight + 2;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    results.advice.recommendations.forEach((rec, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`• ${rec}`, margin + 5, yPosition);
      yPosition += lineHeight + 2;
    });

    yPosition += sectionSpacing;

    // Medical Disclaimer
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFillColor(255, 243, 224);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 25, 3, 3, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(184, 134, 11);
    doc.text('Medical Disclaimer', margin + 5, yPosition + 8);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const disclaimerText = 'This analysis is for informational purposes only. Please consult with a qualified healthcare professional for proper medical diagnosis and treatment. This report should not replace professional medical consultation.';
    const disclaimerLines = doc.splitTextToSize(disclaimerText, pageWidth - 2 * margin - 10);
    doc.text(disclaimerLines, margin + 5, yPosition + 15);

    // Footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${totalPages} | CardioLink - Heartbeat Analysis Platform`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Generate filename
    const filename = `Heartbeat_Analysis_${results.condition}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Save the PDF
    doc.save(filename);
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
                        accept=".wav,audio/wav,audio/x-wav"
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
                {fileError && (
                  <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{fileError}</div>
                )}
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
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Heart className="w-6 h-6 mr-2 text-red-600" />
                  Analysis Result
                </h3>
                <div className={`p-8 rounded-xl border-2 ${
                  results.condition === 'Normal' 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                    : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                }`}>
                  <div className="text-center">
                    <div className={`text-4xl font-bold mb-4 ${
                      results.condition === 'Normal' ? 'text-green-700' : 'text-amber-700'
                    }`}>
                      {results.condition}
                    </div>
                    <div className="text-gray-600 font-medium text-lg mb-6">
                      Confidence: {results.confidence}%
                    </div>
                    <div className="text-sm text-gray-500">
                      <p><strong>Audio Duration:</strong> {results.audioMetrics.duration}</p>
                      <p><strong>Format:</strong> {results.audioMetrics.format}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Advice */}
              <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-6 ${
                results.condition === 'Normal' 
                  ? 'border-green-200' 
                  : 'border-amber-200'
              }`}>
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <AlertCircle className={`w-6 h-6 mr-2 ${
                    results.condition === 'Normal' ? 'text-green-600' : 'text-amber-600'
                  }`} />
                  Medical Advice
                </h3>
                <div className={`p-6 rounded-xl border ${
                  results.condition === 'Normal' 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
                    : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                }`}>
                  <p className="text-gray-800 font-medium leading-relaxed mb-6 text-lg">
                    {results.advice.message}
                  </p>
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-900 mb-3">Recommendations:</h4>
                    <ul className="space-y-2">
                      {results.advice.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            results.condition === 'Normal' ? 'bg-blue-600' : 'bg-amber-600'
                          }`}></div>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <button 
                  onClick={generatePDFReport}
                  className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <Download className="w-5 h-5 mr-3" />
                  Download PDF Report
                </button>
                <button 
                  onClick={resetAnalysis}
                  className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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