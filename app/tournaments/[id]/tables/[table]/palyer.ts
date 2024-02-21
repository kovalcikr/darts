type Player = {
  name: string;
  image: string;
  score: number;
  lastThrow: number;
  legs: number;
  previousState: Player | undefined;
};
