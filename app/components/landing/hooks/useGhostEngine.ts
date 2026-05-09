"use client";

import { useEffect, useState } from "react";

export function useGhostEngine() {
  const GHOST_BASE = 20000;

  const [liveUsers, setLiveUsers] = useState(GHOST_BASE);
  const [comaUsers, setComaUsers] = useState(121);
  const [deadUsers, setDeadUsers] = useState(542);
  const [jackpotTotal, setJackpotTotal] = useState(100000);

  const [notifications, setNotifications] = useState<
    { id: number; text: string; type: string }[]
  >([]);

  const [glitch, setGlitch] = useState(false);

  return {
    liveUsers,
    setLiveUsers,

    comaUsers,
    setComaUsers,

    deadUsers,
    setDeadUsers,

    jackpotTotal,
    setJackpotTotal,

    notifications,
    setNotifications,

    glitch,
    setGlitch,
  };
}