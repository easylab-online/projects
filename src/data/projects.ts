export type ProjectLink = {
  label: string;
  url: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  /** Emoji or short icon glyph shown on the card */
  icon: string;
  /** Optional image URL (overrides emoji when set) */
  imageUrl?: string;
  links: ProjectLink[];
  githubUrl: string;
};

/**
 * Starter EasyLab projects — extend this array to add more cards.
 */
export const projects: Project[] = [
  {
    id: "doneplan",
    name: "DonePlan",
    description:
      "تطبيق إدارة المهام والمشاريع لفرق العمل — لوحات كانبان، تذكيرات، ومزامنة سحابية.",
    icon: "📋",
    links: [
      { label: "الموقع", url: "https://doneplan.easylab.online" },
      { label: "التوثيق", url: "https://docs.easylab.online/doneplan" },
    ],
    githubUrl: "https://github.com/easylab-online/doneplan",
  },
  {
    id: "kishha",
    name: "Kishha",
    description:
      "لعبة شطرنج عربية مع لوحات حية، وضع عدم الاتصال، ولوحة تحكم للإدارة.",
    icon: "♟️",
    links: [
      { label: "اللعب الآن", url: "https://kishha.easylab.online" },
      { label: "لوحة الإدارة", url: "https://admin.kishha.easylab.online" },
    ],
    githubUrl: "https://github.com/easylab-online/kishha",
  },
  {
    id: "easylab-hub",
    name: "EasyLab Hub",
    description:
      "بوابة داخلية لخدمات EasyLab: أدوات، روابط سريعة، ومراقبة حالة المشاريع.",
    icon: "🧪",
    links: [
      { label: "البوابة", url: "https://easylab.online" },
      { label: "الحالة", url: "https://status.easylab.online" },
    ],
    githubUrl: "https://github.com/easylab-online/hub",
  },
];
