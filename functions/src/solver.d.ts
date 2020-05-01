import 'types';

declare module "solver" {
  export function solve(preferences: PreferenceRecord): Assignment;
}
