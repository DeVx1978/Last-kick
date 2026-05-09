"use client";

import { useState } from "react";

export function useLandingState() {
  const [loading, setLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [userId, setUserId] = useState("");
  const [userLives, setUserLives] = useState(3);

  const [activeIndex, setActiveIndex] = useState(0);

  const [activeProtocolId, setActiveProtocolId] = useState("1");

  const [currentRank, setCurrentRank] = useState("Bronce");

  const [matchFilter, setMatchFilter] = useState("TODOS");

  const [isGameActive, setIsGameActive] = useState(false);

  return {
    loading,
    setLoading,
    isLoadingData,
    setIsLoadingData,

    userId,
    setUserId,

    userLives,
    setUserLives,

    activeIndex,
    setActiveIndex,

    activeProtocolId,
    setActiveProtocolId,

    currentRank,
    setCurrentRank,

    matchFilter,
    setMatchFilter,

    isGameActive,
    setIsGameActive,
  };
}