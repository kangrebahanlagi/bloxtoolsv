import React from 'react';
import BackButton from '@/components/BackButton';
import ToolForm from '@/components/ToolForm';
import VideoTutorial from '@/components/VideoTutorial';
import { toolsConfig } from '@/config/toolsConfig';

const GroupBotter = () => (
  <div className="min-h-screen bg-blox-gradient">
    <div className="container mx-auto px-4 py-8">
      <BackButton />
      <h1 className="text-4xl font-bold mb-2 text-center">Group Botter</h1>
      <p className="text-center text-gray-400 mb-12">
        Mass-join a Roblox group with bots in seconds.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ToolForm
          toolType="Group Botter"
          toolKey="group_botter"
          title="Group Botter"
          description="Enter your player file, the group ID, and how many bots to send."
          buttonLabel="Start Botting!"
          successMessage="Group botter started!"
          filePlaceholder="Enter player file"
          extras={[
            { key: 'groupId', label: 'Group ID', placeholder: 'Group ID', type: 'number', required: true },
            { key: 'amount', label: 'Amount', placeholder: 'Amount of bots', type: 'number', required: true },
          ]}
        />
        <VideoTutorial youtubeUrl={toolsConfig.groupBotter.youtubeUrl} />
      </div>
    </div>
  </div>
);

export default GroupBotter;
