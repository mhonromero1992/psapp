import React from 'react';
import * as P from 'phosphor-react-native';
import {useTheme} from 'styled-components/native';

/**
 * Phosphor icons, the same set as the web version: duotone for features, regular or bold for
 * controls. Icons always sit beside a text label (older members read words, not glyphs).
 */
const ICONS = {
  home: P.House,
  equity: P.PiggyBank,
  loans: P.Bank,
  claims: P.Lifebuoy,
  more: P.SquaresFour,
  payouts: P.Wallet,
  assist: P.Gavel,
  travel: P.AirplaneTilt,
  branches: P.MapPin,
  profile: P.UserCircle,
  bell: P.Bell,
  help: P.Question,
  back: P.ArrowLeft,
  forward: P.ArrowRight,
  chevron: P.CaretRight,
  close: P.X,
  check: P.Check,
  checkCircle: P.CheckCircle,
  warning: P.WarningCircle,
  info: P.Info,
  camera: P.Camera,
  image: P.Image,
  file: P.FileText,
  trash: P.Trash,
  plus: P.Plus,
  fingerprint: P.Fingerprint,
  key: P.Key,
  lock: P.LockKey,
  shield: P.ShieldCheck,
  phone: P.PhoneCall,
  chat: P.ChatCircleText,
  clock: P.Clock,
  directions: P.NavigationArrow,
  id: P.IdentificationCard,
  download: P.DownloadSimple,
  signOut: P.SignOut,
  sun: P.Sun,
  moon: P.Moon,
  text: P.TextAa,
  globe: P.Globe,
  users: P.UsersThree,
  receipt: P.Receipt,
  calendar: P.CalendarBlank,
  hospital: P.FirstAidKit,
  bandage: P.Bandaids,
  thermometer: P.Thermometer,
  wheelchair: P.Wheelchair,
  heart: P.HandHeart,
  medal: P.MedalMilitary,
  coins: P.Coins,
  trend: P.TrendUp,
  pencil: P.PencilSimple,
  search: P.MagnifyingGlass,
  refresh: P.ArrowClockwise,
  presenter: P.PresentationChart,
  forwardStep: P.FastForward,
  lightbulb: P.Lightbulb,
  userFocus: P.UserFocus,
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({name, size = 22, color, weight = 'regular'}: {name: IconName; size?: number; color?: string; weight?: P.IconWeight}) {
  const t = useTheme();
  const Cmp = ICONS[name];
  return <Cmp size={Math.round(size * t.scale)} color={color ?? t.colors.text} weight={weight} />;
}
