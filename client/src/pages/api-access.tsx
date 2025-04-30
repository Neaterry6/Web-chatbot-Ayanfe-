import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SimpleThemeToggle } from '@/components/ui/mode-toggle';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Key, Copy, FileCog, History, Trash, AlertTriangle, ShieldAlert, Gauge, Clock, Loader,
  MessageCircle, Music, Image, Quote, Calendar, Smile, Film, Search, Palette, Languages, Cat, Dog, 
  Code, Award, Users, Terminal, BookOpen, Tag, HelpCircle, Coffee
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import MainLayout from '../layouts/main-layout';
import { useAuth } from '@/hooks/use-auth';

interface ApiKey {
  id: number;
  userId: number;
  key: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
  isActive: boolean;
}

interface ApiUsage {
  id: number;
  endpoint: string;
  method: string;
  count: number;
  date: string;
}

export default function ApiAccess() {
  const [activeTab, setActiveTab] = useState('apis');
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [selectedApi, setSelectedApi] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loginMutation } = useAuth();
  
  // API definition interfaces
  interface ApiEndpoint {
    name: string;
    endpoint: string;
    method: string;
    description: string;
    parameters?: string[];
    exampleRequest?: string;
    exampleResponse?: string;
    requiresAuth?: boolean;
    category: string;
    icon: JSX.Element;
  }
  
  // Organize APIs by category
  const apiCategories: Record<string, ApiEndpoint[]> = {
    'Chat': [
      {
        name: 'Chat Message',
        endpoint: '/api/chat/ask',
        method: 'POST',
        description: 'Send a message to the AI and get a response',
        parameters: ['message', 'userId'],
        exampleRequest: '{ "message": "Hello, how are you?", "userId": "123" }',
        exampleResponse: '{ "response": "I\'m doing well, thank you for asking! How can I assist you today?", "timestamp": "2025-04-30T10:00:00Z" }',
        requiresAuth: true,
        category: 'Chat',
        icon: <MessageCircle className="h-5 w-5" />
      }
    ],
    'Music': [
      {
        name: 'Music Lyrics',
        endpoint: '/api/music-lyrics',
        method: 'GET',
        description: 'Get lyrics for a song by artist and title',
        parameters: ['artist', 'song'],
        exampleRequest: '/api/music-lyrics?artist=Taylor%20Swift&song=Blank%20Space',
        exampleResponse: '{ "lyrics": "Nice to meet you, where you been?...", "song": "Blank Space", "artist": "Taylor Swift", "timestamp": "2025-04-30T10:00:00Z" }',
        requiresAuth: false,
        category: 'Music',
        icon: <Music className="h-5 w-5" />
      },
      {
        name: 'Music Recommendations',
        endpoint: '/api/music',
        method: 'GET',
        description: 'Get music recommendations by genre or mood',
        parameters: ['genre', 'mood'],
        exampleRequest: '/api/music?genre=pop&mood=happy',
        exampleResponse: '{ "recommendations": [{"title": "Happy", "artist": "Pharrell Williams"}] }',
        requiresAuth: false,
        category: 'Music',
        icon: <Music className="h-5 w-5" />
      }
    ],
    'Images': [
      {
        name: 'Generate Image',
        endpoint: '/api/images/generate',
        method: 'GET',
        description: 'Generate an AI image based on a prompt',
        parameters: ['prompt', 'size'],
        exampleRequest: '/api/images/generate?prompt=sunset%20over%20mountains&size=512x512',
        exampleResponse: '{ "url": "https://example.com/image.jpg", "query": "sunset over mountains", "timestamp": "2025-04-30T10:00:00Z" }',
        requiresAuth: true,
        category: 'Images',
        icon: <Image className="h-5 w-5" />
      },
      {
        name: 'Search Images',
        endpoint: '/api/images/search',
        method: 'GET',
        description: 'Search for images based on a query',
        parameters: ['query', 'limit'],
        exampleRequest: '/api/images/search?query=cats&limit=10',
        exampleResponse: '{ "results": [{"url": "https://example.com/cat1.jpg"}], "query": "cats", "timestamp": "2025-04-30T10:00:00Z" }',
        requiresAuth: false,
        category: 'Images',
        icon: <Search className="h-5 w-5" />
      },
      {
        name: 'Pexels Images',
        endpoint: '/api/pexels',
        method: 'GET',
        description: 'Search for high-quality stock photos from Pexels',
        parameters: ['query', 'limit'],
        exampleRequest: '/api/pexels?query=nature&limit=5',
        exampleResponse: '{ "photos": [{"url": "https://pexels.com/photo1.jpg", "photographer": "John Doe"}] }',
        requiresAuth: false,
        category: 'Images',
        icon: <Image className="h-5 w-5" />
      }
    ],
    'Quotes': [
      {
        name: 'Get Quotes',
        endpoint: '/api/quotes/:category',
        method: 'GET',
        description: 'Get inspirational quotes by category',
        parameters: ['category'],
        exampleRequest: '/api/quotes/motivation',
        exampleResponse: '{ "quote": "The only way to do great work is to love what you do.", "author": "Steve Jobs", "category": "motivation", "timestamp": "2025-04-30T10:00:00Z" }',
        requiresAuth: false,
        category: 'Quotes',
        icon: <Quote className="h-5 w-5" />
      }
    ],
    'Date & Time': [
      {
        name: 'Get Date/Time',
        endpoint: '/api/datetime',
        method: 'GET',
        description: 'Get current date and time information',
        exampleResponse: '{ "date": "April 30, 2025", "time": "10:00 AM", "day": "Wednesday", "timestamp": "2025-04-30T10:00:00Z" }',
        requiresAuth: false,
        category: 'Date & Time',
        icon: <Calendar className="h-5 w-5" />
      }
    ],
    'Mood': [
      {
        name: 'Analyze Mood',
        endpoint: '/api/mood',
        method: 'POST',
        description: 'Analyze the mood of a text message',
        parameters: ['text'],
        exampleRequest: '{ "text": "I\'m having a wonderful day!" }',
        exampleResponse: '{ "mood": "positive", "emoji": "😄", "message": "You seem to be having a great day!", "timestamp": "2025-04-30T10:00:00Z" }',
        requiresAuth: false,
        category: 'Mood',
        icon: <Smile className="h-5 w-5" />
      }
    ],
    'Entertainment': [
      {
        name: 'Movie Recommendations',
        endpoint: '/api/movie',
        method: 'GET',
        description: 'Get movie recommendations by genre or mood',
        parameters: ['genre', 'mood'],
        exampleRequest: '/api/movie?genre=action&mood=exciting',
        exampleResponse: '{ "recommendations": [{"title": "The Dark Knight", "year": 2008}] }',
        requiresAuth: false,
        category: 'Entertainment',
        icon: <Film className="h-5 w-5" />
      },
      {
        name: 'Anime Recommendations',
        endpoint: '/api/anime',
        method: 'GET',
        description: 'Get anime recommendations by genre',
        parameters: ['genre'],
        exampleRequest: '/api/anime?genre=action',
        exampleResponse: '{ "recommendations": [{"title": "Attack on Titan", "year": 2013}] }',
        requiresAuth: false,
        category: 'Entertainment',
        icon: <Film className="h-5 w-5" />
      }
    ],
    'Language': [
      {
        name: 'Translate Text',
        endpoint: '/api/translate',
        method: 'POST',
        description: 'Translate text between languages',
        parameters: ['text', 'from', 'to'],
        exampleRequest: '{ "text": "Hello world", "from": "en", "to": "es" }',
        exampleResponse: '{ "translated": "Hola mundo", "from": "en", "to": "es" }',
        requiresAuth: false,
        category: 'Language',
        icon: <Languages className="h-5 w-5" />
      }
    ],
    'Animals': [
      {
        name: 'Get Dog Images',
        endpoint: '/api/dog',
        method: 'GET',
        description: 'Get random dog images',
        exampleRequest: '/api/dog',
        exampleResponse: '{ "url": "https://example.com/dog.jpg" }',
        requiresAuth: false,
        category: 'Animals',
        icon: <Dog className="h-5 w-5" />
      },
      {
        name: 'Get Cat Images',
        endpoint: '/api/cat',
        method: 'GET',
        description: 'Get random cat images',
        exampleRequest: '/api/cat',
        exampleResponse: '{ "url": "https://example.com/cat.jpg" }',
        requiresAuth: false,
        category: 'Animals',
        icon: <Cat className="h-5 w-5" />
      },
      {
        name: 'Get Neko Images',
        endpoint: '/api/neko',
        method: 'GET',
        description: 'Get anime-style cat person (neko) images',
        exampleRequest: '/api/neko',
        exampleResponse: '{ "url": "https://example.com/neko.jpg" }',
        requiresAuth: false,
        category: 'Animals',
        icon: <Cat className="h-5 w-5" />
      }
    ],
    'User': [
      {
        name: 'User Settings',
        endpoint: '/api/user/settings',
        method: 'GET',
        description: 'Get user settings',
        exampleResponse: '{ "theme": "dark", "notifications": true }',
        requiresAuth: true,
        category: 'User',
        icon: <Users className="h-5 w-5" />
      },
      {
        name: 'Update Settings',
        endpoint: '/api/user/settings',
        method: 'PATCH',
        description: 'Update user settings',
        parameters: ['theme', 'notifications'],
        exampleRequest: '{ "theme": "light", "notifications": false }',
        exampleResponse: '{ "success": true, "settings": {"theme": "light", "notifications": false} }',
        requiresAuth: true,
        category: 'User',
        icon: <Users className="h-5 w-5" />
      }
    ],
    'Misc': [
      {
        name: 'Roast Generator',
        endpoint: '/api/roast/:category',
        method: 'GET',
        description: 'Get a playful roast by category',
        parameters: ['category'],
        exampleRequest: '/api/roast/friendly',
        exampleResponse: '{ "roast": "You\'re so bad at jokes, even dad jokes don\'t claim you.", "category": "friendly", "timestamp": "2025-04-30T10:00:00Z" }',
        requiresAuth: false,
        category: 'Misc',
        icon: <Coffee className="h-5 w-5" />
      },
      {
        name: 'Health Check',
        endpoint: '/api/health',
        method: 'GET',
        description: 'Check if the API is operational',
        exampleResponse: '{ "status": "ok", "version": "1.0.0" }',
        requiresAuth: false,
        category: 'Misc',
        icon: <ShieldAlert className="h-5 w-5" />
      }
    ]
  };
  
  // Auto login for admin if needed
  useEffect(() => {
    const attemptAdminLogin = async () => {
      if (!user && !loginAttempted) {
        console.log("Attempting auto-login for admin access");
        setLoginAttempted(true);
        try {
          await loginMutation.mutateAsync({
            username: "akewusholaabdulbakri101@gmail.com",
            password: "Makemoney@11"
          });
          toast({
            title: "Admin Access Granted",
            description: "You've been logged in as admin",
          });
        } catch (error) {
          console.error("Auto-login failed:", error);
          toast({
            title: "Admin Access Failed",
            description: "Please log in manually",
            variant: "destructive",
          });
        }
      }
    };
    
    attemptAdminLogin();
  }, [user, loginAttempted, loginMutation, toast]);
  
  // Fetch API keys
  const { data: apiKeys = [], isLoading: apiKeysLoading } = useQuery({
    queryKey: ['/api/apikeys'],
    queryFn: () => apiRequest('GET', '/api/apikeys').then(res => res.json()),
  });
  
  // Fetch API usage
  const { data: apiUsage = [], isLoading: apiUsageLoading } = useQuery({
    queryKey: ['/api/user/usage'],
    queryFn: () => apiRequest('GET', '/api/user/usage').then(res => res.json()),
  });
  
  // Generate API key mutation
  const generateKeyMutation = useMutation({
    mutationFn: (name: string) => apiRequest('POST', '/api/apikeys', { name }),
    onSuccess: (response) => {
      response.json().then(data => {
        setGeneratedKey(data.key);
        queryClient.invalidateQueries({ queryKey: ['/api/apikeys'] });
        toast({
          title: "API Key Generated",
          description: "Your new API key has been created successfully",
        });
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Generating API Key",
        description: error.message || "Failed to generate API key",
        variant: "destructive",
      });
    }
  });
  
  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: (keyId: number) => apiRequest('DELETE', `/api/apikeys/${keyId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/apikeys'] });
      toast({
        title: "API Key Deleted",
        description: "The API key has been revoked successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting API Key",
        description: error.message || "Failed to delete API key",
        variant: "destructive",
      });
    }
  });
  
  // Handle generate API key
  const handleGenerateKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name Required",
        description: "Please provide a name for your API key",
        variant: "destructive",
      });
      return;
    }
    
    generateKeyMutation.mutate(newKeyName);
  };
  
  // Handle copy API key to clipboard
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Copied to Clipboard",
      description: "API key has been copied to clipboard",
    });
  };
  
  // Handle delete API key
  const handleDeleteKey = (keyId: number) => {
    if (window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      deleteKeyMutation.mutate(keyId);
    }
  };
  
  return (
    <MainLayout title="API Access" description="Manage your API keys and monitor usage">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">API Access</h1>
        <SimpleThemeToggle />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="apis">
            <Code className="h-4 w-4 mr-2" />
            APIs
          </TabsTrigger>
          <TabsTrigger value="keys">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="usage">
            <History className="h-4 w-4 mr-2" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="documentation">
            <FileCog className="h-4 w-4 mr-2" />
            Documentation
          </TabsTrigger>
        </TabsList>
        
        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate New API Key</CardTitle>
              <CardDescription>Create a new API key to access AYANFE AI services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="key-name">API Key Name</Label>
                <Input 
                  id="key-name" 
                  placeholder="e.g. Development, Production, etc." 
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Give your API key a descriptive name to identify its purpose or usage
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                disabled={generateKeyMutation.isPending} 
                onClick={handleGenerateKey}
              >
                {generateKeyMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Generate API Key
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Generated Key Display */}
          {generatedKey && (
            <Card className="border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-primary">New API Key Generated</CardTitle>
                <CardDescription>Copy your API key now. For security reasons, it won't be shown again.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-md flex items-center justify-between overflow-x-auto">
                  <code className="text-xs md:text-sm font-mono">{generatedKey}</code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCopyKey(generatedKey)}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy API key</span>
                  </Button>
                </div>
                <div className="mt-4 flex items-start space-x-4 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Important Security Notice</p>
                    <p className="text-xs mt-1 text-amber-700 dark:text-amber-400">
                      This API key will only be displayed once. Make sure to copy it and store it in a secure location.
                      If you lose this key, you'll need to generate a new one.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setGeneratedKey(null)}
                  className="w-full"
                >
                  I've Copied My API Key
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Existing API Keys */}
          <Card>
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>Manage your existing API keys</CardDescription>
            </CardHeader>
            <CardContent>
              {apiKeysLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-6">
                  <Key className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No API Keys Yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Generate your first API key to access AYANFE AI services
                  </p>
                </div>
              ) : (
                <Table>
                  <TableCaption>You have {apiKeys.length} active API keys</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key: ApiKey) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <Key className="h-4 w-4 text-muted-foreground" />
                            <span>{key.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {key.lastUsed 
                            ? new Date(key.lastUsed).toLocaleDateString() 
                            : 'Never'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant={key.isActive ? "default" : "secondary"}>
                            {key.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteKey(key.id)}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete API key</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* APIs Tab */}
        <TabsContent value="apis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AYANFE AI API Reference</CardTitle>
              <CardDescription>
                Explore and interact with all available APIs in the AYANFE AI platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="col-span-1 space-y-2 border-r pr-4">
                  <h3 className="text-lg font-medium mb-4">API Categories</h3>
                  <div className="space-y-1">
                    {Object.keys(apiCategories).map((category) => (
                      <Button 
                        key={category}
                        variant={selectedApi === category ? "default" : "ghost"} 
                        className="w-full justify-start"
                        onClick={() => setSelectedApi(category)}
                      >
                        {(() => {
                          switch(category) {
                            case 'Chat': return <MessageCircle className="h-4 w-4 mr-2" />;
                            case 'Music': return <Music className="h-4 w-4 mr-2" />;
                            case 'Images': return <Image className="h-4 w-4 mr-2" />;
                            case 'Quotes': return <Quote className="h-4 w-4 mr-2" />;
                            case 'Date & Time': return <Calendar className="h-4 w-4 mr-2" />;
                            case 'Mood': return <Smile className="h-4 w-4 mr-2" />;
                            case 'Entertainment': return <Film className="h-4 w-4 mr-2" />;
                            case 'Language': return <Languages className="h-4 w-4 mr-2" />;
                            case 'Animals': return <Dog className="h-4 w-4 mr-2" />;
                            case 'User': return <Users className="h-4 w-4 mr-2" />;
                            case 'Misc': return <HelpCircle className="h-4 w-4 mr-2" />;
                            default: return <Code className="h-4 w-4 mr-2" />;
                          }
                        })()}
                        {category}
                        <Badge variant="outline" className="ml-auto">
                          {apiCategories[category].length}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="col-span-1 lg:col-span-3">
                  {!selectedApi ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <Code className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                      <h3 className="text-xl font-medium">Select an API Category</h3>
                      <p className="text-muted-foreground mt-2">
                        Choose a category from the left to view available APIs
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">{selectedApi} APIs</h2>
                        <Badge variant="outline">
                          {apiCategories[selectedApi].length} endpoints
                        </Badge>
                      </div>
                      
                      <Accordion type="single" collapsible className="space-y-4">
                        {apiCategories[selectedApi].map((api, index) => (
                          <AccordionItem value={api.endpoint} key={index} className="border rounded-lg p-2">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center text-left">
                                <div className={`
                                  mr-2 px-2 py-1 rounded text-xs font-bold
                                  ${api.method === 'GET' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                                    api.method === 'POST' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 
                                    api.method === 'PUT' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 
                                    api.method === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
                                    api.method === 'PATCH' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' : 
                                    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}
                                `}>
                                  {api.method}
                                </div>
                                <div className="ml-2">
                                  <div className="font-medium">{api.name}</div>
                                  <div className="text-sm text-muted-foreground font-mono">{api.endpoint}</div>
                                </div>
                                {api.requiresAuth && (
                                  <Badge variant="outline" className="ml-auto mr-2">
                                    <Key className="h-3 w-3 mr-1" />
                                    Auth
                                  </Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-4">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Description</h4>
                                  <p className="text-sm text-muted-foreground">{api.description}</p>
                                </div>
                                
                                {api.parameters && api.parameters.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Parameters</h4>
                                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                      {api.parameters.map(param => (
                                        <li key={param}>{param}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {api.exampleRequest && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Example Request</h4>
                                    <div className="bg-muted p-3 rounded-md">
                                      <code className="text-xs font-mono whitespace-pre-wrap">{api.exampleRequest}</code>
                                    </div>
                                  </div>
                                )}
                                
                                {api.exampleResponse && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-1">Example Response</h4>
                                    <div className="bg-muted p-3 rounded-md">
                                      <code className="text-xs font-mono whitespace-pre-wrap">{api.exampleResponse}</code>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex justify-between items-center pt-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(api.endpoint);
                                      toast({
                                        title: "Endpoint Copied",
                                        description: "API endpoint copied to clipboard",
                                      });
                                    }}
                                  >
                                    <Copy className="h-3 w-3 mr-2" />
                                    Copy Endpoint
                                  </Button>
                                  
                                  <div className="text-xs text-muted-foreground">
                                    {api.requiresAuth ? (
                                      <div className="flex items-center">
                                        <ShieldAlert className="h-3 w-3 mr-1 text-amber-500" />
                                        Requires Authentication
                                      </div>
                                    ) : (
                                      <div className="flex items-center">
                                        <ShieldAlert className="h-3 w-3 mr-1 text-green-500" />
                                        Public API
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Documentation Tab */}
        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                Comprehensive guide for integrating with AYANFE AI APIs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Getting Started</h2>
                <p className="text-muted-foreground">
                  To use the AYANFE AI APIs, you'll need to create an API key from your dashboard. 
                  This key should be included in the header of all your API requests.
                </p>
                
                <div className="bg-muted p-4 rounded-md">
                  <code className="text-sm font-mono whitespace-pre-wrap">
{`// Example Authentication Header
"X-API-Key": "YOUR_API_KEY"`}
                  </code>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Rate Limits</h2>
                <p className="text-muted-foreground">
                  Our standard tier allows for 60 requests per minute. If you need higher limits, 
                  please contact our support team to discuss enterprise options.
                </p>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium">Free Tier</div>
                    <Progress value={20} className="h-2" />
                    <div className="text-xs text-muted-foreground">20 req/min</div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium">Standard Tier</div>
                    <Progress value={60} className="h-2" />
                    <div className="text-xs text-muted-foreground">60 req/min</div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="text-sm font-medium">Pro Tier</div>
                    <Progress value={100} className="h-2" />
                    <div className="text-xs text-muted-foreground">100 req/min</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Error Handling</h2>
                <p className="text-muted-foreground">
                  All API responses follow standard HTTP status codes. Here are the common error codes you might encounter:
                </p>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status Code</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>200 OK</TableCell>
                      <TableCell>The request was successful</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>400 Bad Request</TableCell>
                      <TableCell>The request was invalid or cannot be served</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>401 Unauthorized</TableCell>
                      <TableCell>Authentication credentials were missing or incorrect</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>403 Forbidden</TableCell>
                      <TableCell>The request is understood but has been refused or access is not allowed</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>404 Not Found</TableCell>
                      <TableCell>The requested resource could not be found</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>429 Too Many Requests</TableCell>
                      <TableCell>You've exceeded the rate limit</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>500 Server Error</TableCell>
                      <TableCell>Something went wrong on our end</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Example Integration</h2>
                <p className="text-muted-foreground">
                  Here's a simple example of how to call our Chat API using JavaScript:
                </p>
                
                <div className="bg-muted p-4 rounded-md">
                  <code className="text-sm font-mono whitespace-pre-wrap">
{`// Example JavaScript code for calling the Chat API
async function sendChatMessage(message) {
  const response = await fetch('https://api.ayanfe.ai/chat/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'YOUR_API_KEY'
    },
    body: JSON.stringify({
      message: message,
      userId: 'user123'
    })
  });
  
  if (!response.ok) {
    throw new Error(\`Error: \${response.status}\`);
  }
  
  const data = await response.json();
  return data.response;
}`}
                  </code>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button variant="outline" size="sm">
                    <FileCog className="h-4 w-4 mr-2" />
                    Download SDK
                  </Button>
                  <Button variant="outline" size="sm">
                    <Code className="h-4 w-4 mr-2" />
                    View Code Samples
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Base URL</h2>
                <p className="text-muted-foreground">
                  All API endpoints should be prefixed with the following base URL:
                </p>
                
                <div className="bg-muted p-4 rounded-md">
                  <code className="text-sm font-mono">
                    https://api.ayanfe.ai/v1
                  </code>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Support</h2>
                <p className="text-muted-foreground">
                  If you need help with our APIs or want to report an issue, please contact our support team:
                </p>
                
                <div className="bg-muted p-4 rounded-md">
                  <div className="flex items-center space-x-2">
                    <HelpCircle className="h-5 w-5 text-primary" />
                    <span>Email: support@ayanfe.ai</span>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <span>Discord: discord.gg/ayanfe-ai</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rate Limit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Gauge className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">60</div>
                  <div className="text-sm text-muted-foreground ml-1">req/min</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Standard tier limit
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <History className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">
                    {apiUsageLoading 
                      ? '-' 
                      : Array.isArray(apiUsage) 
                        ? apiUsage.reduce((sum: number, item: ApiUsage) => sum + (item?.count || 0), 0).toLocaleString()
                        : '0'
                    }
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total API calls this month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Quota Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ShieldAlert className="h-5 w-5 mr-2 text-green-500" />
                  <div className="text-2xl font-bold text-green-500">Good</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  34% of monthly quota used
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>API Usage History</CardTitle>
              <CardDescription>View your recent API usage</CardDescription>
            </CardHeader>
            <CardContent>
              {apiUsageLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              ) : !Array.isArray(apiUsage) || apiUsage.length === 0 ? (
                <div className="text-center py-6">
                  <History className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No API Usage Yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start using the API to see your usage history
                  </p>
                </div>
              ) : (
                <Table>
                  <TableCaption>Your recent API usage</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Calls</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(apiUsage)
                      .sort((a: ApiUsage, b: ApiUsage) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map((usage: ApiUsage) => (
                        <TableRow key={usage.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{new Date(usage.date).toLocaleDateString()}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="px-1 py-0.5 bg-muted rounded text-xs">
                              {usage.endpoint}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{usage.method}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{usage.count}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Documentation Tab */}
        <TabsContent value="documentation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>Learn how to use AYANFE AI API services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  All API requests require an API key for authentication. Include your API key in the request headers.
                </p>
                <div className="bg-muted p-4 rounded-md">
                  <code className="text-xs md:text-sm font-mono">
                    <pre>{`// Example header
{
  "X-API-Key": "your_api_key_here"
}
`}</pre>
                  </code>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Base URL</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  All API endpoints are relative to the base URL.
                </p>
                <div className="bg-muted p-4 rounded-md">
                  <code className="text-xs md:text-sm font-mono">
                    https://api.ayanfe.ai/v1
                  </code>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">API Endpoints</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Chat API</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Get AI-powered chat responses.
                    </p>
                    <div className="bg-muted p-4 rounded-md">
                      <code className="text-xs md:text-sm font-mono">
                        <span className="text-blue-500">POST</span> /chat/ask
                      </code>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Music API</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Search and play music from our database.
                    </p>
                    <div className="bg-muted p-4 rounded-md">
                      <code className="text-xs md:text-sm font-mono">
                        <span className="text-green-500">GET</span> /play
                      </code>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Lyrics API</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Get lyrics for songs.
                    </p>
                    <div className="bg-muted p-4 rounded-md">
                      <code className="text-xs md:text-sm font-mono">
                        <span className="text-green-500">GET</span> /music-lyrics
                      </code>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Hentai Video API</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Get adult anime content.
                    </p>
                    <div className="bg-muted p-4 rounded-md">
                      <code className="text-xs md:text-sm font-mono">
                        <span className="text-green-500">GET</span> /henataivid
                      </code>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Rate Limits</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  API calls are subject to rate limiting based on your plan. The default limit is 60 requests per minute.
                </p>
                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-md border border-amber-200 dark:border-amber-800 flex items-start space-x-4">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Rate Limit Exceeded</p>
                    <p className="text-xs mt-1 text-amber-700 dark:text-amber-400">
                      If you exceed your rate limit, you'll receive a 429 Too Many Requests response.
                      Consider upgrading your plan if you need higher limits.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">View Example Code</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Example API Request</DialogTitle>
                    <DialogDescription>
                      Code example for making an API request to AYANFE AI
                    </DialogDescription>
                  </DialogHeader>
                  <div className="bg-muted p-4 rounded-md">
                    <code className="text-xs md:text-sm font-mono">
                      <pre>{`// Example using fetch in JavaScript
const apiKey = 'your_api_key_here';

fetch('https://api.ayanfe.ai/v1/chat/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey
  },
  body: JSON.stringify({
    message: 'Hello, how are you today?'
  })
})
.then(response => response.json())
.then(data => {
  console.log(data);
})
.catch(error => {
  console.error('Error:', error);
});
`}</pre>
                    </code>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(`// Example using fetch in JavaScript
const apiKey = 'your_api_key_here';

fetch('https://api.ayanfe.ai/v1/chat/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey
  },
  body: JSON.stringify({
    message: 'Hello, how are you today?'
  })
})
.then(response => response.json())
.then(data => {
  console.log(data);
})
.catch(error => {
  console.error('Error:', error);
});`);
                        toast({
                          title: "Copied to Clipboard",
                          description: "Example code has been copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button>
                View Full Documentation
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}