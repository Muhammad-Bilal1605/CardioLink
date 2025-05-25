import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, Activity, CheckCircle, AlertCircle, Heart, Download, RotateCcw, Zap, Clock, TrendingUp, Menu, User, Bell } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuthStore } from '../../store/authStore';

const ECGAnalyzer = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processingStep, setProcessingStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuthStore();

  const processingSteps = [
    { label: "Initializing Analysis", icon: Zap, duration: 800 },
    { label: "Reading ECG Data", icon: FileText, duration: 1200 },
    { label: "Signal Processing", icon: Activity, duration: 1500 },
    { label: "Pattern Recognition", icon: TrendingUp, duration: 1000 },
    { label: "Generating Report", icon: CheckCircle, duration: 600 }
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
    setUploadedFile(file);
    setResults(null);
    processFile(file);
  };

  const processFile = async (file) => {
    setIsProcessing(true);
    setProcessingStep(0);
    setProgress(0);
    
    for (let i = 0; i < processingSteps.length; i++) {
      setProcessingStep(i);
      const stepProgress = (i / processingSteps.length) * 100;
      
      // Animate progress for this step
      const duration = processingSteps[i].duration;
      const frames = 30;
      const increment = (100 / processingSteps.length) / frames;
      
      for (let frame = 0; frame < frames; frame++) {
        await new Promise(resolve => setTimeout(resolve, duration / frames));
        setProgress(stepProgress + (frame + 1) * increment);
      }
    }
    
    // Generate comprehensive mock results
    const mockResults = {
      timestamp: new Date().toISOString(),
      patientId: "ECG-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      diagnosis: {
        primary: "Normal Sinus Rhythm",
        classification: "NORMAL",
        confidence: 96.8
      },
      measurements: {
        heartRate: { value: 74, unit: "bpm", range: "60-100", status: "normal" },
        prInterval: { value: 142, unit: "ms", range: "120-200", status: "normal" },
        qrsDuration: { value: 88, unit: "ms", range: "80-120", status: "normal" },
        qtInterval: { value: 398, unit: "ms", range: "350-450", status: "normal" },
        qtcInterval: { value: 412, unit: "ms", range: "<450", status: "normal" }
      },
      rhythm: {
        type: "Sinus Rhythm",
        regularity: "Regular",
        rate: "Normal"
      },
      abnormalities: [],
      riskScore: {
        overall: "Low",
        cardiovascular: 12,
        arrhythmic: 8
      },
      recommendations: [
        "Continue regular cardiac monitoring as part of routine healthcare",
        "No immediate medical intervention required",
        "Maintain healthy lifestyle and exercise routine"
      ]
    };
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setResults(mockResults);
    setIsProcessing(false);
  };

  const resetAnalysis = () => {
    setUploadedFile(null);
    setResults(null);
    setIsProcessing(false);
    setProcessingStep(0);
    setProgress(0);
  };

  const CurrentStepIcon = processingSteps[processingStep]?.icon || Activity;

  return (
    <DashboardLayout title="ECG Analysis" role={user?.role}>
      <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">ECG Analysis Platform</h1>
                <p className="text-blue-100 mt-1">Advanced cardiac rhythm analysis powered by AI</p>
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
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload ECG Recording</h2>
                    <p className="text-gray-600">Select your ECG file for professional cardiac rhythm analysis</p>
                  </div>
                  
                  <div
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                      dragActive 
                        ? 'border-blue-400 bg-blue-50 scale-105' 
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-4">
                      <Upload className="w-16 h-16 text-gray-400 mx-auto" />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Drop ECG file here</h3>
                        <p className="text-gray-500 mb-6">or click to browse from your device</p>
                      </div>
                      
                      <label className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        <Upload className="w-5 h-5 mr-3" />
                        Select ECG File
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg,.dcm,.xml"
                          onChange={handleFileInput}
                        />
                      </label>
                      
                      <div className="mt-6 text-sm text-gray-500 space-y-1">
                        <p className="font-medium">Supported formats:</p>
                        <p>PDF, PNG, JPG, JPEG, DICOM, XML</p>
                        <p className="text-xs">Maximum file size: 10MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Panel */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-600" />
                    Analysis Features
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Rhythm Analysis</p>
                        <p className="text-sm text-gray-600">Comprehensive cardiac rhythm assessment</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Interval Measurements</p>
                        <p className="text-sm text-gray-600">Precise PR, QRS, QT interval analysis</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Risk Assessment</p>
                        <p className="text-sm text-gray-600">AI-powered cardiovascular risk evaluation</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-bold text-green-900">AI-Powered Analysis</h3>
                  </div>
                  <p className="text-green-800 text-sm">
                    Our advanced AI algorithms provide accurate ECG interpretation with 96%+ confidence rates, 
                    helping healthcare professionals make informed decisions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Processing Section */}
          {isProcessing && (
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                {/* File Info */}
                <div className="flex items-center space-x-4 mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="bg-blue-600 p-3 rounded-xl">
                    <FileText className="w-8 h-8 text-white" />
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
                    {/* Animated Circle */}
                    <div className="relative w-32 h-32 mx-auto">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-gray-200"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                          className="text-blue-600 transition-all duration-300 ease-out"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CurrentStepIcon className="w-10 h-10 text-blue-600" />
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
                    
                    {/* Progress Bar */}
                    <div className="max-w-md mx-auto">
                      <div className="bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
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
                    <div className="flex justify-center space-x-4 mt-8 flex-wrap">
                      {processingSteps.map((step, index) => {
                        const StepIcon = step.icon;
                        return (
                          <div key={index} className="flex flex-col items-center space-y-2 p-2">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                              index < processingStep ? 'bg-green-100 text-green-600 scale-110' :
                              index === processingStep ? 'bg-blue-100 text-blue-600 animate-pulse scale-110' :
                              'bg-gray-100 text-gray-400'
                            }`}>
                              {index < processingStep ? (
                                <CheckCircle className="w-6 h-6" />
                              ) : (
                                <StepIcon className="w-6 h-6" />
                              )}
                            </div>
                            <span className={`text-xs font-medium text-center ${
                              index <= processingStep ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                              Step {index + 1}
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
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Analysis Complete</h2>
                      <p className="text-gray-600">Report ID: {results.patientId}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p className="font-medium">Analyzed: {new Date(results.timestamp).toLocaleString()}</p>
                    <p>Processing time: 4.2 seconds</p>
                  </div>
                </div>
              </div>

              {/* Primary Diagnosis */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Primary Diagnosis</h3>
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div>
                    <h4 className="text-2xl font-bold text-green-800 mb-1">{results.diagnosis.primary}</h4>
                    <p className="text-green-700 font-medium">Classification: {results.diagnosis.classification}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-700">{results.diagnosis.confidence}%</div>
                    <div className="text-green-600 font-medium">Confidence</div>
                  </div>
                </div>
              </div>

              {/* Measurements Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(results.measurements).map(([key, measurement]) => (
                  <div key={key} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                    <h4 className="font-bold text-gray-900 mb-4 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <div className="flex items-baseline space-x-2 mb-3">
                      <span className="text-3xl font-bold text-gray-900">{measurement.value}</span>
                      <span className="text-gray-600 font-medium">{measurement.unit}</span>
                    </div>
                    <div className="space-y-2">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                        measurement.status === 'normal' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {measurement.status.toUpperCase()}
                      </div>
                      <p className="text-sm text-gray-600">Normal range: {measurement.range}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Risk Assessment */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Risk Assessment</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="text-3xl font-bold text-green-700 mb-2">LOW</div>
                    <div className="text-green-600 font-medium">Overall Risk</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="text-3xl font-bold text-blue-700 mb-2">{results.riskScore.cardiovascular}</div>
                    <div className="text-blue-600 font-medium">CV Risk Score</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                    <div className="text-3xl font-bold text-purple-700 mb-2">{results.riskScore.arrhythmic}</div>
                    <div className="text-purple-600 font-medium">Arrhythmic Risk</div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Clinical Recommendations</h3>
                <div className="space-y-4">
                  {results.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-bold text-amber-800">{index + 1}</span>
                      </div>
                      <p className="text-gray-800 font-medium">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button className="flex-1 flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <Download className="w-5 h-5 mr-3" />
                  Download Full Report
                </button>
                <button 
                  onClick={resetAnalysis}
                  className="flex-1 flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <RotateCcw className="w-5 h-5 mr-3" />
                  Analyze New File
                </button>
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

export default ECGAnalyzer;