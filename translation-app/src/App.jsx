// import React, { useState, useRef, useEffect } from 'react';
// import { Mic, MicOff, LogOut, Users, MessageSquare, Volume2 } from 'lucide-react';
// import io from 'socket.io-client';

// const CHUNK_DURATION = 3000;
// const SERVER_URL = 'https://young-maura-mdsalmanhossainst75-a8b23dcc.koyeb.app/';

// const languages = {
//   'en': 'English',
//   'bn': 'বাংলা',
//   'es': 'Español',
//   'fr': 'Français',
//   'de': 'Deutsch',
//   'ja': '日本語',
//   'zh-CN': '中文',
//   'ar': 'العربية',
//   'hi': 'हिन्दी'
// };

// function App() {
//   const [isSetup, setIsSetup] = useState(true);
//   const [userName, setUserName] = useState('User');
//   const [userLang, setUserLang] = useState('en');
//   const [isConnected, setIsConnected] = useState(false);
//   const [isStreaming, setIsStreaming] = useState(false);
//   const [participants, setParticipants] = useState([]);
//   const [messages, setMessages] = useState([]);
//   const [debugLogs, setDebugLogs] = useState(['Debug Console:']);

//   const socketRef = useRef(null);
//   const mediaRecorderRef = useRef(null);
//   const streamRef = useRef(null);
//   const streamingIntervalRef = useRef(null);
//   const audioContextRef = useRef(null);

//   const debugLog = (message) => {
//     const timestamp = new Date().toLocaleTimeString();
//     const log = `[${timestamp}] ${message}`;
//     setDebugLogs(prev => [...prev, log]);
//     console.log(message);
//   };

//   const initAudioContext = () => {
//     if (!audioContextRef.current) {
//       audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
//       debugLog('🔊 Audio context initialized');
//     }
//     if (audioContextRef.current.state === 'suspended') {
//       audioContextRef.current.resume();
//     }
//   };

//   const testAudio = () => {
//     debugLog('🔊 Testing audio playback...');
//     initAudioContext();
//     const oscillator = audioContextRef.current.createOscillator();
//     const gainNode = audioContextRef.current.createGain();
//     oscillator.connect(gainNode);
//     gainNode.connect(audioContextRef.current.destination);
//     oscillator.frequency.value = 440;
//     gainNode.gain.value = 0.3;
//     oscillator.start();
//     setTimeout(() => {
//       oscillator.stop();
//       debugLog('✅ Audio test completed!');
//     }, 500);
//   };

//   const joinMeeting = () => {
//     initAudioContext();
//     debugLog(`🔗 Connecting to ${SERVER_URL} as ${userName} (${userLang})`);
    
//     const socket = io(SERVER_URL, {
//       transports: ['websocket', 'polling']
//     });
//     socketRef.current = socket;

//     socket.on('connect', () => {
//       debugLog('✅ Socket.IO connected');
//       setIsConnected(true);
      
//       socket.emit('register', {
//         name: userName,
//         lang: userLang
//       });
      
//       setIsSetup(false);
//     });

//     socket.on('user_joined', (data) => {
//       setParticipants(prev => [...prev, { name: data.user, lang: data.lang }]);
//       setMessages(prev => [...prev, { type: 'system', text: `${data.user} joined` }]);
//       debugLog(`👤 ${data.user} joined`);
//     });

//     socket.on('user_left', (data) => {
//       setParticipants(prev => prev.filter(p => p.name !== data.user));
//       setMessages(prev => [...prev, { type: 'system', text: `${data.user} left` }]);
//       debugLog(`👋 ${data.user} left`);
//     });

//     socket.on('translated_audio', (data) => {
//       debugLog(`🎵 Received from ${data.speaker}: "${data.translated_text}"`);
//       setMessages(prev => [...prev, {
//         type: 'message',
//         speaker: data.speaker,
//         original: data.original_text,
//         translated: data.translated_text
//       }]);
//       playAudio(data.audio);
//     });

//     socket.on('connect_error', (error) => {
//       debugLog('❌ Connection error: ' + error.message);
//       alert('Connection failed. Make sure server is running on http://localhost:5000');
//     });

//     socket.on('disconnect', () => {
//       debugLog('❌ Disconnected');
//       stopStreaming();
//       setIsConnected(false);
//     });
//   };

//   const startStreaming = async () => {
//     try {
//       debugLog('🎤 Starting continuous streaming...');
      
