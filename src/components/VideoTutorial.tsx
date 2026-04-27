
import React from 'react';

interface VideoTutorialProps {
  youtubeUrl?: string;
}

const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
  return match ? match[1] : null;
};

const VideoTutorial: React.FC<VideoTutorialProps> = ({ youtubeUrl }) => {
  const videoId = youtubeUrl ? getYouTubeId(youtubeUrl) : null;

  return (
    <div className="blox-card p-8 max-w-xl">
      <h2 className="text-2xl font-bold mb-2">How to use</h2>
      <p className="text-gray-400 mb-4">Video Tutorial</p>
      
      <div className="relative rounded-md overflow-hidden aspect-video">
        {videoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Video Tutorial"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-gray-400">
            No video configured
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoTutorial;
