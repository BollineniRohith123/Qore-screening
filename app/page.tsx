'use client';

import React, { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation'; 
import { startCall, endCall } from '../lib/callFunctions'
import { CallConfig, SelectedTool } from '../lib/types'
import demoConfig from './demo-config';
import { Role, Transcript, UltravoxExperimentalMessageEvent, UltravoxSessionStatus } from 'ultravox-client';
import CallStatus from './components/CallStatus';
import DebugMessages from './components/DebugMessages';
import MicToggleButton from './components/MicToggleButton';
import ScreeningTimer from './components/ScreeningTimer';
import { PhoneOffIcon, AlertCircleIcon } from 'lucide-react';

type SearchParamsProps = {
  showMuteSpeakerButton: boolean;
  modelOverride: string | undefined;
  showDebugMessages: boolean;
  showUserTranscripts: boolean;
};

type SearchParamsHandlerProps = {
  children: (props: SearchParamsProps) => React.ReactNode;
};

function SearchParamsHandler({ children }: SearchParamsHandlerProps) {
  // Process query params to see if we want to change the behavior for showing speaker mute button or changing the model
  const searchParams = useSearchParams();
  const showMuteSpeakerButton = searchParams.get('showSpeakerMute') === 'true';
  const showDebugMessages = searchParams.get('showDebugMessages') === 'true';
  const showUserTranscripts = searchParams.get('showUserTranscripts') === 'true';
  let modelOverride: string | undefined;
  
  if (searchParams.get('model')) {
    modelOverride = "fixie-ai/" + searchParams.get('model');
  }

  return children({ showMuteSpeakerButton, modelOverride, showDebugMessages, showUserTranscripts });
}

export default function Home() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [agentStatus, setAgentStatus] = useState<string>('off');
  const [callTranscript, setCallTranscript] = useState<Transcript[] | null>([]);
  const [callDebugMessages, setCallDebugMessages] = useState<UltravoxExperimentalMessageEvent[]>([]);
  const [customerProfileKey, setCustomerProfileKey] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [showTimeNotification, setShowTimeNotification] = useState(false);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [callTranscript]);

  const handleStatusChange = useCallback((status: UltravoxSessionStatus | string | undefined) => {
    if(status) {
      setAgentStatus(status);
    } else {
      setAgentStatus('off');
    }
    
  }, []);

  const handleTranscriptChange = useCallback((transcripts: Transcript[] | undefined) => {
    if(transcripts) {
      setCallTranscript([...transcripts]);
    }
  }, []);

  const handleDebugMessage = useCallback((debugMessage: UltravoxExperimentalMessageEvent) => {
    setCallDebugMessages(prevMessages => [...prevMessages, debugMessage]);
  }, []);

  const clearCustomerProfile = useCallback(() => {
    // This will trigger a re-render of CustomerProfileForm with a new empty profile
    setCustomerProfileKey(prev => prev ? `${prev}-cleared` : 'cleared');
  }, []);

  const handleStartCallButtonClick = async (modelOverride?: string, showDebugMessages?: boolean) => {
    try {
      handleStatusChange('Starting call...');
      setCallTranscript(null);
      setCallDebugMessages([]);
      clearCustomerProfile();

      // Generate a new key for the customer profile
      const newKey = `call-${Date.now()}`;
      setCustomerProfileKey(newKey);

      // Setup our call config including the call key as a parameter restriction
      let callConfig: CallConfig = {
        systemPrompt: demoConfig.callConfig.systemPrompt,
        model: modelOverride || demoConfig.callConfig.model,
        languageHint: demoConfig.callConfig.languageHint,
        voice: demoConfig.callConfig.voice,
        temperature: demoConfig.callConfig.temperature,
        maxDuration: demoConfig.callConfig.maxDuration,
        timeExceededMessage: demoConfig.callConfig.timeExceededMessage
      };

      const paramOverride: { [key: string]: any } = {
        "callId": newKey
      }

      let cpTool: SelectedTool | undefined = demoConfig?.callConfig?.selectedTools?.find(tool => tool.toolName === "createProfile");
      
      if (cpTool) {
        cpTool.parameterOverrides = paramOverride;
      }
      callConfig.selectedTools = demoConfig.callConfig.selectedTools;
      
      // Add job description to the system prompt
      if (jobDescription) {
        callConfig.systemPrompt = callConfig.systemPrompt + `\n\n## Job Description\n${jobDescription}\n\n## Interview Duration\nThis interview should last approximately 10 minutes.`;
      }
      
      // Set max duration to 10 minutes (600 seconds)
      callConfig.maxDuration = "600s";

      await startCall({
        onStatusChange: handleStatusChange,
        onTranscriptChange: handleTranscriptChange,
        onDebugMessage: handleDebugMessage
      }, callConfig, showDebugMessages);

      setIsCallActive(true);
      handleStatusChange('Call started successfully');
    } catch (error) {
      handleStatusChange(`Error starting call: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleEndCallButtonClick = async () => {
    try {
      handleStatusChange('Ending screening...');
      await endCall();
      setIsCallActive(false);
      setShowTimeNotification(false);

      clearCustomerProfile();
      setCustomerProfileKey(null);
      handleStatusChange('Screening ended successfully');
    } catch (error) {
      handleStatusChange(`Error ending screening: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const handleTimeEnd = useCallback(() => {
    setShowTimeNotification(true);
    setTimeout(() => {
      handleEndCallButtonClick();
    }, 10000); // Give 10 seconds warning before ending
  }, []);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsHandler>
        {({ showMuteSpeakerButton, modelOverride, showDebugMessages, showUserTranscripts }: SearchParamsProps) => (
          <div className="flex flex-col items-center justify-center bg-[#111111]">
            {/* Main Area */}
            <header className="w-full py-4 px-5 border-b border-[#2A2A2A] mb-6">
              <div className="max-w-[1206px] mx-auto flex justify-between items-center">
                <h1 className="text-4xl font-bold text-white">QORE Interview Screening</h1>
              </div>
            </header>
            <div className="w-full max-w-[1800px] mx-auto py-5 px-5 border border-[#2A2A2A] rounded-[3px] bg-[#111111]">
              <div className="flex flex-col justify-center lg:flex-row">
                {/* Action Area */}
                <div className="w-full lg:w-2/3 mt-4 lg:mt-0">
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white mb-3">{demoConfig.title}</h1>
                    <p className="text-[#999999]">Revolutionizing interview screening with AI-powered candidate assessment</p>
                  </div>

                  <div className="flex flex-col h-full pl-5 justify-between items-start font-mono p-4">
                    <div className="mt-6 self-center w-full">
                      <div className="p-8 rounded-lg bg-[#1a1a1a] border border-[#2A2A2A] flex flex-col items-center justify-center">
                        <h2 className="text-4xl font-bold text-white mb-3">QORE Interview Screening</h2>
                        <p className="text-lg text-[rgb(179,158,219)] mb-4">AI-Powered Candidate Assessment</p>
                        <p className="text-[#999999] text-center max-w-md">This system conducts structured 10-minute technical and behavioral interviews based on job descriptions. It provides consistent candidate evaluation through voice interaction and structured assessment.</p>
                      </div>
                    </div>
                    {isCallActive ? (
                      <div className="w-full">
                        {showTimeNotification && (
                          <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded flex items-start">
                            <AlertCircleIcon className="text-red-500 mr-2 flex-shrink-0 mt-0.5" size={16} />
                            <p className="text-white text-sm">This screening will automatically end after 10 minutes. Please complete your answers concisely as the time limit approaches.</p>
                          </div>
                        )}
                        <ScreeningTimer 
                          isActive={isCallActive} 
                          maxDuration={600} 
                          onTimeUp={handleTimeEnd} 
                        />
                        <div className="mb-5 relative">
                          <div 
                            ref={transcriptContainerRef}
                            className="h-[300px] p-2.5 overflow-y-auto relative"
                          >
                            {callTranscript && callTranscript.map((transcript, index) => (
                              <div key={index}>
                                {showUserTranscripts ? (
                                  <>
                                    <p><span className="text-gray-600">{transcript.speaker === 'agent' ? "QORE" : "User"}</span></p>
                                    <p className="mb-4"><span>{transcript.text}</span></p>
                                  </>
                                ) : (
                                  transcript.speaker === 'agent' && (
                                    <>
                                      <p><span className="text-gray-600">{transcript.speaker === 'agent' ? "QORE" : "User"}</span></p>
                                      <p className="mb-4"><span>{transcript.text}</span></p>
                                    </>
                                  )
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-t from-transparent to-[#111111] pointer-events-none" />
                        </div>
                        <div className="flex justify-between space-x-4 p-4 w-full">
                          <MicToggleButton role={Role.USER}/>
                          { showMuteSpeakerButton && <MicToggleButton role={Role.AGENT}/> }
                          <button
                            type="button"
                            className="flex-grow flex items-center justify-center h-10 bg-[rgb(147,112,219)] hover:bg-[rgb(179,158,219)] transition-colors relative"
                            onClick={handleEndCallButtonClick}
                            disabled={!isCallActive}
                          >
                            <div className="pointer-events-none flex items-center justify-center w-full">
                              <PhoneOffIcon width={24} className="brightness-0 invert" />
                              <span className="ml-2">End Call</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 w-full">
                        <div className="flex flex-col">
                          <div className="mb-6">
                            <label htmlFor="jobDescription" className="block text-white text-sm font-medium mb-2">Enter Job Description</label>
                            <textarea
                              id="jobDescription"
                              className="w-full h-40 px-4 py-3 bg-[#1a1a1a] border border-[#2A2A2A] rounded text-white focus:outline-none focus:ring-2 focus:ring-[rgb(147,112,219)]"
                              placeholder="Paste the complete job description here. Include required skills, experience level, and responsibilities. The AI will conduct the interview based on this information..."
                              value={jobDescription}
                              onChange={(e) => setJobDescription(e.target.value)}
                            />
                          </div>
                          <button 
                            type="button"
                            className="bg-[rgb(147,112,219)] text-white h-12 px-6 text-sm font-bold rounded hover:bg-[rgb(179,158,219)] transition-colors relative w-full"
                            onClick={() => handleStartCallButtonClick(modelOverride, showDebugMessages)}
                            disabled={isCallActive || !jobDescription.trim()}
                          >
                            <div className="pointer-events-none flex items-center justify-center w-full">
                              Start 10-Minute Screening
                            </div>
                          </button>
                          <div className="mt-10">
                            <div className="p-6 bg-[#1a1a1a] border border-[#2A2A2A] rounded-lg mb-8">
                              <h3 className="text-xl font-bold text-white mb-4">How to Use This Screening Tool</h3>
                              <ol className="list-decimal pl-5 space-y-3 text-[#999999]">
                                <li><span className="text-white font-medium">Paste Job Description:</span> Enter the complete job description to ensure the AI conducts a relevant interview.</li>
                                <li><span className="text-white font-medium">Start Screening:</span> Click the button to begin a 10-minute AI-powered screening session.</li>
                                <li><span className="text-white font-medium">Microphone Control:</span> Use the Mute button if you need to temporarily disable your microphone.</li>
                                <li><span className="text-white font-medium">End Screening:</span> Click End Call when the screening is complete or needs to be terminated.</li>
                                <li><span className="text-white font-medium">Review Transcript:</span> The conversation transcript will be available for review after the screening.</li>
                              </ol>
                            </div>
                            <div className="p-6 bg-[#1a1a1a] border border-[#2A2A2A] rounded-lg">
                              <h3 className="text-xl font-bold text-white mb-4">Screening Assistant Features</h3>
                              <ul className="list-disc pl-5 space-y-3 text-[#999999]">
                                <li><span className="text-white font-medium">Technical Assessment:</span> Evaluates candidate's technical skills relevant to the position</li>
                                <li><span className="text-white font-medium">Behavioral Analysis:</span> Assesses soft skills and cultural fit through structured questions</li>
                                <li><span className="text-white font-medium">Experience Verification:</span> Validates candidate's claimed experience with targeted questions</li>
                                <li><span className="text-white font-medium">Comprehensive Evaluation:</span> Provides structured assessment based on job requirements</li>
                                <li><span className="text-white font-medium">Objective Screening:</span> Ensures consistent evaluation criteria across all candidates</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Call Status */}
                <CallStatus status={agentStatus}>
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-white mb-3">Screening Status</h3>
                    <p className="text-xs text-[#999999] mb-2">API Status: <span className={agentStatus === 'ready' ? 'text-[rgb(147,112,219)]' : 'text-[#999999]'}>{agentStatus}</span></p>
                    <p className="text-[#999999] mb-4">The screening will last approximately 10 minutes.</p>
                    {jobDescription && <div className="mt-4">
                      <h4 className="text-md font-bold text-white mb-2">Job Description</h4>
                      <div className="max-h-60 overflow-y-auto bg-[#1a1a1a] p-3 rounded border border-[#2A2A2A] text-[#999999] text-sm">{jobDescription}</div>
                    </div>}
                  </div>
                </CallStatus>
              </div>
            </div>
            {/* Debug View */}
            <DebugMessages debugMessages={callDebugMessages} />
          </div>
        )}
      </SearchParamsHandler>
    </Suspense>
  )
}