//       const stream = await navigator.mediaDevices.getUserMedia({ 
//         audio: {
//           echoCancellation: true,
//           noiseSuppression: true,
//           sampleRate: 44100
//         } 
//       });
//       streamRef.current = stream;
      
//       let mimeType = 'audio/webm;codecs=opus';
//       if (!MediaRecorder.isTypeSupported(mimeType)) {
//         mimeType = 'audio/webm';
//       }
      
//       const mediaRecorder = new MediaRecorder(stream, { mimeType });
//       mediaRecorderRef.current = mediaRecorder;
//       let audioChunks = [];
      
//       mediaRecorder.ondataavailable = (e) => {
//         if (e.data.size > 0) {
//           audioChunks.push(e.data);
//         }
//       };
      
//       mediaRecorder.onstop = async () => {
//         if (audioChunks.length > 0) {
//           const audioBlob = new Blob(audioChunks, { type: mimeType });
          
//           if (audioBlob.size > 1000) {
//             debugLog(`📤 Sending chunk (${audioBlob.size} bytes)`);
            
//             const reader = new FileReader();
//             reader.onloadend = () => {
//               const base64String = reader.result.split(',')[1];
              
//               if (socketRef.current && socketRef.current.connected) {
//                 socketRef.current.emit('audio', {
//                   audio: base64String
//                 });
//               }
//             };
//             reader.readAsDataURL(audioBlob);
//           }
          
//           audioChunks = [];
//         }
        
//         if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'recording' && streamRef.current) {
//           mediaRecorderRef.current.start();
//         }
//       };
      
//       mediaRecorder.start();
      
//       streamingIntervalRef.current = setInterval(() => {
//         if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
//           mediaRecorderRef.current.stop();
//         }
//       }, CHUNK_DURATION);
      
//       setIsStreaming(true);
//       debugLog('✅ Streaming started - speak naturally!');
      
//     } catch (error) {
//       debugLog('❌ Microphone error: ' + error.message);
//       alert('Microphone access denied.');
//     }
//   };

//   const stopStreaming = () => {
//     debugLog('⏹️ Stopping streaming...');
    
//     if (streamingIntervalRef.current) {
//       clearInterval(streamingIntervalRef.current);
//       streamingIntervalRef.current = null;
//     }
    
//     if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
//       mediaRecorderRef.current.stop();
//     }
    
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(track => track.stop());
//       streamRef.current = null;
//     }
    
//     setIsStreaming(false);
//     debugLog('✅ Streaming stopped');
//   };

//   const toggleStreaming = () => {
//     if (!isStreaming) {
//       startStreaming();
//     } else {
//       stopStreaming();
//     }
//   };

//   const playAudio = (base64Audio) => {
//     if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
//       audioContextRef.current.resume();
//     }
    
//     const audio = new Audio();
//     audio.volume = 1.0;
//     audio.src = `data:audio/mpeg;base64,${base64Audio}`;
    
//     audio.play().catch(error => {
//       debugLog('❌ Playback failed: ' + error.message);
//     });
//   };

//   const leaveMeeting = () => {
//     stopStreaming();
//     if (socketRef.current) {
//       socketRef.current.disconnect();
//     }
//     setIsSetup(true);
//     setParticipants([]);
//     setMessages([]);
//     setDebugLogs(['Debug Console:']);
//   };

//   useEffect(() => {
//     return () => {
//       stopStreaming();
//       if (socketRef.current) {
//         socketRef.current.disconnect();
//       }
//     };
//   }, []);

//   if (isSetup) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-5">
//         <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow-2xl">
//           <h1 className="text-4xl font-bold text-center text-purple-600 mb-2">
//             🌍 Real-time Translation Meeting
//           </h1>
//           <p className="text-center text-gray-600 mb-8">
//             Speak naturally - translation happens automatically
//           </p>
          
//           <div className="bg-gray-50 p-6 rounded-xl space-y-4">
//             <div>
//               <label className="block font-semibold text-gray-700 mb-2">Your Name:</label>
//               <input
//                 type="text"
//                 value={userName}
//                 onChange={(e) => setUserName(e.target.value)}
//                 placeholder="Enter your name"
//                 className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
//               />
//             </div>
            
