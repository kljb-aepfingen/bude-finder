import validator from 'validator'
import z from 'zod'


export const contactValidator = z.string().email().or(z.string().refine(validator.isMobilePhone))

export const budeValidator = z.object({
  name: z.string(),
  description: z.string(),
  lat: z.number(),
  lng: z.number(),
  contact: contactValidator
})


export const reportValidator = z.object({
  typeId: z.string().cuid(),
  budeId: z.string().cuid(),
  description: z.string().optional(),
  contact: contactValidator.optional()
})