"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mic, MicOff, Volume2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useConversation } from '@elevenlabs/react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="space-y-6">
        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/')}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle>Conversational AI</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Animation Card */}
            <AnimatePresence>
              {showAnimation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="relative overflow-hidden bg-gradient-to-r from-purple-100 via-blue-100 to-pink-100 border-purple-200">
                    <CardContent className="p-8 text-center">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ 
                          duration: 0.6, 
                          repeat: Infinity, 
                          repeatType: "reverse",
                          ease: "easeInOut"
                        }}
                      >
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 rounded-full mx-auto mb-4"></div>
                      </motion.div>
                      <p className="text-lg font-medium">
                        Preparing your AI conversation partner...
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Get ready to practice Croatian!
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conversation Interface */}
            <AnimatePresence>
              {!showAnimation && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="bg-muted/30 p-4 sm:p-6 lg:p-8 rounded-lg">
                    <div className="text-center space-y-6">
                      <h3 className="text-xl font-semibold">
                        {conversation.status === 'connected' ? 'Connected to Croatian AI Partner' : 'Ready to Start'}
                      </h3>
                      {/* Status Indicator */}
                      <div className="flex justify-center">
                        <motion.div
                          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                            conversation.status === 'connected' 
                              ? conversation.isSpeaking 
                                ? 'bg-green-200/50' 
                                : 'bg-blue-200/50'
                              : 'bg-muted'
                          }`}
                          animate={{
                            boxShadow: conversation.status === 'connected' 
                              ? conversation.isSpeaking 
                                ? ["0 0 0 0px rgba(34, 197, 94, 0.4)", "0 0 0 20px rgba(34, 197, 94, 0)", "0 0 0 0px rgba(34, 197, 94, 0.4)"]
                                : ["0 0 0 0px rgba(59, 130, 246, 0.4)", "0 0 0 20px rgba(59, 130, 246, 0)", "0 0 0 0px rgba(59, 130, 246, 0.4)"]
                              : "0 0 0 0px rgba(156, 163, 175, 0)"
                          }}
                          transition={{
                            duration: 2,
                            repeat: conversation.status === 'connected' ? Infinity : 0,
                            ease: "easeInOut"
                          }}
                        >
                          {conversation.status === 'connected' ? (
                            conversation.isSpeaking ? (
                              <Volume2 className="h-8 w-8 text-green-600" />
                            ) : (
                              <Mic className="h-8 w-8 text-blue-600" />
                            )
                          ) : (
                            <Mic className="h-8 w-8 text-muted-foreground" />
                          )}
                        </motion.div>
                      </div>

                      {/* Status Text */}
                      <div className="text-center">
                        <motion.p 
                          className="text-lg font-medium"
                          key={conversation.status + conversation.isSpeaking}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {conversation.status === 'connected' 
                            ? conversation.isSpeaking 
                              ? 'AI is speaking...' 
                              : 'Listening...'
                            : 'Click to start conversation'
                          }
                        </motion.p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {conversation.status === 'connected' 
                            ? 'Speak naturally in Croatian or English' 
                            : 'Microphone access will be requested'
                          }
                        </p>
                        {error && (
                          <motion.p 
                            className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            {error}
                          </motion.p>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex justify-center gap-4">
                        {conversation.status !== 'connected' ? (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button 
                              onClick={handleStartConversation}
                              disabled={conversation.status === 'connecting'}
                              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8"
                              size="lg"
                            >
                              {conversation.status === 'connecting' ? 'Connecting...' : 'Start Conversation'}
                            </Button>
                          </motion.div>
                        ) : (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button 
                              onClick={handleEndConversation}
                              variant="destructive"
                              className="px-8"
                              size="lg"
                            >
                              End Conversation
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info Card */}
            <Card className="bg-muted/50">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Tips for Better Conversation</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Speak clearly and at a normal pace</li>
                  <li>• You can switch between Croatian and English</li>
                  <li>• The AI will help correct your pronunciation</li>
                  <li>• Try asking questions about Croatian culture</li>
                </ul>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}