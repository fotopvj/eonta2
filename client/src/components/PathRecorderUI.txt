import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Map, Timer, Mail, Download, Info } from 'lucide-react';

const PathRecorderUI = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [pointsRecorded, setPointsRecorded] = useState(0);
  const [recordingId, setRecordingId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const timerRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Path Recorder Service would be injected in a real implementation
  // For this demo, we'll simulate the behavior
  const startRecording = () => {
    setIsRecording(true);
    setRecordingDuration(0);
    setPointsRecorded(0);
    setError(null);
    
    // Start timer
    const startTime = Date.now();
    
    const updateTimer = () => {
      const elapsed = Date.now() - startTime;
      setRecordingDuration(elapsed);
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateTimer);
    
    // Simulate points being recorded
    timerRef.current = setInterval(() => {
      setPointsRecorded(prev => prev + 1);
    }, 3000);
    
    // Notify the user that recording has started
    setSuccess('Recording started! Walk through the installation to capture your journey.');
    setTimeout(() => setSuccess(null), 5000);
  };
  
  const stopRecording = () => {
    setIsRecording(false);
    
    // Clear timers
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // In a real implementation, this would call the path recorder service
    // For now, we'll simulate the response
    const newRecordingId = 'rec_' + Math.random().toString(36).substr(2, 9);
    setRecordingId(newRecordingId);
    setProcessingStatus('processing');
    
    // Show email form to send download link
    setShowEmailForm(true);
    
    // Simulate processing completion after a delay
    setTimeout(() => {
      setProcessingStatus('completed');
    }, 5000);
  };
  
  const sendDownloadEmail = () => {
    // Validate email
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // In a real implementation, this would call the API
    // For now, we'll simulate the response
    setError(null);
    setSuccess(`Download link sent to ${email}! Please check your inbox.`);
    setShowEmailForm(false);
    
    // Clear success message after a delay
    setTimeout(() => setSuccess(null), 5000);
  };
  
  // Format duration as MM:SS
  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };
  
  // Format state for display
  const getRecordingStatusText = () => {
    if (isRecording) {
      return 'Recording in progress...';
    }
    
    if (processingStatus === 'processing') {
      return 'Processing your recording...';
    }
    
    if (processingStatus === 'completed') {
      return 'Your composition is ready!';
    }
    
    return 'Ready to record';
  };
  
  useEffect(() => {
    // Clean up timers on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 max-w-md w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
          <Map size={20} className="mr-2 text-blue-500" />
          Path Recorder
        </h2>
        
        <button
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
          onClick={() => {/* Show help modal */}}
        >
          <Info size={18} />
        </button>
      </div>
      
      {/* Status */}
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 mb-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {getRecordingStatusText()}
        </p>
        
        {isRecording && (
          <div className="mt-2 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <Timer size={14} className="mr-1" />
                Duration
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white">
                {formatDuration(recordingDuration)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <Map size={14} className="mr-1" />
                GPS Points
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white">
                {pointsRecorded}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Email Form */}
      {showEmailForm && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
            Enter your email to receive a download link for your composition:
          </p>
          
          <div className="flex items-center">
            <input
              type="email"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={sendDownloadEmail}
            >
              <Mail size={16} />
            </button>
          </div>
          
          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              {error}
            </p>
          )}
        </div>
      )}
      