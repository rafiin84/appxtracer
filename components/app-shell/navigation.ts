import type { Icon } from "@phosphor-icons/react";
import {
  Broadcast,
  ChartLineUp,
  ChatCircleDots,
  Compass,
  FileMagnifyingGlass,
  GitBranch,
  Graph,
  Pulse,
  ShieldCheck,
  SquaresFour,
  Stack,
  Target,
  UsersThree,
  Warning,
} from "@phosphor-icons/react/dist/ssr";

export interface NavItem {
  href: string;
  label: string;
  /** The question this destination answers, shown in the command palette. */
  question: string;
  icon: Icon;
  /** Shown in the mobile bottom bar. */
  primaryMobile?: boolean;
  /** Shorter label for the bottom bar, where five tabs share the width. */
  mobileLabel?: string;
}

/**
 * Primary navigation is written in the business's language. No "Servers",
 * "Interfaces" or "Alarms" — those are investigation surfaces reached from a
 * business symptom, not destinations a CIO browses.
 */
export const PRIMARY_NAV: NavItem[] = [
  {
    href: "/command-center",
    label: "Command Center",
    question: "How is my app performing?",
    icon: SquaresFour,
    primaryMobile: true,
    mobileLabel: "Home",
  },
  {
    href: "/experience",
    label: "Experience",
    question: "Are my customers having a good experience?",
    icon: Pulse,
  },
  {
    href: "/journeys",
    label: "Journeys",
    question: "Which customer journeys are breaking?",
    icon: Compass,
    primaryMobile: true,
  },
  {
    href: "/applications",
    label: "Applications",
    question: "Which applications are hurting the business?",
    icon: Stack,
  },
  {
    href: "/customers",
    label: "Customers",
    question: "What did a specific customer experience?",
    icon: UsersThree,
  },
  {
    href: "/incidents",
    label: "Incidents",
    question: "What needs my attention right now?",
    icon: Warning,
    primaryMobile: true,
  },
  {
    href: "/impact",
    label: "Impact",
    question: "If this fails, what breaks?",
    icon: Target,
  },
  {
    href: "/digital-map",
    label: "Digital Map",
    question: "What is connected to what?",
    icon: Graph,
  },
  {
    href: "/changes",
    label: "Changes",
    question: "What changed before things went wrong?",
    icon: GitBranch,
  },
  {
    href: "/ask",
    label: "Ask APPX",
    question: "Ask anything about my app.",
    icon: ChatCircleDots,
    primaryMobile: true,
    mobileLabel: "Ask",
  },
];

export const SECONDARY_NAV: NavItem[] = [
  {
    href: "/executive-insights",
    label: "Executive Insights",
    question: "Is digital experience getting better or worse?",
    icon: ChartLineUp,
  },
  {
    href: "/evidence",
    label: "Evidence",
    question: "What is every claim built on?",
    icon: FileMagnifyingGlass,
  },
  {
    href: "/administration",
    label: "Administration",
    question: "What is connected, and is the model healthy?",
    icon: ShieldCheck,
  },
];

export const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

export const SOURCE_ICON = Broadcast;
