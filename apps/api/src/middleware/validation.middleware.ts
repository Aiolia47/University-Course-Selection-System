import { Request, Response, NextFunction } from 'express';
import { ValidationError, validate } from 'class-validator';

export const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = Object.assign(new dtoClass(), req.body);

    const errors: ValidationError[] = await validate(dto);

    if (errors.length > 0) {
      const errorMessages = errors.map(error => {
        const constraints = error.constraints;
        return Object.values(constraints || {}).join(', ');
      });

      return res.status(400).json({
        error: 'Validation Error',
        message: errorMessages.join('; '),
        details: errors
      });
    }

    req.body = dto;
    next();
  };
};

export const validateQuery = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dto = Object.assign(new dtoClass(), req.query);

    const errors: ValidationError[] = await validate(dto);

    if (errors.length > 0) {
      const errorMessages = errors.map(error => {
        const constraints = error.constraints;
        return Object.values(constraints || {}).join(', ');
      });

      return res.status(400).json({
        error: 'Validation Error',
        message: errorMessages.join('; '),
        details: errors
      });
    }

    req.query = dto;
    next();
  };
};