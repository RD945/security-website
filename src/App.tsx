import React, { useEffect, useState, useRef } from 'react';
import { Shield, AlertTriangle, Eye, Clock, Lock } from 'lucide-react';

interface SecurityEvent {
  id: number;
  type: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
}

function App() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const eventIdRef = useRef(0);

  const addSecurityEvent = (type: string, message: string, severity: 'low' | 'medium' | 'high') => {
    if (!isMonitoring) return;
    
    const event: SecurityEvent = {
      id: eventIdRef.current++,
      type,
      message,
      timestamp: new Date(),
      severity
    };
    
    setSecurityEvents(prev => [event, ...prev.slice(0, 9)]);
    setViolations(prev => prev + 1);
    
    // Show notification
    if (Notification.permission === 'granted') {
      new Notification('Security Alert!', {
        body: message,
        icon: '/vite.svg'
      });
    }

    // Lock system after too many violations
    if (violations >= 5) {
      setIsLocked(true);
    }
  };

  useEffect(() => {
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Session timer
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);

    // Page Visibility API - detects tab switching
    const handleVisibilityChange = () => {
      if (document.hidden && isMonitoring) {
        addSecurityEvent('TAB_SWITCH', 'User switched to another tab or minimized window', 'high');
      }
    };

    // Window focus/blur detection
    const handleWindowBlur = () => {
      if (isMonitoring) {
        addSecurityEvent('FOCUS_LOSS', 'Window lost focus - user may have switched applications', 'high');
      }
    };

    const handleWindowFocus = () => {
      if (isMonitoring) {
        addSecurityEvent('FOCUS_RETURN', 'Window regained focus', 'low');
      }
    };

    // Mouse leave detection
    const handleMouseLeave = () => {
      if (isMonitoring) {
        addSecurityEvent('MOUSE_LEAVE', 'Mouse cursor left the browser window', 'medium');
      }
    };

    // Right-click prevention
    const handleContextMenu = (e: Event) => {
      if (isMonitoring) {
        e.preventDefault();
        addSecurityEvent('RIGHT_CLICK', 'Attempted to open context menu', 'medium');
      }
    };

    // Copy/paste prevention
    const handleCopy = (e: Event) => {
      if (isMonitoring) {
        e.preventDefault();
        addSecurityEvent('COPY_ATTEMPT', 'Attempted to copy content', 'medium');
      }
    };

    const handlePaste = (e: Event) => {
      if (isMonitoring) {
        e.preventDefault();
        addSecurityEvent('PASTE_ATTEMPT', 'Attempted to paste content', 'medium');
      }
    };

    // Keyboard shortcuts prevention
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMonitoring) return;
      
      // Prevent common shortcuts
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 's' || e.key === 'p')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.key === 'u') ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        addSecurityEvent('KEYBOARD_SHORTCUT', `Blocked keyboard shortcut: ${e.key}`, 'medium');
      }
    };

    // Developer tools detection
    const detectDevTools = () => {
      if (!isMonitoring) return;
      
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        addSecurityEvent('DEV_TOOLS', 'Developer tools may be open', 'high');
      }
    };

    // Fullscreen detection
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!document.fullscreenElement;
      setIsFullscreen(isFullscreenNow);
      
      if (!isFullscreenNow && isMonitoring) {
        addSecurityEvent('FULLSCREEN_EXIT', 'Exited fullscreen mode', 'high');
      }
    };

    // Before unload detection
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isMonitoring) {
        e.preventDefault();
        addSecurityEvent('PAGE_LEAVE_ATTEMPT', 'Attempted to leave the page', 'high');
        return 'Are you sure you want to leave? This action will be logged.';
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Dev tools detection interval
    const devToolsInterval = setInterval(detectDevTools, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(devToolsInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [violations, isMonitoring]);

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen();
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    addSecurityEvent('MONITORING_START', 'Security monitoring activated', 'low');
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    addSecurityEvent('MONITORING_STOP', 'Security monitoring deactivated', 'low');
  };

  const resetSession = () => {
    setIsLocked(false);
    setViolations(0);
    setSecurityEvents([]);
    setIsMonitoring(false);
    setSessionTime(0);
    eventIdRef.current = 0;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-red-600 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-md">
          <Lock className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-4">Session Locked</h1>
          <p className="text-gray-700 mb-4">
            Too many security violations detected. This session has been terminated for security reasons.
          </p>
          <p className="text-sm text-gray-500 mb-6">Contact your administrator to unlock.</p>
          <button
            onClick={resetSession}
            className="bg-blue-600 hover:bg-blue-700 transition-colors px-6 py-3 rounded-lg font-medium text-white flex items-center space-x-2 mx-auto"
          >
            <Shield className="w-4 h-4" />
            <span>Reset Session</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur border-b border-white/10 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">Secure Exam Environment</h1>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>{formatTime(sessionTime)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span>{violations} violations</span>
            </div>
            <div className={`flex items-center space-x-2 ${isFullscreen ? 'text-green-400' : 'text-red-400'}`}>
              <Eye className="w-4 h-4" />
              <span>{isFullscreen ? 'Fullscreen' : 'Not Fullscreen'}</span>
            </div>
            <div className={`flex items-center space-x-2 ${isMonitoring ? 'text-green-400' : 'text-gray-400'}`}>
              <Shield className="w-4 h-4" />
              <span>{isMonitoring ? 'Monitoring' : 'Not Monitoring'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-black/20 backdrop-blur rounded-lg p-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4">Security Controls</h2>
              <div className="flex items-center space-x-4">
                {!isMonitoring ? (
                  <button
                    onClick={startMonitoring}
                    className="bg-green-600 hover:bg-green-700 transition-colors px-6 py-2 rounded-lg font-medium flex items-center space-x-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Start Monitoring</span>
                  </button>
                ) : (
                  <button
                    onClick={stopMonitoring}
                    className="bg-red-600 hover:bg-red-700 transition-colors px-6 py-2 rounded-lg font-medium flex items-center space-x-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Stop Monitoring</span>
                  </button>
                )}
                <div className={`px-3 py-1 rounded-full text-sm ${isMonitoring ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}>
                  {isMonitoring ? 'Active' : 'Inactive'}
                </div>
              </div>
              <p className="text-gray-300 text-sm mt-3">
                {isMonitoring 
                  ? 'Security monitoring is active. All activities are being tracked.'
                  : 'Click "Start Monitoring" to begin tracking security events.'
                }
              </p>
            </div>

            <div className="bg-black/20 backdrop-blur rounded-lg p-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4">Exam Instructions</h2>
              <div className="space-y-3 text-gray-300">
                <p>• Click "Start Monitoring" to begin the secure exam session</p>
                <p>• You are now in a secure exam environment</p>
                <p>• All activities are being monitored and logged</p>
                <p>• Do not switch tabs, minimize the window, or leave this page</p>
                <p>• Right-click, copy/paste, and keyboard shortcuts are disabled</p>
                <p>• Fullscreen mode is recommended for security</p>
              </div>
              
              {!isFullscreen && (
                <button
                  onClick={enterFullscreen}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-2 rounded-lg font-medium"
                >
                  Enter Fullscreen Mode
                </button>
              )}
            </div>

            <div className="bg-black/20 backdrop-blur rounded-lg p-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4">Sample Exam Content</h2>
              <div className="space-y-4">
                <div className="p-4 bg-white/10 rounded-lg">
                  <h3 className="font-medium mb-2">Question 1:</h3>
                  <p className="text-gray-300 mb-3">What is the capital of France?</p>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="q1" className="text-blue-600" />
                      <span>London</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="q1" className="text-blue-600" />
                      <span>Berlin</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="q1" className="text-blue-600" />
                      <span>Paris</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="radio" name="q1" className="text-blue-600" />
                      <span>Madrid</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Monitor */}
          <div className="space-y-6">
            <div className="bg-black/20 backdrop-blur rounded-lg p-4 border border-white/10">
              <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span>Security Monitor</span>
              </h3>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {securityEvents.length === 0 ? (
                  <p className="text-gray-400 text-sm">No security events detected</p>
                ) : (
                  securityEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg border text-sm ${getSeverityColor(event.severity)}`}
                    >
                      <div className="font-medium">{event.type.replace('_', ' ')}</div>
                      <div className="text-xs opacity-80 mt-1">{event.message}</div>
                      <div className="text-xs opacity-60 mt-1">
                        {event.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur rounded-lg p-4 border border-white/10">
              <h3 className="text-lg font-semibold mb-3">Security Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Page Visibility:</span>
                  <span className={document.hidden ? 'text-red-400' : 'text-green-400'}>
                    {document.hidden ? 'Hidden' : 'Visible'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Window Focus:</span>
                  <span className={document.hasFocus() ? 'text-green-400' : 'text-red-400'}>
                    {document.hasFocus() ? 'Focused' : 'Not Focused'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Fullscreen:</span>
                  <span className={isFullscreen ? 'text-green-400' : 'text-yellow-400'}>
                    {isFullscreen ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Violations:</span>
                  <span className={violations > 3 ? 'text-red-400' : violations > 0 ? 'text-yellow-400' : 'text-green-400'}>
                    {violations}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Monitoring Status:</span>
                  <span className={isMonitoring ? 'text-green-400' : 'text-gray-400'}>
                    {isMonitoring ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;