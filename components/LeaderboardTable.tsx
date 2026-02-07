"use client";

import { Player } from "@/lib/types";

interface LeaderboardTableProps {
  players: Player[];
  currentPlayerId?: string;
}

export function LeaderboardTable({ players, currentPlayerId }: LeaderboardTableProps) {
  const sortedPlayers = [...players].sort((a, b) => b.total_score - a.total_score);

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="w-8 h-8 rounded-full bg-[#ffcc00] flex items-center justify-center">
            <span className="text-[#121212] font-black text-sm">1</span>
          </div>
        );
      case 2:
        return (
          <div className="w-8 h-8 rounded-full bg-[#c0c0c0] flex items-center justify-center">
            <span className="text-[#121212] font-black text-sm">2</span>
          </div>
        );
      case 3:
        return (
          <div className="w-8 h-8 rounded-full bg-[#cd7f32] flex items-center justify-center">
            <span className="text-white font-black text-sm">3</span>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 flex items-center justify-center">
            <span className="text-[#6c6c6c] font-bold text-sm">{rank}</span>
          </div>
        );
    }
  };

  if (sortedPlayers.length === 0) {
    return (
      <div className="text-center py-12 text-[#6c6c6c]">
        No players yet. Be the first to join!
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#e8e8e8]">
      {sortedPlayers.map((player, index) => {
        const rank = index + 1;
        const isCurrentPlayer = player.id === currentPlayerId;
        const isTopThree = rank <= 3;

        return (
          <div
            key={player.id}
            className={`flex items-center justify-between py-3 px-4 ${
              isCurrentPlayer ? "bg-[#fff3e0]" : isTopThree ? "bg-[#fafafa]" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              {getRankDisplay(rank)}
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${isTopThree ? "text-[#121212]" : "text-[#484848]"}`}>
                    {player.name}
                  </span>
                  {isCurrentPlayer && (
                    <span className="espn-badge espn-badge-red text-[10px]">YOU</span>
                  )}
                </div>
                <div className="text-[11px] text-[#999] font-mono">
                  {player.join_code}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`font-black ${isTopThree ? "text-2xl" : "text-xl"} ${
                rank === 1 ? "text-[#121212]" : "text-[#484848]"
              }`}>
                {player.total_score}
              </div>
              <div className="text-[10px] text-[#999] uppercase tracking-wider">pts</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
