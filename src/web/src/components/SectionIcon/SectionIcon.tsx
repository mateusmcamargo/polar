import {
    Building2,
    CalendarCheck,
    ChartColumn,
    ChartPie,
    ClipboardList,
    Compass,
    DollarSign,
    DoorOpen,
    Earth,
    FileText,
    Flag,
    Gavel,
    Gift,
    HandHelping,
    Handshake,
    History,
    House,
    IdCardLanyard,
    Info,
    Landmark,
    Lightbulb,
    ListOrdered,
    MapPin,
    Receipt,
    Route,
    Scale,
    ScrollText,
    Store,
    Target,
    UserGroup,
    Users,
    UsersRound,
    Vote,
    Wallet,
    Zap,
    BookOpen,
    type LucideIcon,
} from "lucide-react";

// icons of the sections of a page, by name, so that a page can hand them to the page map (a client component) as text; the
// same icon is drawn in the map and in the title of the section
const SECTION_ICONS = {
    // ruler page
    person: IdCardLanyard,
    before: History,
    policies: ScrollText,
    economy: DollarSign,
    world: Earth,
    opinion: UserGroup,
    justice: Gavel,
    congress: Landmark,
    after: DoorOpen,
    trivia: Lightbulb,
    // deputy page and its spending page
    summary: ClipboardList,
    votes: Vote,
    attendance: CalendarCheck,
    money: Wallet,
    organs: Users,
    fronts: Flag,
    parties: Building2,
    categories: ChartPie,
    suppliers: Store,
    receipts: Receipt,
    benefits: Gift,
    // vote page
    proposition: FileText,
    result: ChartColumn,
    orientation: Compass,
    voters: UsersRound,
    siblings: ListOrdered,
    // proposition page and the questions of its summary
    now: MapPin,
    plain: BookOpen,
    stages: Route,
    goal: Target,
    life: House,
    benefited: HandHelping,
    affected: Scale,
    // landmark page
    facts: Info,
    numbers: Zap,
    timeline: History,
    decided: Landmark,
    agreement: Handshake,
    cost: Wallet,
    theses: Scale,
    where: MapPin,
    today: CalendarCheck,
} as const satisfies Record<string, LucideIcon>;

export type SectionIconName = keyof typeof SECTION_ICONS;

export function SectionIcon({ name }: Readonly<{ name: SectionIconName }>) {
    const Icon = SECTION_ICONS[name];
    return <Icon aria-hidden="true" />;
}