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
      
      const duration = processingSteps[i].duration;
      const frames = 40;
      const increment = (100 / processingSteps.length) / frames;
      
      for (let frame = 0; frame < frames; frame++) {
        await new Promise(resolve => setTimeout(resolve, duration / frames));
        setProgress(stepProgress + (frame + 1) * increment);
      }
    }
    
    const mockResults = {
      timestamp: new Date().toISOString(),
      studyId: "ECHO-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      videoMetrics: {
        duration: "12.3 seconds",
        frameRate: "30 fps",
        resolution: "1920x1080",
        quality: "High Definition"
      },
      chambersAnalysis: {
        leftVentricle: {
          ejectionFraction: { value: 58, unit: "%", range: "55-70", status: "normal" },
          endDiastolicVolume: { value: 142, unit: "mL", range: "120-160", status: "normal" },
          endSystolicVolume: { value: 59, unit: "mL", range: "40-70", status: "normal" },
          wallMotion: "Normal"
        },
        leftAtrium: {
          volume: { value: 54, unit: "mL", range: "22-58", status: "normal" },
          diameter: { value: 3.8, unit: "cm", range: "2.7-4.0", status: "normal" }
        },
        rightVentricle: {
          function: "Normal",
          systolicPressure: { value: 28, unit: "mmHg", range: "15-30", status: "normal" }
        },
        aorticRoot: {
          diameter: { value: 3.2, unit: "cm", range: "2.0-3.7", status: "normal" }
        }
      },
      valvularAssessment: {
        mitralValve: { function: "Normal", regurgitation: "Trace", stenosis: "None" },
        aorticValve: { function: "Normal", regurgitation: "None", stenosis: "None" },
        tricuspidValve: { function: "Normal", regurgitation: "Mild", stenosis: "None" },
        pulmonaryValve: { function: "Normal", regurgitation: "None", stenosis: "None" }
      },
      diastolicFunction: {
        grade: "Normal (Grade I)",
        eWaveVelocity: { value: 0.78, unit: "m/s", status: "normal" },
        aWaveVelocity: { value: 0.65, unit: "m/s", status: "normal" },
        eaRatio: { value: 1.2, unit: "", status: "normal" }
      },
      overallAssessment: {
        diagnosis: "Normal Echocardiogram",
        classification: "NORMAL",
        confidence: 94.2,
        riskLevel: "Low"
      },
      recommendations: [
        "Cardiac function within normal limits",
        "Continue routine cardiovascular health maintenance",
        "No immediate follow-up echocardiography required",
        "Regular exercise and heart-healthy diet recommended"
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
                <h1 className="text-3xl font-bold">EchoVision Analysis Platform</h1>
                <p className="text-purple-100 mt-1">Advanced echocardiogram video analysis powered by AI</p>
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
                    <p className="text-gray-600">Upload your ECHO video for comprehensive cardiac chamber and valve analysis</p>
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
                          accept=".mp4,.avi,.mov,.wmv,.dicom"
                          onChange={handleFileInput}
                        />
                      </label>
                      
                      <div className="mt-6 text-sm text-gray-500 space-y-1">
                        <p className="font-medium">Supported formats:</p>
                        <p>MP4, AVI, MOV, WMV, DICOM</p>
                        <p className="text-xs">Maximum file size: 500MB • Recommended: 1080p or higher</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Panel */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Heart className="w-5 h-5 mr-2 text-purple-600" />
                    Analysis Features
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Chamber Analysis</p>
                        <p className="text-sm text-gray-600">Comprehensive cardiac chamber assessment</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Valve Function</p>
                        <p className="text-sm text-gray-600">Detailed valvular assessment and grading</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Motion Analysis</p>
                        <p className="text-sm text-gray-600">Wall motion and ejection fraction calculation</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <Brain className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-bold text-purple-900">AI-Powered Video Analysis</h3>
                  </div>
                  <p className="text-purple-800 text-sm">
                    Our advanced AI algorithms analyze echocardiogram videos frame by frame, providing 
                    accurate measurements and assessments with 94%+ confidence rates.
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
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-7 h-7 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Echocardiogram Analysis Complete</h2>
                      <p className="text-gray-600">Study ID: {results.studyId}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p className="font-medium">Analyzed: {new Date(results.timestamp).toLocaleString()}</p>
                    <p>Video: {results.videoMetrics.duration} • {results.videoMetrics.quality}</p>
                  </div>
                </div>
              </div>

              {/* Overall Assessment */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Overall Assessment</h3>
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div>
                    <h4 className="text-2xl font-bold text-green-800 mb-1">{results.overallAssessment.diagnosis}</h4>
                    <p className="text-green-700 font-medium">Classification: {results.overallAssessment.classification}</p>
                    <p className="text-green-600 font-medium mt-1">Risk Level: {results.overallAssessment.riskLevel}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-700">{results.overallAssessment.confidence}%</div>
                    <div className="text-green-600 font-medium">Confidence</div>
                  </div>
                </div>
              </div>

              {/* Left Ventricle Analysis */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Left Ventricular Function</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <h4 className="font-bold text-gray-900 mb-2">Ejection Fraction</h4>
                    <div className="text-3xl font-bold text-blue-700 mb-1">{results.chambersAnalysis.leftVentricle.ejectionFraction.value}%</div>
                    <div className="text-sm text-blue-600">Normal: {results.chambersAnalysis.leftVentricle.ejectionFraction.range}</div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                    <h4 className="font-bold text-gray-900 mb-2">EDV</h4>
                    <div className="text-3xl font-bold text-indigo-700 mb-1">{results.chambersAnalysis.leftVentricle.endDiastolicVolume.value}</div>
                    <div className="text-sm text-indigo-600">{results.chambersAnalysis.leftVentricle.endDiastolicVolume.unit}</div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <h4 className="font-bold text-gray-900 mb-2">ESV</h4>
                    <div className="text-3xl font-bold text-purple-700 mb-1">{results.chambersAnalysis.leftVentricle.endSystolicVolume.value}</div>
                    <div className="text-sm text-purple-600">{results.chambersAnalysis.leftVentricle.endSystolicVolume.unit}</div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-200">
                    <h4 className="font-bold text-gray-900 mb-2">Wall Motion</h4>
                    <div className="text-xl font-bold text-pink-700 mb-1">{results.chambersAnalysis.leftVentricle.wallMotion}</div>
                    <div className="text-sm text-pink-600">Assessment</div>
                  </div>
                </div>
              </div>

              {/* Valvular Assessment */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Valvular Assessment</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(results.valvularAssessment).map(([valve, assessment]) => (
                    <div key={valve} className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
                      <h4 className="font-bold text-gray-900 mb-4 capitalize">
                        {valve.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Function:</span>
                          <span className="font-bold text-green-600">{assessment.function}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Regurgitation:</span>
                          <span className="font-bold">{assessment.regurgitation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Stenosis:</span>
                          <span className="font-bold">{assessment.stenosis}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diastolic Function */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Diastolic Function Analysis</h3>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-200">
                    <h4 className="font-bold text-gray-900 mb-2">Grade</h4>
                    <div className="text-lg font-bold text-teal-700">{results.diastolicFunction.grade}</div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-cyan-50 to-sky-50 rounded-xl border border-cyan-200">
                    <h4 className="font-bold text-gray-900 mb-2">E Wave</h4>
                    <div className="text-2xl font-bold text-cyan-700 mb-1">{results.diastolicFunction.eWaveVelocity.value}</div>
                    <div className="text-sm text-cyan-600">{results.diastolicFunction.eWaveVelocity.unit}</div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl border border-sky-200">
                    <h4 className="font-bold text-gray-900 mb-2">A Wave</h4>
                    <div className="text-2xl font-bold text-sky-700 mb-1">{results.diastolicFunction.aWaveVelocity.value}</div>
                    <div className="text-sm text-sky-600">{results.diastolicFunction.aWaveVelocity.unit}</div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <h4 className="font-bold text-gray-900 mb-2">E/A Ratio</h4>
                    <div className="text-2xl font-bold text-blue-700 mb-1">{results.diastolicFunction.eaRatio.value}</div>
                    <div className="text-sm text-blue-600">Ratio</div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Clinical Recommendations</h3>
                <div className="space-y-4">
                  {results.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-bold text-green-800">{index + 1}</span>
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