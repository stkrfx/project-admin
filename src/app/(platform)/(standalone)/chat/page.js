export default function ChatPage() {
    return (
      <div className="flex-1 flex h-[calc(100dvh-64px)] overflow-hidden">
        {/* Chat Sidebar (Contacts) */}
        <div className="w-80 border-r border-zinc-200 bg-white overflow-y-auto">
          <div className="p-4 font-semibold text-zinc-900 border-b border-zinc-100">Messages</div>
          {/* List of users/clients goes here */}
          <div className="p-4 text-sm text-zinc-500">Select a conversation...</div>
        </div>
  
        {/* Main Chat Area */}
        <div className="flex-1 bg-zinc-50 flex items-center justify-center">
          <p className="text-zinc-400">Chat window active</p>
        </div>
      </div>
    );
  }