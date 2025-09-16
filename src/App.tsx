import { useEffect, useState, useRef } from 'react';
import { Shield, Lock, Play, RotateCcw, CheckCircle, XCircle, Timer, User, FileText, Code, Terminal } from 'lucide-react';

interface SecurityEvent {
  id: number;
  type: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
}

interface TestCase {
  id: number;
  input: string;
  expected: string;
  actual?: string;
  status?: 'pass' | 'fail' | 'pending';
  executionTime?: number;
}

function App() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [violations, setViolations] = useState(0);
  const [examTime, setExamTime] = useState(3600); // 60 minutes in seconds
  const [isLocked, setIsLocked] = useState(false);
  const [isMonitoring] = useState(true);
  const [code, setCode] = useState(`#include <iostream>
#include <vector>
using namespace std;

int findUnique(vector<int>& nums) {
    // Your code here
    
}

int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for(int i = 0; i < n; i++) {
        cin >> nums[i];
    }
    
    cout << findUnique(nums) << endl;
    return 0;
}`);
  const [selectedLanguage, setSelectedLanguage] = useState('cpp');
  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: 1,
      input: "5\n1 2 3 2 1",
      expected: "3",
      status: 'pending'
    },
    {
      id: 2,
      input: "11\n4 5 2 6 1 8 2 6 5 4 1",
      expected: "8",
      status: 'pending'
    }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
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
    
    setSecurityEvents(prev => [event, ...prev.slice(0, 4)]);
    setViolations(prev => prev + 1);
    
    // Show browser notification for security violations
    if (Notification.permission === 'granted') {
      new Notification('Security Violation Detected!', {
        body: message,
        icon: '/favicon.ico',
        tag: 'security-violation',
        requireInteraction: severity === 'high'
      });
    } else if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Security Violation Detected!', {
            body: message,
            icon: '/favicon.ico',
            tag: 'security-violation',
            requireInteraction: severity === 'high'
          });
        }
      });
    }
    
    // Show in-app notification toast
    showToastNotification(message, severity);
    
    if (violations >= 4) { // Lock after 5 violations (current + 4 previous)
      setIsLocked(true);
    }
  };

  const showToastNotification = (message: string, severity: 'low' | 'medium' | 'high') => {
    // Create toast notification element
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 transform translate-x-full ${
      severity === 'high' ? 'bg-red-50 border-red-500 text-red-800' :
      severity === 'medium' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' :
      'bg-blue-50 border-blue-500 text-blue-800'
    }`;
    
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div>
          <div class="font-medium">Security Alert</div>
          <div class="text-sm">${message}</div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-gray-400 hover:text-gray-600">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
      }, 300);
    }, 5000);
  };

  const restartTest = () => {
    setIsLocked(false);
    setViolations(0);
    setSecurityEvents([]);
    setExamTime(3600); // Reset to 60 minutes
    setShowResults(false);
    setTestCases(prev => prev.map(tc => ({ ...tc, actual: undefined, status: 'pending' })));
    eventIdRef.current = 0;
    
    // Clear any existing toast notifications
    const toasts = document.querySelectorAll('.fixed.top-4.right-4');
    toasts.forEach(toast => toast.remove());
    
    // Reset code to template
    setCode(`#include <iostream>
#include <vector>
using namespace std;

int findUnique(vector<int>& nums) {
    // Your code here
    
}

int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for(int i = 0; i < n; i++) {
        cin >> nums[i];
    }
    
    cout << findUnique(nums) << endl;
    return 0;
}`);
  };

  useEffect(() => {
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Exam timer
    const timer = setInterval(() => {
      setExamTime(prev => {
        if (prev <= 1) {
          setIsLocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Security monitoring (simplified for exam interface)
    const handleVisibilityChange = () => {
      if (document.hidden && isMonitoring) {
        addSecurityEvent('TAB_SWITCH', 'Switched tab during exam', 'high');
      }
    };

    const handleWindowBlur = () => {
      if (isMonitoring) {
        addSecurityEvent('FOCUS_LOSS', 'Window lost focus', 'medium');
      }
    };

    const handleContextMenu = (e: Event) => {
      if (isMonitoring) {
        e.preventDefault();
        addSecurityEvent('RIGHT_CLICK', 'Right-click attempted', 'medium');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMonitoring) return;
      
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        addSecurityEvent('BLOCKED_ACTION', `Blocked: ${e.key}`, 'medium');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [violations, isMonitoring]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const runCode = () => {
    setIsRunning(true);
    setShowResults(true);
    
    // Simulate code execution
    setTimeout(() => {
      const updatedTestCases = testCases.map(testCase => ({
        ...testCase,
        actual: testCase.expected, // Simulate correct output
        status: 'pass' as const,
        executionTime: Math.random() * 100 + 50 // Random execution time
      }));
      setTestCases(updatedTestCases);
      setIsRunning(false);
    }, 2000);
  };

  const clearCode = () => {
    setCode(`#include <iostream>
#include <vector>
using namespace std;

int findUnique(vector<int>& nums) {
    // Your code here
    
}

