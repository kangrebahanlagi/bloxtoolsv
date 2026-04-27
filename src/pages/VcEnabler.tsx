import React from 'react';
import BackButton from '@/components/BackButton';
import ToolForm from '@/components/ToolForm';
import VideoTutorial from '@/components/VideoTutorial';
import { toolsConfig } from '@/config/toolsConfig';

const VcEnabler = () => (
  <div className="min-h-screen bg-blox-gradient">
    <div className="container mx-auto px-4 py-8">
      <BackButton />
      <h1 className="text-4xl font-bold mb-2 text-center">VC Enabler</h1>
      <p className="text-center text-gray-400 mb-12">
        Enable voice chat on any Roblox account.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ToolForm
          toolType="VC Enabler"
          toolKey="vc_enabler"
          title="VC Enabler"
          description="Paste your player file to enable voice chat on the account."
          buttonLabel="Enable VC!"
          successMessage="VC enabling process started!"
        />
        <VideoTutorial youtubeUrl={toolsConfig.vcEnabler.youtubeUrl} />
      </div>
    </div>
  </div>
);

export default VcEnabler;
