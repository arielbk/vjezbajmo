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
    <div className="min-h-screen bg-background p-4">
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
          <h1 className="text-2xl font-bold">Conversational AI</h1>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
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
                <Card className="bg-card">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl">
                      {conversation.status === 'connected' ? 'Connected to Croatian AI Partner' : 'Ready to Start'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
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
                          scale: conversation.status === 'connected' ? [1, 1.1, 1] : 1,
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
                        <motion.div
                          animate={{
                            scale: conversation.status === 'connected' ? [1, 1.2, 1] : 1,
                            rotate: conversation.isSpeaking ? [0, 360] : 0
                          }}
                          transition={{
                            duration: conversation.isSpeaking ? 2 : 1.5,
                            repeat: Infinity,
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
                            className="bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 hover:from-purple-600 hover:via-blue-600 hover:to-pink-600 text-white px-8"
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
                          >
                            End Conversation
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
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
        </div>
      </div>
    </div>
  );
}