"use client";

type Props = {
  isGameActive: boolean;
  setIsGameActive: (value: boolean) => void;
  THE_GAME: {
    name: string;
    image: string;
    color: string;
  };
};

export default function GameModal({
  isGameActive,
  setIsGameActive,
  THE_GAME,
}: Props) {
  if (!isGameActive) return null;

  return (
    <div>
      Game Modal Ready
    </div>
  );
}