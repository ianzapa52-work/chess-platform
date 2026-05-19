export interface User {
  name: string;
  email: string;
  avatar: string; 
}

export interface Stats {
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
  puzzlesSolved: number;
  puzzlesFailed: number;
  createdAt: number;
  lastLogin: number;
}