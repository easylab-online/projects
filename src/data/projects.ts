export type ProjectLink = {
  label: string;
  url: string;
};

export type ProjectRepo = {
  name: string;
  url: string;
};

export type Project = {
  id: string;
  name: string;
  /** May be empty */
  description: string;
  icon: string;
  imageUrl?: string;
  links: ProjectLink[];
  /** GitHub repositories (name + url) */
  repos: ProjectRepo[];
  /** First repo URL when present — prefer `repos` */
  githubUrl?: string;
};
