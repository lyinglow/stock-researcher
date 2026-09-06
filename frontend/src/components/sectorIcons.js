import {
  Cpu,
  HeartPulse,
  Landmark,
  ShoppingBag,
  ShoppingCart,
  Flame,
  Factory,
  Boxes,
  Building2,
  Zap,
  Radio,
  Briefcase,
} from "lucide-react";

const SECTOR_ICONS = {
  Technology: Cpu,
  Healthcare: HeartPulse,
  "Financial Services": Landmark,
  "Consumer Cyclical": ShoppingBag,
  "Consumer Defensive": ShoppingCart,
  Energy: Flame,
  Industrials: Factory,
  "Basic Materials": Boxes,
  "Real Estate": Building2,
  Utilities: Zap,
  "Communication Services": Radio,
};

export function sectorIcon(sector) {
  return SECTOR_ICONS[sector] || Briefcase;
}
