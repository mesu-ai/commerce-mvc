export interface CareerT {
  jobId: number;
  jobTitle: string;
  slug?: string;
  position: string;
  department: string;
  departmentId: number;
  vacancy: number;
  experience: string;
  salary: string;
  deadline: string;
  location: string;
  email: string;
  context: string;
  requirements: string;
  additionalRequirements: string;
  skills: string;
  qualifications: string;
  benefits: string;
  shortListed: number;
  viewed: number;
  notViewed: number;
  applicants: number;
  status: "Y" | "N";

  metaTag: {
    metaTitle: string;
    metaKeywords: string;
    metaDescription: string;
  };
  ogTag: {
    ogType: string;
    ogTitle: string;
    ogDescription: string;
    ogImage?: string;
  };
}