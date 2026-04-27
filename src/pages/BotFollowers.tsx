
import React from 'react';
import BackButton from '@/components/BackButton';
import BotFollowersForm from '@/components/BotFollowersForm';
import VideoTutorial from '@/components/VideoTutorial';
import { siteConfig } from '@/config/toolsConfig';
import { toolsConfig } from '@/config/toolsConfig';

const BotFollowers = () => {
  return (
    <div className="min-h-screen bg-blox-gradient">
      <div className="container mx-auto px-4 py-8">
        <BackButton />
        
        <h1 className="text-4xl font-bold mb-2 text-center">{siteConfig.name}</h1>
        <p className="text-center text-gray-400 mb-12">
          Bot followers with ease, with this brand new powershell-based system!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <BotFollowersForm />
          <VideoTutorial youtubeUrl={toolsConfig.botFollowers.youtubeUrl} />
        </div>
      </div>
    </div>
  );
};

export default BotFollowers;