//             <div>
//               <label className="block font-semibold text-gray-700 mb-2">Your Language:</label>
//               <select
//                 value={userLang}
//                 onChange={(e) => setUserLang(e.target.value)}
//                 className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
//               >
//                 {Object.entries(languages).map(([code, name]) => (
//                   <option key={code} value={code}>{name}</option>
//                 ))}
//               </select>
//             </div>
            
//             <button
//               onClick={joinMeeting}
//               className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all hover:-translate-y-0.5"
//             >
//               Join Meeting
//             </button>
            
//             <button
//               onClick={testAudio}
//               className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
//             >
//               <Volume2 size={20} /> Test Audio Playback
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-5">
//       <div className="max-w-6xl mx-auto bg-white rounded-2xl p-8 shadow-2xl">
//         <h1 className="text-4xl font-bold text-center text-purple-600 mb-2">
//           🌍 Real-time Translation Meeting
//         </h1>
//         <p className="text-center text-gray-600 mb-6">
//           Speak naturally - translation happens automatically
//         </p>
        
//         <div className={`text-center py-3 rounded-lg font-semibold mb-6 ${
//           isStreaming ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
//           isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//         }`}>
//           {isStreaming ? '🎙️ Streaming... (Click to stop)' :
//            isConnected ? `Connected as ${userName}` : 'Disconnected'}
//         </div>
        
//         <div className="bg-blue-50 p-4 rounded-lg text-center mb-6 text-blue-900">
//           💡 <strong>Streaming Mode:</strong> Click microphone once to start speaking. Audio is sent automatically every 3 seconds. Click again to stop.
//         </div>
        
//         <div className="grid md:grid-cols-3 gap-6 mb-6">
//           <div className="bg-gray-50 p-5 rounded-xl">
//             <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
//               <Users size={20} /> Participants
//             </h3>
//             <div className="space-y-2">
//               {participants.map((p, i) => (
//                 <div key={i} className="bg-white p-3 rounded-lg flex items-center gap-3">
//                   <span className="text-2xl">👤</span>
//                   <div>
//                     <div className="font-semibold">{p.name}</div>
//                     <div className="text-xs text-gray-600">{languages[p.lang]}</div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
          
//           <div className="md:col-span-2 bg-gray-50 p-5 rounded-xl">
//             <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
//               <MessageSquare size={20} /> Translated Messages
//             </h3>
//             <div className="max-h-96 overflow-y-auto space-y-3">
//               {messages.map((msg, i) => (
//                 msg.type === 'system' ? (
//                   <div key={i} className="text-center text-gray-600 text-sm py-2">
//                     ℹ️ {msg.text}
//                   </div>
//                 ) : (
//                   <div key={i} className="bg-white p-4 rounded-lg border-l-4 border-purple-600">
//                     <div className="font-semibold text-purple-600 mb-1">
//                       🗣️ {msg.speaker}
//                     </div>
//                     <div className="text-sm text-gray-600 italic mb-2">
//                       Original: "{msg.original}"
//                     </div>
//                     <div className="text-gray-900">
//                       📝 {msg.translated}
//                     </div>
//                   </div>
//                 )
//               ))}
//             </div>
//           </div>
//         </div>
        
//         <div className="flex justify-center gap-4 mb-6">
//           <button
//             onClick={toggleStreaming}
//             disabled={!isConnected}
//             className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-4xl transition-all ${
//               isStreaming 
//                 ? 'bg-red-500 border-red-700 hover:scale-110 animate-pulse' 
//                 : 'bg-green-500 border-green-700 hover:scale-110'
//             } disabled:bg-gray-300 disabled:border-gray-400 disabled:cursor-not-allowed`}
//           >
//             {isStreaming ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
//           </button>
//         </div>
//         <p className="text-center text-gray-600 mb-6">Click microphone to start/stop speaking</p>
        
//         <div className="flex justify-center">
//           <button
//             onClick={leaveMeeting}
//             className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-all flex items-center gap-2"
//           >
//             <LogOut size={20} /> Leave Meeting
//           </button>
//         </div>
        
//         <div className="bg-gray-900 text-green-400 p-4 rounded-lg mt-6 max-h-48 overflow-y-auto font-mono text-xs">
//           {debugLogs.map((log, i) => (
//             <div key={i} className="mb-1">{log}</div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default App;


import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, LogOut, Users, MessageSquare, Volume2 } from 'lucide-react';
import io from 'socket.io-client';

