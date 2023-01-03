import {z} from 'zod'
import {protectedProcedure, publicProcedure, router} from '../trpc'

const validator = z.object({
  name: z.string(),
  description: z.string(),
  lat: z.number(),
  lng: z.number()
})

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
      lng: bude.lng.toNumber(),
      active: bude.active
    }
  }),
  add: protectedProcedure.input(validator).mutation(async ({ctx, input}) => {
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
  update: protectedProcedure.input(validator).mutation(async ({ctx, input}) => {
    return await ctx.prisma.bude.update({
      where: {
        userId: ctx.session.user.id
      },
      data: {
        active: true,
        ...input
      }
    })
  }),
  all: publicProcedure.query(async ({ctx}) => {
    const budes = await ctx.prisma.bude.findMany({
      select: {
        id: true,
        lat: true,
        lng: true,
        name: true,
        description: true
      },
      where: {
        active: true
      }
    })
    return budes.map(({name, description, lat, lng, id}) => ({id, name, description, lat: lat.toNumber(), lng: lng.toNumber()}))
  }),
  delete: protectedProcedure.mutation(async ({ctx}) => {
    return await ctx.prisma.bude.update({
      where: {
        userId: ctx.session.user.id
      },
      data: {
        active: false
      }
    })
  })
})