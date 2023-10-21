export type JudgeData = {
  name: string;
  title: string;
  phone: string;
  courthouse: string;
  department: string;
};

export type RulingData = {
  county: string;
  hearingDate: string;
  courthouse: string;
  department: string;
  caseNumber: string;
  content: string;
  day?: number;
  month?: number;
  year?: number;
  value?: string;
  alias?: string;
  address?: string;
  judge?: JudgeData | string | undefined;
  verified?: boolean;
  _id?: string;
};

export type CaseNumberData = {
  date: string;
  caseNumber: string;
};

export type RulingLinkType = {
  type: string;
  url: string;
  judge: string;
  courthouse: string;
  department: string;
};

export type RulingDataByDepartment = {
  department: string;
  rulings: string[];
};

export type CaptchaResponse = {
  status: number;
  request: string;
};
