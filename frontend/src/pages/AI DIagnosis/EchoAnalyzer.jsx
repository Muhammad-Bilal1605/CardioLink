import React, { useState, useCallback } from 'react';
import { Upload, Play, Heart, CheckCircle, AlertCircle, Download, RotateCcw, Video, Zap, Brain, TrendingUp, Camera } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuthStore } from '../../store/authStore';

const EchoAnalyzer = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileError, setFileError] = useState(null);
  const { user } = useAuthStore();

  const processingSteps = [
    { label: "Video Preprocessing", icon: Video, duration: 1000 },
    { label: "Frame Extraction", icon: Camera, duration: 1500 },
    { label: "Cardiac Chamber Detection", icon: Heart, duration: 2000 },
    { label: "Motion Analysis", icon: TrendingUp, duration: 1800 },
    { label: "AI Interpretation", icon: Brain, duration: 1200 },
    { label: "Report Generation", icon: CheckCircle, duration: 500 }
  ];

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    setFileError(null);
    const isAvi = file.type === 'video/x-msvideo' || file.name.toLowerCase().endsWith('.avi');
    if (!isAvi) {
      setUploadedFile(null);
      setResults(null);
      setFileError('Please upload an AVI video (.avi) for ECHO analysis.');
      return;
    }
    setUploadedFile(file);
    setResults(null);
    processFile(file);
  };

  const processFile = async (file) => {
    setIsProcessing(true);
    setProcessingStep(0);
    setProgress(0);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('video', file);
      
      // Start the progress animation
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 3;
          if (newProgress >= 95) {
            clearInterval(progressInterval);
            return 95; // Cap at 95% until we get results
          }
          return newProgress;
        });
        
        // Update processing step based on progress
        setProcessingStep(prevStep => {
          const currentProgress = progress;
          const stepIndex = Math.floor((currentProgress / 100) * processingSteps.length);
          return Math.min(stepIndex, processingSteps.length - 1);
        });
      }, 300);
      
      // Make API call to backend
      const response = await fetch('http://localhost:5000/api/echo/analyze', {
        method: 'POST',
        body: formData,
        headers: {
          'x-upload-start': new Date().toISOString()
        }
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          throw new Error(`Server error: ${response.status} - ${response.statusText}`);
        }
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }
      
      // Complete progress and set final step
      setProgress(100);
      setProcessingStep(processingSteps.length - 1);
      
      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set results from AI analysis
      setResults(result);
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Echo analysis error:', error);
      
      // Clear progress animation
      setIsProcessing(false);
      setProgress(0);
      setProcessingStep(0);
      
      // Create error result
      const errorResult = {
        error: true,
        timestamp: new Date().toISOString(),
        studyId: "ERROR-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        errorMessage: error.message,
        errorDetails: error.message.includes('Python') ? 
          'The AI analysis service is currently unavailable. Please ensure the Python API server is running.' :
          'There was an error processing your echocardiogram video.',
        recommendations: [
          'Please check that the Python AI service is running',
          'Verify the video file is a valid echocardiogram',
          'Try uploading a different video file',
          'Contact support if the issue persists'
        ]
      };
      
      setResults(errorResult);
    }
  };

  const resetAnalysis = () => {
    setUploadedFile(null);
    setResults(null);
    setIsProcessing(false);
    setProcessingStep(0);
    setProgress(0);
  };

  const CurrentStepIcon = processingSteps[processingStep]?.icon || Video;

  return (
    <DashboardLayout title="ECHO Analysis" role={user?.role}>
      <div className="min-h-full bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
          <div className="px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">AI Ejection Fraction Calculator</h1>
                <p className="text-purple-100 mt-1">AI-powered Left Ventricular Ejection Fraction analysis from echocardiogram videos</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Upload Section */}
          {!uploadedFile && !isProcessing && !results && (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Upload Area */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 h-full">
                  <div className="text-center mb-8">
                    <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="w-8 h-8 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Echocardiogram Video</h2>
                    <p className="text-gray-600">Upload your ECHO video for AI-powered Ejection Fraction calculation</p>
                  </div>
                  
                  <div
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                      dragActive 
                        ? 'border-purple-400 bg-purple-50 scale-105' 
                        : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-4">
                      <Play className="w-16 h-16 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Drop ECHO video here</h3>
                        <p className="text-gray-500 mb-6">or click to browse from your device</p>
                      </div>
                      
                      <label className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        <Upload className="w-5 h-5 mr-3" />
                        Select ECHO Video
                        <input
                          type="file"
                          className="hidden"
                          accept=".avi,video/x-msvideo"
                          onChange={handleFileInput}
                        />
                      </label>
                      
                      <div className="mt-6 text-sm text-gray-500 space-y-1">
                        <p className="font-medium">Supported formats:</p>
                        <p>AVI</p>
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
                    <Heart className="w-5 h-5 mr-2 text-purple-600" />
                    AI Analysis Features
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Ejection Fraction</p>
                        <p className="text-sm text-gray-600">AI-powered EF calculation from video analysis</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Clinical Classification</p>
                        <p className="text-sm text-gray-600">Automated heart failure category assessment</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Risk Assessment</p>
                        <p className="text-sm text-gray-600">Clinical risk level based on EF values</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <Brain className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-bold text-purple-900">AI-Powered EF Analysis</h3>
                  </div>
                  <p className="text-purple-800 text-sm">
                    Our enhanced R(2+1)D ResNet model analyzes echocardiogram videos frame by frame to calculate 
                    Left Ventricular Ejection Fraction with high accuracy and clinical reliability.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Processing Section */}
          {isProcessing && (
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                {/* File Info */}
                <div className="flex items-center space-x-4 mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                  <div className="bg-purple-600 p-3 rounded-xl">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{uploadedFile.name}</h3>
                    <p className="text-gray-600">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Processing Animation */}
                <div className="text-center">
                  <div className="relative mb-8">
                    <div className="relative w-36 h-36 mx-auto">
                      <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="5" fill="none" className="text-gray-200" />
                        <circle
                          cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="5" fill="none"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
                          className="text-purple-600 transition-all duration-300 ease-out"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CurrentStepIcon className="w-12 h-12 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        {processingSteps[processingStep]?.label}
                      </h3>
                      <p className="text-gray-600">
                        Processing step {processingStep + 1} of {processingSteps.length}
                      </p>
                    </div>
                    
                    <div className="max-w-lg mx-auto">
                      <div className="bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 mt-2">
                        <span>0%</span>
                        <span className="font-bold">{Math.round(progress)}%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Processing Steps */}
                    <div className="grid grid-cols-6 gap-4 mt-8 max-w-3xl mx-auto">
                      {processingSteps.map((step, index) => {
                        const StepIcon = step.icon;
                        return (
                          <div key={index} className="flex flex-col items-center space-y-2">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                              index < processingStep ? 'bg-green-100 text-green-600 scale-110' :
                              index === processingStep ? 'bg-purple-100 text-purple-600 animate-pulse scale-110' :
                              'bg-gray-100 text-gray-400'
                            }`}>
                              {index < processingStep ? (
                                <CheckCircle className="w-7 h-7" />
                              ) : (
                                <StepIcon className="w-7 h-7" />
                              )}
                            </div>
                            <span className={`text-xs font-medium text-center ${
                              index <= processingStep ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {results && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      results.error ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {results.error ? (
                        <AlertCircle className="w-7 h-7 text-red-600" />
                      ) : (
                        <CheckCircle className="w-7 h-7 text-green-600" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {results.error ? 'Analysis Error' : 'Echocardiogram Analysis Complete'}
                      </h2>
                      <p className="text-gray-600">Study ID: {results.studyId}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p className="font-medium">Analyzed: {new Date(results.timestamp).toLocaleString()}</p>
                    {results.videoMetrics && (
                      <p>Video: {results.videoMetrics.duration} • {results.videoMetrics.quality}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {results.error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                  <div className="flex items-start space-x-4">
                    <AlertCircle className="w-8 h-8 text-red-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-red-900 mb-2">Analysis Failed</h3>
                      <p className="text-red-800 mb-4">{results.errorDetails}</p>
                      <div className="bg-white rounded-xl p-4 border border-red-200">
                        <h4 className="font-semibold text-red-900 mb-2">Error Details:</h4>
                        <p className="text-red-700 text-sm">{results.errorMessage}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show recommendations for errors too */}
              {results.error && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Troubleshooting Steps</h3>
                  <div className="space-y-4">
                    {results.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-blue-800">{index + 1}</span>
                        </div>
                        <p className="text-gray-800 font-medium">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Results - Only show if no error */}
              {!results.error && (
                <>
                  {/* AI Ejection Fraction Analysis */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">AI Ejection Fraction Analysis</h3>
                    
                    {/* Main EF Result */}
                    <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 mb-6">
                      <div className="text-center">
                        <h4 className="text-2xl font-bold text-gray-900 mb-4">Left Ventricular Ejection Fraction</h4>
                        <div className="text-6xl font-bold text-blue-700 mb-2">{results.aiAnalysis.ejectionFraction.value}%</div>
                        <div className="text-lg text-blue-600 mb-4">Normal range: {results.aiAnalysis.ejectionFraction.range}</div>
                        
                        {/* Status Badge */}
                        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                          results.aiAnalysis.ejectionFraction.status === 'normal' ? 'bg-green-100 text-green-800' :
                          results.aiAnalysis.ejectionFraction.status === 'mildly_reduced' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {results.aiAnalysis.ejectionFraction.status === 'normal' ? 'Normal' :
                           results.aiAnalysis.ejectionFraction.status === 'mildly_reduced' ? 'Mildly Reduced' :
                           'Reduced'}
                        </div>
                      </div>
                    </div>

                    {/* Clinical Classification */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                        <h4 className="font-bold text-gray-900 mb-2">Clinical Category</h4>
                        <div className="text-xl font-bold text-purple-700 mb-1">{results.aiAnalysis.category}</div>
                        <div className="text-sm text-purple-600">{results.aiAnalysis.description}</div>
                      </div>
                      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <h4 className="font-bold text-gray-900 mb-2">AI Confidence</h4>
                        <div className="text-xl font-bold text-green-700 mb-1">{results.aiAnalysis.confidence}%</div>
                        <div className="text-sm text-green-600">Analysis reliability</div>
                      </div>
                    </div>

                    {/* Severity Assessment */}
                    <div className={`p-6 rounded-xl border-2 ${
                      results.aiAnalysis.severity === 'low' ? 'bg-green-50 border-green-200' :
                      results.aiAnalysis.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 mb-1">Risk Assessment</h4>
                          <p className={`font-medium ${
                            results.aiAnalysis.severity === 'low' ? 'text-green-700' :
                            results.aiAnalysis.severity === 'medium' ? 'text-yellow-700' :
                            'text-red-700'
                          }`}>
                            {results.aiAnalysis.severity === 'low' ? 'Low Risk' :
                             results.aiAnalysis.severity === 'medium' ? 'Medium Risk' :
                             'High Risk'}
                          </p>
                        </div>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          results.aiAnalysis.severity === 'low' ? 'bg-green-100' :
                          results.aiAnalysis.severity === 'medium' ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}>
                          {results.aiAnalysis.severity === 'low' ? (
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          ) : results.aiAnalysis.severity === 'medium' ? (
                            <AlertCircle className="w-8 h-8 text-yellow-600" />
                          ) : (
                            <AlertCircle className="w-8 h-8 text-red-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Recommendations */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Clinical Recommendations</h3>
                    <div className="space-y-4">
                      {results.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-sm font-bold text-blue-800">{index + 1}</span>
                          </div>
                          <p className="text-gray-800 font-medium">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button className="flex-1 flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      <Download className="w-5 h-5 mr-3" />
                      Download ECHO Report
                    </button>
                    <button 
                      onClick={resetAnalysis}
                      className="flex-1 flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <RotateCcw className="w-5 h-5 mr-3" />
                      Analyze New Video
                    </button>
                  </div>
                </>
              )}

              {/* Action Buttons for Error State */}
              {results.error && (
                <div className="flex space-x-4">
                  <button 
                    onClick={resetAnalysis}
                    className="flex-1 flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <RotateCcw className="w-5 h-5 mr-3" />
                    Try Again
                  </button>
                </div>
              )}
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

export default EchoAnalyzer;