int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for(int i = 0; i < n; i++) {
        cin >> nums[i];
    }
    
    cout << findUnique(nums) << endl;
    return 0;
}`);
    setShowResults(false);
    setTestCases(prev => prev.map(tc => ({ ...tc, actual: undefined, status: 'pending' })));
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-red-600 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-2xl text-center max-w-md">
          <Lock className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-4">Exam Terminated</h1>
          <p className="text-gray-700 mb-4">
            {examTime <= 0 ? 
              'Time expired. Your exam session has ended.' : 
              `Too many security violations detected (${violations}/5). Your exam has been terminated for security reasons.`
            }
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">Security Summary:</h3>
            <ul className="text-sm text-red-700 space-y-1">
              {securityEvents.slice(0, 3).map((event, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>{event.message}</span>
                </li>
              ))}
              {securityEvents.length > 3 && (
                <li className="text-red-600 font-medium">
                  +{securityEvents.length - 3} more violations
                </li>
              )}
            </ul>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Contact your proctor if you believe this termination was in error.
          </p>
          <div className="flex flex-col space-y-3">
            <button
              onClick={restartTest}
              className="bg-blue-600 hover:bg-blue-700 transition-colors px-6 py-3 rounded-lg font-medium text-white flex items-center justify-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restart Test</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 transition-colors px-6 py-3 rounded-lg font-medium text-white flex items-center justify-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>Contact Proctor</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Code className="w-6 h-6 text-blue-600" />
          <h1 className="text-lg font-semibold text-gray-900">Coding Assessment - Problem Q7592</h1>
          <span className="text-sm text-gray-500">C++ Programming</span>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-sm">
            <Timer className="w-4 h-4 text-orange-500" />
            <span className={`font-mono ${examTime < 600 ? 'text-red-600' : 'text-gray-700'}`}>
              {formatTime(examTime)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">Student ID: ST2024001</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Shield className={`w-4 h-4 ${violations > 0 ? 'text-yellow-500' : 'text-green-500'}`} />
            <span className={violations > 0 ? 'text-yellow-600' : 'text-green-600'}>
              {violations} violations
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Left Panel - Problem Statement */}
        <div className="w-2/5 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Task Statement</h2>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <p className="text-gray-700 leading-relaxed">
                  You are given an array of integers in which every element occurs twice except one element, which occurs only once. Your task is to find and return the unique element.
                </p>
                <p className="text-blue-700 font-medium mt-2">
                  Must solve in O(n) time and O(1) space using bit manipulation.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Input Format</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">First line: integer n (size of array).</p>
                <p className="text-gray-700">Second line: n space-separated integers (array elements).</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Output Format</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">Print the unique integer.</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Constraints</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-1">1 ≤ n ≤ 10<sup>5</sup>, and n is always odd.</p>
                <p className="text-gray-700">-10<sup>9</sup> ≤ array[i] ≤ 10<sup>9</sup>.</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Sample</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Input 1:</h4>
                  <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-sm">
                    <div>5</div>
                    <div>1 2 3 2 1</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Output 1:</h4>
                  <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-sm">
                    <div>3</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Note for Java Users</h3>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-gray-700 mb-1">Use package: q7592</p>
                <p className="text-gray-700">Main class must be declared as: public class CTJ7592</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Sample Test Cases</h3>
              <div className="space-y-4">
                {testCases.map((testCase) => (
                  <div key={testCase.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">Test case {testCase.id}</h4>
                      {testCase.status !== 'pending' && (
                        <span className={`flex items-center space-x-1 text-sm ${
                          testCase.status === 'pass' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {testCase.status === 'pass' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          <span>{testCase.status?.toUpperCase()}</span>
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Input:</span>
                        <div className="bg-gray-100 p-2 rounded text-sm font-mono mt-1">
                          {testCase.input}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Expected Output:</span>
                        <div className="bg-gray-100 p-2 rounded text-sm font-mono mt-1">
                          {testCase.expected}
                        </div>
                      </div>
                      {testCase.actual && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Your Output:</span>
                          <div className={`p-2 rounded text-sm font-mono mt-1 ${
                            testCase.status === 'pass' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {testCase.actual}
                          </div>
                        </div>
                      )}
                      {testCase.executionTime && (
                        <div className="text-xs text-gray-500">
                          Execution time: {testCase.executionTime.toFixed(2)}ms
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">CTC7592.cpp</span>
              </div>
              <select 
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="python">Python</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={runCode}
                disabled={isRunning}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
              >
                <Play className="w-4 h-4" />
                <span>{isRunning ? 'Running...' : 'Run'}</span>
              </button>
              <button
                onClick={clearCode}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 flex">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 p-4 font-mono text-sm bg-gray-900 text-green-400 resize-none focus:outline-none"
              style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
              placeholder="Write your code here..."
            />
          </div>

          {/* Results Panel */}
          {showResults && (
            <div className="h-64 bg-gray-50 border-t border-gray-200">
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Terminal className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Test Results</h3>
                  {isRunning && (
                    <div className="text-sm text-blue-600">Running tests...</div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {testCases.map((testCase) => (
                    <div key={testCase.id} className={`p-3 rounded border ${
                      testCase.status === 'pass' ? 'bg-green-50 border-green-200' :
                      testCase.status === 'fail' ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Test {testCase.id}</span>
                        {testCase.status !== 'pending' && (
                          <span className={`flex items-center space-x-1 text-xs ${
                            testCase.status === 'pass' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {testCase.status === 'pass' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            <span>{testCase.status?.toUpperCase()}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">
                        Expected: {testCase.expected}
                      </div>
                      {testCase.actual && (
                        <div className="text-xs text-gray-600">
                          Got: {testCase.actual}
                        </div>
                      )}
                      {testCase.executionTime && (
                        <div className="text-xs text-gray-500 mt-1">
                          {testCase.executionTime.toFixed(2)}ms
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Security Status: <span className={`font-medium ${violations > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {violations > 0 ? 'Violations Detected' : 'Secure'}
            </span>
          </div>
          {securityEvents.length > 0 && (
            <div className="text-xs text-gray-500">
              Last: {securityEvents[0]?.message}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded font-medium">
            Save Draft
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium">
            Submit Solution
          </button>
          <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-medium">
            Finish Exam
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;