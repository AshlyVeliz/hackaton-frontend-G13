// Tipos copiados del contrato de Swagger (/docs). Así TypeScript nos avisa si usamos mal un campo.

export type WantedStatus = "AT_LARGE" | "CAPTURED" | "MISSING";
export type FruitType = "PARAMECIA" | "ZOAN" | "LOGIA";
export type LogPoseStatus = "LOCKED" | "UNLOCKED";

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Team = {
  code: string;
  name: string;
};

export type LoginResponse = {
  token: string;
  tokenType: "Bearer";
  expiresAt: string;
  user: User;
  team: Team;
};

export type MeResponse = {
  user: User;
  team: Team;
  expiresAt: string;
};

export type CrewRef = {
  id: string;
  name: string;
};

export type Crew = {
  id: string;
  name: string;
  shipName: string;
  jollyRogerColor: string;
  memberCount: number;
  totalBounty: number;
};

export type DevilFruit = {
  name: string;
  type: FruitType;
};

export type WantedSummary = {
  id: string;
  name: string;
  epithet: string;
  bounty: number;
  status: WantedStatus;
  crew: CrewRef;
  role: string;
  devilFruit: DevilFruit | null;
  threatLevel: number;
  lastSeenIsland: string;
  updatedAt: string;
};

// ---------- CP2: carteles de "Se Busca" ----------

// En el filtro existe "NONE" (sin fruta), aunque un cartel nunca trae type "NONE".
export type FruitFilter = FruitType | "NONE";
export type WantedSort = "bounty,desc" | "name,asc" | "updatedAt,desc";

export type WantedDetail = WantedSummary & {
  age: number;
  heightCm: number;
  bio: string;
  lastSeen: {
    island: string;
    seenAt: string;
  };
  bountyHistory: {
    amount: number;
    issuedAt: string;
  }[];
};

// Respuesta paginada de GET /wanted
export type WantedPage = {
  content: WantedSummary[];
  totalElements: number;
  totalPages: number;
  page: number; // empieza en 0
  size: number;
};

export type DashboardSummary = {
  team: Team;
  wanted: {
    total: number;
    totalBounty: number;
    averageBounty: number;
    byStatus: Record<WantedStatus, number>;
    byFruit: Record<FruitType | "NONE", number>;
  };
  crews: {
    total: number;
    mostWanted: Crew | null;
  };
  topBounties: WantedSummary[];
  generatedAt: string;
};

export type LogPose = {
  status: LogPoseStatus;
  grandLineUnlocked: boolean;
  unlockedAt: string | null;
  message: string;
};

// ---------- CP4: noticias (Grand Line) ----------

export type NewsType =
  | "BOUNTY_UPDATE"
  | "BATTLE"
  | "MARINE_OPERATION"
  | "WORLD_GOVERNMENT"
  | "DISCOVERY";
export type NewsPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type NewsStatus = "RUMOR" | "CONFIRMED" | "DEBUNKED";
export type NewsVerdict = "CONFIRMED" | "DEBUNKED";

export type NewsItem = {
  id: string;
  type: NewsType;
  priority: NewsPriority;
  status: NewsStatus;
  title: string;
  summary: string;
  source: string;
  island: string;
  relatedWanted: { id: string; name: string } | null;
  publishedAt: string;
  updatedAt: string;
  verifiedAt: string | null;
};

export type NewsDetail = NewsItem & {
  body: string[];
};

// Respuesta de GET /news/feed (paginación por cursor)
export type NewsFeed = {
  items: NewsItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

// ---------- CP5: sagas (Grand Line) ----------

export type Palette = {
  background: string;
  surface: string;
  primary: string;
  accent: string;
  text: string;
};

export type SagaSummary = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  synopsis: string;
  stageCount: number;
  totalDistanceNm: number;
  firstIsland: string;
  lastIsland: string;
  palette: Palette;
};

export type StageMetric = {
  key: "distanceNm" | "crewMorale" | "bountyPool" | "marineThreat";
  label: string;
  value: number;
  unit: string;
};

export type SagaStage = {
  id: string;
  order: number;
  slug: string;
  title: string;
  narrative: string[];
  island: {
    id: string;
    name: string;
    x: number;
    y: number;
  };
  palette: Palette;
  metrics: StageMetric[];
};

export type SagaStory = {
  saga: SagaSummary & { intro: string };
  map: { width: number; height: number };
  stages: SagaStage[];
};
