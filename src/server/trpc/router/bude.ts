import {z} from 'zod'
import {protectedProcedure, publicProcedure, router} from '../trpc'

export const budeRouter = router({
  own: protectedProcedure.query(async ({ctx}) => {
    const {user} = ctx.session
    const bude = await ctx.prisma.bude.findFirst({where: {userId: user.id}})

    if (!bude)
      return null
    
    return {
      name: bude.name,
      description: bude.description,
      lat: bude.lat.toNumber(),
      lng: bude.lng.toNumber()
    }
  }),
  add: protectedProcedure.input(z.object({
    name: z.string(),
    description: z.string(),
    lat: z.number(),
    lng: z.number()
  })).mutation(async ({ctx, input}) => {
    const bude = await ctx.prisma.bude.findFirst({where: {userId: ctx.session.user.id}})
    if (bude) {
      return await ctx.prisma.bude.update({
        where: {id: bude.id},
        data: {
          name: input.name,
          description: input.description,
          lat: input.lat,
          lng: input.lng
        }
      })
    }

    return await ctx.prisma.bude.create({
      data: {
        lat: input.lat,
        lng: input.lng,
        name: input.name,
        description: input.description,
        userId: ctx.session.user.id
      }
    })
  }),
  all: publicProcedure.query(async ({ctx}) => {
    const budes = await ctx.prisma.bude.findMany({select: {lat: true, lng: true, name: true, description: true}})
    return budes.map(({name, description, lat, lng}) => ({name, description, lat: lat.toNumber(), lng: lng.toNumber()}))
  })
})