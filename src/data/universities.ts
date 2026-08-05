export interface University {
  id: string;
  name: string;
  isAvailable: boolean;
}

export const universities: University[] = [
  { id: "mukuba", name: "Mukuba University", isAvailable: true },
  { id: "unza", name: "University of Zambia", isAvailable: false },
  { id: "cbu", name: "Copperbelt University", isAvailable: false },
  { id: "mulungushi", name: "Mulungushi University", isAvailable: false },
  { id: "chalimbana", name: "Chalimbana University", isAvailable: false },
  { id: "kwame-nkrumah", name: "Kwame Nkrumah University", isAvailable: false },
  { id: "levy-mwanawasa", name: "Levy Mwanawasa Medical University", isAvailable: false },
];