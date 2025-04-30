import { useState, useRef, useEffect, useMemo } from "react";
import { MainLayout } from "@/components/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Search, Music, Mic, RefreshCw, Heart } from "lucide-react";
import { utilsApi, lyricsApi } from "@/lib/api-client";

// Helper function to format time in MM:SS format
const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return "00:00";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  
  return `${formattedMinutes}:${formattedSeconds}`;
};

export default function MusicPage() {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsRef = useRef<HTMLDivElement>(null);
  
  // Music search and player state
  const [songQuery, setSongQuery] = useState("");
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Lyrics state
  const [lyrics, setLyrics] = useState("");
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);
  const [lyricsArtist, setLyricsArtist] = useState("");
  const [lyricsTitle, setLyricsTitle] = useState("");
  const [showLyricsFullscreen, setShowLyricsFullscreen] = useState(false);
  const [currentLyricLine, setCurrentLyricLine] = useState(-1);
  const fullscreenLyricsRef = useRef<HTMLDivElement>(null);
  const lyricLineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Handle audio play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error("Failed to play audio:", error);
          setIsPlaying(false);
          toast({
            title: "Playback Error",
            description: "Could not play the audio. Please try again.",
            variant: "destructive",
          });
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, toast]);
  
  // Parse lyrics into individual lines
  const parsedLyrics = useMemo(() => {
    if (!lyrics) return [];
    // Split lyrics by newline and filter out empty lines
    return lyrics
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }, [lyrics]);

  // Function to estimate the current lyric line based on song progress
  const determineCurrentLyricLine = (currentTime: number, duration: number) => {
    if (!parsedLyrics.length || !duration || isNaN(currentTime) || isNaN(duration)) return -1;
    
    // Calculate what percentage of the song has played
    const progressPercentage = currentTime / duration;
    
    // Calculate which line should be active based on song progress
    const lineIndex = Math.floor(progressPercentage * parsedLyrics.length);
    
    // Make sure we're within the array bounds
    return Math.min(lineIndex, parsedLyrics.length - 1);
  };

  // Update progress bar and time
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateProgress = () => {
      const currentTime = audio.currentTime;
      const duration = audio.duration;
      
      if (duration) {
        // Calculate percentage
        const progressPercent = (currentTime / duration) * 100;
        setProgress(progressPercent);
        setCurrentTime(currentTime);
        setDuration(duration);
        
        // Determine which lyric line should be active
        const activeLine = determineCurrentLyricLine(currentTime, duration);
        setCurrentLyricLine(activeLine);
        
        // If we have a current line and its ref exists
        if (activeLine >= 0 && lyricLineRefs.current[activeLine]) {
          // Get the ref of the active lyric
          const activeLyricElement = lyricLineRefs.current[activeLine];
          
          // Scroll that element into view with smooth scrolling if it exists
          if (activeLyricElement && lyricsRef.current) {
            // Calculate the element's position relative to the container
            const containerTop = lyricsRef.current.scrollTop;
            const containerHeight = lyricsRef.current.clientHeight;
            const elementTop = activeLyricElement.offsetTop;
            const elementHeight = activeLyricElement.clientHeight;
            
            // Calculate the target scroll position to center the element
            const targetScroll = elementTop - (containerHeight / 2) + (elementHeight / 2);
            
            // Apply smooth scrolling
            lyricsRef.current.scrollTo({
              top: targetScroll,
              behavior: 'smooth'
            });
          }
          
          // Do the same for fullscreen lyrics if visible
          if (activeLyricElement && fullscreenLyricsRef.current && showLyricsFullscreen) {
            const fullscreenContainer = fullscreenLyricsRef.current;
            const containerHeight = fullscreenContainer.clientHeight;
            const elementTop = activeLyricElement.offsetTop;
            const elementHeight = activeLyricElement.clientHeight;
            
            const targetScroll = elementTop - (containerHeight / 2) + (elementHeight / 2);
            
            fullscreenContainer.scrollTo({
              top: targetScroll,
              behavior: 'smooth'
            });
          }
        }
      }
    };
    
    // Update playback rate when changed
    audio.playbackRate = playbackRate;
    
    // Set up event listeners for the audio element
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('durationchange', updateProgress);
    audio.addEventListener('loadedmetadata', updateProgress);
    
    // Handle mute state changes
    audio.addEventListener('volumechange', () => {
      setIsMuted(audio.muted);
    });
    
    return () => {
      // Clean up event listeners
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('durationchange', updateProgress);
      audio.removeEventListener('loadedmetadata', updateProgress);
      audio.removeEventListener('volumechange', () => {
        setIsMuted(audio.muted);
      });
    };
  }, [currentSong, lyrics, playbackRate, showLyricsFullscreen, parsedLyrics]);

  // Function to play a song
  const playSong = async () => {
    if (!songQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a song name to search",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await utilsApi.playSong(songQuery);
      
      // Check if we have a valid audio URL before proceeding
      if (!response.audioUrl && !response.audioData) {
        // If we have a fallback URL (typically YouTube), offer that instead
        if (response.fallbackUrl) {
          toast({
            title: "Song Not Available",
            description: "This song isn't available in our library. You can try searching for it on YouTube.",
          });
          
          // Still set the current song for display purposes
          setCurrentSong({
            ...response,
            // Add a placeholder thumbnail if none exists
            thumbnail: response.thumbnail || "https://i.imgur.com/aVu6wvs.png"
          });
          
          // Extract artist and title for lyrics search
          let title = response.title || songQuery;
          let artist = response.artist || "Unknown";
          
          setLyricsArtist(artist);
          setLyricsTitle(title);
          
          // Try to fetch lyrics even if the song isn't available
          fetchLyrics(artist, title);
          return;
        } else {
          throw new Error("No audio source available for this song");
        }
      }
      
      // Set the current song if we have a valid audio URL
      setCurrentSong(response);
      
      // Auto-extract artist and title from the song title
      if (response.title) {
        let title = response.title;
        let artist = response.artist || "Unknown";
        
        // If the title contains a dash, it might be "Artist - Title"
        if (title.includes(" - ")) {
          const parts = title.split(" - ");
          artist = parts[0].trim();
          title = parts.slice(1).join(" - ").trim();
          
          // If title still contains "ft." or "feat." part, clean it up
          if (title.includes(" ft.")) {
            title = title.split(" ft.")[0].trim();
          } else if (title.includes(" feat.")) {
            title = title.split(" feat.")[0].trim();
          }
        }
        
        setLyricsArtist(artist);
        setLyricsTitle(title);
        
        // Auto-fetch lyrics
        fetchLyrics(artist, title);
      }
      
      // Only try to play if we have a valid audio source
      if (response.audioUrl || response.audioData) {
        setTimeout(() => {
          // Delayed play to ensure audio element has loaded the source
          setIsPlaying(true);
        }, 300);
      }
      
    } catch (error) {
      console.error("Error playing song:", error);
      toast({
        title: "Playback Error",
        description: "Could not play the audio. Please try again with a different song.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch lyrics
  const fetchLyrics = async (artist: string, title: string) => {
    if (!title) return;
    
    setIsLyricsLoading(true);
    setCurrentLyricLine(-1); // Reset current lyric line
    
    try {
      const lyricsResponse = await lyricsApi.getLyrics(artist, title);
      setLyrics(lyricsResponse.lyrics || "No lyrics found for this song.");
      // Reset refs array for new lyrics
      lyricLineRefs.current = [];
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      setLyrics("Could not load lyrics at this time.");
    } finally {
      setIsLyricsLoading(false);
    }
  };

  // Handle manual lyrics search
  const searchLyrics = async () => {
    if (!lyricsArtist.trim() || !lyricsTitle.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter both artist and song title to search for lyrics",
        variant: "destructive",
      });
      return;
    }
    
    fetchLyrics(lyricsArtist, lyricsTitle);
  };

  return (
    <MainLayout title="Music Player" description="Play music and view lyrics">
      <div className="dark bg-black min-h-screen text-white">
        <div className="container max-w-4xl py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Music Player</h1>
              <p className="text-zinc-400 mt-1">
                Search for songs and view lyrics
              </p>
            </div>
            <Music className="h-8 w-8 text-primary animate-pulse" />
          </div>

          {/* Music Player Main Content */}
          <div className="space-y-8">
            {/* Search box */}
            <div className="space-y-2">
              <Label htmlFor="song-search" className="text-zinc-300">Search for a song</Label>
              <div className="flex space-x-2">
                <Input
                  id="song-search"
                  placeholder="Enter song name or artist"
                  value={songQuery}
                  onChange={(e) => setSongQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && playSong()}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Button
                  onClick={playSong}
                  disabled={isLoading || !songQuery.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Current Song Player */}
            {currentSong && (
              <div className="rounded-md overflow-hidden bg-zinc-800 border border-zinc-700">
                {currentSong.thumbnail && (
                  <div className="relative">
                    <img 
                      src={currentSong.thumbnail} 
                      alt={currentSong.title || "Song cover"} 
                      className="w-full aspect-video object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg truncate">{currentSong.title || currentSong.query}</h3>
                  <p className="text-zinc-400 text-sm">{currentSong.artist || "Unknown Artist"}</p>
                  
                  <div className="mt-4">
                    <audio
                      ref={audioRef}
                      src={currentSong.audioData || currentSong.audioUrl}
                      className="hidden"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onEnded={() => setIsPlaying(false)}
                    >
                      Your browser does not support the audio element.
                    </audio>
                    
                    {/* Custom player controls */}
                    <div className="flex flex-col space-y-3">
                      {/* Progress bar */}
                      <div className="w-full bg-zinc-700 h-1.5 rounded-full overflow-hidden cursor-pointer"
                        onClick={(e) => {
                          if (audioRef.current && duration) {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const width = rect.width;
                            const percentage = x / width;
                            audioRef.current.currentTime = percentage * duration;
                          }
                        }}
                      >
                        <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" 
                             style={{ width: `${progress}%` }}>
                        </div>
                      </div>
                      
                      {/* Time display */}
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      
                      {/* Player controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-white hover:bg-zinc-700"
                            onClick={() => {
                              if (audioRef.current) {
                                audioRef.current.currentTime = 0;
                              }
                            }}
                          >
                            <SkipBack className="h-5 w-5" />
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className={`h-10 w-10 rounded-full border-none ${currentSong?.audioUrl || currentSong?.audioData ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-zinc-600 text-zinc-300 cursor-not-allowed'}`}
                            disabled={!currentSong?.audioUrl && !currentSong?.audioData}
                            onClick={() => {
                              if (currentSong?.audioUrl || currentSong?.audioData) {
                                setIsPlaying(!isPlaying);
                              } else if (currentSong?.fallbackUrl) {
                                // Redirect to YouTube if play button is clicked but no audio source is available
                                window.open(currentSong.fallbackUrl, '_blank');
                                toast({
                                  title: "YouTube Search",
                                  description: "This song isn't available to play directly. Opening YouTube search in a new tab."
                                });
                              }
                            }}
                          >
                            {isPlaying ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5 ml-0.5" />
                            )}
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-white hover:bg-zinc-700"
                            onClick={() => {
                              if (audioRef.current) {
                                audioRef.current.currentTime += 10;
                              }
                            }}
                          >
                            <SkipForward className="h-5 w-5" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-white hover:bg-zinc-700"
                          >
                            <Heart className="h-5 w-5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-white hover:bg-zinc-700"
                            onClick={() => {
                              if (audioRef.current) {
                                audioRef.current.muted = !audioRef.current.muted;
                                setIsMuted(!isMuted);
                              }
                            }}
                          >
                            {isMuted ? (
                              <VolumeX className="h-5 w-5" />
                            ) : (
                              <Volume2 className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Additional controls: Playback Speed and Download */}
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-700">
                        {/* Playback Speed */}
                        <div className="flex items-center">
                          <span className="text-xs text-zinc-400 mr-2">Speed:</span>
                          <select
                            value={playbackRate}
                            onChange={(e) => {
                              const newRate = parseFloat(e.target.value);
                              setPlaybackRate(newRate);
                              if (audioRef.current) {
                                audioRef.current.playbackRate = newRate;
                              }
                            }}
                            className="bg-zinc-900 text-white text-xs py-1 px-2 rounded border border-zinc-700"
                          >
                            <option value="0.5">0.5x</option>
                            <option value="0.75">0.75x</option>
                            <option value="1.0">1.0x</option>
                            <option value="1.25">1.25x</option>
                            <option value="1.5">1.5x</option>
                            <option value="2.0">2.0x</option>
                          </select>
                        </div>
                        
                        {/* Download Button */}
                        <Button 
                          variant="ghost"
                          size="sm"
                          className={`text-xs ${currentSong?.audioUrl ? 'text-white hover:bg-zinc-700' : 'text-zinc-500 cursor-not-allowed'}`}
                          disabled={!currentSong?.audioUrl}
                          onClick={() => {
                            if (currentSong?.audioUrl) {
                              // Create a temporary anchor element
                              const a = document.createElement('a');
                              a.href = currentSong.audioUrl;
                              a.download = `${currentSong.title || 'download'}.mp3`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              
                              toast({
                                title: "Download Started",
                                description: "Your download should begin shortly",
                              });
                            } else if (currentSong?.fallbackUrl) {
                              // Offer YouTube link instead
                              window.open(currentSong.fallbackUrl, '_blank');
                              
                              toast({
                                title: "YouTube Search",
                                description: "Opening YouTube search results in a new tab",
                              });
                            } else {
                              toast({
                                title: "Download Unavailable",
                                description: "This song isn't available for download",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          {currentSong?.audioUrl ? "Download" : currentSong?.fallbackUrl ? "YouTube" : "Download"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Song Lyrics Section */}
            <div className="rounded-md overflow-hidden bg-zinc-800 border border-zinc-700 mb-8">
              <div className="p-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Song Lyrics</h2>
                {lyrics && !isLyricsLoading && (
                  <Button 
                    variant="outline"
                    className="rounded-full border-zinc-600 hover:bg-zinc-700 text-white"
                    onClick={() => setShowLyricsFullscreen(true)}
                  >
                    Lyric
                  </Button>
                )}
              </div>
              
              <div className="p-4 pt-0">
                {isLyricsLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  </div>
                ) : lyrics ? (
                  <div 
                    ref={lyricsRef}
                    className="max-h-[200px] overflow-y-auto p-4 bg-zinc-900 rounded-md"
                  >
                    <h3 className="font-semibold mb-4 text-zinc-300">
                      {lyricsTitle} - {lyricsArtist}
                    </h3>
                    <div className="lyrics-container space-y-1">
                      {parsedLyrics.map((line, index) => (
                        <div
                          key={index}
                          ref={el => lyricLineRefs.current[index] = el}
                          className={`transition-all duration-300 py-1 px-2 rounded ${
                            index === currentLyricLine 
                              ? 'bg-indigo-900/50 text-white font-medium' 
                              : 'text-zinc-400'
                          }`}
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-zinc-400">
                    <Mic className="h-12 w-12 mb-4 opacity-50" />
                    <p>Lyrics will display as you play music</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spotify-style fullscreen lyrics overlay */}
      {showLyricsFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
          {/* Header */}
          <div className="p-6 flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowLyricsFullscreen(false)} 
              className="text-white mr-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Button>
            <div className="text-white">
              <h2 className="text-lg font-semibold">{lyricsTitle}</h2>
              <p className="text-sm opacity-70">{lyricsArtist}</p>
            </div>
          </div>
          
          {/* Lyrics content */}
          <div className="flex-1 overflow-y-auto px-6 text-white text-center">
            <div 
              ref={fullscreenLyricsRef}
              className="max-w-md mx-auto py-8 space-y-2"
            >
              {parsedLyrics.map((line, index) => (
                <div
                  key={index}
                  ref={el => lyricLineRefs.current[index] = el}
                  className={`transition-all duration-300 py-2 px-3 rounded ${
                    index === currentLyricLine
                      ? 'bg-white/10 text-white font-medium transform scale-105'
                      : 'text-gray-400'
                  }`}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer player controls */}
          <div className="p-6 border-t border-gray-800">
            <div className="max-w-lg mx-auto">
              {/* Progress bar */}
              <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden mb-4">
                <div className="bg-white h-full rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
              
              {/* Mini player controls */}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {formatTime(currentTime)}
                </div>
                
                <div className="flex items-center space-x-6">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-white"
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
                      }
                    }}
                  >
                    <SkipBack className="h-5 w-5" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`h-10 w-10 rounded-full ${currentSong?.audioUrl || currentSong?.audioData ? 'text-black bg-white hover:bg-white/90' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                    disabled={!currentSong?.audioUrl && !currentSong?.audioData}
                    onClick={() => {
                      if (currentSong?.audioUrl || currentSong?.audioData) {
                        setIsPlaying(!isPlaying);
                      } else if (currentSong?.fallbackUrl) {
                        window.open(currentSong.fallbackUrl, '_blank');
                        toast({
                          title: "YouTube Search",
                          description: "This song isn't available to play directly. Opening YouTube search in a new tab."
                        });
                      }
                    }}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5" />
                    )}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-white"
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
                      }
                    }}
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="text-xs text-gray-400">
                  {formatTime(duration)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}