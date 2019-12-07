export interface Link {
  name: string;
  to: string;
}

export interface Project {
  name: string;
  description: string;
  links?: Link[];
  tags?: string[];
}
