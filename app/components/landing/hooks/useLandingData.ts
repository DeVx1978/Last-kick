import { useState } from "react";

export function useLandingData() {
  const [loading, setLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);
  const [userLives, setUserLives] = useState<number | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [activeProtocolId, setActiveProtocolId] = useState<string | null>(null);

  const [currentRank, setCurrentRank] = useState("UNRANKED");

  const [matchFilter, setMatchFilter] = useState<string>("TODOS");

  const [selectedMode, setSelectedMode] = useState<string>("ALL");

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedRegion, setSelectedRegion] = useState("ALL");

  const [selectedLeague, setSelectedLeague] = useState("ALL");

  const [selectedPlatform, setSelectedPlatform] = useState("ALL");

  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedTab, setSelectedTab] = useState("ALL");

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

    timeLeft,
    setTimeLeft,

    activeProtocolId,
    setActiveProtocolId,

    currentRank,
    setCurrentRank,

    matchFilter,
    setMatchFilter,

    selectedMode,
    setSelectedMode,

    searchTerm,
    setSearchTerm,

    selectedRegion,
    setSelectedRegion,

    selectedLeague,
    setSelectedLeague,

    selectedPlatform,
    setSelectedPlatform,

    selectedStatus,
    setSelectedStatus,

    isFilterOpen,
    setIsFilterOpen,

    isSearchOpen,
    setIsSearchOpen,

    isModalOpen,
    setIsModalOpen,

    selectedTab,
    setSelectedTab,
  };
}