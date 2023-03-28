import {protectedProcedure, publicProcedure, router} from '../trpc'
import {budeValidator} from '@/utils/validators'

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
      active: bude.active,
      contact: bude.contact,
      id: bude.id
    }
  }),
  add: protectedProcedure.input(budeValidator).mutation(({ctx, input}) => {
    return ctx.prisma.bude.create({
      data: {
        ...input,
        userId: ctx.session.user.id
      }
    })
  }),
  update: protectedProcedure.input(budeValidator).mutation(({ctx, input}) => {
    return ctx.prisma.bude.update({
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
  delete: protectedProcedure.mutation(({ctx}) => {
    return ctx.prisma.bude.update({
      where: {
        userId: ctx.session.user.id
      },
      data: {
        active: false
      }
    })
  })
})