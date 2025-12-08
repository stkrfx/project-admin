export default async function VideoCallPage({ params }) {
    const { id } = await params;
  
    return (
      <div className="flex-1 bg-zinc-950 relative flex flex-col">
        {/* Video Grid */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-white text-center">
            <h2 className="text-2xl font-bold">Meeting Room: {id}</h2>
            <p className="text-zinc-400">Waiting for participants...</p>
          </div>
        </div>
  
        {/* Video Controls (Bottom Bar) */}
        <div className="h-20 bg-zinc-900 border-t border-zinc-800 flex items-center justify-center gap-4">
          <button className="px-4 py-2 bg-red-600 rounded-full text-white font-medium hover:bg-red-700 transition">
            End Call
          </button>
        </div>
      </div>
    );
  }