"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mic, MicOff, Volume2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useConversation } from '@elevenlabs/react';

export function ConversationClient() {
  const router = useRouter();
  const [showAnimation, setShowAnimation] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to Eleven Labs');
      setError(null);
    },
    onDisconnect: () => {
      console.log('Disconnected from Eleven Labs');
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      setError('Failed to connect to conversation service. Please try again.');
    },
    onMessage: (message) => {
      console.log('Message:', message);
    },
  });

  useEffect(() => {
    // Hide animation after 3 seconds
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleStartConversation = async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start the conversation with Eleven Labs
      // Note: You'll need to replace 'YOUR_AGENT_ID' with your actual agent ID
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'YOUR_AGENT_ID',
        // You can add Croatian language configuration here
        // dynamicVariables: {
        //   language: 'Croatian',
        //   user_level: 'beginner'
        // }
      });
      
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setError('Failed to start conversation. Please ensure microphone access is granted and try again.');
    }
  };

  const handleEndConversation = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Failed to end conversation:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-purple-800">Conversational AI</h1>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Animation Card */}
          {showAnimation && (
            <Card className="relative overflow-hidden bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
              <CardContent className="p-8 text-center">
                <div className="animate-pulse">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mb-4 animate-bounce"></div>
                  <p className="text-lg font-medium text-purple-800">
                    Preparing your AI conversation partner...
                  </p>
                  <p className="text-sm text-purple-600 mt-2">
                    Get ready to practice Croatian!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conversation Interface */}
          {!showAnimation && (
            <Card className="bg-white/90 backdrop-blur-sm border-purple-200">
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-purple-800">
                  {conversation.status === 'connected' ? 'Connected to Croatian AI Partner' : 'Ready to Start'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Indicator */}
                <div className="flex justify-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                    conversation.status === 'connected' 
                      ? conversation.isSpeaking 
                        ? 'bg-green-200 animate-pulse' 
                        : 'bg-blue-200 animate-pulse'
                      : 'bg-gray-200'
                  }`}>
                    {conversation.status === 'connected' ? (
                      conversation.isSpeaking ? (
                        <Volume2 className="h-8 w-8 text-green-600" />
                      ) : (
                        <Mic className="h-8 w-8 text-blue-600" />
                      )
                    ) : (
                      <Mic className="h-8 w-8 text-gray-600" />
                    )}
                  </div>
                </div>

                {/* Status Text */}
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-800">
                    {conversation.status === 'connected' 
                      ? conversation.isSpeaking 
                        ? 'AI is speaking...' 
                        : 'Listening...'
                      : 'Click to start conversation'
                    }
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {conversation.status === 'connected' 
                      ? 'Speak naturally in Croatian or English' 
                      : 'Microphone access will be requested'
                    }
                  </p>
                  {error && (
                    <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                      {error}
                    </p>
                  )}
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4">
                  {conversation.status !== 'connected' ? (
                    <Button 
                      onClick={handleStartConversation}
                      disabled={conversation.status === 'connecting'}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8"
                    >
                      {conversation.status === 'connecting' ? 'Connecting...' : 'Start Conversation'}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleEndConversation}
                      variant="destructive"
                      className="px-8"
                    >
                      End Conversation
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-purple-800 mb-2">Tips for Better Conversation</h3>
              <ul className="space-y-1 text-sm text-purple-700">
                <li>• Speak clearly and at a normal pace</li>
                <li>• You can switch between Croatian and English</li>
                <li>• The AI will help correct your pronunciation</li>
                <li>• Try asking questions about Croatian culture</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}