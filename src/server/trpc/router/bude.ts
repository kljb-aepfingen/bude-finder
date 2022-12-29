import {z} from 'zod'
import {protectedProcedure, router} from '../trpc'

export const budeRouter = router({
  own: protectedProcedure.query(async ({ctx}) => {
    const {user} = ctx.session
    const bude = await ctx.prisma.bude.findFirst({where: {userId: user.id}})
    return bude
  }),
  add: protectedProcedure.input(z.object({
    name: z.string(),
    description: z.string(),
    lat: z.number(),
    lng: z.number()
  })).mutation(async ({ctx, input}) => {
    const bude = await ctx.prisma.bude.create({
      data: {
        lat: input.lat,
        lng: input.lng,
        name: input.name,
        description: input.description,
        userId: ctx.session.user.id
      }
    })
    return bude
  })
})