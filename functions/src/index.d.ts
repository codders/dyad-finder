import {Request, Response} from 'express';

declare module "DyadAPI" {
  export function postPreference(request: Request, response: Response): void;
}
