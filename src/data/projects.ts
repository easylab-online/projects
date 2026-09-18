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
