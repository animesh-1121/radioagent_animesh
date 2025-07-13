'use client';

import { useState, useRef, useEffect } from 'react';
import type { AnalysisResult } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { getConversationalResponse } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AssistantCardProps {
  analysisResult: AnalysisResult;
}

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
};

export function AssistantCard({ analysisResult }: AssistantCardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const context = `Findings: ${analysisResult.findings}. Anomalies: ${analysisResult.anomalies}.`;

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>, question?: string) => {
    e?.preventDefault();
    const userMessage = question || input;
    if (!userMessage.trim()) return;

    const newUserMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    const result = await getConversationalResponse(context, userMessage);
    if (result.success) {
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: result.data,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
      setMessages((prev) => prev.slice(0, -1)); // Remove user message on error
    }
    setIsLoading(false);
  };
  
  const quickQuestions = [
    "Explain these findings in simpler terms.",
    "What are potential differential diagnoses?",
    "What are the recommended next steps or tests?",
  ];

  return (
    <Card className="flex flex-col min-h-[80vh]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span>Conversational Assistant</span>
        </CardTitle>
        <CardDescription>Ask questions about the current analysis.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex items-start gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
             {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-2 text-sm flex items-center">
                    <Loader2 className="w-4 h-4 animate-spin"/>
                  </div>
                </div>
              )}
          </div>
           {messages.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground text-sm space-y-4 pt-8">
                <p>No messages yet. Ask a question or use a suggestion below.</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {quickQuestions.map(q => (
                    <Button key={q} variant="outline" size="sm" onClick={() => handleSubmit(undefined, q)}>{q}</Button>
                  ))}
                </div>
              </div>
            )}
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-4 border-t">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