const CHUNK_DURATION = 3000; // 3 seconds for better recognition
const SERVER_URL = 'https://young-maura-mdsalmanhossainst75-a8b23dcc.koyeb.app/';

const languages = {
  'en': 'English',
  'bn': 'বাংলা',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
  'ja': '日本語',
  'zh-CN': '中文',
  'ar': 'العربية',
  'hi': 'हिन्दी'
};

function App() {
  const [isSetup, setIsSetup] = useState(true);
  const [userName, setUserName] = useState('User');
  const [userLang, setUserLang] = useState('en');
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [debugLogs, setDebugLogs] = useState(['Debug Console:']);

  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const streamingIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioChunksRef = useRef([]);

  const debugLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    const log = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [...prev.slice(-20), log]); // Keep last 20 logs
    console.log(message);
  };

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      debugLog('🔊 Audio context initialized');
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const testAudio = () => {
    debugLog('🔊 Testing audio playback...');
    initAudioContext();
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    oscillator.frequency.value = 440;
    gainNode.gain.value = 0.3;
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      debugLog('✅ Audio test completed!');
    }, 500);
  };

  const joinMeeting = () => {
    initAudioContext();
    debugLog(`🔗 Connecting to ${SERVER_URL} as ${userName} (${userLang})`);
    
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      debugLog('✅ Socket.IO connected');
      setIsConnected(true);
      
      socket.emit('register', {
        name: userName,
        lang: userLang
      });
      
      setIsSetup(false);
    });

    socket.on('user_joined', (data) => {
      setParticipants(prev => [...prev, { name: data.user, lang: data.lang }]);
      setMessages(prev => [...prev, { type: 'system', text: `${data.user} joined` }]);
      debugLog(`👤 ${data.user} joined`);
    });

    socket.on('user_left', (data) => {
      setParticipants(prev => prev.filter(p => p.name !== data.user));
      setMessages(prev => [...prev, { type: 'system', text: `${data.user} left` }]);
      debugLog(`👋 ${data.user} left`);
    });

    socket.on('translated_audio', (data) => {
      debugLog(`🎵 Received from ${data.speaker}: "${data.translated_text}"`);
      setMessages(prev => [...prev, {
        type: 'message',
        speaker: data.speaker,
        original: data.original_text,
        translated: data.translated_text
      }]);
      playAudio(data.audio);
    });

    socket.on('connect_error', (error) => {
      debugLog('❌ Connection error: ' + error.message);
    });

    socket.on('disconnect', () => {
      debugLog('❌ Disconnected');
      stopStreaming();
      setIsConnected(false);
    });
  };

  const startStreaming = async () => {
    try {
      debugLog('🎤 Starting audio streaming...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,           // Mono for better recognition
          sampleRate: 16000,         // Optimal for speech recognition
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;
      
      // Check supported MIME types
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
        }
      }
      debugLog(`🎵 Using format: ${mimeType}`);
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000 
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          
          // Only send if audio is substantial (> 5KB)
          if (audioBlob.size > 5000) {
            debugLog(`📤 Sending: ${(audioBlob.size / 1024).toFixed(2)} KB`);
            
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result.split(',')[1];
              
              if (socketRef.current?.connected) {
                socketRef.current.emit('audio', { audio: base64String });
                debugLog('✅ Audio sent');
              } else {
                debugLog('❌ Not connected');
              }
            };
            reader.onerror = () => {
              debugLog('❌ FileReader error');
            };
            reader.readAsDataURL(audioBlob);
          } else {
            debugLog(`⚠️ Skipped (${audioBlob.size} bytes too short)`);
          }
          
          audioChunksRef.current = [];
        }
        
        // Restart recording for continuous streaming
        if (isStreaming && streamRef.current) {
          setTimeout(() => {
            if (mediaRecorderRef.current?.state === 'inactive') {
              mediaRecorderRef.current.start();
            }
          }, 100);
        }
      };
      
      mediaRecorder.onerror = (e) => {
        debugLog('❌ MediaRecorder error: ' + e.error);
      };
      
      // Start recording
      mediaRecorder.start();
      debugLog('🎙️ Recording started');
      
      // Stop and restart every CHUNK_DURATION
      streamingIntervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, CHUNK_DURATION);
      
      setIsStreaming(true);
      debugLog(`✅ Streaming (${CHUNK_DURATION / 1000}s chunks)`);
      
    } catch (error) {
      debugLog('❌ Microphone error: ' + error.message);
      alert('Microphone access denied. Please grant permission.');
    }
  };

  const stopStreaming = () => {
    debugLog('🛑 Stopping streaming...');
    
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    audioChunksRef.current = [];
    setIsStreaming(false);
    debugLog('✅ Streaming stopped');
  };

  const toggleStreaming = () => {
    if (!isStreaming) {
      startStreaming();
    } else {
      stopStreaming();
    }
  };

  const playAudio = (base64Audio) => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    const audio = new Audio();
    audio.volume = 1.0;
    audio.src = `data:audio/mpeg;base64,${base64Audio}`;
    
    audio.play().catch(error => {
      debugLog('❌ Playback failed: ' + error.message);
    });
  };

  const leaveMeeting = () => {
    stopStreaming();
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setIsSetup(true);
    setParticipants([]);
    setMessages([]);
    setDebugLogs(['Debug Console:']);
  };

  useEffect(() => {
    return () => {
      stopStreaming();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  if (isSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-5">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow-2xl">
          <h1 className="text-4xl font-bold text-center text-purple-600 mb-2">
            🌍 Real-time Translation Meeting
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Speak naturally - translation happens automatically
          </p>
          
          <div className="bg-gray-50 p-6 rounded-xl space-y-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Your Name:</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block font-semibold text-gray-700 mb-2">Your Language:</label>
              <select
                value={userLang}
                onChange={(e) => setUserLang(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={joinMeeting}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all hover:-translate-y-0.5"
            >
              Join Meeting
            </button>
            
            <button
              onClick={testAudio}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-all flex items-center justify-center gap-2"
            >
              <Volume2 size={20} /> Test Audio Playback
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-5">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl p-8 shadow-2xl">
        <h1 className="text-4xl font-bold text-center text-purple-600 mb-2">
          🌍 Real-time Translation Meeting
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Speak naturally - translation happens automatically
        </p>
        
        <div className={`text-center py-3 rounded-lg font-semibold mb-6 ${
          isStreaming ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isStreaming ? '🎙️ Streaming... (Click to stop)' :
           isConnected ? `Connected as ${userName}` : 'Disconnected'}
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg text-center mb-6 text-blue-900">
          💡 <strong>Streaming Mode:</strong> Click microphone to start. Speak clearly for 2-3 seconds. Audio sent every 3 seconds automatically.
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-50 p-5 rounded-xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Users size={20} /> Participants
            </h3>
            <div className="space-y-2">
              {participants.map((p, i) => (
                <div key={i} className="bg-white p-3 rounded-lg flex items-center gap-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-600">{languages[p.lang]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="md:col-span-2 bg-gray-50 p-5 rounded-xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <MessageSquare size={20} /> Translated Messages
            </h3>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {messages.map((msg, i) => (
                msg.type === 'system' ? (
                  <div key={i} className="text-center text-gray-600 text-sm py-2">
                    ℹ️ {msg.text}
                  </div>
                ) : (
                  <div key={i} className="bg-white p-4 rounded-lg border-l-4 border-purple-600">
                    <div className="font-semibold text-purple-600 mb-1">
                      🗣️ {msg.speaker}
                    </div>
                    <div className="text-sm text-gray-600 italic mb-2">
                      Original: "{msg.original}"
                    </div>
                    <div className="text-gray-900">
                      📝 {msg.translated}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={toggleStreaming}
            disabled={!isConnected}
            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-4xl transition-all ${
              isStreaming 
                ? 'bg-red-500 border-red-700 hover:scale-110 animate-pulse' 
                : 'bg-green-500 border-green-700 hover:scale-110'
            } disabled:bg-gray-300 disabled:border-gray-400 disabled:cursor-not-allowed`}
          >
            {isStreaming ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
          </button>
        </div>
        <p className="text-center text-gray-600 mb-6">
          {isStreaming ? 'Recording... speak clearly!' : 'Click microphone to start speaking'}
        </p>
        
        <div className="flex justify-center">
          <button
            onClick={leaveMeeting}
            className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-all flex items-center gap-2"
          >
            <LogOut size={20} /> Leave Meeting
          </button>
        </div>
        
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg mt-6 max-h-48 overflow-y-auto font-mono text-xs">
          {debugLogs.map((log, i) => (
            <div key={i} className="mb-1">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;