"use client";

import { useState } from "react";

export function useUIEngine() {
  const [selectedMode, setSelectedMode] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedTab, setSelectedTab] = useState("overview");

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  return {
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

    timeLeft,
    setTimeLeft,
  };
}