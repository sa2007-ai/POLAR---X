import React, { useState, useEffect } from 'react';
import { PolarConvoy, ConvoyBroadcastMessage } from '../types/convoy';
import { convoyMeshService } from '../services/mesh/convoyMeshService';
import {
  Truck,
  Send,
  MessageSquare
} from 'lucide-react';

export const ConvoyMeshPage: React.FC = () => {
  const [convoy, setConvoy] = useState<PolarConvoy>(convoyMeshService.getActiveConvoy());
  const [messages, setMessages] = useState<ConvoyBroadcastMessage[]>(convoyMeshService.getMessages());
  const [newMsgText, setNewMsgText] = useState('');
  const [msgType, setMsgType] = useState<ConvoyBroadcastMessage['type']>('CHAT');

  useEffect(() => {
    const unsub = convoyMeshService.subscribe((updatedConvoy, updatedMsgs) => {
      setConvoy(updatedConvoy);
      setMessages(updatedMsgs);
    });
    return () => unsub();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim()) return;

    await convoyMeshService.broadcastMessage(
      'v-01',
      'Capt. Marcus Vance (Lead Scout)',
      msgType,
      newMsgText,
      msgType === 'HAZARD_ALERT' ? 'WARNING' : 'INFO'
    );
    setNewMsgText('');
  };

  const peerBadgeColors = {
    CONNECTED: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
    CONNECTING: 'bg-cyan-950 text-cyan-300 border-cyan-500/30 animate-pulse',
    DEGRADED: 'bg-amber-950 text-amber-300 border-amber-500/40',
    DISCONNECTED: 'bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse',
    SIMULATED: 'bg-indigo-950 text-indigo-300 border-indigo-500/30'
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-white font-sans">
              Convoy Mesh Network & WebRTC Vehicle-to-Vehicle Data Link
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Decentralized peer-to-peer telemetry sync, intra-convoy spacing, and zero-cloud communication.
          </p>
        </div>

        {/* Mesh Status indicator */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/30 text-xs font-bold text-cyan-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>WebRTC Direct DataChannels: Connected</span>
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Convoy Formation & Member Vehicles */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-cyan-400">{convoy.code}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    {convoy.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white font-sans">{convoy.name}</h3>
              </div>
              <div className="text-right text-xs text-slate-400">
                <div>Mesh Health: <strong className="text-emerald-400">{convoy.meshHealthScorePercent}%</strong></div>
                <div className="text-[10px]">Max Gap: {convoy.maxIntraConvoyGapMeters}m</div>
              </div>
            </div>

            {/* Convoy Formation Units */}
            <div className="space-y-3">
              {convoy.members.map((member, index) => (
                <div
                  key={member.vehicleId}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-400 text-xs">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="text-xs font-bold text-white font-sans">{member.vehicleName}</h4>
                        <span className="text-[10px] text-slate-400">{member.driverOrCommander} ({member.roleInConvoy})</span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${peerBadgeColors[member.meshConnectionState]}`}>
                      {member.meshConnectionState}
                    </span>
                  </div>

                  {/* Telemetry Matrix */}
                  <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Velocity</span>
                      <strong className="text-slate-200">{member.speedKmh} km/h</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Lead Gap</span>
                      <strong className={member.distanceToLeadMeters > 500 ? 'text-amber-400' : 'text-slate-200'}>
                        {member.distanceToLeadMeters}m
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Battery</span>
                      <strong className="text-emerald-400">{member.batteryLevelPercent}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">P2P Latency</span>
                      <strong className="text-cyan-300">{member.latencyMs} ms</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Convoy P2P Broadcast Channel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 flex flex-col h-full justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white font-sans">
                    Intra-Convoy P2P Radio Feed
                  </h3>
                </div>
                <span className="text-[10px] text-slate-500">Zero-Cloud Peer Broadcast</span>
              </div>

              {/* Messages Stream */}
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      msg.severity === 'WARNING'
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-cyan-300">{msg.senderName}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="leading-relaxed text-[11px]">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Broadcast Input Box */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={msgType}
                  onChange={(e) => setMsgType(e.target.value as any)}
                  className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-[11px]"
                >
                  <option value="CHAT">Convoy Chat</option>
                  <option value="SPEED_COMMAND">Speed Order</option>
                  <option value="HAZARD_ALERT">Hazard Warning</option>
                  <option value="FORMATION_HOLD">Formation Hold</option>
                </select>

                <input
                  type="text"
                  value={newMsgText}
                  onChange={(e) => setNewMsgText(e.target.value)}
                  placeholder="Broadcast message to convoy peers..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500"
                />

                <button
                  type="submit"
                  className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors cursor-pointer"
                  title="Broadcast over WebRTC DataChannel"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
