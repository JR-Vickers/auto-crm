import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Wifi, WifiOff } from "lucide-react";

export function RealtimeIndicator() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const channel = supabase.channel('system');
    
    channel
      .on('system', { event: '*' }, () => {
        setIsConnected(true);
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Ping every 30 seconds to check connection
    const interval = setInterval(() => {
      channel.send({
        type: 'broadcast',
        event: 'ping',
        payload: {},
      });
    }, 30000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Wifi className="h-4 w-4" />
        <span>Connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-yellow-600">
      <WifiOff className="h-4 w-4" />
      <span>Reconnecting...</span>
    </div>
  );
} 