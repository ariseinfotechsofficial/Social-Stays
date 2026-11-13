import {
  BedIcon,
  BookOpenTextIcon,
  BuildingsIcon,
  CalendarDotsIcon,
  ChartLineUpIcon,
  ClockCounterClockwiseIcon,
  CompassIcon,
  CurrencyInrIcon,
  EnvelopeSimpleIcon,
  FileTextIcon,
  GearSixIcon,
  HandshakeIcon,
  ImagesIcon,
  type Icon,
  ListChecksIcon,
  MegaphoneIcon,
  NotePencilIcon,
  QuestionIcon,
  ScrollIcon,
  ShuffleIcon,
  SparkleIcon,
  StackIcon,
  StarIcon,
  TagIcon,
  TicketIcon,
  UserCircleIcon,
  UsersThreeIcon,
  WalletIcon,
} from "@phosphor-icons/react";
import type { Permission } from "@admin/lib/session";

export type CountKey = "needsAction" | "newEnquiries" | "newOwnerLeads" | "listingRequests";

export type NavItem = { href: string; label: string; icon: Icon; perms?: Permission[]; count?: CountKey };
export type NavGroup = { label?: string; items: NavItem[] };

export const STAFF_NAV: NavGroup[] = [
  { items: [{ href: "/admin", label: "Dashboard", icon: ChartLineUpIcon }] },
  {
    label: "Bookings",
    items: [
      { href: "/admin/bookings", label: "Bookings", icon: TicketIcon, perms: ["bookings"], count: "needsAction" },
      { href: "/admin/calendar", label: "Calendar", icon: CalendarDotsIcon, perms: ["bookings"] },
      { href: "/admin/coupons", label: "Coupons", icon: TagIcon, perms: ["coupons"] },
      { href: "/admin/payouts", label: "Owner payouts", icon: WalletIcon, perms: ["payouts"] },
    ],
  },
  {
    label: "Leads",
    items: [
      { href: "/admin/enquiries", label: "Enquiries", icon: EnvelopeSimpleIcon, perms: ["leads"], count: "newEnquiries" },
      { href: "/admin/owner-leads", label: "Owner leads", icon: HandshakeIcon, perms: ["leads"], count: "newOwnerLeads" },
    ],
  },
  {
    label: "Villas",
    items: [
      { href: "/admin/villas", label: "Villas", icon: BedIcon, perms: ["catalog"] },
      { href: "/admin/destinations", label: "Destinations", icon: CompassIcon, perms: ["catalog"] },
      { href: "/admin/experiences", label: "Experiences", icon: SparkleIcon, perms: ["catalog"] },
      { href: "/admin/categories", label: "Villa categories", icon: StackIcon, perms: ["catalog"] },
      { href: "/admin/amenities", label: "Amenities", icon: ListChecksIcon, perms: ["catalog"] },
      { href: "/admin/occasions", label: "Occasions", icon: MegaphoneIcon, perms: ["catalog"] },
      { href: "/admin/cancellation-policies", label: "Cancellation rules", icon: ScrollIcon, perms: ["catalog"] },
    ],
  },
  {
    label: "Website",
    items: [
      { href: "/admin/pages", label: "Pages & sections", icon: FileTextIcon, perms: ["content"] },
      { href: "/admin/reviews", label: "Reviews", icon: StarIcon, perms: ["content"] },
      { href: "/admin/faqs", label: "FAQs", icon: QuestionIcon, perms: ["content"] },
      { href: "/admin/team", label: "Team", icon: UsersThreeIcon, perms: ["content"] },
      { href: "/admin/policies", label: "Policies", icon: BookOpenTextIcon, perms: ["content"] },
      { href: "/admin/landing-pages", label: "Ad landing pages", icon: MegaphoneIcon, perms: ["content"] },
      { href: "/admin/media", label: "Media library", icon: ImagesIcon, perms: ["media", "content", "catalog"] },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/admin/settings", label: "Site settings", icon: GearSixIcon, perms: ["settings", "booking-settings"] },
      { href: "/admin/redirects", label: "Redirects", icon: ShuffleIcon, perms: ["settings"] },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/users", label: "Users & owners", icon: UserCircleIcon, perms: ["users", "owners"] },
      { href: "/admin/listing-requests", label: "Listing requests", icon: NotePencilIcon, perms: ["owners", "catalog"], count: "listingRequests" },
      { href: "/admin/activity", label: "Activity log", icon: ClockCounterClockwiseIcon, perms: ["activity"] },
    ],
  },
];

export const OWNER_NAV: NavGroup[] = [
  {
    items: [
      { href: "/admin", label: "Dashboard", icon: ChartLineUpIcon },
      { href: "/admin/my/bookings", label: "Bookings", icon: TicketIcon },
      { href: "/admin/my/calendar", label: "Calendar", icon: CalendarDotsIcon },
      { href: "/admin/my/earnings", label: "Earnings & payouts", icon: CurrencyInrIcon },
      { href: "/admin/my/villas", label: "My villas", icon: BuildingsIcon },
    ],
  },
];
